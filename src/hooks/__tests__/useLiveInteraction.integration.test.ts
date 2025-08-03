import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useLiveInteraction } from '../useLiveInteraction';

// Mock Clerk
const mockUser = {
  id: 'test-user-id',
  firstName: 'Test',
  lastName: 'User',
};

const mockGetToken = vi.fn().mockResolvedValue('mock-token');

vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: mockUser }),
  useAuth: () => ({ getToken: mockGetToken }),
}));

// Mock tRPC client
const mockTRPCClient = {
  interaction: {
    getRoomState: {
      query: vi.fn(),
    },
    joinRoom: {
      mutate: vi.fn(),
    },
    leaveRoom: {
      mutate: vi.fn(),
    },
    takeTurn: {
      mutate: vi.fn(),
    },
    skipTurn: {
      mutate: vi.fn(),
    },
    sendChatMessage: {
      mutate: vi.fn(),
    },
    pauseInteraction: {
      mutate: vi.fn(),
    },
    resumeInteraction: {
      mutate: vi.fn(),
    },
    backtrackTurn: {
      mutate: vi.fn(),
    },
    roomUpdates: {
      subscribe: vi.fn(),
    },
  },
};

vi.mock('../../lib/trpc', () => ({
  createTRPCClient: vi.fn(() => mockTRPCClient),
  trpc: {},
}));

describe('useLiveInteraction Integration Tests', () => {
  const interactionId = 'test-interaction-id';
  const mockGameState = {
    interactionId,
    status: 'active' as const,
    initiativeOrder: [
      { entityId: 'char1', entityType: 'playerCharacter' as const, initiative: 18, userId: 'test-user-id' },
      { entityId: 'monster1', entityType: 'monster' as const, initiative: 15 },
    ],
    currentTurnIndex: 0,
    roundNumber: 1,
    participants: {
      char1: {
        entityId: 'char1',
        entityType: 'playerCharacter' as const,
        userId: 'test-user-id',
        currentHP: 45,
        maxHP: 50,
        position: { x: 5, y: 5 },
        conditions: [],
        inventory: {
          items: [],
          equippedItems: {},
          capacity: 20,
        },
        availableActions: [],
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

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    mockTRPCClient.interaction.getRoomState.query.mockResolvedValue({
      success: true,
      gameState: mockGameState,
      roomId: 'test-room-id',
      participantCount: 2,
      status: 'active',
    });

    mockTRPCClient.interaction.joinRoom.mutate.mockResolvedValue({
      success: true,
      roomId: 'test-room-id',
      gameState: mockGameState,
      participantCount: 2,
    });

    mockTRPCClient.interaction.roomUpdates.subscribe.mockReturnValue({
      unsubscribe: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Connection Management', () => {
    it('should establish connection and load initial state', async () => {
      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      // Initially connecting
      expect(result.current.connectionStatus).toBe('connecting');

      // Wait for connection to establish
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(result.current.gameState).toEqual(mockGameState);
      expect(mockTRPCClient.interaction.getRoomState.query).toHaveBeenCalledWith({
        interactionId,
      });
    });

    it('should handle connection errors and attempt reconnection', async () => {
      const onError = vi.fn();
      mockTRPCClient.interaction.getRoomState.query.mockRejectedValue(
        new Error('Connection failed')
      );

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId, onError })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('error');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(result.current.error?.message).toBe('Connection failed');
    });

    it('should set up real-time subscription on successful connection', async () => {
      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(mockTRPCClient.interaction.roomUpdates.subscribe).toHaveBeenCalledWith(
        { interactionId },
        expect.objectContaining({
          onData: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });

  describe('Room Management', () => {
    it('should join room successfully', async () => {
      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      await act(async () => {
        await result.current.joinRoom();
      });

      expect(mockTRPCClient.interaction.joinRoom.mutate).toHaveBeenCalledWith({
        interactionId,
        entityId: 'char_test-user-id',
        entityType: 'playerCharacter',
      });
    });

    it('should leave room successfully', async () => {
      mockTRPCClient.interaction.leaveRoom.mutate.mockResolvedValue({
        success: true,
        message: 'Successfully left room',
      });

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      await act(async () => {
        await result.current.leaveRoom();
      });

      expect(mockTRPCClient.interaction.leaveRoom.mutate).toHaveBeenCalledWith({
        interactionId,
      });
    });
  });

  describe('Turn Management', () => {
    it('should take turn with optimistic updates', async () => {
      mockTRPCClient.interaction.takeTurn.mutate.mockResolvedValue({
        success: true,
        result: { valid: true, errors: [] },
        gameState: {
          ...mockGameState,
          currentTurnIndex: 1,
        },
      });

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      const turnAction = {
        type: 'move' as const,
        entityId: 'char1',
        position: { x: 6, y: 5 },
      };

      await act(async () => {
        await result.current.takeTurn(turnAction);
      });

      expect(mockTRPCClient.interaction.takeTurn.mutate).toHaveBeenCalledWith(turnAction);
      expect(result.current.gameState?.currentTurnIndex).toBe(1);
    });

    it('should skip turn with optimistic updates', async () => {
      mockTRPCClient.interaction.skipTurn.mutate.mockResolvedValue({
        success: true,
        message: 'Turn skipped successfully',
        gameState: {
          ...mockGameState,
          currentTurnIndex: 1,
        },
      });

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      await act(async () => {
        await result.current.skipTurn();
      });

      expect(mockTRPCClient.interaction.skipTurn.mutate).toHaveBeenCalledWith({
        interactionId,
        reason: 'Manual skip',
      });
    });

    it('should revert optimistic updates on server error', async () => {
      mockTRPCClient.interaction.takeTurn.mutate.mockRejectedValue(
        new Error('Invalid action')
      );

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      const originalTurnIndex = result.current.gameState?.currentTurnIndex;

      const turnAction = {
        type: 'move' as const,
        entityId: 'char1',
        position: { x: 6, y: 5 },
      };

      await act(async () => {
        await result.current.takeTurn(turnAction);
      });

      // Should revert to original state after error
      expect(result.current.gameState?.currentTurnIndex).toBe(originalTurnIndex);
      expect(result.current.error?.message).toBe('Invalid action');
    });
  });

  describe('Chat System', () => {
    it('should send chat message with optimistic updates', async () => {
      const mockChatMessage = {
        id: 'server-msg-id',
        userId: 'test-user-id',
        content: 'Hello everyone!',
        type: 'party' as const,
        timestamp: Date.now(),
      };

      mockTRPCClient.interaction.sendChatMessage.mutate.mockResolvedValue({
        success: true,
        message: mockChatMessage,
      });

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      const messageToSend = {
        userId: 'test-user-id',
        content: 'Hello everyone!',
        type: 'party' as const,
      };

      await act(async () => {
        await result.current.sendChatMessage(messageToSend);
      });

      expect(mockTRPCClient.interaction.sendChatMessage.mutate).toHaveBeenCalledWith({
        interactionId,
        content: 'Hello everyone!',
        type: 'party',
        recipients: undefined,
        entityId: undefined,
      });

      // Should have the server message in chat log
      expect(result.current.gameState?.chatLog).toContainEqual(mockChatMessage);
    });
  });

  describe('DM Controls', () => {
    it('should pause interaction', async () => {
      mockTRPCClient.interaction.pauseInteraction.mutate.mockResolvedValue({
        success: true,
        message: 'Interaction paused successfully',
        reason: 'Manual pause',
      });

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      await act(async () => {
        await result.current.pauseInteraction();
      });

      expect(mockTRPCClient.interaction.pauseInteraction.mutate).toHaveBeenCalledWith({
        interactionId,
        reason: 'Manual pause',
      });
    });

    it('should resume interaction', async () => {
      mockTRPCClient.interaction.resumeInteraction.mutate.mockResolvedValue({
        success: true,
        message: 'Interaction resumed successfully',
      });

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      await act(async () => {
        await result.current.resumeInteraction();
      });

      expect(mockTRPCClient.interaction.resumeInteraction.mutate).toHaveBeenCalledWith({
        interactionId,
      });
    });

    it('should rollback turn', async () => {
      mockTRPCClient.interaction.backtrackTurn.mutate.mockResolvedValue({
        success: true,
        message: 'Turn backtrack initiated',
        turnNumber: 5,
        reason: 'Rollback to turn 5, round 2',
      });

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      await act(async () => {
        await result.current.rollbackTurn(5, 2);
      });

      expect(mockTRPCClient.interaction.backtrackTurn.mutate).toHaveBeenCalledWith({
        interactionId,
        turnNumber: 5,
        reason: 'Rollback to turn 5, round 2',
      });
    });
  });

  describe('Real-time Event Handling', () => {
    it('should handle TURN_COMPLETED events', async () => {
      let subscriptionCallback: (event: any) => void;
      
      mockTRPCClient.interaction.roomUpdates.subscribe.mockImplementation(
        (input, callbacks) => {
          subscriptionCallback = callbacks.onData;
          return { unsubscribe: vi.fn() };
        }
      );

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      // Simulate TURN_COMPLETED event
      act(() => {
        subscriptionCallback!({
          type: 'TURN_COMPLETED',
          entityId: 'char1',
          actions: [{ type: 'move', entityId: 'char1' }],
        });
      });

      expect(result.current.gameState?.currentTurnIndex).toBe(1);
    });

    it('should handle CHAT_MESSAGE events', async () => {
      let subscriptionCallback: (event: any) => void;
      
      mockTRPCClient.interaction.roomUpdates.subscribe.mockImplementation(
        (input, callbacks) => {
          subscriptionCallback = callbacks.onData;
          return { unsubscribe: vi.fn() };
        }
      );

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      const newMessage = {
        id: 'new-msg',
        userId: 'other-user',
        content: 'Hello from server!',
        type: 'party',
        timestamp: Date.now(),
      };

      // Simulate CHAT_MESSAGE event
      act(() => {
        subscriptionCallback!({
          type: 'CHAT_MESSAGE',
          message: newMessage,
        });
      });

      expect(result.current.gameState?.chatLog).toContainEqual(newMessage);
    });

    it('should handle INTERACTION_PAUSED events', async () => {
      let subscriptionCallback: (event: any) => void;
      
      mockTRPCClient.interaction.roomUpdates.subscribe.mockImplementation(
        (input, callbacks) => {
          subscriptionCallback = callbacks.onData;
          return { unsubscribe: vi.fn() };
        }
      );

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      // Simulate INTERACTION_PAUSED event
      act(() => {
        subscriptionCallback!({
          type: 'INTERACTION_PAUSED',
          reason: 'DM pause',
        });
      });

      expect(result.current.gameState?.status).toBe('paused');
    });

    it('should handle ERROR events', async () => {
      let subscriptionCallback: (event: any) => void;
      const onError = vi.fn();
      
      mockTRPCClient.interaction.roomUpdates.subscribe.mockImplementation(
        (input, callbacks) => {
          subscriptionCallback = callbacks.onData;
          return { unsubscribe: vi.fn() };
        }
      );

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId, onError })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      // Simulate ERROR event
      act(() => {
        subscriptionCallback!({
          type: 'ERROR',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid game state',
          },
        });
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(result.current.error?.message).toBe('Invalid game state');
    });
  });

  describe('Computed Values', () => {
    it('should correctly identify current participant', async () => {
      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(result.current.currentParticipant?.entityId).toBe('char1');
      expect(result.current.currentParticipant?.userId).toBe('test-user-id');
    });

    it('should correctly identify if it is user\'s turn', async () => {
      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(result.current.isMyTurn).toBe(true);
      expect(result.current.currentTurnParticipant?.entityId).toBe('char1');
    });

    it('should track turn time remaining', async () => {
      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(result.current.turnTimeRemaining).toBe(90);
    });
  });
});