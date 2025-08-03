"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const logger_1 = require("../utils/logger");
const schemas_1 = require("../schemas");
class ChatService {
    config;
    eventBroadcaster;
    rateLimitTrackers = new Map();
    profanityWords = new Set();
    constructor(eventBroadcaster, config = {}) {
        this.eventBroadcaster = eventBroadcaster;
        this.config = {
            maxMessageLength: config.maxMessageLength ?? 1000,
            maxHistorySize: config.maxHistorySize ?? 500,
            enableProfanityFilter: config.enableProfanityFilter ?? true,
            rateLimitPerMinute: config.rateLimitPerMinute ?? 30,
            allowPrivateMessages: config.allowPrivateMessages ?? true,
        };
        this.initializeProfanityFilter();
        this.startRateLimitCleanup();
        logger_1.logger.info('ChatService initialized', {
            config: this.config,
            timestamp: new Date().toISOString(),
        });
    }
    async sendMessage(interactionId, userId, content, type, recipients, entityId) {
        try {
            if (!this.checkRateLimit(userId)) {
                throw new Error('Rate limit exceeded. Please slow down your messages.');
            }
            const filterResult = this.filterMessage(content);
            if (!filterResult.allowed) {
                throw new Error(`Message not allowed: ${filterResult.reason}`);
            }
            const finalContent = filterResult.filteredContent || content;
            const chatMessage = {
                id: this.generateMessageId(),
                userId,
                entityId,
                content: finalContent,
                type,
                recipients: (type === 'private' || type === 'system') ? recipients : undefined,
                timestamp: Date.now(),
            };
            const validatedMessage = schemas_1.ChatMessageSchema.parse(chatMessage);
            this.updateRateLimit(userId);
            await this.broadcastMessage(interactionId, validatedMessage);
            logger_1.logger.info('Chat message sent', {
                messageId: chatMessage.id,
                userId,
                interactionId,
                type,
                contentLength: finalContent.length,
                recipientCount: recipients?.length || 0,
            });
            return validatedMessage;
        }
        catch (error) {
            logger_1.logger.error('Failed to send chat message', {
                userId,
                interactionId,
                type,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    getChatHistory(gameState, userId, channelType, limit) {
        try {
            let messages = [...gameState.chatLog];
            if (channelType) {
                messages = messages.filter(msg => msg.type === channelType);
            }
            messages = messages.filter(msg => this.canUserSeeMessage(msg, userId));
            messages.sort((a, b) => b.timestamp - a.timestamp);
            if (limit && limit > 0) {
                messages = messages.slice(0, limit);
            }
            logger_1.logger.debug('Retrieved chat history', {
                userId,
                interactionId: gameState.interactionId,
                channelType,
                messageCount: messages.length,
                totalMessages: gameState.chatLog.length,
            });
            return messages;
        }
        catch (error) {
            logger_1.logger.error('Failed to get chat history', {
                userId,
                interactionId: gameState.interactionId,
                channelType,
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    addMessageToHistory(gameState, message) {
        try {
            gameState.chatLog.push(message);
            if (gameState.chatLog.length > this.config.maxHistorySize) {
                const excessCount = gameState.chatLog.length - this.config.maxHistorySize;
                gameState.chatLog.splice(0, excessCount);
                logger_1.logger.debug('Trimmed chat history', {
                    interactionId: gameState.interactionId,
                    removedMessages: excessCount,
                    remainingMessages: gameState.chatLog.length,
                });
            }
            gameState.timestamp = new Date();
        }
        catch (error) {
            logger_1.logger.error('Failed to add message to history', {
                interactionId: gameState.interactionId,
                messageId: message.id,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    async sendSystemMessage(interactionId, content, recipients) {
        return this.sendMessage(interactionId, 'system', content, 'system', recipients);
    }
    validateChatPermissions(userId, type, participants, recipients) {
        try {
            if (type === 'system' && userId !== 'system') {
                return { allowed: false, reason: 'Only system can send system messages' };
            }
            if (userId === 'system' && type === 'system') {
                return { allowed: true };
            }
            const participant = participants.get(userId);
            if (!participant) {
                return { allowed: false, reason: 'User is not a participant in this interaction' };
            }
            if (type === 'private') {
                if (!this.config.allowPrivateMessages) {
                    return { allowed: false, reason: 'Private messages are disabled' };
                }
                if (!recipients || recipients.length === 0) {
                    return { allowed: false, reason: 'Private messages must have recipients' };
                }
                for (const recipientId of recipients) {
                    if (!participants.has(recipientId)) {
                        return { allowed: false, reason: `Recipient ${recipientId} is not a participant` };
                    }
                }
            }
            if (type === 'dm') {
                logger_1.logger.debug('DM message permission check', {
                    userId,
                    type,
                    note: 'DM role validation not fully implemented',
                });
            }
            return { allowed: true };
        }
        catch (error) {
            logger_1.logger.error('Failed to validate chat permissions', {
                userId,
                type,
                error: error instanceof Error ? error.message : String(error),
            });
            return { allowed: false, reason: 'Permission validation failed' };
        }
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    filterMessage(content) {
        try {
            if (content.length > this.config.maxMessageLength) {
                return {
                    allowed: false,
                    reason: `Message too long (max ${this.config.maxMessageLength} characters)`,
                };
            }
            if (content.trim().length === 0) {
                return {
                    allowed: false,
                    reason: 'Message cannot be empty',
                };
            }
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
        }
        catch (error) {
            logger_1.logger.error('Message filtering failed', {
                contentLength: content.length,
                error: error instanceof Error ? error.message : String(error),
            });
            return {
                allowed: false,
                reason: 'Message filtering failed',
            };
        }
    }
    applyProfanityFilter(content) {
        let filtered = content;
        for (const word of this.profanityWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            filtered = filtered.replace(regex, '*'.repeat(word.length));
        }
        return filtered;
    }
    checkRateLimit(userId) {
        const now = Date.now();
        const windowDuration = 60 * 1000;
        const tracker = this.rateLimitTrackers.get(userId);
        if (!tracker) {
            return true;
        }
        if (now - tracker.windowStart > windowDuration) {
            return true;
        }
        return tracker.messageCount < this.config.rateLimitPerMinute;
    }
    updateRateLimit(userId) {
        const now = Date.now();
        const windowDuration = 60 * 1000;
        const tracker = this.rateLimitTrackers.get(userId);
        if (!tracker || now - tracker.windowStart > windowDuration) {
            this.rateLimitTrackers.set(userId, {
                userId,
                messageCount: 1,
                windowStart: now,
            });
        }
        else {
            tracker.messageCount++;
        }
    }
    async broadcastMessage(interactionId, message) {
        try {
            const chatEvent = {
                type: 'CHAT_MESSAGE',
                message,
                timestamp: Date.now(),
                interactionId,
            };
            switch (message.type) {
                case 'party':
                    await this.eventBroadcaster.broadcast(interactionId, chatEvent);
                    break;
                case 'dm':
                    await this.eventBroadcaster.broadcast(interactionId, chatEvent);
                    break;
                case 'private':
                    if (message.recipients) {
                        await this.eventBroadcaster.broadcastToUser(interactionId, message.userId, chatEvent);
                        for (const recipientId of message.recipients) {
                            await this.eventBroadcaster.broadcastToUser(interactionId, recipientId, chatEvent);
                        }
                    }
                    break;
                case 'system':
                    if (message.recipients) {
                        for (const recipientId of message.recipients) {
                            await this.eventBroadcaster.broadcastToUser(interactionId, recipientId, chatEvent);
                        }
                    }
                    else {
                        await this.eventBroadcaster.broadcast(interactionId, chatEvent);
                    }
                    break;
                default:
                    logger_1.logger.warn('Unknown message type for broadcasting', {
                        messageId: message.id,
                        type: message.type,
                        interactionId,
                    });
                    break;
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast chat message', {
                messageId: message.id,
                interactionId,
                type: message.type,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    canUserSeeMessage(message, userId) {
        switch (message.type) {
            case 'party':
            case 'dm':
            case 'system':
                return true;
            case 'private':
                return message.userId === userId ||
                    (message.recipients && message.recipients.includes(userId));
            default:
                return false;
        }
    }
    initializeProfanityFilter() {
        const basicProfanity = [
            'damn', 'hell', 'crap', 'stupid', 'idiot'
        ];
        this.profanityWords = new Set(basicProfanity);
    }
    startRateLimitCleanup() {
        setInterval(() => {
            const now = Date.now();
            const windowDuration = 60 * 1000;
            for (const [userId, tracker] of this.rateLimitTrackers) {
                if (now - tracker.windowStart > windowDuration * 2) {
                    this.rateLimitTrackers.delete(userId);
                }
            }
        }, 5 * 60 * 1000);
    }
    cleanup() {
        this.rateLimitTrackers.clear();
        logger_1.logger.info('ChatService cleanup completed');
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=ChatService.js.map