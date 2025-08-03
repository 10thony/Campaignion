import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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
    roomUpdates: {
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    },
  },
};

vi.mock('../../lib/trpc', () => ({
  createTRPCClient: vi.fn(() => mockTRPCClient),
  trpc: {},
}));

describe('useLiveInteraction Optimistic Updates', () => {
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
    
    mockTRPCClient.interaction.getRoomState.query.mockResolvedValue({
      success: true,
      gameState: mockGameState,
      roomId: 'test-room-id',
      participantCount: 2,
      status: 'active',
    });
  });

  describe('Turn Action Optimistic Updates', () => {
    it('should immediately update turn index optimistically', async () => {
      // Delay the server response to test optimistic update
      let resolveServerCall: (value: any) => void;
      const serverPromise = new Promise((resolve) => {
        resolveServerCall = resolve;
      });
      
      mockTRPCClient.interaction.takeTurn.mutate.mockReturnValue(serverPromise);

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(result.current.gameState?.currentTurnIndex).toBe(0);

      const turnAction = {
        type: 'move' as const,
        entityId: 'char1',
        position: { x: 6, y: 5 },
      };

      // Start the turn action
      act(() => {
        result.current.takeTurn(turnAction);
      });

      // Should immediately show optimistic update
      expect(result.current.gameState?.currentTurnIndex).toBe(1);
      expect(result.current.gameState?.turnHistory).toHaveLength(1);

      // Resolve server call
      act(() => {
        resolveServerCall!({
          success: true,
          result: { valid: true, errors: [] },
          gameState: {
            ...mockGameState,
            currentTurnIndex: 1,
            turnHistory: [{
              entityId: 'char1',
              turnNumber: 1,
              roundNumber: 1,
              actions: [turnAction],
              startTime: expect.any(Date),
              endTime: expect.any(Date),
              status: 'completed',
            }],
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should maintain the updated state
      expect(result.current.gameState?.currentTurnIndex).toBe(1);
    });

    it('should revert optimistic update on server error', async () => {
      mockTRPCClient.interaction.takeTurn.mutate.mockRejectedValue(
        new Error('Invalid move')
      );

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      const originalTurnIndex = result.current.gameState?.currentTurnIndex;
      const originalHistoryLength = result.current.gameState?.turnHistory.length;

      const turnAction = {
        type: 'move' as const,
        entityId: 'char1',
        position: { x: 6, y: 5 },
      };

      await act(async () => {
        await result.current.takeTurn(turnAction);
      });

      // Should revert to original state
      expect(result.current.gameState?.currentTurnIndex).toBe(originalTurnIndex);
      expect(result.current.gameState?.turnHistory).toHaveLength(originalHistoryLength || 0);
      expect(result.current.error?.message).toBe('Invalid move');
    });

    it('should handle server reconciliation correctly', async () => {
      const serverGameState = {
        ...mockGameState,
        currentTurnIndex: 1,
        roundNumber: 2, // Server has different round number
        turnHistory: [{
          entityId: 'char1',
          turnNumber: 1,
          roundNumber: 1,
          actions: [{ type: 'move', entityId: 'char1' }],
          startTime: new Date(),
          endTime: new Date(),
          status: 'completed' as const,
        }],
      };

      mockTRPCClient.interaction.takeTurn.mutate.mockResolvedValue({
        success: true,
        result: { valid: true, errors: [] },
        gameState: serverGameState,
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

      // Should use server state, not optimistic state
      expect(result.current.gameState?.roundNumber).toBe(2);
      expect(result.current.gameState?.currentTurnIndex).toBe(1);
    });
  });

  describe('Skip Turn Optimistic Updates', () => {
    it('should immediately advance turn on skip', async () => {
      let resolveServerCall: (value: any) => void;
      const serverPromise = new Promise((resolve) => {
        resolveServerCall = resolve;
      });
      
      mockTRPCClient.interaction.skipTurn.mutate.mockReturnValue(serverPromise);

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(result.current.gameState?.currentTurnIndex).toBe(0);

      // Start skip turn
      act(() => {
        result.current.skipTurn();
      });

      // Should immediately show optimistic update
      expect(result.current.gameState?.currentTurnIndex).toBe(1);

      // Resolve server call
      act(() => {
        resolveServerCall!({
          success: true,
          message: 'Turn skipped successfully',
          gameState: {
            ...mockGameState,
            currentTurnIndex: 1,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.gameState?.currentTurnIndex).toBe(1);
    });
  });

  describe('Chat Message Optimistic Updates', () => {
    it('should immediately show chat message optimistically', async () => {
      let resolveServerCall: (value: any) => void;
      const serverPromise = new Promise((resolve) => {
        resolveServerCall = resolve;
      });
      
      mockTRPCClient.interaction.sendChatMessage.mutate.mockReturnValue(serverPromise);

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      const originalChatLength = result.current.gameState?.chatLog.length || 0;

      const messageToSend = {
        userId: 'test-user-id',
        content: 'Hello everyone!',
        type: 'party' as const,
      };

      // Start sending message
      act(() => {
        result.current.sendChatMessage(messageToSend);
      });

      // Should immediately show optimistic message
      expect(result.current.gameState?.chatLog).toHaveLength(originalChatLength + 1);
      const optimisticMessage = result.current.gameState?.chatLog[originalChatLength];
      expect(optimisticMessage?.content).toBe('Hello everyone!');
      expect(optimisticMessage?.id).toMatch(/^temp-/);

      // Resolve server call with real message
      const serverMessage = {
        id: 'server-msg-id',
        userId: 'test-user-id',
        content: 'Hello everyone!',
        type: 'party' as const,
        timestamp: Date.now(),
      };

      act(() => {
        resolveServerCall!({
          success: true,
          message: serverMessage,
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should replace optimistic message with server message
      expect(result.current.gameState?.chatLog).toHaveLength(originalChatLength + 1);
      const finalMessage = result.current.gameState?.chatLog.find(msg => msg.content === 'Hello everyone!');
      expect(finalMessage?.id).toBe('server-msg-id');
      expect(finalMessage?.id).not.toMatch(/^temp-/);
    });

    it('should revert optimistic chat message on error', async () => {
      mockTRPCClient.interaction.sendChatMessage.mutate.mockRejectedValue(
        new Error('Message blocked')
      );

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      const originalChatLength = result.current.gameState?.chatLog.length || 0;

      const messageToSend = {
        userId: 'test-user-id',
        content: 'Blocked message',
        type: 'party' as const,
      };

      await act(async () => {
        await result.current.sendChatMessage(messageToSend);
      });

      // Should revert to original chat log
      expect(result.current.gameState?.chatLog).toHaveLength(originalChatLength);
      expect(result.current.error?.message).toBe('Message blocked');
    });
  });

  describe('Interaction State Optimistic Updates', () => {
    it('should immediately pause interaction optimistically', async () => {
      let resolveServerCall: (value: any) => void;
      const serverPromise = new Promise((resolve) => {
        resolveServerCall = resolve;
      });
      
      mockTRPCClient.interaction.pauseInteraction.mutate.mockReturnValue(serverPromise);

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(result.current.gameState?.status).toBe('active');

      // Start pause
      act(() => {
        result.current.pauseInteraction();
      });

      // Should immediately show paused state
      expect(result.current.gameState?.status).toBe('paused');

      // Resolve server call
      act(() => {
        resolveServerCall!({
          success: true,
          message: 'Interaction paused successfully',
          reason: 'Manual pause',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.gameState?.status).toBe('paused');
    });

    it('should immediately resume interaction optimistically', async () => {
      // Start with paused state
      const pausedGameState = {
        ...mockGameState,
        status: 'paused' as const,
      };

      mockTRPCClient.interaction.getRoomState.query.mockResolvedValue({
        success: true,
        gameState: pausedGameState,
        roomId: 'test-room-id',
        participantCount: 2,
        status: 'paused',
      });

      let resolveServerCall: (value: any) => void;
      const serverPromise = new Promise((resolve) => {
        resolveServerCall = resolve;
      });
      
      mockTRPCClient.interaction.resumeInteraction.mutate.mockReturnValue(serverPromise);

      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(result.current.gameState?.status).toBe('paused');

      // Start resume
      act(() => {
        result.current.resumeInteraction();
      });

      // Should immediately show active state
      expect(result.current.gameState?.status).toBe('active');

      // Resolve server call
      act(() => {
        resolveServerCall!({
          success: true,
          message: 'Interaction resumed successfully',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.gameState?.status).toBe('active');
    });
  });

  describe('Multiple Concurrent Optimistic Updates', () => {
    it('should handle multiple optimistic updates correctly', async () => {
      const { result } = renderHook(() =>
        useLiveInteraction({ interactionId })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      // Mock delayed responses
      const turnPromise = new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          result: { valid: true, errors: [] },
          gameState: { ...mockGameState, currentTurnIndex: 1 },
        }), 100);
      });

      const chatPromise = new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: {
            id: 'server-msg',
            userId: 'test-user-id',
            content: 'Test message',
            type: 'party',
            timestamp: Date.now(),
          },
        }), 50);
      });

      mockTRPCClient.interaction.takeTurn.mutate.mockReturnValue(turnPromise);
      mockTRPCClient.interaction.sendChatMessage.mutate.mockReturnValue(chatPromise);

      // Start both actions simultaneously
      act(() => {
        result.current.takeTurn({
          type: 'move',
          entityId: 'char1',
          position: { x: 6, y: 5 },
        });
        
        result.current.sendChatMessage({
          userId: 'test-user-id',
          content: 'Test message',
          type: 'party',
        });
      });

      // Both optimistic updates should be visible
      expect(result.current.gameState?.currentTurnIndex).toBe(1);
      expect(result.current.gameState?.chatLog.length).toBeGreaterThan(0);

      // Wait for both to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 200 });

      // Both updates should be reconciled
      expect(result.current.gameState?.currentTurnIndex).toBe(1);
      expect(result.current.gameState?.chatLog.some(msg => msg.id === 'server-msg')).toBe(true);
    });
  });
});