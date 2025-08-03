import { describe, it, expect } from 'vitest';
import {
  PositionSchema,
  StatusEffectSchema,
  InventoryItemSchema,
  InventoryStateSchema,
  ActionSchema,
  ParticipantStateSchema,
  InitiativeEntrySchema,
  MapStateSchema,
  TurnActionSchema,
  TurnRecordSchema,
  ChatMessageSchema,
  GameStateSchema,
} from '../gameState';

describe('GameState Schemas', () => {
  describe('PositionSchema', () => {
    it('should validate valid position', () => {
      const validPosition = { x: 10, y: 20 };
      expect(PositionSchema.parse(validPosition)).toEqual(validPosition);
    });

    it('should reject invalid position', () => {
      expect(() => PositionSchema.parse({ x: 'invalid', y: 20 })).toThrow();
      expect(() => PositionSchema.parse({ x: 10 })).toThrow();
    });
  });

  describe('StatusEffectSchema', () => {
    it('should validate valid status effect', () => {
      const validEffect = {
        id: 'effect-1',
        name: 'Poisoned',
        duration: 3,
        effects: { damage: 5 },
      };
      expect(StatusEffectSchema.parse(validEffect)).toEqual(validEffect);
    });

    it('should reject invalid status effect', () => {
      expect(() => StatusEffectSchema.parse({
        id: 'effect-1',
        name: 'Poisoned',
        // missing duration
        effects: { damage: 5 },
      })).toThrow();
    });
  });

  describe('InventoryItemSchema', () => {
    it('should validate valid inventory item', () => {
      const validItem = {
        id: 'item-1',
        itemId: 'sword-of-power',
        quantity: 1,
        properties: { damage: '1d8' },
      };
      expect(InventoryItemSchema.parse(validItem)).toEqual(validItem);
    });

    it('should reject negative quantity', () => {
      expect(() => InventoryItemSchema.parse({
        id: 'item-1',
        itemId: 'sword-of-power',
        quantity: -1,
        properties: {},
      })).toThrow();
    });
  });

  describe('InventoryStateSchema', () => {
    it('should validate valid inventory state', () => {
      const validInventory = {
        items: [{
          id: 'item-1',
          itemId: 'sword',
          quantity: 1,
          properties: {},
        }],
        equippedItems: { mainHand: 'item-1' },
        capacity: 20,
      };
      expect(InventoryStateSchema.parse(validInventory)).toEqual(validInventory);
    });

    it('should reject negative capacity', () => {
      expect(() => InventoryStateSchema.parse({
        items: [],
        equippedItems: {},
        capacity: -1,
      })).toThrow();
    });
  });

  describe('ActionSchema', () => {
    it('should validate valid action', () => {
      const validAction = {
        id: 'action-1',
        name: 'Attack',
        type: 'attack' as const,
        available: true,
        requirements: [{
          type: 'weapon',
          value: 'sword',
          met: true,
        }],
      };
      expect(ActionSchema.parse(validAction)).toEqual(validAction);
    });

    it('should reject invalid action type', () => {
      expect(() => ActionSchema.parse({
        id: 'action-1',
        name: 'Invalid',
        type: 'invalid',
        available: true,
        requirements: [],
      })).toThrow();
    });
  });

  describe('ParticipantStateSchema', () => {
    it('should validate valid participant state', () => {
      const validParticipant = {
        entityId: 'entity-1',
        entityType: 'playerCharacter' as const,
        userId: 'user-1',
        currentHP: 25,
        maxHP: 30,
        position: { x: 5, y: 10 },
        conditions: [],
        inventory: {
          items: [],
          equippedItems: {},
          capacity: 20,
        },
        availableActions: [],
        turnStatus: 'waiting' as const,
      };
      expect(ParticipantStateSchema.parse(validParticipant)).toEqual(validParticipant);
    });

    it('should reject when currentHP exceeds maxHP', () => {
      expect(() => ParticipantStateSchema.parse({
        entityId: 'entity-1',
        entityType: 'playerCharacter',
        currentHP: 35,
        maxHP: 30,
        position: { x: 5, y: 10 },
        conditions: [],
        inventory: { items: [], equippedItems: {}, capacity: 20 },
        availableActions: [],
        turnStatus: 'waiting',
      })).toThrow();
    });

    it('should reject invalid entity type', () => {
      expect(() => ParticipantStateSchema.parse({
        entityId: 'entity-1',
        entityType: 'invalid',
        currentHP: 25,
        maxHP: 30,
        position: { x: 5, y: 10 },
        conditions: [],
        inventory: { items: [], equippedItems: {}, capacity: 20 },
        availableActions: [],
        turnStatus: 'waiting',
      })).toThrow();
    });
  });

  describe('TurnActionSchema', () => {
    it('should validate valid turn action', () => {
      const validAction = {
        type: 'move' as const,
        entityId: 'entity-1',
        position: { x: 10, y: 15 },
      };
      expect(TurnActionSchema.parse(validAction)).toEqual(validAction);
    });

    it('should validate attack action with target', () => {
      const attackAction = {
        type: 'attack' as const,
        entityId: 'entity-1',
        target: 'entity-2',
        actionId: 'sword-attack',
      };
      expect(TurnActionSchema.parse(attackAction)).toEqual(attackAction);
    });

    it('should reject invalid action type', () => {
      expect(() => TurnActionSchema.parse({
        type: 'invalid',
        entityId: 'entity-1',
      })).toThrow();
    });
  });

  describe('ChatMessageSchema', () => {
    it('should validate valid chat message', () => {
      const validMessage = {
        id: 'msg-1',
        userId: 'user-1',
        content: 'Hello everyone!',
        type: 'party' as const,
        timestamp: Date.now(),
      };
      expect(ChatMessageSchema.parse(validMessage)).toEqual(validMessage);
    });

    it('should reject empty content', () => {
      expect(() => ChatMessageSchema.parse({
        id: 'msg-1',
        userId: 'user-1',
        content: '',
        type: 'party',
        timestamp: Date.now(),
      })).toThrow();
    });

    it('should reject content that is too long', () => {
      expect(() => ChatMessageSchema.parse({
        id: 'msg-1',
        userId: 'user-1',
        content: 'a'.repeat(1001),
        type: 'party',
        timestamp: Date.now(),
      })).toThrow();
    });

    it('should validate private message with recipients', () => {
      const privateMessage = {
        id: 'msg-1',
        userId: 'user-1',
        content: 'Secret message',
        type: 'private' as const,
        recipients: ['user-2'],
        timestamp: Date.now(),
      };
      expect(ChatMessageSchema.parse(privateMessage)).toEqual(privateMessage);
    });
  });

  describe('GameStateSchema', () => {
    it('should validate valid game state', () => {
      const validGameState = {
        interactionId: 'interaction-1',
        status: 'active' as const,
        initiativeOrder: [{
          entityId: 'entity-1',
          entityType: 'playerCharacter' as const,
          initiative: 15,
          userId: 'user-1',
        }],
        currentTurnIndex: 0,
        roundNumber: 1,
        participants: {
          'entity-1': {
            entityId: 'entity-1',
            entityType: 'playerCharacter' as const,
            userId: 'user-1',
            currentHP: 25,
            maxHP: 30,
            position: { x: 5, y: 10 },
            conditions: [],
            inventory: { items: [], equippedItems: {}, capacity: 20 },
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
      expect(GameStateSchema.parse(validGameState)).toEqual(validGameState);
    });

    it('should reject when currentTurnIndex is out of bounds', () => {
      expect(() => GameStateSchema.parse({
        interactionId: 'interaction-1',
        status: 'active',
        initiativeOrder: [{
          entityId: 'entity-1',
          entityType: 'playerCharacter',
          initiative: 15,
        }],
        currentTurnIndex: 5, // Out of bounds
        roundNumber: 1,
        participants: {},
        mapState: { width: 20, height: 20, entities: {}, obstacles: [], terrain: [] },
        turnHistory: [],
        chatLog: [],
        timestamp: new Date(),
      })).toThrow();
    });

    it('should allow empty initiative order with currentTurnIndex 0', () => {
      const gameStateWithEmptyInitiative = {
        interactionId: 'interaction-1',
        status: 'waiting' as const,
        initiativeOrder: [],
        currentTurnIndex: 0,
        roundNumber: 1,
        participants: {},
        mapState: { width: 20, height: 20, entities: {}, obstacles: [], terrain: [] },
        turnHistory: [],
        chatLog: [],
        timestamp: new Date(),
      };
      expect(GameStateSchema.parse(gameStateWithEmptyInitiative)).toEqual(gameStateWithEmptyInitiative);
    });
  });
});