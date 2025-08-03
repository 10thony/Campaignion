import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InteractionRoom } from '../services/InteractionRoom';
import { GameState, Participant, TurnAction } from '../types';

// Mock logger to avoid console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    })
  }
}));

describe('InteractionRoom', () => {
  let room: InteractionRoom;
  let mockGameState: GameState;
  let mockParticipant: Participant;

  beforeEach(() => {
    mockGameState = {
      interactionId: 'test-interaction-1',
      status: 'active',
      initiativeOrder: [
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 15, userId: 'user1' },
        { entityId: 'monster1', entityType: 'monster', initiative: 10 }
      ],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map(),
      mapState: {
        width: 20,
        height: 20,
        entities: new Map(),
        obstacles: [],
        terrain: []
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date()
    };

    mockParticipant = {
      userId: 'user1',
      entityId: 'player1',
      entityType: 'playerCharacter',
      connectionId: 'conn1',
      isConnected: true,
      lastActivity: new Date()
    };

    room = new InteractionRoom('test-interaction-1', mockGameState, 5000); // 5 second timeout for tests
  });

  afterEach(() => {
    room.cleanup();
  });

  describe('constructor', () => {
    it('should create a room with correct initial state', () => {
      expect(room.interactionId).toBe('test-interaction-1');
      expect(room.status).toBe('active');
      expect(room.participants.size).toBe(0);
      expect(room.gameState).toEqual(mockGameState);
      expect(room.id).toBeDefined();
      expect(room.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe('participant management', () => {
    it('should add a participant successfully', () => {
      const eventSpy = vi.fn();
      room.on('participantJoined', eventSpy);

      room.addParticipant(mockParticipant);

      expect(room.participants.size).toBe(1);
      expect(room.getParticipant('user1')).toEqual(mockParticipant);
      expect(eventSpy).toHaveBeenCalledWith({
        type: 'PARTICIPANT_JOINED',
        userId: 'user1',
        entityId: 'player1'
      });
    });

    it('should remove a participant successfully', () => {
      const eventSpy = vi.fn();
      room.addParticipant(mockParticipant);
      room.on('participantLeft', eventSpy);

      const result = room.removeParticipant('user1');

      expect(result).toBe(true);
      expect(room.participants.size).toBe(0);
      expect(room.getParticipant('user1')).toBeUndefined();
      expect(eventSpy).toHaveBeenCalledWith({
        type: 'PARTICIPANT_LEFT',
        userId: 'user1'
      });
    });

    it('should return false when removing non-existent participant', () => {
      const result = room.removeParticipant('non-existent');
      expect(result).toBe(false);
    });

    it('should update participant connection status', () => {
      room.addParticipant(mockParticipant);

      const result = room.updateParticipantConnection('user1', false, 'new-conn');

      expect(result).toBe(true);
      const participant = room.getParticipant('user1');
      expect(participant?.isConnected).toBe(false);
      expect(participant?.connectionId).toBe('new-conn');
    });

    it('should return all participants', () => {
      const participant2: Participant = {
        userId: 'user2',
        entityId: 'player2',
        entityType: 'playerCharacter',
        connectionId: 'conn2',
        isConnected: true,
        lastActivity: new Date()
      };

      room.addParticipant(mockParticipant);
      room.addParticipant(participant2);

      const allParticipants = room.getAllParticipants();
      expect(allParticipants).toHaveLength(2);
      expect(allParticipants).toContain(mockParticipant);
      expect(allParticipants).toContain(participant2);
    });
  });

  describe('game state management', () => {
    it('should update game state', () => {
      const eventSpy = vi.fn();
      room.on('stateChanged', eventSpy);

      const newState = { status: 'paused' as const, roundNumber: 2 };
      room.updateGameState(newState);

      expect(room.gameState.status).toBe('paused');
      expect(room.gameState.roundNumber).toBe(2);
      expect(room.gameState.timestamp).toBeInstanceOf(Date);
      expect(eventSpy).toHaveBeenCalledWith(room.gameState);
    });

    it('should process valid turn action', () => {
      const eventSpy = vi.fn();
      room.on('turnCompleted', eventSpy);

      const turnAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 5, y: 5 }
      };

      const result = room.processTurnAction(turnAction);

      expect(result).toBe(true);
      expect(room.gameState.turnHistory).toHaveLength(1);
      expect(room.gameState.turnHistory[0].entityId).toBe('player1');
      expect(room.gameState.turnHistory[0].actions).toContain(turnAction);
      expect(eventSpy).toHaveBeenCalledWith({
        type: 'TURN_COMPLETED',
        entityId: 'player1',
        actions: [turnAction]
      });
    });

    it('should reject turn action from wrong entity', () => {
      const turnAction: TurnAction = {
        type: 'move',
        entityId: 'wrong-entity',
        position: { x: 5, y: 5 }
      };

      const result = room.processTurnAction(turnAction);

      expect(result).toBe(false);
      expect(room.gameState.turnHistory).toHaveLength(0);
    });
  });

  describe('room lifecycle', () => {
    it('should pause room', () => {
      const pauseEventSpy = vi.fn();
      const persistenceEventSpy = vi.fn();
      room.on('interactionPaused', pauseEventSpy);
      room.on('persistenceRequired', persistenceEventSpy);

      room.pause('Test pause');

      expect(room.status).toBe('paused');
      expect(room.gameState.status).toBe('paused');
      expect(pauseEventSpy).toHaveBeenCalledWith({
        type: 'INTERACTION_PAUSED',
        reason: 'Test pause'
      });
      expect(persistenceEventSpy).toHaveBeenCalledWith('pause');
    });

    it('should resume room', () => {
      const eventSpy = vi.fn();
      room.pause();
      room.on('interactionResumed', eventSpy);

      room.resume();

      expect(room.status).toBe('active');
      expect(room.gameState.status).toBe('active');
      expect(eventSpy).toHaveBeenCalledWith({
        type: 'INTERACTION_RESUMED'
      });
    });

    it('should complete room', () => {
      const persistenceEventSpy = vi.fn();
      const completionEventSpy = vi.fn();
      room.on('persistenceRequired', persistenceEventSpy);
      room.on('interactionCompleted', completionEventSpy);

      room.complete('Test completion');

      expect(room.status).toBe('completed');
      expect(room.gameState.status).toBe('completed');
      expect(persistenceEventSpy).toHaveBeenCalledWith('complete');
      expect(completionEventSpy).toHaveBeenCalledWith('Test completion');
    });

    it('should not pause already paused room', () => {
      room.pause();
      const eventSpy = vi.fn();
      room.on('interactionPaused', eventSpy);

      room.pause('Second pause');

      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('should not resume non-paused room', () => {
      const eventSpy = vi.fn();
      room.on('interactionResumed', eventSpy);

      room.resume();

      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('inactivity handling', () => {
    it('should detect inactive room', async () => {
      // Wait for inactivity timeout
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      expect(room.isInactive()).toBe(true);
    }, 10000); // 10 second timeout

    it('should reset inactivity on activity', () => {
      room.addParticipant(mockParticipant);
      expect(room.isInactive()).toBe(false);
    });

    it('should emit inactivity timeout event', async () => {
      const eventSpy = vi.fn();
      room.on('inactivityTimeout', eventSpy);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 6000));

      expect(eventSpy).toHaveBeenCalled();
    }, 10000); // 10 second timeout
  });

  describe('statistics', () => {
    it('should return correct room statistics', () => {
      room.addParticipant(mockParticipant);
      room.addParticipant({
        userId: 'user2',
        entityId: 'player2',
        entityType: 'playerCharacter',
        connectionId: 'conn2',
        isConnected: false,
        lastActivity: new Date()
      });

      const stats = room.getStats();

      expect(stats.id).toBe(room.id);
      expect(stats.interactionId).toBe('test-interaction-1');
      expect(stats.status).toBe('active');
      expect(stats.participantCount).toBe(2);
      expect(stats.connectedParticipants).toBe(1);
      expect(stats.currentTurn).toBe('player1');
      expect(stats.roundNumber).toBe(1);
      expect(stats.turnHistoryLength).toBe(0);
      expect(stats.chatMessageCount).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should clean up room resources', () => {
      room.addParticipant(mockParticipant);
      
      room.cleanup();

      expect(room.participants.size).toBe(0);
      expect(room.listenerCount('participantJoined')).toBe(0);
    });
  });
});