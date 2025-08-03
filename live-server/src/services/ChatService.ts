import { logger } from '../utils/logger';
import { ChatMessage, GameState, Participant } from '../types';
import { ChatMessageSchema } from '../schemas';
import { EventBroadcaster } from './EventBroadcaster';
import { z } from 'zod';

/**
 * Configuration for ChatService
 */
export interface ChatServiceConfig {
  maxMessageLength?: number;
  maxHistorySize?: number;
  enableProfanityFilter?: boolean;
  rateLimitPerMinute?: number;
  allowPrivateMessages?: boolean;
}

/**
 * Chat channel types and their validation rules
 */
export type ChatChannelType = 'party' | 'dm' | 'private' | 'system';

/**
 * Message filtering result
 */
interface MessageFilterResult {
  allowed: boolean;
  filteredContent?: string;
  reason?: string;
}

/**
 * Rate limiting tracking
 */
interface RateLimitTracker {
  userId: string;
  messageCount: number;
  windowStart: number;
}

/**
 * ChatService handles all chat functionality for live interactions
 * 
 * Features:
 * - Multi-channel chat (party, DM, private, system)
 * - Message validation and filtering
 * - Rate limiting
 * - Chat history management
 * - Real-time message broadcasting
 */
export class ChatService {
  private config: Required<ChatServiceConfig>;
  private eventBroadcaster: EventBroadcaster;
  private rateLimitTrackers: Map<string, RateLimitTracker> = new Map();
  private profanityWords: Set<string> = new Set();

  constructor(eventBroadcaster: EventBroadcaster, config: ChatServiceConfig = {}) {
    this.eventBroadcaster = eventBroadcaster;
    this.config = {
      maxMessageLength: config.maxMessageLength ?? 1000,
      maxHistorySize: config.maxHistorySize ?? 500,
      enableProfanityFilter: config.enableProfanityFilter ?? true,
      rateLimitPerMinute: config.rateLimitPerMinute ?? 30,
      allowPrivateMessages: config.allowPrivateMessages ?? true,
    };

    // Initialize basic profanity filter (in production, use a proper library)
    this.initializeProfanityFilter();

    // Start rate limit cleanup timer
    this.startRateLimitCleanup();

    logger.info('ChatService initialized', {
      config: this.config,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a chat message
   */
  async sendMessage(
    interactionId: string,
    userId: string,
    content: string,
    type: ChatChannelType,
    recipients?: string[],
    entityId?: string
  ): Promise<ChatMessage> {
    try {
      // Rate limiting check
      if (!this.checkRateLimit(userId)) {
        throw new Error('Rate limit exceeded. Please slow down your messages.');
      }

      // Validate message content
      const filterResult = this.filterMessage(content);
      if (!filterResult.allowed) {
        throw new Error(`Message not allowed: ${filterResult.reason}`);
      }

      // Use filtered content if available
      const finalContent = filterResult.filteredContent || content;

      // Create chat message
      const chatMessage: ChatMessage = {
        id: this.generateMessageId(),
        userId,
        entityId,
        content: finalContent,
        type,
        recipients: (type === 'private' || type === 'system') ? recipients : undefined,
        timestamp: Date.now(),
      };

      // Validate with schema
      const validatedMessage = ChatMessageSchema.parse(chatMessage);

      // Update rate limit tracker
      this.updateRateLimit(userId);

      // Broadcast message based on type
      await this.broadcastMessage(interactionId, validatedMessage);

      logger.info('Chat message sent', {
        messageId: chatMessage.id,
        userId,
        interactionId,
        type,
        contentLength: finalContent.length,
        recipientCount: recipients?.length || 0,
      });

      return validatedMessage;

    } catch (error) {
      logger.error('Failed to send chat message', {
        userId,
        interactionId,
        type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get chat history for an interaction
   */
  getChatHistory(
    gameState: GameState,
    userId: string,
    channelType?: ChatChannelType,
    limit?: number
  ): ChatMessage[] {
    try {
      let messages = [...gameState.chatLog];

      // Filter by channel type if specified
      if (channelType) {
        messages = messages.filter(msg => msg.type === channelType);
      }

      // Filter messages based on user permissions
      messages = messages.filter(msg => this.canUserSeeMessage(msg, userId));

      // Sort by timestamp (newest first)
      messages.sort((a, b) => b.timestamp - a.timestamp);

      // Apply limit
      if (limit && limit > 0) {
        messages = messages.slice(0, limit);
      }

      logger.debug('Retrieved chat history', {
        userId,
        interactionId: gameState.interactionId,
        channelType,
        messageCount: messages.length,
        totalMessages: gameState.chatLog.length,
      });

      return messages;

    } catch (error) {
      logger.error('Failed to get chat history', {
        userId,
        interactionId: gameState.interactionId,
        channelType,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Add a message to game state chat log
   */
  addMessageToHistory(gameState: GameState, message: ChatMessage): void {
    try {
      // Add message to chat log
      gameState.chatLog.push(message);

      // Trim history if it exceeds max size
      if (gameState.chatLog.length > this.config.maxHistorySize) {
        const excessCount = gameState.chatLog.length - this.config.maxHistorySize;
        gameState.chatLog.splice(0, excessCount);
        
        logger.debug('Trimmed chat history', {
          interactionId: gameState.interactionId,
          removedMessages: excessCount,
          remainingMessages: gameState.chatLog.length,
        });
      }

      // Update timestamp
      gameState.timestamp = new Date();

    } catch (error) {
      logger.error('Failed to add message to history', {
        interactionId: gameState.interactionId,
        messageId: message.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Send a system message
   */
  async sendSystemMessage(
    interactionId: string,
    content: string,
    recipients?: string[]
  ): Promise<ChatMessage> {
    return this.sendMessage(
      interactionId,
      'system',
      content,
      'system',
      recipients
    );
  }

  /**
   * Validate chat permissions for a user
   */
  validateChatPermissions(
    userId: string,
    type: ChatChannelType,
    participants: Map<string, Participant>,
    recipients?: string[]
  ): { allowed: boolean; reason?: string } {
    try {
      // System messages are only allowed from system
      if (type === 'system' && userId !== 'system') {
        return { allowed: false, reason: 'Only system can send system messages' };
      }

      // Allow system user to send system messages without participant check
      if (userId === 'system' && type === 'system') {
        return { allowed: true };
      }

      // Check if user is a participant (for non-system users)
      const participant = participants.get(userId);
      if (!participant) {
        return { allowed: false, reason: 'User is not a participant in this interaction' };
      }

      // Private messages validation
      if (type === 'private') {
        if (!this.config.allowPrivateMessages) {
          return { allowed: false, reason: 'Private messages are disabled' };
        }

        if (!recipients || recipients.length === 0) {
          return { allowed: false, reason: 'Private messages must have recipients' };
        }

        // Validate all recipients are participants
        for (const recipientId of recipients) {
          if (!participants.has(recipientId)) {
            return { allowed: false, reason: `Recipient ${recipientId} is not a participant` };
          }
        }
      }

      // DM messages - only DMs can send to DM channel
      if (type === 'dm') {
        // In a full implementation, we'd check if the user is a DM
        // For now, we'll allow it but this should be enhanced
        logger.debug('DM message permission check', {
          userId,
          type,
          note: 'DM role validation not fully implemented',
        });
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Failed to validate chat permissions', {
        userId,
        type,
        error: error instanceof Error ? error.message : String(error),
      });
      return { allowed: false, reason: 'Permission validation failed' };
    }
  }

  /**
   * Private helper methods
   */

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private filterMessage(content: string): MessageFilterResult {
    try {
      // Length check
      if (content.length > this.config.maxMessageLength) {
        return {
          allowed: false,
          reason: `Message too long (max ${this.config.maxMessageLength} characters)`,
        };
      }

      // Empty message check
      if (content.trim().length === 0) {
        return {
          allowed: false,
          reason: 'Message cannot be empty',
        };
      }

      // Profanity filter
      if (this.config.enableProfanityFilter) {
        const filteredContent = this.applyProfanityFilter(content);
        if (filteredContent !== content) {
          return {
            allowed: true,
            filteredContent,
          };
        }
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Message filtering failed', {
        contentLength: content.length,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        allowed: false,
        reason: 'Message filtering failed',
      };
    }
  }

  private applyProfanityFilter(content: string): string {
    let filtered = content;
    
    for (const word of this.profanityWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    }
    
    return filtered;
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minute
    
    const tracker = this.rateLimitTrackers.get(userId);
    
    if (!tracker) {
      return true; // First message, allow it
    }
    
    // Check if we're in a new window
    if (now - tracker.windowStart > windowDuration) {
      return true; // New window, reset will happen in updateRateLimit
    }
    
    // Check if user has exceeded rate limit
    return tracker.messageCount < this.config.rateLimitPerMinute;
  }

  private updateRateLimit(userId: string): void {
    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minute
    
    const tracker = this.rateLimitTrackers.get(userId);
    
    if (!tracker || now - tracker.windowStart > windowDuration) {
      // New tracker or new window
      this.rateLimitTrackers.set(userId, {
        userId,
        messageCount: 1,
        windowStart: now,
      });
    } else {
      // Increment count in current window
      tracker.messageCount++;
    }
  }

  private async broadcastMessage(interactionId: string, message: ChatMessage): Promise<void> {
    try {
      const chatEvent = {
        type: 'CHAT_MESSAGE' as const,
        message,
        timestamp: Date.now(),
        interactionId,
      };

      // Broadcast based on message type
      switch (message.type) {
        case 'party':
          // Broadcast to all participants
          await this.eventBroadcaster.broadcast(interactionId, chatEvent);
          break;

        case 'dm':
          // Broadcast to all participants (DMs and players can see DM channel)
          await this.eventBroadcaster.broadcast(interactionId, chatEvent);
          break;

        case 'private':
          // Broadcast to sender and recipients only
          if (message.recipients) {
            // Send to sender
            await this.eventBroadcaster.broadcastToUser(interactionId, message.userId, chatEvent);
            
            // Send to each recipient
            for (const recipientId of message.recipients) {
              await this.eventBroadcaster.broadcastToUser(interactionId, recipientId, chatEvent);
            }
          }
          break;

        case 'system':
          if (message.recipients) {
            // Send to specific recipients
            for (const recipientId of message.recipients) {
              await this.eventBroadcaster.broadcastToUser(interactionId, recipientId, chatEvent);
            }
          } else {
            // Broadcast to all participants
            await this.eventBroadcaster.broadcast(interactionId, chatEvent);
          }
          break;

        default:
          logger.warn('Unknown message type for broadcasting', {
            messageId: message.id,
            type: message.type,
            interactionId,
          });
          break;
      }

    } catch (error) {
      logger.error('Failed to broadcast chat message', {
        messageId: message.id,
        interactionId,
        type: message.type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private canUserSeeMessage(message: ChatMessage, userId: string): boolean {
    switch (message.type) {
      case 'party':
      case 'dm':
      case 'system':
        return true; // All participants can see these

      case 'private':
        // User can see if they sent it or are a recipient
        return message.userId === userId || 
               (message.recipients && message.recipients.includes(userId));

      default:
        return false;
    }
  }

  private initializeProfanityFilter(): void {
    // Basic profanity list - in production, use a proper library like 'bad-words'
    const basicProfanity = [
      'damn', 'hell', 'crap', 'stupid', 'idiot'
    ];
    
    this.profanityWords = new Set(basicProfanity);
  }

  private startRateLimitCleanup(): void {
    // Clean up old rate limit trackers every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const windowDuration = 60 * 1000; // 1 minute
      
      for (const [userId, tracker] of this.rateLimitTrackers) {
        if (now - tracker.windowStart > windowDuration * 2) {
          this.rateLimitTrackers.delete(userId);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.rateLimitTrackers.clear();
    logger.info('ChatService cleanup completed');
  }
}