import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../_generated/api';
import schema from '../schema';

describe('interactions queries and mutations', () => {
  let t: any;

  beforeEach(() => {
    t = convexTest(schema);
  });

  describe('getUserInteractions', () => {
    it('returns interactions for authenticated user', async () => {
      // Mock authentication
      const mockIdentity = {
        subject: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      };

      // Create test data
      const userId = await t.db.insert('users', {
        clerkId: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: Date.now(),
        role: 'user' as const,
      });

      const campaignId = await t.db.insert('campaigns', {
        name: 'Test Campaign',
        creatorId: userId,
        isPublic: false,
        dmId: 'user123',
        createdAt: Date.now(),
      });

      const interactionId = await t.db.insert('interactions', {
        name: 'Test Interaction',
        description: 'A test interaction',
        creatorId: userId,
        dmUserId: userId,
        campaignId,
        status: 'idle' as const,
        createdAt: Date.now(),
      });

      // Execute query with mocked auth
      const result = await t.withIdentity(mockIdentity).query(api.interactions.getUserInteractions, {
        userId,
      });

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe(interactionId);
      expect(result[0].name).toBe('Test Interaction');
    });

    it('throws error when not authenticated', async () => {
      await expect(
        t.query(api.interactions.getUserInteractions, {})
      ).rejects.toThrow('Not authenticated');
    });

    it('filters interactions by campaign', async () => {
      const mockIdentity = {
        subject: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const userId = await t.db.insert('users', {
        clerkId: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: Date.now(),
        role: 'user' as const,
      });

      const campaign1 = await t.db.insert('campaigns', {
        name: 'Campaign 1',
        creatorId: userId,
        isPublic: false,
        dmId: 'user123',
        createdAt: Date.now(),
      });

      const campaign2 = await t.db.insert('campaigns', {
        name: 'Campaign 2',
        creatorId: userId,
        isPublic: false,
        dmId: 'user123',
        createdAt: Date.now(),
      });

      await t.db.insert('interactions', {
        name: 'Interaction 1',
        creatorId: userId,
        dmUserId: userId,
        campaignId: campaign1,
        status: 'idle' as const,
        createdAt: Date.now(),
      });

      await t.db.insert('interactions', {
        name: 'Interaction 2',
        creatorId: userId,
        dmUserId: userId,
        campaignId: campaign2,
        status: 'idle' as const,
        createdAt: Date.now(),
      });

      const result = await t.withIdentity(mockIdentity).query(api.interactions.getUserInteractions, {
        userId,
        campaignId: campaign1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Interaction 1');
    });
  });

  describe('getInteractionWithLiveStatus', () => {
    it('returns interaction with live status information', async () => {
      const mockIdentity = {
        subject: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const userId = await t.db.insert('users', {
        clerkId: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: Date.now(),
        role: 'user' as const,
      });

      const interactionId = await t.db.insert('interactions', {
        name: 'Test Interaction',
        creatorId: userId,
        dmUserId: userId,
        status: 'live' as const,
        connectedParticipants: ['user1', 'user2', 'user3'],
        initiativeOrder: [
          {
            entityId: 'player1',
            entityType: 'playerCharacter' as const,
            initiativeRoll: 15,
            dexterityModifier: 2,
          },
          {
            entityId: 'monster1',
            entityType: 'monster' as const,
            initiativeRoll: 12,
            dexterityModifier: 1,
          },
        ],
        currentInitiativeIndex: 0,
        lastActivity: Date.now(),
        createdAt: Date.now(),
      });

      const result = await t.withIdentity(mockIdentity).query(api.interactions.getInteractionWithLiveStatus, {
        interactionId,
      });

      expect(result.liveStatus.status).toBe('live');
      expect(result.liveStatus.participantCount).toBe(3);
      expect(result.liveStatus.currentTurn).toBe('player1');
      expect(result.liveStatus.lastActivity).toBeInstanceOf(Date);
    });

    it('throws error for non-existent interaction', async () => {
      const mockIdentity = {
        subject: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const fakeId = 'fake-interaction-id' as any;

      await expect(
        t.withIdentity(mockIdentity).query(api.interactions.getInteractionWithLiveStatus, {
          interactionId: fakeId,
        })
      ).rejects.toThrow('Interaction not found');
    });
  });

  describe('updateInteractionStatus', () => {
    it('allows DM to update interaction status', async () => {
      const mockIdentity = {
        subject: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const userId = await t.db.insert('users', {
        clerkId: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: Date.now(),
        role: 'user' as const,
      });

      const interactionId = await t.db.insert('interactions', {
        name: 'Test Interaction',
        creatorId: userId,
        dmUserId: userId,
        status: 'idle' as const,
        createdAt: Date.now(),
      });

      const result = await t.withIdentity(mockIdentity).mutation(api.interactions.updateInteractionStatus, {
        interactionId,
        status: 'live' as const,
        reason: 'Starting the session',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('live');
      expect(result.reason).toBe('Starting the session');

      // Verify the interaction was updated
      const updatedInteraction = await t.db.get(interactionId);
      expect(updatedInteraction?.status).toBe('live');
    });

    it('prevents non-DM users from updating interaction status', async () => {
      const mockIdentity = {
        subject: 'user456',
        name: 'Other User',
        email: 'other@example.com',
      };

      const dmUserId = await t.db.insert('users', {
        clerkId: 'user123',
        email: 'dm@example.com',
        firstName: 'DM',
        lastName: 'User',
        createdAt: Date.now(),
        role: 'user' as const,
      });

      const otherUserId = await t.db.insert('users', {
        clerkId: 'user456',
        email: 'other@example.com',
        firstName: 'Other',
        lastName: 'User',
        createdAt: Date.now(),
        role: 'user' as const,
      });

      const interactionId = await t.db.insert('interactions', {
        name: 'Test Interaction',
        creatorId: dmUserId,
        dmUserId: dmUserId,
        status: 'idle' as const,
        createdAt: Date.now(),
      });

      await expect(
        t.withIdentity(mockIdentity).mutation(api.interactions.updateInteractionStatus, {
          interactionId,
          status: 'live' as const,
        })
      ).rejects.toThrow('Only the DM can change interaction status');
    });
  });

  describe('getAllInteractionsWithLiveStatus', () => {
    it('returns all interactions with live status for user', async () => {
      const mockIdentity = {
        subject: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const userId = await t.db.insert('users', {
        clerkId: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: Date.now(),
        role: 'user' as const,
      });

      const campaignId = await t.db.insert('campaigns', {
        name: 'Test Campaign',
        creatorId: userId,
        isPublic: false,
        dmId: 'user123',
        createdAt: Date.now(),
      });

      await t.db.insert('interactions', {
        name: 'Interaction 1',
        creatorId: userId,
        dmUserId: userId,
        campaignId,
        status: 'idle' as const,
        connectedParticipants: [],
        createdAt: Date.now(),
      });

      await t.db.insert('interactions', {
        name: 'Interaction 2',
        creatorId: userId,
        dmUserId: userId,
        campaignId,
        status: 'live' as const,
        connectedParticipants: ['user1', 'user2'],
        lastActivity: Date.now(),
        createdAt: Date.now(),
      });

      const result = await t.withIdentity(mockIdentity).query(api.interactions.getAllInteractionsWithLiveStatus, {
        campaignId,
      });

      expect(result).toHaveLength(2);
      expect(result[0].liveStatus.status).toBe('live');
      expect(result[0].liveStatus.participantCount).toBe(2);
      expect(result[1].liveStatus.status).toBe('idle');
      expect(result[1].liveStatus.participantCount).toBe(0);
    });

    it('filters by campaign when provided', async () => {
      const mockIdentity = {
        subject: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const userId = await t.db.insert('users', {
        clerkId: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: Date.now(),
        role: 'user' as const,
      });

      const campaign1 = await t.db.insert('campaigns', {
        name: 'Campaign 1',
        creatorId: userId,
        isPublic: false,
        dmId: 'user123',
        createdAt: Date.now(),
      });

      const campaign2 = await t.db.insert('campaigns', {
        name: 'Campaign 2',
        creatorId: userId,
        isPublic: false,
        dmId: 'user123',
        createdAt: Date.now(),
      });

      await t.db.insert('interactions', {
        name: 'Interaction 1',
        creatorId: userId,
        dmUserId: userId,
        campaignId: campaign1,
        status: 'idle' as const,
        createdAt: Date.now(),
      });

      await t.db.insert('interactions', {
        name: 'Interaction 2',
        creatorId: userId,
        dmUserId: userId,
        campaignId: campaign2,
        status: 'idle' as const,
        createdAt: Date.now(),
      });

      const result = await t.withIdentity(mockIdentity).query(api.interactions.getAllInteractionsWithLiveStatus, {
        campaignId: campaign1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Interaction 1');
    });
  });
});