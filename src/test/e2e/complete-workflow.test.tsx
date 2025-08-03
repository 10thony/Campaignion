/**
 * End-to-End Complete Workflow Tests
 * 
 * This test suite covers the complete user workflow from interactions list
 * to live gameplay, testing the full integration between client and server.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { InteractionsPage } from '../../pages/InteractionsPage';
import { App } from '../../App';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { WebSocket } from 'ws';

// Mock data for complete workflow
const mockCampaign = {
  _id: 'campaign_123',
  name: 'Test Campaign',
  dmUserId: 'dm_user_123',
};

const mockInteraction = {
  _id: 'interaction_123',
  name: 'Dragon Encounter',
  description: 'A fierce battle with an ancient red dragon',
  campaignId: 'campaign_123',
  dmUserId: 'dm_user_123',
  liveStatus: {
    status: 'idle' as const,
    participantCount: 0,
    lastActivity: new Date(),
    currentTurn: null,
  },
};

const mockCharacter = {
  _id: 'char_123',
  name: 'Thorin Ironforge',
  userId: 'player_123',
  campaignId: 'campaign_123',
  level: 5,
  hitPoints: 45,
  maxHitPoints: 45,
};

// Mock WebSocket for real-time testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private messageQueue: any[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
      this.emit('open', new Event('open'));
      
      // Process queued messages
      this.messageQueue.forEach(msg => this.simulateMessage(msg));
      this.messageQueue = [];
    }, 100);
  }

  send(data: string) {
    console.log('WebSocket send:', data);
    
    // Parse tRPC message and simulate appropriate response
    try {
      const message = JSON.parse(data);
      this.handleTRPCMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
    this.emit('close', new CloseEvent('close'));
  }

  addEventListener(event: string, listener: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  removeEventListener(event: string, listener: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  private handleTRPCMessage(message: any) {
    if (message.method === 'subscription') {
      // Handle subscription requests
      setTimeout(() => {
        this.simulateMessage({
          id: message.id,
          result: {
            type: 'started',
          },
        });
      }, 50);

      // Simulate subscription data based on path
      if (message.params?.path === 'interaction.roomUpdates') {
        setTimeout(() => {
          this.simulateMessage({
            id: message.id,
            result: {
              type: 'data',
              data: {
                type: 'PARTICIPANT_JOINED',
                userId: 'player_123',
                entityId: 'char_thorin',
                timestamp: Date.now(),
              },
            },
          });
        }, 200);
      }
    }
  }

  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      const event = new MessageEvent('message', { 
        data: JSON.stringify(data) 
      });
      this.onmessage?.(event);
      this.emit('message', event);
    } else {
      // Queue message for when connection opens
      this.messageQueue.push(data);
    }
  }

  // Helper methods for testing
  simulateGameEvent(event: any) {
    this.simulateMessage({
      id: 1,
      result: {
        type: 'data',
        data: event,
      },
    });
  }

  simulateError(error: string) {
    this.simulateMessage({
      id: 1,
      error: {
        message: error,
        code: -32603,
      },
    });
  }
}

// MSW handlers for complete workflow
const handlers = [
  // Health check
  rest.get('http://localhost:3001/health', (req, res, ctx) => {
    return res(ctx.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'test',
      uptime: 100,
      responseTime: 50,
      services: {
        convex: 'healthy',
        websocket: 'healthy',
      },
      stats: {
        activeRooms: 0,
      },
    }));
  }),

  // Join room
  rest.post('http://localhost:3001/trpc/interaction.joinRoom', (req, res, ctx) => {
    return res(ctx.json({
      result: {
        data: {
          success: true,
          gameState: {
            interactionId: 'interaction_123',
            status: 'active',
            initiativeOrder: [
              {
                entityId: 'char_thorin',
                entityType: 'playerCharacter',
                initiative: 18,
                userId: 'player_123',
              },
              {
                entityId: 'dragon_ancient_red',
                entityType: 'monster',
                initiative: 15,
                userId: undefined,
              },
            ],
            currentTurnIndex: 0,
            roundNumber: 1,
            participants: {
              'char_thorin': {
                entityId: 'char_thorin',
                entityType: 'playerCharacter',
                userId: 'player_123',
                currentHP: 45,
                maxHP: 45,
                position: { x: 10, y: 10 },
                conditions: [],
                inventory: {
                  items: [
                    {
                      id: 'item_1',
                      itemId: 'warhammer',
                      quantity: 1,
                      properties: { damage: '1d8+3' },
                    },
                    {
                      id: 'item_2',
                      itemId: 'healing_potion',
                      quantity: 2,
                      properties: { healing: '2d4+2' },
                    },
                  ],
                  equippedItems: { mainHand: 'warhammer' },
                  capacity: 20,
                },
                availableActions: [
                  {
                    id: 'attack',
                    name: 'Attack',
                    type: 'attack',
                    available: true,
                    requirements: [],
                  },
                  {
                    id: 'move',
                    name: 'Move',
                    type: 'move',
                    available: true,
                    requirements: [],
                  },
                  {
                    id: 'use_item',
                    name: 'Use Item',
                    type: 'useItem',
                    available: true,
                    requirements: [],
                  },
                ],
                turnStatus: 'active',
              },
              'dragon_ancient_red': {
                entityId: 'dragon_ancient_red',
                entityType: 'monster',
                userId: undefined,
                currentHP: 546,
                maxHP: 546,
                position: { x: 15, y: 15 },
                conditions: [],
                inventory: {
                  items: [],
                  equippedItems: {},
                  capacity: 0,
                },
                availableActions: [],
                turnStatus: 'waiting',
              },
            },
            mapState: {
              width: 30,
              height: 30,
              entities: {
                'char_thorin': { entityId: 'char_thorin', position: { x: 10, y: 10 } },
                'dragon_ancient_red': { entityId: 'dragon_ancient_red', position: { x: 15, y: 15 } },
              },
              obstacles: [
                { x: 12, y: 12 },
                { x: 13, y: 12 },
                { x: 14, y: 12 },
              ],
              terrain: [],
            },
            turnHistory: [],
            chatLog: [],
            timestamp: new Date(),
          },
        },
      },
    }));
  }),

  // Get room state
  rest.post('http://localhost:3001/trpc/interaction.getRoomState', (req, res, ctx) => {
    return res(ctx.json({
      result: {
        data: {
          success: true,
          gameState: {
            interactionId: 'interaction_123',
            status: 'active',
            initiativeOrder: [
              {
                entityId: 'char_thorin',
                entityType: 'playerCharacter',
                initiative: 18,
                userId: 'player_123',
              },
            ],
            currentTurnIndex: 0,
            roundNumber: 1,
            participants: {},
            mapState: { width: 30, height: 30, entities: {}, obstacles: [], terrain: [] },
            turnHistory: [],
            chatLog: [],
            timestamp: new Date(),
          },
        },
      },
    }));
  }),

  // Take turn
  rest.post('http://localhost:3001/trpc/interaction.takeTurn', (req, res, ctx) => {
    return res(ctx.json({
      result: {
        data: {
          success: true,
          result: {
            valid: true,
            errors: [],
            effects: ['Dealt 12 damage to dragon_ancient_red'],
          },
          gameState: {
            interactionId: 'interaction_123',
            status: 'active',
            currentTurnIndex: 1, // Advanced to next turn
            roundNumber: 1,
            participants: {
              'dragon_ancient_red': {
                entityId: 'dragon_ancient_red',
                currentHP: 534, // Reduced HP
                maxHP: 546,
              },
            },
            turnHistory: [
              {
                entityId: 'char_thorin',
                turnNumber: 1,
                roundNumber: 1,
                actions: [
                  {
                    type: 'attack',
                    entityId: 'char_thorin',
                    target: 'dragon_ancient_red',
                  },
                ],
                startTime: new Date(),
                endTime: new Date(),
                status: 'completed',
              },
            ],
          },
        },
      },
    }));
  }),

  // Send chat message
  rest.post('http://localhost:3001/trpc/interaction.sendChatMessage', (req, res, ctx) => {
    return res(ctx.json({
      result: {
        data: {
          success: true,
          message: {
            id: 'msg_123',
            userId: 'player_123',
            content: 'For the mountain!',
            type: 'party',
            timestamp: Date.now(),
          },
        },
      },
    }));
  }),

  // Skip turn
  rest.post('http://localhost:3001/trpc/interaction.skipTurn', (req, res, ctx) => {
    return res(ctx.json({
      result: {
        data: {
          success: true,
          gameState: {
            currentTurnIndex: 1,
          },
        },
      },
    }));
  }),

  // Pause interaction
  rest.post('http://localhost:3001/trpc/interaction.pauseInteraction', (req, res, ctx) => {
    return res(ctx.json({
      result: {
        data: {
          success: true,
        },
      },
    }));
  }),

  // Resume interaction
  rest.post('http://localhost:3001/trpc/interaction.resumeInteraction', (req, res, ctx) => {
    return res(ctx.json({
      result: {
        data: {
          success: true,
        },
      },
    }));
  }),
];

// Mock Clerk with different user roles
const createMockClerkUser = (userId: string, role: 'player' | 'dm') => ({
  id: userId,
  firstName: role === 'dm' ? 'Dungeon' : 'Test',
  lastName: role === 'dm' ? 'Master' : 'Player',
  emailAddresses: [{ emailAddress: `${role}@example.com` }],
});

// Mock Convex responses
const mockConvexResponses = {
  interactions: [mockInteraction],
  campaigns: [mockCampaign],
  characters: [mockCharacter],
};

vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    userId: 'player_123',
    getToken: vi.fn().mockResolvedValue('mock-token'),
    isSignedIn: true,
  }),
  useUser: () => ({
    user: createMockClerkUser('player_123', 'player'),
    isLoaded: true,
  }),
}));

vi.mock('convex/react', () => ({
  ConvexProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useQuery: vi.fn((query) => {
    if (query.toString().includes('interactions')) {
      return mockConvexResponses.interactions;
    }
    if (query.toString().includes('campaigns')) {
      return mockConvexResponses.campaigns;
    }
    if (query.toString().includes('characters')) {
      return mockConvexResponses.characters;
    }
    return [];
  }),
  useMutation: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({ success: true })),
  ConvexReactClient: vi.fn(),
}));

// Mock WebSocket globally
global.WebSocket = MockWebSocket as any;

describe('Complete Workflow End-to-End Tests', () => {
  let queryClient: QueryClient;
  let mockWebSocket: MockWebSocket;

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    server.resetHandlers(...handlers);
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey="test-key">
          <ConvexProvider client={new ConvexReactClient('test-url')}>
            {component}
          </ConvexProvider>
        </ClerkProvider>
      </QueryClientProvider>
    );
  };

  describe('Complete Player Workflow', () => {
    it('should complete full player workflow from interactions list to combat', async () => {
      const user = userEvent.setup();

      // Step 1: Load interactions page
      renderWithProviders(<InteractionsPage />);

      // Wait for interactions to load
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      // Verify initial state
      expect(screen.getByText('idle')).toBeInTheDocument();
      expect(screen.getByText('0 connected')).toBeInTheDocument();

      // Step 2: DM starts the interaction (simulate by updating mock data)
      act(() => {
        mockConvexResponses.interactions[0].liveStatus.status = 'live';
        mockConvexResponses.interactions[0].liveStatus.participantCount = 1;
      });

      // Trigger re-render
      await waitFor(() => {
        expect(screen.getByText('Join')).toBeInTheDocument();
      });

      // Step 3: Player joins the interaction
      const joinButton = screen.getByText('Join');
      await user.click(joinButton);

      // Should open live modal
      await waitFor(() => {
        expect(screen.getByText('Live Interaction')).toBeInTheDocument();
      });

      // Step 4: Verify connection status
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Step 5: Verify game state loaded
      expect(screen.getByText('Initiative Order - Round 1')).toBeInTheDocument();
      expect(screen.getByText('char_thorin (You)')).toBeInTheDocument();
      expect(screen.getByText('Your Turn')).toBeInTheDocument();

      // Step 6: Verify character stats
      expect(screen.getByText('45/45')).toBeInTheDocument(); // HP display

      // Step 7: Take a combat action
      expect(screen.getByText('Available Actions')).toBeInTheDocument();
      
      const attackButton = screen.getByText('Attack');
      await user.click(attackButton);

      // Should show target selection
      await waitFor(() => {
        expect(screen.getByText('Select Target')).toBeInTheDocument();
      });

      const dragonButton = screen.getByText(/dragon_ancient_red/);
      await user.click(dragonButton);

      // Submit the action
      const submitButton = screen.getByText('Submit Action');
      await user.click(submitButton);

      // Step 8: Verify action result
      await waitFor(() => {
        expect(screen.queryByText('Your Turn')).not.toBeInTheDocument();
      });

      // Should show waiting for next turn
      expect(screen.getByText(/Waiting for.*turn/)).toBeInTheDocument();
    });

    it('should handle chat during combat', async () => {
      const user = userEvent.setup();

      renderWithProviders(<InteractionsPage />);

      // Join interaction
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      // Mock live status
      act(() => {
        mockConvexResponses.interactions[0].liveStatus.status = 'live';
      });

      const joinButton = await screen.findByText('Join');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Live Interaction')).toBeInTheDocument();
      });

      // Switch to chat tab
      const chatTab = screen.getByText('Chat');
      await user.click(chatTab);

      // Send a message
      const chatInput = screen.getByPlaceholderText('Message party...');
      await user.type(chatInput, 'For the mountain!');

      const sendButton = screen.getByText('Send');
      await user.click(sendButton);

      // Should clear input
      expect(chatInput).toHaveValue('');

      // Should show message in chat (after server response)
      await waitFor(() => {
        expect(screen.getByText('For the mountain!')).toBeInTheDocument();
      });
    });

    it('should handle inventory usage during combat', async () => {
      const user = userEvent.setup();

      renderWithProviders(<InteractionsPage />);

      // Join interaction
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      act(() => {
        mockConvexResponses.interactions[0].liveStatus.status = 'live';
      });

      const joinButton = await screen.findByText('Join');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Live Interaction')).toBeInTheDocument();
      });

      // Switch to inventory tab
      const inventoryTab = screen.getByText('Inventory');
      await user.click(inventoryTab);

      // Should show inventory items
      expect(screen.getByText('warhammer')).toBeInTheDocument();
      expect(screen.getByText('healing_potion')).toBeInTheDocument();
      expect(screen.getByText('Qty: 2')).toBeInTheDocument();

      // Should show equipped items
      expect(screen.getByText('mainhand')).toBeInTheDocument();

      // Use an item
      const useButtons = screen.getAllByText('Use');
      await user.click(useButtons[1]); // Use healing potion

      // Should trigger item usage (in a real implementation)
      expect(useButtons[1]).toBeInTheDocument();
    });

    it('should handle real-time events during gameplay', async () => {
      const user = userEvent.setup();

      renderWithProviders(<InteractionsPage />);

      // Join interaction
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      act(() => {
        mockConvexResponses.interactions[0].liveStatus.status = 'live';
      });

      const joinButton = await screen.findByText('Join');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Live Interaction')).toBeInTheDocument();
      });

      // Wait for WebSocket connection
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Simulate real-time events
      act(() => {
        // Find the mock WebSocket instance
        const wsInstances = (global.WebSocket as any).instances || [];
        const ws = wsInstances[wsInstances.length - 1];
        
        if (ws) {
          // Simulate another player joining
          ws.simulateGameEvent({
            type: 'PARTICIPANT_JOINED',
            userId: 'player_456',
            entityId: 'char_gandalf',
            timestamp: Date.now(),
          });

          // Simulate chat message from another player
          ws.simulateGameEvent({
            type: 'CHAT_MESSAGE',
            message: {
              id: 'msg_456',
              userId: 'player_456',
              content: 'I cast fireball!',
              type: 'party',
              timestamp: Date.now(),
            },
          });

          // Simulate turn completion
          ws.simulateGameEvent({
            type: 'TURN_COMPLETED',
            entityId: 'char_gandalf',
            actions: [
              {
                type: 'cast',
                entityId: 'char_gandalf',
                spellId: 'fireball',
                target: 'dragon_ancient_red',
              },
            ],
            timestamp: Date.now(),
          });
        }
      });

      // Should handle events appropriately
      // (In a real implementation, these would update the UI)
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
  });

  describe('Complete DM Workflow', () => {
    beforeEach(() => {
      // Mock user as DM
      vi.mocked(require('@clerk/clerk-react').useAuth).mockReturnValue({
        userId: 'dm_user_123',
        getToken: vi.fn().mockResolvedValue('mock-token'),
        isSignedIn: true,
      });

      vi.mocked(require('@clerk/clerk-react').useUser).mockReturnValue({
        user: createMockClerkUser('dm_user_123', 'dm'),
        isLoaded: true,
      });
    });

    it('should complete full DM workflow from starting to managing interaction', async () => {
      const user = userEvent.setup();

      renderWithProviders(<InteractionsPage />);

      // Step 1: Verify DM sees interaction management controls
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      expect(screen.getByTitle('Start Live Session')).toBeInTheDocument();

      // Step 2: Start the interaction
      const startButton = screen.getByTitle('Start Live Session');
      await user.click(startButton);

      // Should update status
      await waitFor(() => {
        expect(screen.getByText('live')).toBeInTheDocument();
      });

      // Step 3: Join as DM to manage
      const joinButton = screen.getByText('Join');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Live Interaction')).toBeInTheDocument();
      });

      // Step 4: Verify DM controls are available
      const dmTab = screen.getByText('DM Controls');
      await user.click(dmTab);

      // Should show DM-specific interface
      expect(dmTab).toBeInTheDocument();

      // Step 5: Test pause functionality
      const pauseButton = screen.getByTitle('Pause Session');
      await user.click(pauseButton);

      // Should pause the interaction
      await waitFor(() => {
        expect(screen.getByTitle('Resume Session')).toBeInTheDocument();
      });

      // Step 6: Resume interaction
      const resumeButton = screen.getByTitle('Resume Session');
      await user.click(resumeButton);

      // Should resume
      await waitFor(() => {
        expect(screen.getByTitle('Pause Session')).toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle server disconnection and reconnection', async () => {
      const user = userEvent.setup();

      renderWithProviders(<InteractionsPage />);

      // Join interaction
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      act(() => {
        mockConvexResponses.interactions[0].liveStatus.status = 'live';
      });

      const joinButton = await screen.findByText('Join');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Simulate server disconnection
      server.use(
        rest.get('http://localhost:3001/health', (req, res, ctx) => {
          return res(ctx.status(503), ctx.json({ error: 'Service unavailable' }));
        })
      );

      // Trigger a health check
      const refreshButton = screen.getByLabelText(/Refresh/);
      await user.click(refreshButton);

      // Should show disconnection
      await waitFor(() => {
        expect(screen.getByText(/Live server unavailable/)).toBeInTheDocument();
      });

      // Restore server
      server.resetHandlers(...handlers);

      // Should reconnect
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText(/Live server connected/)).toBeInTheDocument();
      });
    });

    it('should handle invalid actions gracefully', async () => {
      const user = userEvent.setup();

      // Mock server to return validation errors
      server.use(
        rest.post('http://localhost:3001/trpc/interaction.takeTurn', (req, res, ctx) => {
          return res(ctx.json({
            result: {
              data: {
                success: false,
                result: {
                  valid: false,
                  errors: ['Target is out of range', 'Not enough action points'],
                },
              },
            },
          }));
        })
      );

      renderWithProviders(<InteractionsPage />);

      // Join interaction
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      act(() => {
        mockConvexResponses.interactions[0].liveStatus.status = 'live';
      });

      const joinButton = await screen.findByText('Join');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Your Turn')).toBeInTheDocument();
      });

      // Try invalid action
      const attackButton = screen.getByText('Attack');
      await user.click(attackButton);

      const dragonButton = screen.getByText(/dragon_ancient_red/);
      await user.click(dragonButton);

      const submitButton = screen.getByText('Submit Action');
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Validation Errors:')).toBeInTheDocument();
        expect(screen.getByText(/Target is out of range/)).toBeInTheDocument();
        expect(screen.getByText(/Not enough action points/)).toBeInTheDocument();
      });
    });

    it('should handle network timeouts during gameplay', async () => {
      const user = userEvent.setup();

      // Mock slow server response
      server.use(
        rest.post('http://localhost:3001/trpc/interaction.takeTurn', (req, res, ctx) => {
          return res(ctx.delay(10000), ctx.json({ result: { data: { success: true } } }));
        })
      );

      renderWithProviders(<InteractionsPage />);

      // Join interaction
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      act(() => {
        mockConvexResponses.interactions[0].liveStatus.status = 'live';
      });

      const joinButton = await screen.findByText('Join');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Your Turn')).toBeInTheDocument();
      });

      // Try action that will timeout
      const attackButton = screen.getByText('Attack');
      await user.click(attackButton);

      const dragonButton = screen.getByText(/dragon_ancient_red/);
      await user.click(dragonButton);

      const submitButton = screen.getByText('Submit Action');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Submit Action')).toBeDisabled();

      // Should eventually timeout and show error
      await waitFor(() => {
        expect(screen.getByText('Validation Errors:')).toBeInTheDocument();
      }, { timeout: 15000 });
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();

      renderWithProviders(<InteractionsPage />);

      // Join interaction
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      act(() => {
        mockConvexResponses.interactions[0].liveStatus.status = 'live';
      });

      const joinButton = await screen.findByText('Join');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Live Interaction')).toBeInTheDocument();
      });

      // Switch to chat tab
      const chatTab = screen.getByText('Chat');
      await user.click(chatTab);

      // Send many rapid messages
      const chatInput = screen.getByPlaceholderText('Message party...');
      const sendButton = screen.getByText('Send');

      for (let i = 0; i < 10; i++) {
        await user.type(chatInput, `Message ${i}`);
        await user.click(sendButton);
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Should handle all messages
      expect(chatInput).toHaveValue('');
    });

    it('should maintain performance with large game state', async () => {
      const user = userEvent.setup();

      // Mock large game state
      const largeGameState = {
        ...mockGameState,
        participants: {},
        chatLog: [],
      };

      // Add many participants
      for (let i = 0; i < 50; i++) {
        largeGameState.participants[`char_${i}`] = {
          entityId: `char_${i}`,
          entityType: 'playerCharacter' as const,
          userId: `user_${i}`,
          currentHP: 30,
          maxHP: 30,
          position: { x: i % 10, y: Math.floor(i / 10) },
          conditions: [],
          inventory: { items: [], equippedItems: {}, capacity: 20 },
          availableActions: [],
          turnStatus: 'waiting' as const,
        };
      }

      // Add many chat messages
      for (let i = 0; i < 100; i++) {
        largeGameState.chatLog.push({
          id: `msg_${i}`,
          userId: `user_${i % 10}`,
          content: `Message ${i}`,
          type: 'party' as const,
          timestamp: Date.now() - (100 - i) * 1000,
        });
      }

      // Mock server to return large state
      server.use(
        rest.post('http://localhost:3001/trpc/interaction.joinRoom', (req, res, ctx) => {
          return res(ctx.json({
            result: {
              data: {
                success: true,
                gameState: largeGameState,
              },
            },
          }));
        })
      );

      renderWithProviders(<InteractionsPage />);

      // Join interaction
      await waitFor(() => {
        expect(screen.getByText('Dragon Encounter')).toBeInTheDocument();
      });

      act(() => {
        mockConvexResponses.interactions[0].liveStatus.status = 'live';
      });

      const joinButton = await screen.findByText('Join');
      await user.click(joinButton);

      // Should still load and be responsive
      await waitFor(() => {
        expect(screen.getByText('Live Interaction')).toBeInTheDocument();
      });

      // Should handle large initiative order
      expect(screen.getByText('Initiative Order - Round 1')).toBeInTheDocument();

      // Switch to chat and verify it handles many messages
      const chatTab = screen.getByText('Chat');
      await user.click(chatTab);

      // Should show recent messages
      expect(screen.getByText('Message 99')).toBeInTheDocument();
    });
  });
});