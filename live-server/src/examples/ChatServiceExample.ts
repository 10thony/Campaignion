/**
 * Example demonstrating ChatService functionality
 * This shows how to use the chat system for live D&D interactions
 */

import { ChatService } from '../services/ChatService';
import { EventBroadcaster } from '../services/EventBroadcaster';
import { GameState, Participant } from '../types';

async function demonstrateChatService() {
  console.log('=== Chat Service Example ===\n');

  // Initialize services
  const eventBroadcaster = new EventBroadcaster();
  const chatService = new ChatService(eventBroadcaster, {
    maxMessageLength: 500,
    maxHistorySize: 100,
    enableProfanityFilter: true,
    rateLimitPerMinute: 10,
    allowPrivateMessages: true,
  });

  // Create mock participants
  const participants = new Map<string, Participant>([
    ['player1', {
      userId: 'player1',
      entityId: 'char1',
      entityType: 'playerCharacter',
      connectionId: 'conn1',
      isConnected: true,
      lastActivity: new Date(),
    }],
    ['player2', {
      userId: 'player2',
      entityId: 'char2',
      entityType: 'playerCharacter',
      connectionId: 'conn2',
      isConnected: true,
      lastActivity: new Date(),
    }],
    ['dm', {
      userId: 'dm',
      entityId: 'dm-npc',
      entityType: 'npc',
      connectionId: 'conn3',
      isConnected: true,
      lastActivity: new Date(),
    }],
  ]);

  // Create mock game state
  const gameState: GameState = {
    interactionId: 'demo-interaction',
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

  // Set up event listeners to demonstrate real-time broadcasting
  const eventSubscriptions: string[] = [];

  // Subscribe to chat events for each participant
  for (const [userId] of participants) {
    const subscriptionId = eventBroadcaster.subscribe(
      'demo-interaction',
      ['CHAT_MESSAGE'],
      (event) => {
        if (event.type === 'CHAT_MESSAGE') {
          console.log(`[${userId}] Received message: "${event.message.content}" from ${event.message.userId} (${event.message.type})`);
        }
      },
      userId
    );
    eventSubscriptions.push(subscriptionId);
  }

  try {
    console.log('1. Sending party messages...');
    
    // Send party messages
    const partyMessage1 = await chatService.sendMessage(
      'demo-interaction',
      'player1',
      'Hello everyone! Ready for adventure?',
      'party',
      undefined,
      'char1'
    );
    chatService.addMessageToHistory(gameState, partyMessage1);

    const partyMessage2 = await chatService.sendMessage(
      'demo-interaction',
      'player2',
      'Let\'s do this!',
      'party',
      undefined,
      'char2'
    );
    chatService.addMessageToHistory(gameState, partyMessage2);

    console.log('\n2. Sending DM message...');
    
    // Send DM message
    const dmMessage = await chatService.sendMessage(
      'demo-interaction',
      'dm',
      'You see a mysterious door ahead...',
      'dm',
      undefined,
      'dm-npc'
    );
    chatService.addMessageToHistory(gameState, dmMessage);

    console.log('\n3. Sending private message...');
    
    // Send private message
    const privateMessage = await chatService.sendMessage(
      'demo-interaction',
      'player1',
      'I think we should be careful here',
      'private',
      ['player2'],
      'char1'
    );
    chatService.addMessageToHistory(gameState, privateMessage);

    console.log('\n4. Sending system message...');
    
    // Send system message
    const systemMessage = await chatService.sendSystemMessage(
      'demo-interaction',
      'Combat has begun! Roll for initiative.'
    );
    chatService.addMessageToHistory(gameState, systemMessage);

    console.log('\n5. Testing profanity filter...');
    
    // Test profanity filter
    const filteredMessage = await chatService.sendMessage(
      'demo-interaction',
      'player1',
      'This damn puzzle is stupid!',
      'party',
      undefined,
      'char1'
    );
    chatService.addMessageToHistory(gameState, filteredMessage);
    console.log(`Original vs Filtered: "This damn puzzle is stupid!" -> "${filteredMessage.content}"`);

    console.log('\n6. Retrieving chat history...');
    
    // Get chat history
    const allMessages = chatService.getChatHistory(gameState, 'player1');
    console.log(`Total messages visible to player1: ${allMessages.length}`);

    const partyMessages = chatService.getChatHistory(gameState, 'player1', 'party');
    console.log(`Party messages visible to player1: ${partyMessages.length}`);

    const privateMessages = chatService.getChatHistory(gameState, 'player2', 'private');
    console.log(`Private messages visible to player2: ${privateMessages.length}`);

    console.log('\n7. Testing permission validation...');
    
    // Test permission validation
    const validPermission = chatService.validateChatPermissions('player1', 'party', participants);
    console.log(`Player1 can send party messages: ${validPermission.allowed}`);

    const invalidPermission = chatService.validateChatPermissions('unknown-user', 'party', participants);
    console.log(`Unknown user can send party messages: ${invalidPermission.allowed} (${invalidPermission.reason})`);

    const privatePermission = chatService.validateChatPermissions('player1', 'private', participants, ['player2']);
    console.log(`Player1 can send private message to player2: ${privatePermission.allowed}`);

    const invalidPrivatePermission = chatService.validateChatPermissions('player1', 'private', participants, ['unknown-user']);
    console.log(`Player1 can send private message to unknown user: ${invalidPrivatePermission.allowed} (${invalidPrivatePermission.reason})`);

    console.log('\n8. Testing rate limiting...');
    
    // Test rate limiting (send messages quickly)
    try {
      for (let i = 0; i < 12; i++) { // Exceeds rate limit of 10
        await chatService.sendMessage(
          'demo-interaction',
          'player1',
          `Rapid message ${i}`,
          'party'
        );
      }
    } catch (error) {
      console.log(`Rate limiting triggered: ${(error as Error).message}`);
    }

    console.log('\n9. Final chat log summary...');
    console.log(`Total messages in chat log: ${gameState.chatLog.length}`);
    console.log('Message types:', gameState.chatLog.map(msg => msg.type).join(', '));

    console.log('\n=== Chat Service Example Complete ===');

  } catch (error) {
    console.error('Error in chat service example:', error);
  } finally {
    // Cleanup
    for (const subscriptionId of eventSubscriptions) {
      eventBroadcaster.unsubscribe(subscriptionId);
    }
    
    chatService.cleanup();
    await eventBroadcaster.shutdown();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  demonstrateChatService().catch(console.error);
}

export { demonstrateChatService };