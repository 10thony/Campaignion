import { EventEmitter } from 'events';
import {
  GameState,
  TurnAction,
  ParticipantState,
  InitiativeEntry,
  ValidationResult,
  GameEvent,
  StateDelta,
  TurnRecord,
  MapState,
  EntityPosition
} from '../types';
import { logger } from '../utils/logger';

export interface GameStateEngineConfig {
  turnTimeoutMs?: number;
  autoAdvanceTurns?: boolean;
  enableActionValidation?: boolean;
  enableTurnQueue?: boolean;
}

export interface ActionValidationContext {
  gameState: GameState;
  participant: ParticipantState;
  mapState: MapState;
}

export interface QueuedAction {
  id: string;
  action: TurnAction;
  queuedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ValidationResult;
}

export interface TurnQueue {
  entityId: string;
  actions: QueuedAction[];
  isProcessing: boolean;
}

export class GameStateEngine extends EventEmitter {
  private gameState: GameState;
  private turnTimer?: NodeJS.Timeout;
  private readonly config: Required<GameStateEngineConfig>;
  private readonly engineLogger;
  private turnQueues: Map<string, TurnQueue>;
  private actionIdCounter: number;

  constructor(initialState: GameState, config: GameStateEngineConfig = {}) {
    super();
    
    this.gameState = { ...initialState };
    this.config = {
      turnTimeoutMs: config.turnTimeoutMs || 90 * 1000, // 90 seconds
      autoAdvanceTurns: config.autoAdvanceTurns ?? true,
      enableActionValidation: config.enableActionValidation ?? true,
      enableTurnQueue: config.enableTurnQueue ?? true
    };
    
    this.turnQueues = new Map();
    this.actionIdCounter = 0;
    
    this.engineLogger = logger.child({ 
      component: 'GameStateEngine',
      interactionId: this.gameState.interactionId 
    });
    
    this.engineLogger.info('GameStateEngine initialized', {
      status: this.gameState.status,
      participantCount: Object.keys(this.gameState.participants).length,
      config: this.config
    });

    // Start turn timer if game is active and auto-advance is enabled
    if (this.gameState.status === 'active' && this.config.autoAdvanceTurns) {
      this.startTurnTimer();
    }
  }

  /**
   * Get current game state (immutable copy)
   */
  public getGameState(): GameState {
    return JSON.parse(JSON.stringify(this.gameState));
  }

  /**
   * Update game state and emit events
   */
  public updateGameState(updates: Partial<GameState>): void {
    const previousState = { ...this.gameState };
    
    this.gameState = {
      ...this.gameState,
      ...updates,
      timestamp: new Date()
    };

    // Calculate and emit state delta
    const delta = this.calculateStateDelta(previousState, this.gameState);
    if (delta) {
      this.emit('stateDelta', delta);
    }

    this.emit('stateChanged', this.gameState);
    
    this.engineLogger.debug('Game state updated', {
      updates: Object.keys(updates),
      status: this.gameState.status,
      currentTurn: this.getCurrentTurnEntity()?.entityId
    });
  }

  /**
   * Queue a turn action for processing
   */
  public async queueTurnAction(action: TurnAction): Promise<string> {
    if (!this.config.enableTurnQueue) {
      // If queue is disabled, process immediately
      const result = await this.processTurnAction(action);
      return result.valid ? 'immediate-success' : 'immediate-failure';
    }

    const actionId = this.generateActionId();
    const queuedAction: QueuedAction = {
      id: actionId,
      action,
      queuedAt: new Date(),
      status: 'pending'
    };

    // Get or create turn queue for entity
    let turnQueue = this.turnQueues.get(action.entityId);
    if (!turnQueue) {
      turnQueue = {
        entityId: action.entityId,
        actions: [],
        isProcessing: false
      };
      this.turnQueues.set(action.entityId, turnQueue);
    }

    // Add action to queue
    turnQueue.actions.push(queuedAction);

    this.engineLogger.debug('Action queued', {
      actionId,
      entityId: action.entityId,
      actionType: action.type,
      queueLength: turnQueue.actions.length
    });

    // Process queue if not already processing
    if (!turnQueue.isProcessing) {
      this.processActionQueue(action.entityId);
    }

    return actionId;
  }

  /**
   * Process a turn action
   */
  public async processTurnAction(action: TurnAction): Promise<ValidationResult> {
    try {
      // Validate the action
      const validation = await this.validateTurnAction(action);
      if (!validation.valid) {
        this.engineLogger.warn('Invalid turn action', {
          entityId: action.entityId,
          actionType: action.type,
          errors: validation.errors
        });
        return validation;
      }

      // Execute the action
      const success = await this.executeTurnAction(action);
      if (!success) {
        return {
          valid: false,
          errors: ['Internal error processing action']
        };
      }

      // Record the turn
      this.recordTurnAction(action);

      // Check if turn should advance
      if (action.type === 'end' || this.shouldAdvanceTurn(action)) {
        this.advanceTurn();
      }

      this.engineLogger.info('Turn action processed successfully', {
        entityId: action.entityId,
        actionType: action.type,
        turnNumber: this.gameState.currentTurnIndex,
        roundNumber: this.gameState.roundNumber
      });

      // Emit turn completed event
      this.emit('turnCompleted', {
        type: 'TURN_COMPLETED',
        entityId: action.entityId,
        actions: [action]
      } as GameEvent);

      return { valid: true, errors: [] };

    } catch (error) {
      this.engineLogger.error('Error processing turn action', {
        error: error instanceof Error ? error.message : String(error),
        action
      });
      
      return {
        valid: false,
        errors: ['Internal error processing action']
      };
    }
  }

  /**
   * Skip the current turn
   */
  public skipTurn(reason: string = 'Manual skip'): boolean {
    const currentEntity = this.getCurrentTurnEntity();
    if (!currentEntity) {
      this.engineLogger.warn('Attempted to skip turn with no current entity');
      return false;
    }

    // Record skipped turn
    const turnRecord: TurnRecord = {
      entityId: currentEntity.entityId,
      turnNumber: this.gameState.currentTurnIndex,
      roundNumber: this.gameState.roundNumber,
      actions: [],
      startTime: new Date(),
      endTime: new Date(),
      status: 'skipped'
    };

    this.gameState.turnHistory.push(turnRecord);

    this.engineLogger.info('Turn skipped', {
      entityId: currentEntity.entityId,
      reason,
      turnNumber: this.gameState.currentTurnIndex,
      roundNumber: this.gameState.roundNumber
    });

    // Emit turn skipped event
    this.emit('turnSkipped', {
      type: 'TURN_SKIPPED',
      entityId: currentEntity.entityId,
      reason
    } as GameEvent);

    // Advance to next turn
    this.advanceTurn();

    return true;
  }

  /**
   * Advance to the next turn
   */
  public advanceTurn(): void {
    const previousTurnIndex = this.gameState.currentTurnIndex;
    const previousRound = this.gameState.roundNumber;

    // Clear current turn timer
    this.clearTurnTimer();

    // Advance turn index
    this.gameState.currentTurnIndex++;

    // Check if we need to start a new round
    if (this.gameState.currentTurnIndex >= this.gameState.initiativeOrder.length) {
      this.gameState.currentTurnIndex = 0;
      this.gameState.roundNumber++;
      
      this.engineLogger.info('New round started', {
        roundNumber: this.gameState.roundNumber,
        previousRound
      });

      // Emit new round event
      this.emit('newRound', {
        roundNumber: this.gameState.roundNumber,
        previousRound
      });
    }

    const currentEntity = this.getCurrentTurnEntity();
    if (currentEntity) {
      // Update participant turn status
      this.updateParticipantTurnStatus(currentEntity.entityId, 'active');

      this.engineLogger.info('Turn advanced', {
        previousTurnIndex,
        currentTurnIndex: this.gameState.currentTurnIndex,
        currentEntityId: currentEntity.entityId,
        roundNumber: this.gameState.roundNumber
      });

      // Emit turn started event
      this.emit('turnStarted', {
        type: 'TURN_STARTED',
        entityId: currentEntity.entityId,
        timeLimit: this.config.turnTimeoutMs
      } as GameEvent);

      // Start turn timer if auto-advance is enabled
      if (this.config.autoAdvanceTurns && this.gameState.status === 'active') {
        this.startTurnTimer();
      }
    }

    // Update game state timestamp
    this.updateGameState({ 
      currentTurnIndex: this.gameState.currentTurnIndex,
      roundNumber: this.gameState.roundNumber
    });
  }

  /**
   * Update initiative order
   */
  public updateInitiativeOrder(newOrder: InitiativeEntry[]): void {
    const previousOrder = [...this.gameState.initiativeOrder];
    
    this.gameState.initiativeOrder = [...newOrder];
    
    // Reset turn index if it's out of bounds
    if (this.gameState.currentTurnIndex >= newOrder.length) {
      this.gameState.currentTurnIndex = 0;
    }

    this.engineLogger.info('Initiative order updated', {
      previousCount: previousOrder.length,
      newCount: newOrder.length,
      currentTurnIndex: this.gameState.currentTurnIndex
    });

    // Emit initiative updated event
    this.emit('initiativeUpdated', {
      type: 'INITIATIVE_UPDATED',
      order: newOrder
    } as GameEvent);

    this.updateGameState({ 
      initiativeOrder: this.gameState.initiativeOrder,
      currentTurnIndex: this.gameState.currentTurnIndex
    });
  }

  /**
   * Pause the game state engine
   */
  public pause(reason: string = 'Manual pause'): void {
    if (this.gameState.status === 'paused') {
      this.engineLogger.warn('Attempted to pause already paused game');
      return;
    }

    this.clearTurnTimer();
    this.updateGameState({ status: 'paused' });

    this.engineLogger.info('Game paused', { reason });

    this.emit('gamePaused', {
      type: 'INTERACTION_PAUSED',
      reason
    } as GameEvent);
  }

  /**
   * Resume the game state engine
   */
  public resume(): void {
    if (this.gameState.status !== 'paused') {
      this.engineLogger.warn('Attempted to resume non-paused game', { 
        status: this.gameState.status 
      });
      return;
    }

    this.updateGameState({ status: 'active' });

    // Restart turn timer if there's an active turn
    if (this.config.autoAdvanceTurns && this.getCurrentTurnEntity()) {
      this.startTurnTimer();
    }

    this.engineLogger.info('Game resumed');

    this.emit('gameResumed', {
      type: 'INTERACTION_RESUMED'
    } as GameEvent);
  }

  /**
   * Complete the game
   */
  public complete(reason: string = 'Game completed'): void {
    this.clearTurnTimer();
    this.updateGameState({ status: 'completed' });

    this.engineLogger.info('Game completed', { reason });

    this.emit('gameCompleted', { reason });
  }

  /**
   * Get the current turn entity
   */
  public getCurrentTurnEntity(): InitiativeEntry | null {
    if (this.gameState.currentTurnIndex >= this.gameState.initiativeOrder.length) {
      return null;
    }
    return this.gameState.initiativeOrder[this.gameState.currentTurnIndex] || null;
  }

  /**
   * Get participant by entity ID
   */
  public getParticipant(entityId: string): ParticipantState | null {
    if (this.gameState.participants instanceof Map) {
      return this.gameState.participants.get(entityId) || null;
    } else {
      return this.gameState.participants[entityId] || null;
    }
  }

  /**
   * Update participant state
   */
  public updateParticipant(entityId: string, updates: Partial<ParticipantState>): boolean {
    const participant = this.getParticipant(entityId);
    if (!participant) {
      this.engineLogger.warn('Attempted to update non-existent participant', { entityId });
      return false;
    }

    const updatedParticipant = {
      ...participant,
      ...updates
    };

    if (this.gameState.participants instanceof Map) {
      this.gameState.participants.set(entityId, updatedParticipant);
    } else {
      (this.gameState.participants as Record<string, ParticipantState>)[entityId] = updatedParticipant;
    }

    this.engineLogger.debug('Participant updated', {
      entityId,
      updates: Object.keys(updates)
    });

    this.updateGameState({ participants: this.gameState.participants });
    return true;
  }

  /**
   * Get turn queue for an entity
   */
  public getTurnQueue(entityId: string): TurnQueue | null {
    return this.turnQueues.get(entityId) || null;
  }

  /**
   * Get all pending actions for an entity
   */
  public getPendingActions(entityId: string): QueuedAction[] {
    const queue = this.turnQueues.get(entityId);
    return queue ? queue.actions.filter(a => a.status === 'pending') : [];
  }

  /**
   * Get completed actions for an entity
   */
  public getCompletedActions(entityId: string): QueuedAction[] {
    const queue = this.turnQueues.get(entityId);
    return queue ? queue.actions.filter(a => a.status === 'completed') : [];
  }

  /**
   * Cancel a queued action
   */
  public cancelQueuedAction(entityId: string, actionId: string): boolean {
    const queue = this.turnQueues.get(entityId);
    if (!queue) return false;

    const actionIndex = queue.actions.findIndex(a => a.id === actionId && a.status === 'pending');
    if (actionIndex === -1) return false;

    queue.actions.splice(actionIndex, 1);

    this.engineLogger.info('Queued action cancelled', {
      entityId,
      actionId
    });

    return true;
  }

  /**
   * Clear all queued actions for an entity
   */
  public clearActionQueue(entityId: string): boolean {
    const queue = this.turnQueues.get(entityId);
    if (!queue) return false;

    const pendingCount = queue.actions.filter(a => a.status === 'pending').length;
    queue.actions = queue.actions.filter(a => a.status !== 'pending');

    this.engineLogger.info('Action queue cleared', {
      entityId,
      clearedCount: pendingCount
    });

    return pendingCount > 0;
  }

  /**
   * Backtrack to a previous turn (DM only functionality)
   */
  public backtrackToTurn(turnNumber: number, roundNumber: number, dmUserId: string): boolean {
    // Validate DM permissions would be done at router level
    
    // Find the target turn in history
    const targetTurnIndex = this.gameState.turnHistory.findIndex(
      turn => turn.turnNumber === turnNumber && turn.roundNumber === roundNumber
    );

    if (targetTurnIndex === -1) {
      this.engineLogger.warn('Backtrack failed: turn not found', {
        targetTurn: turnNumber,
        targetRound: roundNumber,
        dmUserId
      });
      return false;
    }

    // Remove all turns after the target turn
    const removedTurns = this.gameState.turnHistory.splice(targetTurnIndex + 1);

    // Restore game state to the target turn
    this.gameState.currentTurnIndex = turnNumber;
    this.gameState.roundNumber = roundNumber;

    // Clear all action queues (since we're backtracking)
    this.turnQueues.clear();

    // Reset participant turn statuses
    if (this.gameState.participants instanceof Map) {
      for (const [, participant] of this.gameState.participants) {
        (participant as ParticipantState).turnStatus = 'waiting';
      }
    } else {
      Object.values(this.gameState.participants).forEach(participant => {
        (participant as ParticipantState).turnStatus = 'waiting';
      });
    }

    // Set current turn entity to active
    const currentEntity = this.getCurrentTurnEntity();
    if (currentEntity) {
      this.updateParticipantTurnStatus(currentEntity.entityId, 'active');
    }

    this.engineLogger.info('Turn backtracked', {
      targetTurn: turnNumber,
      targetRound: roundNumber,
      removedTurns: removedTurns.length,
      dmUserId
    });

    // Emit backtrack event
    this.emit('turnBacktracked', {
      type: 'TURN_BACKTRACKED',
      targetTurn: turnNumber,
      targetRound: roundNumber,
      removedTurns: removedTurns.length,
      dmUserId
    });

    // Restart turn timer if needed
    if (this.config.autoAdvanceTurns && this.gameState.status === 'active') {
      this.startTurnTimer();
    }

    this.updateGameState({
      currentTurnIndex: this.gameState.currentTurnIndex,
      roundNumber: this.gameState.roundNumber,
      turnHistory: this.gameState.turnHistory
    });

    return true;
  }

  /**
   * Redo a turn that was previously backtracked (DM only functionality)
   */
  public redoTurn(entityId: string, actions: TurnAction[], dmUserId: string): Promise<boolean> {
    // This allows DM to redo a turn with different actions
    const currentEntity = this.getCurrentTurnEntity();
    if (!currentEntity || currentEntity.entityId !== entityId) {
      this.engineLogger.warn('Redo failed: not entity\'s turn', {
        entityId,
        currentEntity: currentEntity?.entityId,
        dmUserId
      });
      return Promise.resolve(false);
    }

    // Process all actions in sequence
    return this.processRedoActions(entityId, actions, dmUserId);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.clearTurnTimer();
    this.turnQueues.clear();
    this.removeAllListeners();
    
    this.engineLogger.info('GameStateEngine cleanup completed');
  }

  /**
   * Validate a turn action
   */
  private async validateTurnAction(action: TurnAction): Promise<ValidationResult> {
    if (!this.config.enableActionValidation) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];

    // Check if it's the entity's turn
    const currentEntity = this.getCurrentTurnEntity();
    if (!currentEntity || currentEntity.entityId !== action.entityId) {
      errors.push('Not your turn');
    }

    // Check if game is active
    if (this.gameState.status !== 'active') {
      errors.push('Game is not active');
    }

    // Get participant state
    const participant = this.getParticipant(action.entityId);
    if (!participant) {
      errors.push('Participant not found');
      return { valid: false, errors };
    }

    // Validate specific action types
    switch (action.type) {
      case 'move':
        errors.push(...this.validateMoveAction(action, participant));
        break;
      case 'attack':
        errors.push(...this.validateAttackAction(action, participant));
        break;
      case 'useItem':
        errors.push(...this.validateItemAction(action, participant));
        break;
      case 'cast':
        errors.push(...this.validateSpellAction(action, participant));
        break;
      case 'interact':
        errors.push(...this.validateInteractAction(action, participant));
        break;
      case 'end':
        // End turn is always valid
        break;
      default:
        errors.push('Unknown action type');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute a turn action
   */
  private async executeTurnAction(action: TurnAction): Promise<boolean> {
    try {
      const participant = this.getParticipant(action.entityId);
      if (!participant) {
        return false;
      }

      switch (action.type) {
        case 'move':
          return this.executeMoveAction(action, participant);
        case 'attack':
          return this.executeAttackAction(action, participant);
        case 'useItem':
          return this.executeItemAction(action, participant);
        case 'cast':
          return this.executeSpellAction(action, participant);
        case 'interact':
          return this.executeInteractAction(action, participant);
        case 'end':
          return true; // End turn always succeeds
        default:
          return false;
      }
    } catch (error) {
      this.engineLogger.error('Error executing action', {
        error: error instanceof Error ? error.message : String(error),
        action
      });
      return false;
    }
  }

  /**
   * Validate move action
   */
  private validateMoveAction(action: TurnAction, participant: ParticipantState): string[] {
    const errors: string[] = [];

    if (!action.position) {
      errors.push('Move action requires target position');
      return errors;
    }

    // Check if position is within map bounds
    const mapState = this.gameState.mapState;
    if (action.position.x < 0 || action.position.x >= mapState.width ||
        action.position.y < 0 || action.position.y >= mapState.height) {
      errors.push('Target position is out of bounds');
    }

    // Check if position is blocked by obstacles
    const isBlocked = mapState.obstacles.some(obstacle => 
      obstacle.x === action.position!.x && obstacle.y === action.position!.y
    );
    if (isBlocked) {
      errors.push('Target position is blocked');
    }

    // Check if position is occupied by another entity
    const entities = mapState.entities instanceof Map ? 
      Array.from(mapState.entities.values()) : 
      Object.values(mapState.entities);
    
    const isOccupied = entities.some(entity => 
      (entity as EntityPosition).position.x === action.position!.x && (entity as EntityPosition).position.y === action.position!.y &&
      (entity as EntityPosition).entityId !== action.entityId
    );
    if (isOccupied) {
      errors.push('Target position is occupied');
    }

    // Check movement range (basic implementation)
    const currentPos = participant.position;
    const distance = Math.abs(action.position.x - currentPos.x) + Math.abs(action.position.y - currentPos.y);
    const maxMoveDistance = 5; // This should come from character stats
    
    if (distance > maxMoveDistance) {
      errors.push('Target position is too far');
    }

    return errors;
  }

  /**
   * Validate attack action
   */
  private validateAttackAction(action: TurnAction, participant: ParticipantState): string[] {
    const errors: string[] = [];

    if (!action.target) {
      errors.push('Attack action requires target');
      return errors;
    }

    // Check if target exists
    const target = this.getParticipant(action.target);
    if (!target) {
      errors.push('Target not found');
      return errors;
    }

    // Check if target is in range (basic implementation)
    const attackerPos = participant.position;
    const targetPos = target.position;
    const distance = Math.abs(attackerPos.x - targetPos.x) + Math.abs(attackerPos.y - targetPos.y);
    const maxAttackRange = 1; // Adjacent squares only for melee
    
    if (distance > maxAttackRange) {
      errors.push('Target is out of range');
    }

    return errors;
  }

  /**
   * Validate item usage action
   */
  private validateItemAction(action: TurnAction, participant: ParticipantState): string[] {
    const errors: string[] = [];

    if (!action.itemId) {
      errors.push('Item action requires item ID');
      return errors;
    }

    // Check if participant has the item
    const hasItem = participant.inventory.items.some(item => 
      item.itemId === action.itemId && item.quantity > 0
    );
    if (!hasItem) {
      errors.push('Item not available');
    }

    return errors;
  }

  /**
   * Validate spell casting action
   */
  private validateSpellAction(action: TurnAction, participant: ParticipantState): string[] {
    const errors: string[] = [];

    if (!action.spellId) {
      errors.push('Spell action requires spell ID');
      return errors;
    }

    // Basic spell validation - this would be more complex in a real implementation
    // Check if participant can cast spells, has spell slots, etc.

    return errors;
  }

  /**
   * Validate interact action
   */
  private validateInteractAction(action: TurnAction, participant: ParticipantState): string[] {
    const errors: string[] = [];

    // Basic interaction validation
    // Check if there's something to interact with at the target position or with target entity

    return errors;
  }

  /**
   * Execute move action
   */
  private executeMoveAction(action: TurnAction, participant: ParticipantState): boolean {
    if (!action.position) return false;

    // Update participant position
    participant.position = { ...action.position };

    // Update map state
    if (this.gameState.mapState.entities instanceof Map) {
      const entityPosition = this.gameState.mapState.entities.get(action.entityId);
      if (entityPosition) {
        entityPosition.position = { ...action.position };
        this.gameState.mapState.entities.set(action.entityId, entityPosition);
      }
    } else {
      const entityPosition = (this.gameState.mapState.entities as Record<string, EntityPosition>)[action.entityId];
      if (entityPosition) {
        entityPosition.position = { ...action.position };
      }
    }

    this.updateParticipant(action.entityId, { position: participant.position });
    return true;
  }

  /**
   * Execute attack action
   */
  private executeAttackAction(action: TurnAction, participant: ParticipantState): boolean {
    if (!action.target) return false;

    const target = this.getParticipant(action.target);
    if (!target) return false;

    // Basic attack implementation - deal 1 damage
    const damage = 1;
    const newHP = Math.max(0, target.currentHP - damage);
    
    this.updateParticipant(action.target, { currentHP: newHP });

    this.engineLogger.info('Attack executed', {
      attacker: action.entityId,
      target: action.target,
      damage,
      targetHP: newHP
    });

    return true;
  }

  /**
   * Execute item usage action
   */
  private executeItemAction(action: TurnAction, participant: ParticipantState): boolean {
    if (!action.itemId) return false;

    // Find and consume the item
    const itemIndex = participant.inventory.items.findIndex(item => 
      item.itemId === action.itemId && item.quantity > 0
    );
    
    if (itemIndex === -1) return false;

    const item = participant.inventory.items[itemIndex];
    if (!item) return false;
    
    item.quantity--;

    // Remove item if quantity reaches 0
    if (item.quantity === 0) {
      participant.inventory.items.splice(itemIndex, 1);
    }

    // Basic item effect - healing potion restores 5 HP
    if (action.itemId === 'healing_potion') {
      const newHP = Math.min(participant.maxHP, participant.currentHP + 5);
      participant.currentHP = newHP;
    }

    this.updateParticipant(action.entityId, { 
      inventory: participant.inventory,
      currentHP: participant.currentHP
    });

    return true;
  }

  /**
   * Execute spell casting action
   */
  private executeSpellAction(action: TurnAction, participant: ParticipantState): boolean {
    if (!action.spellId) return false;

    // Basic spell implementation
    // This would be much more complex in a real implementation
    
    return true;
  }

  /**
   * Execute interact action
   */
  private executeInteractAction(action: TurnAction, participant: ParticipantState): boolean {
    // Basic interaction implementation
    return true;
  }

  /**
   * Record a turn action in history
   */
  private recordTurnAction(action: TurnAction): void {
    const turnRecord: TurnRecord = {
      entityId: action.entityId,
      turnNumber: this.gameState.currentTurnIndex,
      roundNumber: this.gameState.roundNumber,
      actions: [action],
      startTime: new Date(),
      endTime: new Date(),
      status: 'completed'
    };

    this.gameState.turnHistory.push(turnRecord);
  }

  /**
   * Check if turn should advance after this action
   */
  private shouldAdvanceTurn(action: TurnAction): boolean {
    // Only end action and attack actions end the turn for now
    // Move actions don't end the turn to allow multiple moves
    return ['attack', 'useItem', 'cast'].includes(action.type);
  }

  /**
   * Update participant turn status
   */
  private updateParticipantTurnStatus(entityId: string, status: ParticipantState['turnStatus']): void {
    // Reset all participants to waiting
    if (this.gameState.participants instanceof Map) {
      for (const [, participant] of this.gameState.participants) {
        participant.turnStatus = 'waiting';
      }
    } else {
      Object.values(this.gameState.participants).forEach(participant => {
        (participant as ParticipantState).turnStatus = 'waiting';
      });
    }

    // Set current participant to active
    const participant = this.getParticipant(entityId);
    if (participant) {
      participant.turnStatus = status;
      this.updateParticipant(entityId, { turnStatus: status });
    }
  }

  /**
   * Start turn timer
   */
  private startTurnTimer(): void {
    this.clearTurnTimer();
    
    this.turnTimer = setTimeout(() => {
      this.engineLogger.info('Turn timeout reached');
      this.skipTurn('timeout');
    }, this.config.turnTimeoutMs) as NodeJS.Timeout;
  }

  /**
   * Clear turn timer
   */
  private clearTurnTimer(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = undefined as any;
    }
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action-${++this.actionIdCounter}-${Date.now()}`;
  }

  /**
   * Process action queue for an entity
   */
  private async processActionQueue(entityId: string): Promise<void> {
    const queue = this.turnQueues.get(entityId);
    if (!queue || queue.isProcessing) return;

    queue.isProcessing = true;

    try {
      // Process actions asynchronously to allow for proper testing
      setTimeout(async () => {
        try {
          while (queue.actions.length > 0) {
            const queuedAction = queue.actions.find(a => a.status === 'pending');
            if (!queuedAction) break;

            queuedAction.status = 'processing';

            try {
              const result = await this.processTurnAction(queuedAction.action);
              queuedAction.result = result;
              queuedAction.status = result.valid ? 'completed' : 'failed';

              this.engineLogger.debug('Queued action processed', {
                actionId: queuedAction.id,
                entityId,
                success: result.valid,
                errors: result.errors
              });

              // Emit queue action completed event
              this.emit('queuedActionCompleted', {
                actionId: queuedAction.id,
                entityId,
                action: queuedAction.action,
                result
              });

              // If action failed or turn ended, stop processing queue
              if (!result.valid || queuedAction.action.type === 'end') {
                break;
              }

            } catch (error) {
              queuedAction.status = 'failed';
              queuedAction.result = {
                valid: false,
                errors: ['Queue processing error']
              };

              this.engineLogger.error('Error processing queued action', {
                actionId: queuedAction.id,
                entityId,
                error: error instanceof Error ? error.message : String(error)
              });
              break;
            }
          }
        } finally {
          queue.isProcessing = false;
        }
      }, 10); // Small delay to allow for proper async testing
    } catch (error) {
      queue.isProcessing = false;
      throw error;
    }
  }

  /**
   * Process redo actions for DM corrections
   */
  private async processRedoActions(entityId: string, actions: TurnAction[], dmUserId: string): Promise<boolean> {
    try {
      const results: ValidationResult[] = [];

      for (const action of actions) {
        // Ensure action is for the correct entity
        if (action.entityId !== entityId) {
          this.engineLogger.warn('Redo action entity mismatch', {
            expectedEntityId: entityId,
            actionEntityId: action.entityId,
            dmUserId
          });
          return false;
        }

        const result = await this.processTurnAction(action);
        results.push(result);

        if (!result.valid) {
          this.engineLogger.warn('Redo action failed', {
            entityId,
            actionType: action.type,
            errors: result.errors,
            dmUserId
          });
          return false;
        }
      }

      this.engineLogger.info('Turn redo completed', {
        entityId,
        actionCount: actions.length,
        dmUserId
      });

      // Emit redo completed event
      this.emit('turnRedoCompleted', {
        entityId,
        actions,
        results,
        dmUserId
      });

      return true;

    } catch (error) {
      this.engineLogger.error('Error processing redo actions', {
        entityId,
        dmUserId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Calculate state delta between two game states
   */
  private calculateStateDelta(previousState: GameState, currentState: GameState): StateDelta | null {
    const changes: Record<string, any> = {};

    // Check for changes in key properties
    if (previousState.status !== currentState.status) {
      changes['status'] = currentState.status;
    }

    if (previousState.currentTurnIndex !== currentState.currentTurnIndex) {
      changes['currentTurnIndex'] = currentState.currentTurnIndex;
    }

    if (previousState.roundNumber !== currentState.roundNumber) {
      changes['roundNumber'] = currentState.roundNumber;
    }

    // Check for participant changes
    const participantChanges: Record<string, any> = {};
    
    // Handle both Map and object cases for participants
    const currentParticipants = currentState.participants instanceof Map ? 
      Object.fromEntries(currentState.participants) : 
      currentState.participants;
    const previousParticipants = previousState.participants instanceof Map ? 
      Object.fromEntries(previousState.participants) : 
      previousState.participants;

    for (const [entityId, participant] of Object.entries(currentParticipants)) {
      const prevParticipant = previousParticipants[entityId];
      if (!prevParticipant || JSON.stringify(prevParticipant) !== JSON.stringify(participant)) {
        participantChanges[entityId] = participant;
      }
    }
    if (Object.keys(participantChanges).length > 0) {
      changes['participants'] = participantChanges;
    }

    // Check for initiative order changes
    if (JSON.stringify(previousState.initiativeOrder) !== JSON.stringify(currentState.initiativeOrder)) {
      changes['initiativeOrder'] = currentState.initiativeOrder;
    }

    // Check for map changes
    if (JSON.stringify(previousState.mapState) !== JSON.stringify(currentState.mapState)) {
      changes['mapState'] = currentState.mapState;
    }

    // Check for new turn history entries
    if (currentState.turnHistory.length > previousState.turnHistory.length) {
      changes['newTurnRecords'] = currentState.turnHistory.slice(previousState.turnHistory.length);
    }

    // Check for new chat messages
    if (currentState.chatLog.length > previousState.chatLog.length) {
      changes['newChatMessages'] = currentState.chatLog.slice(previousState.chatLog.length);
    }

    // Return delta if there are changes
    if (Object.keys(changes).length > 0) {
      return {
        type: 'participant', // This would be more specific in a real implementation
        changes,
        timestamp: Date.now()
      };
    }

    return null;
  }
}