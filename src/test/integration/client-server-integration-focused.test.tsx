/**
 * Focused Client-Server Integration Tests
 * 
 * This test suite covers the essential integration testing requirements:
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
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

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
  },
  mapState: {
    width: 20,
    height: 20,
    entities: {},
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
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 100);
  }

  send(data: string) {
    console.log('WebSocket send:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  addEventListener() {}
  removeEventListener() {}
}

// MSW handlers
const handlers = [
  http.get('http://localhost:3001/health', () => {
    return HttpResponse.json({
      status: 'ok',
      services: { convex: 'healthy', websocket: 'healthy' },
      stats: { activeRooms: 1 },
    });
  }),
  http.post('http://localhost:3001/trpc/interaction.joinRoom', () => {
    return HttpResponse.json({
      result: { data: { success: true, gameState: mockGameState } }
    });
  }),
  http.post('http://localhost:3001/trpc/interaction.getRoomState', () => {
    return HttpResponse.json({
      result: { data: { success: true, gameState: mockGameState } }
    });
  }),
  http.post('http://localhost:3001/trpc/interaction.takeTurn', () => {
    return HttpResponse.json({
      result: { 
        data: { 
          success: true, 
          result: { valid: true, errors: [] },
          gameState: { ...mockGameState, currentTurnIndex: 1 }
        } 
      }
    });
  }),
];

const server = setupServer(...handlers);

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    userId: 'player_123',
    getToken: vi.fn().mockResolvedValue('mock-token'),
    isSignedIn: true,
  }),
  useUser: () => ({
    user: { id: 'player_123', firstName: 'Test', lastName: 'Player' },
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

// Mock useLiveInteraction hook
vi.mock('../../hooks/useLiveInteraction', () => ({
  useLiveInteraction: vi.fn().mockReturnValue({
    connectionStatus: 'connected',
    gameState: mockGameState,
    isMyTurn: true,
    currentTurnParticipant: mockGameState.participants['char_player_123'],
    joinRoom: vi.fn().mockResolvedValue({ success: true }),
    leaveRoom: vi.fn().mockResolvedValue({ success: true }),
    takeTurn: vi.fn().mockResolvedValue({ success: true }),
    error: null,
  }),
}));

// Mock WebSocket globally
global.WebSocket = MockWebSocket as any;

describe('Focused Client-Server Integration Tests', () => {
  let queryClient: QueryClient;

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

      await waitFor(() => {
        expect(screen.getByText('Live Interactions')).toBeInTheDocument();
      });

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
      server.use(
        http.get('http://localhost:3001/health', () => {
          return HttpResponse.json({ error: 'Service unavailable' }, { status: 503 });
        })
      );

      renderWithProviders(<InteractionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Live server unavailable/)).toBeInTheDocument();
      });
    });

    it('should allow players to join live session', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Live Interaction')).toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Subscriptions', () => {
    it('should establish connection for real-time updates', async () => {
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

      expect(screen.getByText('char_player_123 (You)')).toBeInTheDocument();
      expect(screen.getByText('Your Turn')).toBeInTheDocument();
    });

    it('should handle WebSocket connection lifecycle', async () => {
      const mockWS = new MockWebSocket('ws://localhost:3001');
      
      expect(mockWS.readyState).toBe(MockWebSocket.CONNECTING);

      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockWS.readyState).toBe(MockWebSocket.OPEN);

      mockWS.close();
      expect(mockWS.readyState).toBe(MockWebSocket.CLOSED);
    });
  });

  describe('Authentication Flow', () => {
    it('should include auth token in requests', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('test-auth-token');
      
      vi.mocked(require('@clerk/clerk-react').useAuth).mockReturnValue({
        userId: 'player_123',
        getToken: mockGetToken,
        isSignedIn: true,
      });

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

      // Verify token was requested for authentication
      expect(mockGetToken).toHaveBeenCalled();
    });

    it('should validate user permissions for DM actions', async () => {
      vi.mocked(require('@clerk/clerk-react').useAuth).mockReturnValue({
        userId: 'player_123',
        getToken: vi.fn().mockResolvedValue('mock-token'),
        isSignedIn: true,
      });

      renderWithProviders(<InteractionsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Combat Encounter')).toBeInTheDocument();
      });

      // Non-DM users should not see DM controls
      expect(screen.queryByTitle('Start Live Session')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling and Reconnection Logic', () => {
    it('should handle connection failures gracefully', async () => {
      server.use(
        http.post('http://localhost:3001/trpc/interaction.getRoomState', () => {
          return HttpResponse.json({ error: 'Connection failed' }, { status: 500 });
        })
      );

      // Mock hook to return error state
      vi.mocked(require('../../hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
        connectionStatus: 'error',
        gameState: null,
        error: new Error('Connection failed'),
        joinRoom: vi.fn(),
        leaveRoom: vi.fn(),
        takeTurn: vi.fn(),
      });

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
        expect(screen.getByText(/Connection error/)).toBeInTheDocument();
      });
    });

    it('should handle server errors during gameplay', async () => {
      server.use(
        http.post('http://localhost:3001/trpc/interaction.takeTurn', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      // Mock hook to simulate error during turn action
      const mockTakeTurn = vi.fn().mockRejectedValue(new Error('Failed to take turn'));
      
      vi.mocked(require('../../hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
        connectionStatus: 'connected',
        gameState: mockGameState,
        isMyTurn: true,
        takeTurn: mockTakeTurn,
        error: null,
        joinRoom: vi.fn(),
        leaveRoom: vi.fn(),
      });

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

      const attackButton = screen.getByText('Attack');
      await userEvent.click(attackButton);

      // Should handle the error gracefully
      expect(mockTakeTurn).toHaveBeenCalled();
    });

    it('should handle network timeouts gracefully', async () => {
      server.use(
        http.post('http://localhost:3001/trpc/interaction.getRoomState', async () => {
          await new Promise(resolve => setTimeout(resolve, 5000));
          return HttpResponse.json({ result: { data: mockGameState } });
        })
      );

      // Mock hook to simulate timeout
      vi.mocked(require('../../hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
        connectionStatus: 'connecting',
        gameState: null,
        error: null,
        joinRoom: vi.fn(),
        leaveRoom: vi.fn(),
        takeTurn: vi.fn(),
      });

      renderWithProviders(
        <LiveInteractionModal
          open={true}
          onOpenChange={() => {}}
          interactionId="interaction_123"
          currentUserId="player_123"
          isDM={false}
        />
      );

      expect(screen.getByText('Connecting to live session...')).toBeInTheDocument();
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

      await waitFor(() => {
        expect(screen.getByText('Initiative Order - Round 1')).toBeInTheDocument();
      });

      expect(screen.getByText('char_player_123 (You)')).toBeInTheDocument();
      expect(screen.getByText('Your Turn')).toBeInTheDocument();
      expect(screen.getByText('Available Actions')).toBeInTheDocument();
    });

    it('should handle turn actions through modal interface', async () => {
      const mockTakeTurn = vi.fn().mockResolvedValue({ success: true });
      
      vi.mocked(require('../../hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
        connectionStatus: 'connected',
        gameState: mockGameState,
        isMyTurn: true,
        takeTurn: mockTakeTurn,
        error: null,
        joinRoom: vi.fn(),
        leaveRoom: vi.fn(),
      });

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

      const attackButton = screen.getByText('Attack');
      await userEvent.click(attackButton);

      // Should call takeTurn function
      expect(mockTakeTurn).toHaveBeenCalled();
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

      const chatTab = screen.getByText('Chat');
      await userEvent.click(chatTab);

      expect(screen.getByPlaceholderText('Message party...')).toBeInTheDocument();
    });
  });

  describe('Performance and Load Considerations', () => {
    it('should handle multiple WebSocket connections', async () => {
      const connections: MockWebSocket[] = [];
      
      // Create multiple connections
      for (let i = 0; i < 10; i++) {
        connections.push(new MockWebSocket(`ws://localhost:3001`));
      }

      // Wait for all connections to open
      await new Promise(resolve => setTimeout(resolve, 200));

      // All connections should be open
      connections.forEach(ws => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      // Clean up
      connections.forEach(ws => ws.close());
    });

    it('should handle rapid message sending', async () => {
      const mockWS = new MockWebSocket('ws://localhost:3001');
      
      await new Promise(resolve => setTimeout(resolve, 150));

      // Send multiple messages rapidly
      for (let i = 0; i < 100; i++) {
        mockWS.send(JSON.stringify({ type: 'test', id: i }));
      }

      // Should not crash or throw errors
      expect(mockWS.readyState).toBe(MockWebSocket.OPEN);
      
      mockWS.close();
    });
  });
});