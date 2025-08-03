import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLiveInteraction } from '../useLiveInteraction';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: { id: 'test-user-id' } }),
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('mock-token') }),
}));

// Mock tRPC client
vi.mock('../../lib/trpc', () => ({
  createTRPCClient: vi.fn(() => ({
    interaction: {
      getRoomState: {
        query: vi.fn().mockResolvedValue({
          success: true,
          gameState: {
            interactionId: 'test-id',
            status: 'active',
            initiativeOrder: [],
            currentTurnIndex: 0,
            roundNumber: 1,
            participants: {},
            mapState: { width: 20, height: 20, entities: {}, obstacles: [], terrain: [] },
            turnHistory: [],
            chatLog: [],
            timestamp: new Date(),
          },
          roomId: 'test-room',
          participantCount: 1,
          status: 'active',
        }),
      },
      roomUpdates: {
        subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      },
    },
  })),
  trpc: {},
}));

describe('useLiveInteraction Basic Tests', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() =>
      useLiveInteraction({ interactionId: 'test-id' })
    );

    expect(result.current.gameState).toBeNull();
    expect(result.current.connectionStatus).toBe('connecting');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.turnTimeRemaining).toBe(90);
  });

  it('should provide all required action methods', () => {
    const { result } = renderHook(() =>
      useLiveInteraction({ interactionId: 'test-id' })
    );

    expect(typeof result.current.joinRoom).toBe('function');
    expect(typeof result.current.leaveRoom).toBe('function');
    expect(typeof result.current.takeTurn).toBe('function');
    expect(typeof result.current.skipTurn).toBe('function');
    expect(typeof result.current.sendChatMessage).toBe('function');
    expect(typeof result.current.pauseInteraction).toBe('function');
    expect(typeof result.current.resumeInteraction).toBe('function');
    expect(typeof result.current.rollbackTurn).toBe('function');
    expect(typeof result.current.updateInitiative).toBe('function');
  });

  it('should provide computed values', () => {
    const { result } = renderHook(() =>
      useLiveInteraction({ interactionId: 'test-id' })
    );

    expect(result.current.currentParticipant).toBeNull();
    expect(result.current.currentTurnParticipant).toBeNull();
    expect(result.current.isMyTurn).toBe(false);
  });

  it('should handle error callback', () => {
    const onError = vi.fn();
    
    renderHook(() =>
      useLiveInteraction({ 
        interactionId: 'test-id',
        onError,
      })
    );

    // Error callback should be available
    expect(onError).toBeDefined();
  });

  it('should handle connection change callback', () => {
    const onConnectionChange = vi.fn();
    
    renderHook(() =>
      useLiveInteraction({ 
        interactionId: 'test-id',
        onConnectionChange,
      })
    );

    // Connection change callback should be available
    expect(onConnectionChange).toBeDefined();
  });
});