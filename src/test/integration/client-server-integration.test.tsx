/**
 * Client-Server Integration Tests
 * 
 * This test suite covers the complete integration between the React client
 * and the live interaction server, testing:
 * - Full workflow from interactions list to live modal
 * - Real-time subscriptions
 * - Authentication flow
 * - Error handling and reconnection logic
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { InteractionsPage } from '../../pages/InteractionsPage';
import { LiveInteractionModal } from '../../components/modals/LiveInteractionModal';
import { trpc, createTRPCClient } from '../../lib/trpc';
import { useLiveInteraction } from '../../hooks/useLiveInteraction';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { WebSocket } from 'ws';

// Mock data
const mockInteraction = {
  _id: 'interaction_123',
  name: 'Test Combat Encounter',
  description: 'A test combat encounter',
  dmUserId: 'dm_user_123',
  liveStatus: {
    status: 'idle' as const,
    participantCount: 0,
    lastActivity: new Date(),
  },
};

const mockGameState = {
  interactionId: 'interaction_123',
  status: 'active' as const,
  initiativeOrder: [
    {
      entityId: 'char_player_123',
      entityType: 'playerCharacter' as const,
      initiative: 15,
      userId: 'player_123',
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
    'char_player_123': {
      entityId: 'char_player_123',
      entityType: 'playerCharacter' as const,
      userId: 'player_123',
      currentHP: 25,
      maxHP: 30,
      position: { x: 5, y: 5 },
      conditions: [],
      inventory: {
        items: [
          {
            id: 'item_1',
            itemId: 'sword',
            quantity: 1,
            properties: {},
          },
        ],
        equippedItems: { mainHand: 'sword' },
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
        {
          id: 'move',
          name: 'Move',
          type: 'move' as const,
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
      'char_player_123': { entityId: 'char_player_123', position: { x: 5, y: 5 } },
      'monster_orc_1': { entityId: 'monster_orc_1', position: { x: 8, y: 8 } },
    },
    obstacles: [],
    terrain: [],
  },
  turnHistory: [],
  chatLog: [],
  timestamp: new Date(),
};

// Mock WebSocket
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

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 100);
  }

  send(data: string) {
    // Mock sending data
    console.log('WebSocket send:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

// Mock tRPC client responses
const mockTRPCResponses = {
  health: {
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
      activeRooms: 1,
    },
  },
  joinRoom: {
    success: true,
    gameState: mockGameState,
  },
  leaveRoom: {
    success: true,
  },
  getRoomState: {
    success: true,
    gameState: mockGameState,
  },
  takeTurn: {
    success: true,
    result: {
      valid: true,
      errors: [],
    },
    gameState: {
      ...mockGameState,
      currentTurnIndex: 1,
    },
  },
  skipTurn: {
    success: true,
    gameState: {
      ...mockGameState,
      currentTurnIndex: 1,
    },
  },
  sendChatMessage: {
    success: true,
    message: {
      id: 'msg_123',
      userId: 'player_123',
      content: 'Test message',
      type: 'party',
      timestamp: Date.now(),
    },
  },
  pauseInteraction: {
    success: true,
  },
  resumeInteraction: {
    success: true,
  },
};

// MSW handlers for HTTP requests
const handlers = [
  http.get('http://localhost:3001/health', () => {
    return HttpResponse.json(mockTRPCResponses.health);
  }),
  http.post('http://localhost:3001/trpc/interaction.joinRoom', () => {
    return HttpResponse.json({ result: { data: mockTRPCResponses.joinRoom } });
  }),
  http.post('http://localhost:3001/trpc/interaction.leaveRoom', () => {
    return HttpResponse.json({ result: { data: mockTRPCResponses.leaveRoom } });
  }),
  http.post('http://localhost:3001/trpc/interaction.getRoomState', () => {
    return HttpResponse.json({ result: { data: mockTRPCResponses.getRoomState } });
  }),
  http.post('http://localhost:3001/trpc/interaction.takeTurn', () => {
    return HttpResponse.json({ result: { data: mockTRPCResponses.takeTurn } });
  }),
  http.post('http://localhost:3001/trpc/interaction.skipTurn', () => {
    return HttpResponse.json({ result: { data: mockTRPCResponses.skipTurn } });
  }),
  http.post('http://localhost:3001/trpc/interaction.sendChatMessage', () => {
    return HttpResponse.json({ result: { data: mockTRPCResponses.sendChatMessage } });
  }),
  http.post('http://localhost:3001/trpc/interaction.pauseInteraction', () => {
    return HttpResponse.json({ result: { data: mockTRPCResponses.pauseInteraction } });
  }),
  http.post('http://localhost:3001/trpc/interaction.resumeInteraction', () => {
    return HttpResponse.json({ result: { data: mockTRPCResponses.resumeInteraction } });
  }),
];

// Mock Clerk
const mockClerkUser = {
  id: 'player_123',
  firstName: 'Test',
  lastName: 'Player',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
};

vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    userId: 'player_123',
    getToken: vi.fn().mockResolvedValue('mock-token'),
    isSignedIn: true,
  }),
  useUser: () => ({
    user: mockClerkUser,
    isLoaded: true,
  }),
}));

// Mock Convex
vi.mock('convex/react', () => ({
  ConvexProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useQuery: vi.fn().mockReturnValue([mockInteraction]),
  useMutation: vi.fn().mockReturnValue(vi.fn()),
  ConvexReactClient: vi.fn(),
}));

// Mock WebSocket globally
global.WebSocket = MockWebSocket as any;

// Create MSW server
const server = setupServer(...handlers);

describe('Client-Server Integration Tests', () => {
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
    server.resetHandlers();
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

  describe('Full Workflow: Interactions List to Live Modal', () => {
    it('should display interactions list with live status indicators', async () => {
      renderWithProviders(<InteractionsPage />);

      // Wait for interactions to load
      await waitFor(() => {
        expect(screen.getByText('Live Interactions')).toBeInTheDocument();
      });

      // Check that interaction is displayed
      expect(screen.getByText('Test Combat Encounter')).toBeInTheDocument();
      expect(screen.getByText('idle')).toBeInTheDocument();
      expect(screen.getByText('0 connected')).toBeInTheDocument();
    });

    it('should show live server connection status', async () => {
      renderWithProviders(<InteractionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Live server connected/)).toBeInTheDocument();
        expect(screen.getByText(/1 active rooms/)).toBeInTheDocument();
      });
    });

    it('should handle live server unavailable gracefully', async () => {
      // Mock server error
      server.use(
        http.get('http://localhost:3001/health', () => {
          return HttpResponse.json({ error: 'Service unavailable' }, { status: 503 });
        })
      );

      renderWithProviders(<InteractionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Live server unavailable/)).toBeInTheDocument();
      });

      // Join button should be disabled
      const joinButton = screen.queryByText('Join');
      if (joinButton) {
        expect(joinButton).toBeDisabled();
      }
    });

    it('should allow DM to start live session', async () => {
      // Mock user as DM
      vi.mocked(require('@clerk/clerk-react').useAuth).mockReturnValue({
        userId: 'dm_user_123',
        getToken: vi.fn().mockResolvedValue('mock-token'),
        isSignedIn: true,
      });

      renderWithProviders(<InteractionsPage />);

      await waitFor(() => {
        expect(screen.getByTitle('Start Live Session')).toBeInTheDocument();
      });

      const startButton = screen.getByTitle('Start Live Session');
      await userEvent.click(startButton);

      // Should update interaction status
      await waitFor(() => {
        expect(screen.getByText('live')).toBeInTheDocument();
      });
    });

    it('should allow players to join live session', async () => {
      // Mock interaction as live
      const liveInteraction = {
        ...mockInteraction,
        liveStatus: {
          status: 'live' as const,
          participantCount: 1,
          lastActivity: new Date(),
        },
      };

      vi.mocked(require('convex/react').useQuery).mockReturnValue([liveInteraction]);

      renderWithProviders(<InteractionsPage />);

      await waitFor(() => {
        expect(screen.getByText('Join')).toBeInTheDocument();
      });

      const joinButton = screen.getByText('Join');
      await userEvent.click(joinButton);

      // Should open live modal
      await waitFor(() => {
        expect(screen.getByText('Live Interaction')).toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Subscriptions', () => {
    it('should establish WebSocket connection for real-time updates', async () => {
      const TestComponent = () => {
        const liveInteraction = useLiveInteraction({
          interactionId: 'interaction_123',
        });

        return (
          <div>
            <div data-testid="connection-status">{liveInteraction.connectionStatus}</div>
            <div data-testid="game-state">
              {liveInteraction.gameState ? 'Connected' : 'No state'}
            </div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      // Should start connecting
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connecting');

      // Wait for connection to establish
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      }, { timeout: 5000 });

      // Should have game state
      expect(screen.getByTestId('game-state')).toHaveTextContent('Connected');
    });

    it('should handle real-time game events', async () => {
      let hookResult: any;
      
      const TestComponent = () => {
        hookResult = useLiveInteraction({
          interactionId: 'interaction_123',
        });

        return (
          <div>
            <div data-testid="current-turn">
              {hookResult.currentTurnParticipant?.entityId || 'No turn'}
            </div>
            <div data-testid="round-number">
              Round: {hookResult.gameState?.roundNumber || 0}
            </div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('current-turn')).toHaveTextContent('char_player_123');
      });

      // Simulate turn completion event
      act(() => {
        if (mockWebSocket) {
          mockWebSocket.simulateMessage({
            type: 'TURN_COMPLETED',
            entityId: 'char_player_123',
            actions: [{ type: 'attack', entityId: 'char_player_123' }],
          });
        }
      });

      // Should advance to next turn
      await waitFor(() => {
        expect(screen.getByTestId('current-turn')).toHaveTextContent('monster_orc_1');
      });
    });

    it('should handle chat messages in real-time', async () => {
      let hookResult: any;
      
      const TestComponent = () => {
        hookResult = useLiveInteraction({
          interactionId: 'interaction_123',
        });

        return (
          <div>
            <div data-testid="chat-count">
              Messages: {hookResult.gameState?.chatLog.length || 0}
            </div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('chat-count')).toHaveTextContent('Messages: 0');
      });

      // Simulate chat message event
      act(() => {
        if (mockWebSocket) {
          mockWebSocket.simulateMessage({
            type: 'CHAT_MESSAGE',
            message: {
              id: 'msg_123',
              userId: 'player_456',
              content: 'Hello everyone!',
              type: 'party',
              timestamp: Date.now(),
            },
          });
        }
      });

      // Should add message to chat log
      await waitFor(() => {
        expect(screen.getByTestId('chat-count')).toHaveTextContent('Messages: 1');
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should include auth token in tRPC requests', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('test-auth-token');
      
      vi.mocked(require('@clerk/clerk-react').useAuth).mockReturnValue({
        userId: 'player_123',
        getToken: mockGetToken,
        isSignedIn: true,
      });

      const TestComponent = () => {
        const liveInteraction = useLiveInteraction({
          interactionId: 'interaction_123',
        });

        return (
          <div>
            <button onClick={() => liveInteraction.joinRoom()}>
              Join Room
            </button>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      const joinButton = screen.getByText('Join Room');
      await userEvent.click(joinButton);

      // Should call getToken for authentication
      await waitFor(() => {
        expect(mockGetToken).toHaveBeenCalled();
      });
    });

    it('should handle authentication failures gracefully', async () => {
      const mockGetToken = vi.fn().mockRejectedValue(new Error('Auth failed'));
      
      vi.mocked(require('@clerk/clerk-react').useAuth).mockReturnValue({
        userId: 'player_123',
        getToken: mockGetToken,
        isSignedIn: true,
      });

      let errorReceived: Error | null = null;
      
      const TestComponent = () => {
        const liveInteraction = useLiveInteraction({
          interactionId: 'interaction_123',
          onError: (error) => {
            errorReceived = error;
          },
        });

        return (
          <div>
            <div data-testid="connection-status">{liveInteraction.connectionStatus}</div>
            <button onClick={() => liveInteraction.joinRoom()}>
              Join Room
            </button>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      const joinButton = screen.getByText('Join Room');
      await userEvent.click(joinButton);

      // Should handle auth error
      await waitFor(() => {
        expect(errorReceived).toBeTruthy();
        expect(screen.getByTestId('connection-status')).toHaveTextContent('error');
      });
    });

    it('should validate user permissions for DM actions', async () => {
      // Mock user as non-DM
      vi.mocked(require('@clerk/clerk-react').useAuth).mockReturnValue({
        userId: 'player_123',
        getToken: vi.fn().mockResolvedValue('mock-token'),
        isSignedIn: true,
      });

      renderWithProviders(<InteractionsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Combat Encounter')).toBeInTheDocument();
      });

      // DM controls should not be visible for non-DM users
      expect(screen.queryByTitle('Start Live Session')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Pause Session')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling and Reconnection Logic', () => {
    it('should handle connection failures with automatic reconnection', async () => {
      let connectionAttempts = 0;
      
      // Mock connection failure on first attempt
      server.use(
        http.post('http://localhost:3001/trpc/interaction.getRoomState', () => {
          connectionAttempts++;
          if (connectionAttempts === 1) {
            return HttpResponse.json({ error: 'Connection failed' }, { status: 500 });
          }
          return HttpResponse.json({ result: { data: mockTRPCResponses.getRoomState } });
        })
      );

      let errorReceived: Error | null = null;
      let connectionStatusChanges: string[] = [];
      
      const TestComponent = () => {
        const liveInteraction = useLiveInteraction({
          interactionId: 'interaction_123',
          onError: (error) => {
            errorReceived = error;
          },
          onConnectionChange: (status) => {
            connectionStatusChanges.push(status);
          },
        });

        return (
          <div>
            <div data-testid="connection-status">{liveInteraction.connectionStatus}</div>
            <div data-testid="error">{liveInteraction.error?.message || 'No error'}</div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      // Should initially fail
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('error');
        expect(errorReceived).toBeTruthy();
      });

      // Should attempt reconnection after delay
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      }, { timeout: 10000 });

      // Should have attempted connection multiple times
      expect(connectionAttempts).toBeGreaterThan(1);
      expect(connectionStatusChanges).toContain('connecting');
      expect(connectionStatusChanges).toContain('error');
      expect(connectionStatusChanges).toContain('connected');
    });

    it('should handle WebSocket disconnection and reconnection', async () => {
      let hookResult: any;
      
      const TestComponent = () => {
        hookResult = useLiveInteraction({
          interactionId: 'interaction_123',
        });

        return (
          <div>
            <div data-testid="connection-status">{hookResult.connectionStatus}</div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      // Wait for initial connection
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Simulate WebSocket disconnection
      act(() => {
        if (mockWebSocket) {
          mockWebSocket.close();
        }
      });

      // Should detect disconnection and attempt reconnection
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('error');
      });

      // Should eventually reconnect
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      }, { timeout: 10000 });
    });

    it('should handle server errors during gameplay', async () => {
      // Mock server error for turn action
      server.use(
        http.post('http://localhost:3001/trpc/interaction.takeTurn', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      let errorReceived: Error | null = null;
      
      const TestComponent = () => {
        const liveInteraction = useLiveInteraction({
          interactionId: 'interaction_123',
          onError: (error) => {
            errorReceived = error;
          },
        });

        return (
          <div>
            <div data-testid="is-my-turn">{liveInteraction.isMyTurn ? 'My turn' : 'Not my turn'}</div>
            <button 
              onClick={() => liveInteraction.takeTurn({
                type: 'attack',
                entityId: 'char_player_123',
                target: 'monster_orc_1',
              })}
            >
              Attack
            </button>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      // Wait for connection and turn
      await waitFor(() => {
        expect(screen.getByTestId('is-my-turn')).toHaveTextContent('My turn');
      });

      const attackButton = screen.getByText('Attack');
      await userEvent.click(attackButton);

      // Should handle server error gracefully
      await waitFor(() => {
        expect(errorReceived).toBeTruthy();
        expect(errorReceived?.message).toContain('Failed to take turn');
      });
    });

    it('should handle optimistic updates with server reconciliation', async () => {
      let hookResult: any;
      
      const TestComponent = () => {
        hookResult = useLiveInteraction({
          interactionId: 'interaction_123',
        });

        return (
          <div>
            <div data-testid="current-turn-index">
              Turn: {hookResult.gameState?.currentTurnIndex || 0}
            </div>
            <button 
              onClick={() => hookResult.takeTurn({
                type: 'attack',
                entityId: 'char_player_123',
                target: 'monster_orc_1',
              })}
            >
              Attack
            </button>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      // Wait for initial state
      await waitFor(() => {
        expect(screen.getByTestId('current-turn-index')).toHaveTextContent('Turn: 0');
      });

      const attackButton = screen.getByText('Attack');
      await userEvent.click(attackButton);

      // Should immediately show optimistic update
      expect(screen.getByTestId('current-turn-index')).toHaveTextContent('Turn: 1');

      // Should reconcile with server response
      await waitFor(() => {
        expect(screen.getByTestId('current-turn-index')).toHaveTextContent('Turn: 1');
      });
    });

    it('should handle network timeouts gracefully', async () => {
      // Mock slow server response
      server.use(
        http.post('http://localhost:3001/trpc/interaction.getRoomState', async () => {
          await new Promise(resolve => setTimeout(resolve, 10000));
          return HttpResponse.json({ result: { data: mockTRPCResponses.getRoomState } });
        })
      );

      let errorReceived: Error | null = null;
      
      const TestComponent = () => {
        const liveInteraction = useLiveInteraction({
          interactionId: 'interaction_123',
          onError: (error) => {
            errorReceived = error;
          },
        });

        return (
          <div>
            <div data-testid="connection-status">{liveInteraction.connectionStatus}</div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      // Should timeout and show error
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('error');
        expect(errorReceived).toBeTruthy();
      }, { timeout: 15000 });
    });
  });

  describe('Live Modal Integration', () => {
    it('should render live modal with game state', async () => {
      renderWithProviders(
        <LiveInteractionModal
          open={true}
          onOpenChange={() => {}}
          interactionId="interaction_123"
          currentUserId="player_123"
          isDM={false}
        />
      );

      // Should show connecting state initially
      expect(screen.getByText('Connecting to live session...')).toBeInTheDocument();

      // Should show game interface after connection
      await waitFor(() => {
        expect(screen.getByText('Initiative Order - Round 1')).toBeInTheDocument();
      });

      // Should show current turn
      expect(screen.getByText('char_player_123 (You)')).toBeInTheDocument();
      expect(screen.getByText('Your Turn')).toBeInTheDocument();
    });

    it('should handle turn actions through modal interface', async () => {
      renderWithProviders(
        <LiveInteractionModal
          open={true}
          onOpenChange={() => {}}
          interactionId="interaction_123"
          currentUserId="player_123"
          isDM={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Available Actions')).toBeInTheDocument();
      });

      // Should show available actions
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Move')).toBeInTheDocument();

      // Select attack action
      const attackButton = screen.getByText('Attack');
      await userEvent.click(attackButton);

      // Should show target selection
      await waitFor(() => {
        expect(screen.getByText('Select Target')).toBeInTheDocument();
      });

      // Select target
      const targetButton = screen.getByText(/monster_orc_1/);
      await userEvent.click(targetButton);

      // Submit action
      const submitButton = screen.getByText('Submit Action');
      await userEvent.click(submitButton);

      // Should advance turn
      await waitFor(() => {
        expect(screen.queryByText('Your Turn')).not.toBeInTheDocument();
      });
    });

    it('should handle chat functionality in modal', async () => {
      renderWithProviders(
        <LiveInteractionModal
          open={true}
          onOpenChange={() => {}}
          interactionId="interaction_123"
          currentUserId="player_123"
          isDM={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Initiative Order - Round 1')).toBeInTheDocument();
      });

      // Switch to chat tab
      const chatTab = screen.getByText('Chat');
      await userEvent.click(chatTab);

      // Should show chat interface
      expect(screen.getByPlaceholderText('Message party...')).toBeInTheDocument();

      // Send a message
      const chatInput = screen.getByPlaceholderText('Message party...');
      await userEvent.type(chatInput, 'Hello everyone!');

      const sendButton = screen.getByText('Send');
      await userEvent.click(sendButton);

      // Should clear input
      expect(chatInput).toHaveValue('');
    });
  });
});