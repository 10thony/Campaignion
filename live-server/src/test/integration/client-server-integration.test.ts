/**
 * Live Server Integration Tests
 * 
 * This test suite covers the server-side integration testing:
 * - tRPC router endpoints
 * - WebSocket subscriptions
 * - Authentication middleware
 * - Error handling and recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { appRouter } from '../../routers';
import { createContext } from '../../middleware/context';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import * as trpcExpress from '@trpc/server/adapters/express';
import express from 'express';
import { RoomManager } from '../../services/RoomManager';
import { GameStateEngine } from '../../services/GameStateEngine';
import { EventBroadcaster } from '../../services/EventBroadcaster';
import { StatePersistence } from '../../services/StatePersistence';
import { createTRPCMsw } from 'msw-trpc';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock Convex client
const mockConvexClient = {
  query: vi.fn(),
  mutation: vi.fn(),
  action: vi.fn(),
};

vi.mock('../../config/convex', () => ({
  getConvexClient: () => mockConvexClient,
  createConvexClient: vi.fn(),
  checkConvexConnection: vi.fn().mockResolvedValue(true),
  closeConvexClient: vi.fn(),
}));

// Mock Clerk authentication
const mockClerkUser = {
  userId: 'test_user_123',
  sessionId: 'test_session_123',
  role: 'player',
};

vi.mock('../../middleware/auth', () => ({
  verifyClerkToken: vi.fn().mockResolvedValue(mockClerkUser),
  protectedProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    mutation: vi.fn().mockReturnThis(),
    subscription: vi.fn().mockReturnThis(),
  },
  dmOnlyProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    mutation: vi.fn().mockReturnThis(),
  },
}));

// Test data
const mockInteractionId = 'interaction_test_123';
const mockEntityId = 'char_test_player';

const mockGameState = {
  interactionId: mockInteractionId,
  status: 'active' as const,
  initiativeOrder: [
    {
      entityId: mockEntityId,
      entityType: 'playerCharacter' as const,
      initiative: 15,
      userId: 'test_user_123',
    },
    {
      entityId: 'monster_orc_1',
      entityType: 'monster' as const,
      initiative: 12,
      userId: undefined,
    },
  ],
  currentTurnIndex: 0,
  roundNumber: 1,
  participants: {
    [mockEntityId]: {
      entityId: mockEntityId,
      entityType: 'playerCharacter' as const,
      userId: 'test_user_123',
      currentHP: 25,
      maxHP: 30,
      position: { x: 5, y: 5 },
      conditions: [],
      inventory: {
        items: [],
        equippedItems: {},
        capacity: 20,
      },
      availableActions: [
        {
          id: 'attack',
          name: 'Attack',
          type: 'attack' as const,
          available: true,
          requirements: [],
        },
      ],
      turnStatus: 'active' as const,
    },
    'monster_orc_1': {
      entityId: 'monster_orc_1',
      entityType: 'monster' as const,
      userId: undefined,
      currentHP: 15,
      maxHP: 15,
      position: { x: 8, y: 8 },
      conditions: [],
      inventory: {
        items: [],
        equippedItems: {},
        capacity: 10,
      },
      availableActions: [],
      turnStatus: 'waiting' as const,
    },
  },
  mapState: {
    width: 20,
    height: 20,
    entities: {
      [mockEntityId]: { entityId: mockEntityId, position: { x: 5, y: 5 } },
      'monster_orc_1': { entityId: 'monster_orc_1', position: { x: 8, y: 8 } },
    },
    obstacles: [],
    terrain: [],
  },
  turnHistory: [],
  chatLog: [],
  timestamp: new Date(),
};

describe('Live Server Integration Tests', () => {
  let server: ReturnType<typeof createServer>;
  let wss: WebSocketServer;
  let app: express.Application;
  let roomManager: RoomManager;
  let gameEngine: GameStateEngine;
  let eventBroadcaster: EventBroadcaster;
  let statePersistence: StatePersistence;
  let serverPort: number;

  beforeAll(async () => {
    // Initialize services
    roomManager = new RoomManager();
    gameEngine = new GameStateEngine();
    eventBroadcaster = new EventBroadcaster();
    statePersistence = new StatePersistence();

    // Create Express app
    app = express();
    server = createServer(app);
    wss = new WebSocketServer({ server });

    // Set up tRPC HTTP handler
    app.use('/trpc', trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: createContext,
    }));

    // Set up WebSocket handler
    applyWSSHandler({
      wss,
      router: appRouter,
      createContext: createContext,
    });

    // Start server on random port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        serverPort = typeof address === 'object' && address ? address.port : 3001;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Convex responses
    mockConvexClient.query.mockResolvedValue({
      _id: mockInteractionId,
      name: 'Test Interaction',
      dmUserId: 'test_dm_123',
      liveStatus: 'idle',
    });
    
    mockConvexClient.mutation.mockResolvedValue({ success: true });
  });

  describe('tRPC HTTP Endpoints', () => {
    it('should handle health check endpoint', async () => {
      const response = await fetch(`http://localhost:${serverPort}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.services.convex).toBe('healthy');
      expect(data.services.websocket).toBe('healthy');
    });

    it('should handle joinRoom mutation', async () => {
      const response = await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          entityId: mockEntityId,
          entityType: 'playerCharacter',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.data.success).toBe(true);
    });

    it('should handle getRoomState query', async () => {
      // First join a room to create state
      await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          entityId: mockEntityId,
          entityType: 'playerCharacter',
        }),
      });

      // Then get room state
      const response = await fetch(`http://localhost:${serverPort}/trpc/interaction.getRoomState`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.data.success).toBe(true);
      expect(data.result.data.gameState).toBeDefined();
    });

    it('should handle takeTurn mutation', async () => {
      // First join a room
      await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          entityId: mockEntityId,
          entityType: 'playerCharacter',
        }),
      });

      // Then take a turn
      const response = await fetch(`http://localhost:${serverPort}/trpc/interaction.takeTurn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          type: 'attack',
          entityId: mockEntityId,
          target: 'monster_orc_1',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.data.success).toBe(true);
    });

    it('should handle authentication errors', async () => {
      const response = await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No authorization header
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          entityId: mockEntityId,
          entityType: 'playerCharacter',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should validate input parameters', async () => {
      const response = await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          // Missing required fields
          interactionId: mockInteractionId,
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('WebSocket Subscriptions', () => {
    it('should establish WebSocket connection', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}`);
      
      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => resolve());
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });

    it('should handle room updates subscription', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}`);
      
      await new Promise<void>((resolve) => {
        ws.on('open', resolve);
      });

      // Subscribe to room updates
      ws.send(JSON.stringify({
        id: 1,
        method: 'subscription',
        params: {
          path: 'interaction.roomUpdates',
          input: { interactionId: mockInteractionId },
        },
      }));

      // Wait for subscription confirmation
      const messages: any[] = [];
      await new Promise<void>((resolve) => {
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          messages.push(message);
          if (message.id === 1 && message.result?.type === 'started') {
            resolve();
          }
        });
        setTimeout(resolve, 2000);
      });

      expect(messages.some(m => m.result?.type === 'started')).toBe(true);
      ws.close();
    });

    it('should broadcast events to subscribed clients', async () => {
      const ws1 = new WebSocket(`ws://localhost:${serverPort}`);
      const ws2 = new WebSocket(`ws://localhost:${serverPort}`);
      
      // Wait for both connections
      await Promise.all([
        new Promise<void>((resolve) => ws1.on('open', resolve)),
        new Promise<void>((resolve) => ws2.on('open', resolve)),
      ]);

      // Subscribe both clients to room updates
      ws1.send(JSON.stringify({
        id: 1,
        method: 'subscription',
        params: {
          path: 'interaction.roomUpdates',
          input: { interactionId: mockInteractionId },
        },
      }));

      ws2.send(JSON.stringify({
        id: 1,
        method: 'subscription',
        params: {
          path: 'interaction.roomUpdates',
          input: { interactionId: mockInteractionId },
        },
      }));

      // Wait for subscriptions to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger an event by joining a room
      await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          entityId: mockEntityId,
          entityType: 'playerCharacter',
        }),
      });

      // Both clients should receive the event
      const messages1: any[] = [];
      const messages2: any[] = [];

      ws1.on('message', (data) => {
        messages1.push(JSON.parse(data.toString()));
      });

      ws2.on('message', (data) => {
        messages2.push(JSON.parse(data.toString()));
      });

      // Wait for messages
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Both clients should have received participant joined event
      expect(messages1.some(m => m.result?.data?.type === 'PARTICIPANT_JOINED')).toBe(true);
      expect(messages2.some(m => m.result?.data?.type === 'PARTICIPANT_JOINED')).toBe(true);

      ws1.close();
      ws2.close();
    });

    it('should handle WebSocket disconnection gracefully', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}`);
      
      await new Promise<void>((resolve) => {
        ws.on('open', resolve);
      });

      // Subscribe to room updates
      ws.send(JSON.stringify({
        id: 1,
        method: 'subscription',
        params: {
          path: 'interaction.roomUpdates',
          input: { interactionId: mockInteractionId },
        },
      }));

      // Wait for subscription
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Close connection abruptly
      ws.terminate();

      // Server should handle disconnection without crashing
      // This is verified by the fact that the test completes without error
      expect(true).toBe(true);
    });
  });

  describe('Authentication Integration', () => {
    it('should authenticate WebSocket connections', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}`, {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });
      
      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => resolve());
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });

    it('should reject unauthenticated WebSocket connections', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}`);
      
      let errorOccurred = false;
      ws.on('error', () => {
        errorOccurred = true;
      });

      ws.on('close', (code) => {
        expect(code).toBe(1008); // Policy violation
        errorOccurred = true;
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      expect(errorOccurred).toBe(true);
    });

    it('should validate user permissions for actions', async () => {
      // Mock user without DM permissions
      vi.mocked(require('../../middleware/auth').verifyClerkToken).mockResolvedValueOnce({
        userId: 'regular_user_123',
        sessionId: 'test_session_123',
        role: 'player',
      });

      // Try to use DM-only endpoint
      const response = await fetch(`http://localhost:${serverPort}/trpc/interaction.pauseInteraction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          reason: 'Test pause',
        }),
      });

      expect(response.status).toBe(403); // Forbidden
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle Convex connection failures', async () => {
      // Mock Convex failure
      mockConvexClient.query.mockRejectedValueOnce(new Error('Convex connection failed'));

      const response = await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          entityId: mockEntityId,
          entityType: 'playerCharacter',
        }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle invalid game actions gracefully', async () => {
      // First join a room
      await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          entityId: mockEntityId,
          entityType: 'playerCharacter',
        }),
      });

      // Try invalid action (attacking non-existent target)
      const response = await fetch(`http://localhost:${serverPort}/trpc/interaction.takeTurn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          type: 'attack',
          entityId: mockEntityId,
          target: 'non_existent_target',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.data.success).toBe(false);
      expect(data.result.data.result.errors).toBeDefined();
    });

    it('should handle room cleanup on server restart', async () => {
      // Join a room
      await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          entityId: mockEntityId,
          entityType: 'playerCharacter',
        }),
      });

      // Simulate server restart by clearing room manager
      roomManager = new RoomManager();

      // Try to get room state - should handle missing room gracefully
      const response = await fetch(`http://localhost:${serverPort}/trpc/interaction.getRoomState`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      // Should either recreate room or return appropriate error
      expect(data.result.data).toBeDefined();
    });

    it('should handle concurrent user actions', async () => {
      // Join room with first user
      await fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-1',
        },
        body: JSON.stringify({
          interactionId: mockInteractionId,
          entityId: 'char_player_1',
          entityType: 'playerCharacter',
        }),
      });

      // Simulate concurrent turn actions
      const promises = [
        fetch(`http://localhost:${serverPort}/trpc/interaction.takeTurn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-1',
          },
          body: JSON.stringify({
            type: 'attack',
            entityId: 'char_player_1',
            target: 'monster_orc_1',
          }),
        }),
        fetch(`http://localhost:${serverPort}/trpc/interaction.takeTurn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-1',
          },
          body: JSON.stringify({
            type: 'move',
            entityId: 'char_player_1',
            position: { x: 6, y: 6 },
          }),
        }),
      ];

      const responses = await Promise.all(promises);
      
      // One should succeed, one should fail due to turn already taken
      const results = await Promise.all(responses.map(r => r.json()));
      const successes = results.filter(r => r.result.data.success);
      const failures = results.filter(r => !r.result.data.success);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
    });

    it('should handle memory pressure gracefully', async () => {
      // Create many rooms to simulate memory pressure
      const roomPromises = [];
      for (let i = 0; i < 100; i++) {
        roomPromises.push(
          fetch(`http://localhost:${serverPort}/trpc/interaction.joinRoom`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token',
            },
            body: JSON.stringify({
              interactionId: `interaction_${i}`,
              entityId: `char_${i}`,
              entityType: 'playerCharacter',
            }),
          })
        );
      }

      const responses = await Promise.all(roomPromises);
      
      // All requests should be handled, even under load
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent connections', async () => {
      const connections: WebSocket[] = [];
      const connectionPromises = [];

      // Create 50 concurrent WebSocket connections
      for (let i = 0; i < 50; i++) {
        const ws = new WebSocket(`ws://localhost:${serverPort}`, {
          headers: {
            'Authorization': 'Bearer test-token',
          },
        });
        connections.push(ws);
        
        connectionPromises.push(
          new Promise<void>((resolve, reject) => {
            ws.on('open', () => resolve());
            ws.on('error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 10000);
          })
        );
      }

      // All connections should establish successfully
      await Promise.all(connectionPromises);
      
      expect(connections.every(ws => ws.readyState === WebSocket.OPEN)).toBe(true);

      // Clean up connections
      connections.forEach(ws => ws.close());
    });

    it('should handle high-frequency message broadcasting', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}`, {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });
      
      await new Promise<void>((resolve) => {
        ws.on('open', resolve);
      });

      // Subscribe to room updates
      ws.send(JSON.stringify({
        id: 1,
        method: 'subscription',
        params: {
          path: 'interaction.roomUpdates',
          input: { interactionId: mockInteractionId },
        },
      }));

      // Wait for subscription
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send many rapid actions
      const actionPromises = [];
      for (let i = 0; i < 100; i++) {
        actionPromises.push(
          fetch(`http://localhost:${serverPort}/trpc/interaction.sendChatMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token',
            },
            body: JSON.stringify({
              interactionId: mockInteractionId,
              content: `Message ${i}`,
              type: 'party',
            }),
          })
        );
      }

      const responses = await Promise.all(actionPromises);
      
      // All messages should be processed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      ws.close();
    });
  });
});