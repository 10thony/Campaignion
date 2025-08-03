import { describe, it, expect } from 'vitest';
import { MapMovementValidator, MapUtils } from '../mapMovementValidator';

const mockMapState = {
  width: 10,
  height: 10,
  entities: {
    'player1': { entityId: 'player1', position: { x: 2, y: 2 } },
    'monster1': { entityId: 'monster1', position: { x: 5, y: 5 } },
  },
  obstacles: [
    { x: 3, y: 3 },
    { x: 4, y: 4 },
  ],
  terrain: [
    { position: { x: 6, y: 6 }, type: 'rough', properties: {} },
    { position: { x: 7, y: 7 }, type: 'deadly', properties: {} },
  ],
};

const mockParticipant = {
  entityId: 'player1',
  entityType: 'playerCharacter' as const,
  userId: 'user1',
  currentHP: 45,
  maxHP: 50,
  position: { x: 2, y: 2 },
  conditions: [],
  inventory: {
    items: [],
    equippedItems: {},
    capacity: 20,
  },
  availableActions: [],
  turnStatus: 'active' as const,
};

describe('MapMovementValidator', () => {
  describe('validateMovement', () => {
    it('validates successful movement within range', () => {
      const result = MapMovementValidator.validateMovement(
        { x: 2, y: 2 },
        { x: 4, y: 3 },
        mockMapState,
        mockParticipant,
        6
      );

      expect(result.isValid).toBe(true);
      expect(result.cost).toBeGreaterThan(0);
      expect(result.path).toBeDefined();
    });

    it('rejects movement outside map bounds', () => {
      const result = MapMovementValidator.validateMovement(
        { x: 2, y: 2 },
        { x: -1, y: 2 },
        mockMapState,
        mockParticipant,
        6
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Destination is outside map boundaries');
    });

    it('rejects movement to occupied position', () => {
      const result = MapMovementValidator.validateMovement(
        { x: 2, y: 2 },
        { x: 5, y: 5 }, // monster1's position
        mockMapState,
        mockParticipant,
        6
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Destination is occupied by another entity');
    });

    it('rejects movement to blocked position', () => {
      const result = MapMovementValidator.validateMovement(
        { x: 2, y: 2 },
        { x: 3, y: 3 }, // obstacle position
        mockMapState,
        mockParticipant,
        6
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Destination is blocked by an obstacle');
    });

    it('rejects movement beyond range', () => {
      const result = MapMovementValidator.validateMovement(
        { x: 2, y: 2 },
        { x: 9, y: 9 },
        mockMapState,
        mockParticipant,
        6
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('exceeds maximum range');
      expect(result.cost).toBeGreaterThan(6);
    });

    it('rejects movement when participant is paralyzed', () => {
      const paralyzedParticipant = {
        ...mockParticipant,
        conditions: [
          { id: '1', name: 'Paralyzed', duration: 3, effects: {} },
        ],
      };

      const result = MapMovementValidator.validateMovement(
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        mockMapState,
        paralyzedParticipant,
        6
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Movement restricted by conditions: Paralyzed');
    });

    it('calculates movement cost with terrain modifiers', () => {
      const result = MapMovementValidator.validateMovement(
        { x: 2, y: 2 },
        { x: 6, y: 6 }, // rough terrain
        mockMapState,
        mockParticipant,
        10
      );

      expect(result.isValid).toBe(true);
      expect(result.cost).toBeGreaterThan(8); // Base cost + terrain modifier
    });
  });

  describe('validateAttack', () => {
    it('validates successful attack within range', () => {
      const result = MapMovementValidator.validateAttack(
        { x: 2, y: 2 },
        { x: 5, y: 5 },
        mockMapState,
        mockParticipant,
        10
      );

      expect(result.isValid).toBe(true);
      expect(result.range).toBe(6); // Manhattan distance
      expect(result.hasLineOfSight).toBe(true);
    });

    it('rejects attack with no target', () => {
      const result = MapMovementValidator.validateAttack(
        { x: 2, y: 2 },
        { x: 1, y: 1 }, // empty position
        mockMapState,
        mockParticipant,
        10
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('No target at specified position');
    });

    it('rejects attack on self', () => {
      const result = MapMovementValidator.validateAttack(
        { x: 2, y: 2 },
        { x: 2, y: 2 }, // same position
        mockMapState,
        mockParticipant,
        10
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Cannot attack yourself');
    });

    it('rejects attack beyond range', () => {
      const result = MapMovementValidator.validateAttack(
        { x: 2, y: 2 },
        { x: 5, y: 5 },
        mockMapState,
        mockParticipant,
        3 // Short range
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Target is out of range');
      expect(result.range).toBe(6);
    });

    it('rejects attack without line of sight', () => {
      // Create a map state with obstacles blocking line of sight
      const blockedMapState = {
        ...mockMapState,
        obstacles: [
          { x: 3, y: 3 },
          { x: 4, y: 4 }, // These should block line of sight to (5,5)
        ],
      };

      const result = MapMovementValidator.validateAttack(
        { x: 2, y: 2 },
        { x: 5, y: 5 },
        blockedMapState,
        mockParticipant,
        10
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('No line of sight to target');
      expect(result.hasLineOfSight).toBe(false);
    });

    it('rejects attack when participant is stunned', () => {
      const stunnedParticipant = {
        ...mockParticipant,
        conditions: [
          { id: '1', name: 'Stunned', duration: 2, effects: {} },
        ],
      };

      const result = MapMovementValidator.validateAttack(
        { x: 2, y: 2 },
        { x: 5, y: 5 },
        mockMapState,
        stunnedParticipant,
        10
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Attack restricted by conditions: Stunned');
    });
  });

  describe('getValidMovementPositions', () => {
    it('returns set of valid movement positions', () => {
      const validPositions = MapMovementValidator.getValidMovementPositions(
        mockParticipant,
        mockMapState,
        6
      );

      expect(validPositions.size).toBeGreaterThan(0);
      expect(validPositions.has('3,2')).toBe(true); // Should be valid
      expect(validPositions.has('3,3')).toBe(false); // Obstacle
      expect(validPositions.has('5,5')).toBe(false); // Occupied
    });

    it('returns empty set when participant cannot move', () => {
      const paralyzedParticipant = {
        ...mockParticipant,
        conditions: [
          { id: '1', name: 'Paralyzed', duration: 3, effects: {} },
        ],
      };

      const validPositions = MapMovementValidator.getValidMovementPositions(
        paralyzedParticipant,
        mockMapState,
        6
      );

      expect(validPositions.size).toBe(0);
    });
  });

  describe('getValidAttackTargets', () => {
    it('returns set of valid attack target positions', () => {
      const validTargets = MapMovementValidator.getValidAttackTargets(
        mockParticipant,
        mockMapState,
        10
      );

      expect(validTargets.has('5,5')).toBe(true); // monster1 position
      expect(validTargets.size).toBe(1);
    });

    it('excludes out-of-range targets', () => {
      const validTargets = MapMovementValidator.getValidAttackTargets(
        mockParticipant,
        mockMapState,
        3 // Short range
      );

      expect(validTargets.has('5,5')).toBe(false); // Too far
      expect(validTargets.size).toBe(0);
    });
  });
});

describe('MapUtils', () => {
  describe('positionToKey', () => {
    it('converts position to string key', () => {
      const key = MapUtils.positionToKey({ x: 3, y: 5 });
      expect(key).toBe('3,5');
    });
  });

  describe('keyToPosition', () => {
    it('converts string key to position', () => {
      const position = MapUtils.keyToPosition('3,5');
      expect(position).toEqual({ x: 3, y: 5 });
    });
  });

  describe('getAdjacentPositions', () => {
    it('returns 4-directional adjacent positions', () => {
      const adjacent = MapUtils.getAdjacentPositions({ x: 3, y: 3 });
      
      expect(adjacent).toHaveLength(4);
      expect(adjacent).toContainEqual({ x: 2, y: 3 });
      expect(adjacent).toContainEqual({ x: 4, y: 3 });
      expect(adjacent).toContainEqual({ x: 3, y: 2 });
      expect(adjacent).toContainEqual({ x: 3, y: 4 });
    });
  });

  describe('getPositionsInRange', () => {
    it('returns all positions within Manhattan distance', () => {
      const positions = MapUtils.getPositionsInRange({ x: 3, y: 3 }, 2);
      
      expect(positions.length).toBeGreaterThan(0);
      expect(positions).toContainEqual({ x: 1, y: 3 }); // Distance 2
      expect(positions).toContainEqual({ x: 3, y: 1 }); // Distance 2
      expect(positions).toContainEqual({ x: 2, y: 2 }); // Distance 2
      expect(positions).not.toContainEqual({ x: 3, y: 3 }); // Center excluded
      expect(positions).not.toContainEqual({ x: 0, y: 3 }); // Distance 3, out of range
    });
  });

  describe('areAdjacent', () => {
    it('returns true for adjacent positions', () => {
      expect(MapUtils.areAdjacent({ x: 3, y: 3 }, { x: 3, y: 4 })).toBe(true);
      expect(MapUtils.areAdjacent({ x: 3, y: 3 }, { x: 4, y: 3 })).toBe(true);
    });

    it('returns false for non-adjacent positions', () => {
      expect(MapUtils.areAdjacent({ x: 3, y: 3 }, { x: 3, y: 3 })).toBe(false); // Same position
      expect(MapUtils.areAdjacent({ x: 3, y: 3 }, { x: 5, y: 5 })).toBe(false); // Diagonal
      expect(MapUtils.areAdjacent({ x: 3, y: 3 }, { x: 3, y: 5 })).toBe(false); // Too far
    });
  });

  describe('getDirection', () => {
    it('returns correct cardinal directions', () => {
      expect(MapUtils.getDirection({ x: 3, y: 3 }, { x: 5, y: 3 })).toBe('east');
      expect(MapUtils.getDirection({ x: 3, y: 3 }, { x: 1, y: 3 })).toBe('west');
      expect(MapUtils.getDirection({ x: 3, y: 3 }, { x: 3, y: 5 })).toBe('south');
      expect(MapUtils.getDirection({ x: 3, y: 3 }, { x: 3, y: 1 })).toBe('north');
    });

    it('prioritizes larger axis difference', () => {
      expect(MapUtils.getDirection({ x: 3, y: 3 }, { x: 6, y: 4 })).toBe('east'); // dx=3, dy=1
      expect(MapUtils.getDirection({ x: 3, y: 3 }, { x: 4, y: 6 })).toBe('south'); // dx=1, dy=3
    });
  });
});