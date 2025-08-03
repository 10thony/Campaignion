import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatService } from '../services/ChatService';
import { EventBroadcaster } from '../services/EventBroadcaster';
import { GameState, Participant, ChatMessage } from '../types';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let eventBroadcaster: EventBroadcaster;
  let mockGameState: GameState;
  let mockParticipants: Map<string, Participant>;

  beforeEach(() => {
    eventBroadcaster = new EventBroadcaster();
    chatService = new ChatService(eventBroadcaster, {
      maxMessageLength: 100,
      maxHistorySize: 10,
      enableProfanityFilter: true,
      rateLimitPerMinute: 5,
      allowPrivateMessages: true,
    });

    // Create mock participants
    mockParticipants = new Map([
      ['user1', {
        userId: 'user1',
        entityId: 'char1',
        entityType: 'playerCharacter',
        connectionId: 'conn1',
        isConnected: true,
        lastActivity: new Date(),
      }],
      ['user2', {
        userId: 'user2',
        entityId: 'char2',
        entityType: 'playerCharacter',
        connectionId: 'conn2',
        isConnected: true,
        lastActivity: new Date(),
      }],
      ['dm1', {
        userId: 'dm1',
        entityId: 'dm',
        entityType: 'npc',
        connectionId: 'conn3',
        isConnected: true,
        lastActivity: new Date(),
      }],
    ]);

    // Create mock game state
    mockGameState = {
      interactionId: 'test-interaction',
      status: 'active',
      initiativeOrder: [],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map(),
      mapState: {
        width: 10,
        height: 10,
        entities: new Map(),
        obstacles: [],
        terrain: [],
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date(),
    };
  });

  afterEach(() => {
    chatService.cleanup();
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a party message successfully', async () => {
      const broadcastSpy = vi.spyOn(eventBroadcaster, 'broadcast').mockResolvedValue();

      const message = await chatService.sendMessage(
        'test-interaction',
        'user1',
        'Hello party!',
        'party',
        undefined,
        'char1'
      );

      expect(message).toMatchObject({
        userId: 'user1',
        entityId: 'char1',
        content: 'Hello party!',
        type: 'party',
      });
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
      expect(broadcastSpy).toHaveBeenCalledWith('test-interaction', expect.objectContaining({
        type: 'CHAT_MESSAGE',
        message: expect.objectContaining({
          content: 'Hello party!',
          type: 'party',
        }),
      }));
    });

    it('should send a private message successfully', async () => {
      const broadcastToUserSpy = vi.spyOn(eventBroadcaster, 'broadcastToUser').mockResolvedValue();

      const message = await chatService.sendMessage(
        'test-interaction',
        'user1',
        'Private message',
        'private',
        ['user2'],
        'char1'
      );

      expect(message).toMatchObject({
        userId: 'user1',
        content: 'Private message',
        type: 'private',
        recipients: ['user2'],
      });

      // Should broadcast to sender and recipient
      expect(broadcastToUserSpy).toHaveBeenCalledTimes(2);
      expect(broadcastToUserSpy).toHaveBeenCalledWith('test-interaction', 'user1', expect.any(Object));
      expect(broadcastToUserSpy).toHaveBeenCalledWith('test-interaction', 'user2', expect.any(Object));
    });

    it('should send a DM message successfully', async () => {
      const broadcastSpy = vi.spyOn(eventBroadcaster, 'broadcast').mockResolvedValue();

      const message = await chatService.sendMessage(
        'test-interaction',
        'dm1',
        'DM announcement',
        'dm',
        undefined,
        'dm'
      );

      expect(message).toMatchObject({
        userId: 'dm1',
        content: 'DM announcement',
        type: 'dm',
      });
      expect(broadcastSpy).toHaveBeenCalledWith('test-interaction', expect.objectContaining({
        type: 'CHAT_MESSAGE',
        message: expect.objectContaining({
          content: 'DM announcement',
          type: 'dm',
        }),
      }));
    });

    it('should send a system message successfully', async () => {
      const broadcastSpy = vi.spyOn(eventBroadcaster, 'broadcast').mockResolvedValue();

      const message = await chatService.sendMessage(
        'test-interaction',
        'system',
        'System notification',
        'system'
      );

      expect(message).toMatchObject({
        userId: 'system',
        content: 'System notification',
        type: 'system',
      });
      expect(broadcastSpy).toHaveBeenCalledWith('test-interaction', expect.objectContaining({
        type: 'CHAT_MESSAGE',
        message: expect.objectContaining({
          content: 'System notification',
          type: 'system',
        }),
      }));
    });

    it('should reject messages that are too long', async () => {
      const longMessage = 'a'.repeat(101); // Exceeds maxMessageLength of 100

      await expect(
        chatService.sendMessage('test-interaction', 'user1', longMessage, 'party')
      ).rejects.toThrow('Message too long');
    });

    it('should reject empty messages', async () => {
      await expect(
        chatService.sendMessage('test-interaction', 'user1', '   ', 'party')
      ).rejects.toThrow('Message cannot be empty');
    });

    it('should apply profanity filter', async () => {
      const broadcastSpy = vi.spyOn(eventBroadcaster, 'broadcast').mockResolvedValue();

      const message = await chatService.sendMessage(
        'test-interaction',
        'user1',
        'This is damn good!',
        'party'
      );

      expect(message.content).toBe('This is **** good!');
      expect(broadcastSpy).toHaveBeenCalled();
    });

    it('should enforce rate limiting', async () => {
      vi.spyOn(eventBroadcaster, 'broadcast').mockResolvedValue();

      // Send 5 messages (at the limit)
      for (let i = 0; i < 5; i++) {
        await chatService.sendMessage('test-interaction', 'user1', `Message ${i}`, 'party');
      }

      // 6th message should be rate limited
      await expect(
        chatService.sendMessage('test-interaction', 'user1', 'Rate limited message', 'party')
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('sendSystemMessage', () => {
    it('should send system message to all participants', async () => {
      const broadcastSpy = vi.spyOn(eventBroadcaster, 'broadcast').mockResolvedValue();

      const message = await chatService.sendSystemMessage(
        'test-interaction',
        'Game started!'
      );

      expect(message).toMatchObject({
        userId: 'system',
        content: 'Game started!',
        type: 'system',
      });
      expect(broadcastSpy).toHaveBeenCalledWith('test-interaction', expect.objectContaining({
        type: 'CHAT_MESSAGE',
        message: expect.objectContaining({
          type: 'system',
        }),
      }));
    });

    it('should send system message to specific recipients', async () => {
      const broadcastToUserSpy = vi.spyOn(eventBroadcaster, 'broadcastToUser').mockResolvedValue();

      const message = await chatService.sendSystemMessage(
        'test-interaction',
        'Private system message',
        ['user1', 'user2']
      );

      expect(message.recipients).toEqual(['user1', 'user2']);
      expect(broadcastToUserSpy).toHaveBeenCalledTimes(2);
      expect(broadcastToUserSpy).toHaveBeenCalledWith('test-interaction', 'user1', expect.any(Object));
      expect(broadcastToUserSpy).toHaveBeenCalledWith('test-interaction', 'user2', expect.any(Object));
    });
  });

  describe('getChatHistory', () => {
    beforeEach(() => {
      // Add some test messages to chat log
      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          userId: 'user1',
          entityId: 'char1',
          content: 'Party message 1',
          type: 'party',
          timestamp: Date.now() - 3000,
        },
        {
          id: 'msg2',
          userId: 'user2',
          entityId: 'char2',
          content: 'Party message 2',
          type: 'party',
          timestamp: Date.now() - 2000,
        },
        {
          id: 'msg3',
          userId: 'user1',
          entityId: 'char1',
          content: 'Private to user2',
          type: 'private',
          recipients: ['user2'],
          timestamp: Date.now() - 1000,
        },
        {
          id: 'msg4',
          userId: 'dm1',
          entityId: 'dm',
          content: 'DM message',
          type: 'dm',
          timestamp: Date.now(),
        },
      ];
      mockGameState.chatLog = messages;
    });

    it('should return all visible messages for a user', () => {
      const messages = chatService.getChatHistory(mockGameState, 'user1');

      expect(messages).toHaveLength(4); // All messages visible to user1
      expect(messages[0].content).toBe('DM message'); // Most recent first
      expect(messages[3].content).toBe('Party message 1'); // Oldest last
    });

    it('should filter by channel type', () => {
      const partyMessages = chatService.getChatHistory(mockGameState, 'user1', 'party');
      expect(partyMessages).toHaveLength(2);
      expect(partyMessages.every(msg => msg.type === 'party')).toBe(true);

      const dmMessages = chatService.getChatHistory(mockGameState, 'user1', 'dm');
      expect(dmMessages).toHaveLength(1);
      expect(dmMessages[0].type).toBe('dm');
    });

    it('should respect message limits', () => {
      const messages = chatService.getChatHistory(mockGameState, 'user1', undefined, 2);
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('DM message'); // Most recent
      expect(messages[1].content).toBe('Private to user2'); // Second most recent
    });

    it('should filter private messages correctly', () => {
      // user2 should see the private message sent to them
      const user2Messages = chatService.getChatHistory(mockGameState, 'user2', 'private');
      expect(user2Messages).toHaveLength(1);
      expect(user2Messages[0].content).toBe('Private to user2');

      // dm1 should not see private messages between users
      const dmMessages = chatService.getChatHistory(mockGameState, 'dm1', 'private');
      expect(dmMessages).toHaveLength(0);
    });
  });

  describe('addMessageToHistory', () => {
    it('should add message to game state chat log', () => {
      const message: ChatMessage = {
        id: 'test-msg',
        userId: 'user1',
        content: 'Test message',
        type: 'party',
        timestamp: Date.now(),
      };

      chatService.addMessageToHistory(mockGameState, message);

      expect(mockGameState.chatLog).toHaveLength(1);
      expect(mockGameState.chatLog[0]).toEqual(message);
      expect(mockGameState.timestamp).toBeInstanceOf(Date);
    });

    it('should trim history when it exceeds max size', () => {
      // Fill chat log to max capacity
      for (let i = 0; i < 10; i++) {
        mockGameState.chatLog.push({
          id: `msg${i}`,
          userId: 'user1',
          content: `Message ${i}`,
          type: 'party',
          timestamp: Date.now() + i,
        });
      }

      // Add one more message (should trigger trimming)
      const newMessage: ChatMessage = {
        id: 'new-msg',
        userId: 'user1',
        content: 'New message',
        type: 'party',
        timestamp: Date.now() + 100,
      };

      chatService.addMessageToHistory(mockGameState, newMessage);

      expect(mockGameState.chatLog).toHaveLength(10); // Should stay at max size
      expect(mockGameState.chatLog[0].id).toBe('msg1'); // First message should be removed
      expect(mockGameState.chatLog[9].id).toBe('new-msg'); // New message should be at the end
    });
  });

  describe('validateChatPermissions', () => {
    it('should allow party messages for participants', () => {
      const result = chatService.validateChatPermissions('user1', 'party', mockParticipants);
      expect(result.allowed).toBe(true);
    });

    it('should reject messages from non-participants', () => {
      const result = chatService.validateChatPermissions('unknown-user', 'party', mockParticipants);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not a participant');
    });

    it('should allow DM messages', () => {
      const result = chatService.validateChatPermissions('dm1', 'dm', mockParticipants);
      expect(result.allowed).toBe(true);
    });

    it('should validate private message recipients', () => {
      // Valid recipients
      const validResult = chatService.validateChatPermissions(
        'user1',
        'private',
        mockParticipants,
        ['user2']
      );
      expect(validResult.allowed).toBe(true);

      // Invalid recipients
      const invalidResult = chatService.validateChatPermissions(
        'user1',
        'private',
        mockParticipants,
        ['unknown-user']
      );
      expect(invalidResult.allowed).toBe(false);
      expect(invalidResult.reason).toContain('not a participant');

      // No recipients
      const noRecipientsResult = chatService.validateChatPermissions(
        'user1',
        'private',
        mockParticipants,
        []
      );
      expect(noRecipientsResult.allowed).toBe(false);
      expect(noRecipientsResult.reason).toContain('must have recipients');
    });

    it('should reject system messages from non-system users', () => {
      const result = chatService.validateChatPermissions('user1', 'system', mockParticipants);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Only system can send system messages');
    });

    it('should allow system messages from system user', () => {
      const result = chatService.validateChatPermissions('system', 'system', mockParticipants);
      expect(result.allowed).toBe(true);
    });
  });

  describe('rate limiting', () => {
    it('should reset rate limit after time window', async () => {
      vi.spyOn(eventBroadcaster, 'broadcast').mockResolvedValue();

      // Send messages up to the limit
      for (let i = 0; i < 5; i++) {
        await chatService.sendMessage('test-interaction', 'user1', `Message ${i}`, 'party');
      }

      // Mock time passage (more than 1 minute)
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 61000); // 61 seconds later

      // Should be able to send another message
      await expect(
        chatService.sendMessage('test-interaction', 'user1', 'After reset', 'party')
      ).resolves.toBeDefined();

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('message filtering', () => {
    it('should filter profanity when enabled', async () => {
      vi.spyOn(eventBroadcaster, 'broadcast').mockResolvedValue();

      const message = await chatService.sendMessage(
        'test-interaction',
        'user1',
        'You are stupid!',
        'party'
      );

      expect(message.content).toBe('You are ******!');
    });

    it('should not filter when profanity filter is disabled', async () => {
      // Create new service with profanity filter disabled
      const noProfanityService = new ChatService(eventBroadcaster, {
        enableProfanityFilter: false,
      });
      vi.spyOn(eventBroadcaster, 'broadcast').mockResolvedValue();

      const message = await noProfanityService.sendMessage(
        'test-interaction',
        'user1',
        'You are stupid!',
        'party'
      );

      expect(message.content).toBe('You are stupid!');
      noProfanityService.cleanup();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources', () => {
      // Add some rate limit trackers
      chatService.sendMessage('test-interaction', 'user1', 'Test', 'party').catch(() => {});
      
      // Cleanup should not throw
      expect(() => chatService.cleanup()).not.toThrow();
    });
  });
});