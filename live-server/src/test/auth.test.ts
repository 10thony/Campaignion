import { describe, it, expect } from 'vitest';
import { TRPCError } from '@trpc/server';
import { appRouter } from '../routers';

describe('Authentication Middleware', () => {
  it('should reject unauthenticated requests to protected procedures', async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: undefined,
    });

    await expect(caller.interaction.joinRoom({ 
      interactionId: 'test-id',
      entityId: 'test-entity',
      entityType: 'playerCharacter'
    }))
      .rejects
      .toThrow(TRPCError);
  });

  it('should allow authenticated requests to protected procedures', async () => {
    const caller = appRouter.createCaller({
      user: {
        userId: 'test-user-id',
        sessionId: 'test-session-id',
      },
      req: undefined,
    });

    const result = await caller.interaction.joinRoom({ 
      interactionId: 'test-id',
      entityId: 'test-entity',
      entityType: 'playerCharacter'
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.roomId).toBeDefined();
    expect(result.gameState).toBeDefined();
    expect(result.participantCount).toBeDefined();
  });

  it('should allow authenticated requests to DM procedures', async () => {
    const caller = appRouter.createCaller({
      user: {
        userId: 'test-dm-id',
        sessionId: 'test-session-id',
      },
      req: undefined,
    });

    const result = await caller.interaction.pauseInteraction({ 
      interactionId: 'test-id',
      reason: 'Test pause'
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should reject unauthenticated requests to DM procedures', async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: undefined,
    });

    await expect(caller.interaction.pauseInteraction({ 
      interactionId: 'test-id' 
    }))
      .rejects
      .toThrow(TRPCError);
  });
});