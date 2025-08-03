/**
 * Client-side prediction service for optimistic updates and server reconciliation
 * This service handles predicting game state changes before server confirmation
 */

import type { 
  GameState, 
  TurnAction, 
  ValidationResult, 
  ParticipantState, 
  Position,
  EntityPosition,
  StateDelta,
  TurnRecord
} from '@campaignion/shared-types';

export interface PredictionResult {
  success: boolean;
  predictedState: GameState;
  errors: string[];
  rollbackData?: PredictionRollbackData;
}

export interface PredictionRollbackData {
  originalState: GameState;
  action: TurnAction;
  timestamp: number;
  predictionId: string;
}

export interface PredictionContext {
  userId: string;
  entityId: string;
  timestamp: number;
}

export class ClientPrediction {
  private predictionHistory: Map<string, PredictionRollbackData> = new Map();
  private predictionIdCounter = 0;

  /**
   * Predict the outcome of an action optimistically
   */
  public predictAction(
    gameState: GameState, 
    action: TurnAction, 
    context?: PredictionContext
  ): PredictionResult {
    try {
      // Generate prediction ID for tracking
      const predictionId = `pred_${++this.predictionIdCounter}_${Date.now()}`;
      
      // Create deep copy of game state for prediction
      const originalState = this.deepCloneGameState(gameState);
      const predictedState = this.deepCloneGameState(gameState);

      // Validate action client-side
      const validation = this.validateActionClientSide(action, predictedState);
      if (!validation.valid) {
        return {
          success: false,
          predictedState: originalState,
          errors: validation.errors
        };
      }

      // Apply predicted changes
      const success = this.applyPredictedAction(predictedState, action);
      
      if (!success) {
        return {
          success: false,
          predictedState: originalState,
          errors: ['Failed to apply predicted action']
        };
      }

      // Store rollback data
      const rollbackData: PredictionRollbackData = {
        originalState,
        action,
        timestamp: Date.now(),
        predictionId
      };

      this.predictionHistory.set(predictionId, rollbackData);

      // Clean up old predictions (keep only last 10)
      this.cleanupOldPredictions();

      return {
        success: true,
        predictedState,
        errors: [],
        rollbackData
      };

    } catch (error) {
      return {
        success: false,
        predictedState: gameState,
        errors: [`Prediction error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Reconcile predicted state with authoritative server state
   */
  public reconcileWithServer(
    predictedState: GameState, 
    serverState: GameState,
    predictionId?: string
  ): GameState {
    try {
      // If we have a prediction ID, remove it from history
      if (predictionId) {
        this.predictionHistory.delete(predictionId);
      }

      // Check if reconciliation is needed
      if (this.statesAreEquivalent(predictedState, serverState)) {
        // Prediction was accurate, use server state for authority
        return this.deepCloneGameState(serverState);
      }

      // States differ, need to reconcile
      const reconciledState = this.performReconciliation(predictedState, serverState);
      
      return reconciledState;

    } catch (error) {
      // If reconciliation fails, fall back to server state
      console.error('Reconciliation error:', error);
      return this.deepCloneGameState(serverState);
    }
  }

  /**
   * Rollback a prediction to the original state
   */
  public rollbackPrediction(gameState: GameState, action: TurnAction): GameState {
    try {
      // Find matching prediction in history
      const matchingPrediction = Array.from(this.predictionHistory.values())
        .find(pred => this.actionsAreEqual(pred.action, action));

      if (matchingPrediction) {
        // Remove from history and return original state
        this.predictionHistory.delete(matchingPrediction.predictionId);
        return this.deepCloneGameState(matchingPrediction.originalState);
      }

      // If no matching prediction found, return current state
      return gameState;

    } catch (error) {
      console.error('Rollback error:', error);
      return gameState;
    }
  }

  /**
   * Rollback prediction by ID
   */
  public rollbackPredictionById(predictionId: string): GameState | null {
    const rollbackData = this.predictionHistory.get(predictionId);
    if (!rollbackData) {
      return null;
    }

    this.predictionHistory.delete(predictionId);
    return this.deepCloneGameState(rollbackData.originalState);
  }

  /**
   * Get all pending predictions
   */
  public getPendingPredictions(): PredictionRollbackData[] {
    return Array.from(this.predictionHistory.values());
  }

  /**
   * Clear all prediction history
   */
  public clearPredictionHistory(): void {
    this.predictionHistory.clear();
  }

  /**
   * Validate action on client-side (basic validation)
   */
  private validateActionClientSide(action: TurnAction, gameState: GameState): ValidationResult {
    const errors: string[] = [];

    // Check if game is active
    if (gameState.status !== 'active') {
      errors.push('Game is not active');
    }

    // Check if it's the entity's turn
    const currentEntity = gameState.initiativeOrder[gameState.currentTurnIndex];
    if (!currentEntity || currentEntity.entityId !== action.entityId) {
      errors.push('Not your turn');
    }

    // Get participant
    const participants = gameState.participants instanceof Map ? 
      gameState.participants : new Map(Object.entries(gameState.participants));
    
    const participant = participants.get(action.entityId);
    if (!participant) {
      errors.push('Participant not found');
      return { valid: false, errors };
    }

    // Validate specific action types
    switch (action.type) {
      case 'move':
        errors.push(...this.validateMoveActionClientSide(action, participant, gameState));
        break;
      case 'attack':
        errors.push(...this.validateAttackActionClientSide(action, participant, gameState));
        break;
      case 'useItem':
        errors.push(...this.validateItemActionClientSide(action, participant));
        break;
      case 'cast':
        errors.push(...this.validateSpellActionClientSide(action, participant));
        break;
      case 'interact':
        errors.push(...this.validateInteractActionClientSide(action, participant));
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
   * Apply predicted action to game state
   */
  private applyPredictedAction(gameState: GameState, action: TurnAction): boolean {
    try {
      const participants = gameState.participants instanceof Map ? 
        gameState.participants : new Map(Object.entries(gameState.participants));
      
      const participant = participants.get(action.entityId);
      if (!participant) {
        return false;
      }

      // Apply action based on type
      switch (action.type) {
        case 'move':
          return this.applyMoveAction(gameState, action, participant);
        case 'attack':
          return this.applyAttackAction(gameState, action, participant);
        case 'useItem':
          return this.applyItemAction(gameState, action, participant);
        case 'cast':
          return this.applySpellAction(gameState, action, participant);
        case 'interact':
          return this.applyInteractAction(gameState, action, participant);
        case 'end':
          return this.applyEndTurnAction(gameState, action, participant);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error applying predicted action:', error);
      return false;
    }
  }

  /**
   * Validate move action on client-side
   */
  private validateMoveActionClientSide(
    action: TurnAction, 
    participant: ParticipantState, 
    gameState: GameState
  ): string[] {
    const errors: string[] = [];

    if (!action.position) {
      errors.push('Move action requires target position');
      return errors;
    }

    const mapState = gameState.mapState;

    // Check bounds
    if (action.position.x < 0 || action.position.x >= mapState.width ||
        action.position.y < 0 || action.position.y >= mapState.height) {
      errors.push('Target position is out of bounds');
    }

    // Check obstacles
    const isBlocked = mapState.obstacles.some(obstacle => 
      obstacle.x === action.position!.x && obstacle.y === action.position!.y
    );
    if (isBlocked) {
      errors.push('Target position is blocked');
    }

    // Check if occupied
    const entities = mapState.entities instanceof Map ? 
      Array.from(mapState.entities.values()) : 
      Object.values(mapState.entities);
    
    const isOccupied = entities.some(entity => 
      (entity as EntityPosition).position.x === action.position!.x && 
      (entity as EntityPosition).position.y === action.position!.y &&
      (entity as EntityPosition).entityId !== action.entityId
    );
    if (isOccupied) {
      errors.push('Target position is occupied');
    }

    // Check movement range (basic)
    const currentPos = participant.position;
    const distance = Math.abs(action.position.x - currentPos.x) + Math.abs(action.position.y - currentPos.y);
    const maxMoveDistance = 5; // Should come from character stats
    
    if (distance > maxMoveDistance) {
      errors.push('Target position is too far');
    }

    return errors;
  }

  /**
   * Validate attack action on client-side
   */
  private validateAttackActionClientSide(
    action: TurnAction, 
    participant: ParticipantState, 
    gameState: GameState
  ): string[] {
    const errors: string[] = [];

    if (!action.target) {
      errors.push('Attack action requires target');
      return errors;
    }

    const participants = gameState.participants instanceof Map ? 
      gameState.participants : new Map(Object.entries(gameState.participants));
    
    const target = participants.get(action.target);
    if (!target) {
      errors.push('Target not found');
      return errors;
    }

    // Check range (basic)
    const attackerPos = participant.position;
    const targetPos = target.position;
    const distance = Math.abs(attackerPos.x - targetPos.x) + Math.abs(attackerPos.y - targetPos.y);
    const maxAttackRange = 1; // Melee range, should come from weapon stats
    
    if (distance > maxAttackRange) {
      errors.push('Target is out of range');
    }

    return errors;
  }

  /**
   * Validate item action on client-side
   */
  private validateItemActionClientSide(action: TurnAction, participant: ParticipantState): string[] {
    const errors: string[] = [];

    if (!action.itemId) {
      errors.push('Item action requires item ID');
      return errors;
    }

    // Check if participant has the item
    const hasItem = participant.inventory.items.some(item => item.itemId === action.itemId);
    if (!hasItem) {
      errors.push('Item not found in inventory');
    }

    return errors;
  }

  /**
   * Validate spell action on client-side
   */
  private validateSpellActionClientSide(action: TurnAction, participant: ParticipantState): string[] {
    const errors: string[] = [];

    if (!action.spellId) {
      errors.push('Spell action requires spell ID');
      return errors;
    }

    // Basic spell validation (would need more complex logic for real implementation)
    // This is a simplified version for client-side prediction

    return errors;
  }

  /**
   * Validate interact action on client-side
   */
  private validateInteractActionClientSide(action: TurnAction, participant: ParticipantState): string[] {
    const errors: string[] = [];

    if (!action.target && !action.position) {
      errors.push('Interact action requires target or position');
    }

    return errors;
  }

  /**
   * Apply move action to game state
   */
  private applyMoveAction(gameState: GameState, action: TurnAction, participant: ParticipantState): boolean {
    if (!action.position) return false;

    // Update participant position
    participant.position = { ...action.position };

    // Update map state
    const entities = gameState.mapState.entities instanceof Map ? 
      gameState.mapState.entities : new Map(Object.entries(gameState.mapState.entities));
    
    entities.set(action.entityId, {
      entityId: action.entityId,
      position: { ...action.position }
    });

    if (!(gameState.mapState.entities instanceof Map)) {
      gameState.mapState.entities = Object.fromEntries(entities);
    }

    return true;
  }

  /**
   * Apply attack action to game state
   */
  private applyAttackAction(gameState: GameState, action: TurnAction, participant: ParticipantState): boolean {
    if (!action.target) return false;

    const participants = gameState.participants instanceof Map ? 
      gameState.participants : new Map(Object.entries(gameState.participants));
    
    const target = participants.get(action.target);
    if (!target) return false;

    // Apply damage (simplified - would need complex damage calculation)
    const damage = 5; // Placeholder damage
    target.currentHP = Math.max(0, target.currentHP - damage);

    return true;
  }

  /**
   * Apply item action to game state
   */
  private applyItemAction(gameState: GameState, action: TurnAction, participant: ParticipantState): boolean {
    if (!action.itemId) return false;

    // Find and consume item (simplified)
    const itemIndex = participant.inventory.items.findIndex(item => item.itemId === action.itemId);
    if (itemIndex === -1) return false;

    const item = participant.inventory.items[itemIndex];
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      participant.inventory.items.splice(itemIndex, 1);
    }

    // Apply item effects (simplified - would need complex item system)
    // This is just a placeholder
    if (action.itemId === 'healing-potion') {
      participant.currentHP = Math.min(participant.maxHP, participant.currentHP + 10);
    }

    return true;
  }

  /**
   * Apply spell action to game state
   */
  private applySpellAction(gameState: GameState, action: TurnAction, participant: ParticipantState): boolean {
    if (!action.spellId) return false;

    // Simplified spell application
    // In a real implementation, this would involve complex spell mechanics
    
    return true;
  }

  /**
   * Apply interact action to game state
   */
  private applyInteractAction(gameState: GameState, action: TurnAction, participant: ParticipantState): boolean {
    // Simplified interaction
    // In a real implementation, this would involve complex interaction mechanics
    
    return true;
  }

  /**
   * Apply end turn action to game state
   */
  private applyEndTurnAction(gameState: GameState, action: TurnAction, participant: ParticipantState): boolean {
    // Update participant turn status
    participant.turnStatus = 'completed';

    // Add turn record
    const turnRecord: TurnRecord = {
      entityId: action.entityId,
      turnNumber: gameState.currentTurnIndex,
      roundNumber: gameState.roundNumber,
      actions: [action],
      startTime: new Date(),
      endTime: new Date(),
      status: 'completed'
    };

    gameState.turnHistory.push(turnRecord);

    // Advance turn (simplified)
    gameState.currentTurnIndex++;
    if (gameState.currentTurnIndex >= gameState.initiativeOrder.length) {
      gameState.currentTurnIndex = 0;
      gameState.roundNumber++;
    }

    return true;
  }

  /**
   * Perform reconciliation between predicted and server states
   */
  private performReconciliation(predictedState: GameState, serverState: GameState): GameState {
    // Start with server state as authoritative
    const reconciledState = this.deepCloneGameState(serverState);

    // Apply any client-side predictions that are still valid
    // This is a simplified reconciliation - real implementation would be more complex
    
    // For now, we trust the server state completely
    return reconciledState;
  }

  /**
   * Check if two game states are equivalent for reconciliation purposes
   */
  private statesAreEquivalent(state1: GameState, state2: GameState): boolean {
    try {
      // Check for null or undefined states
      if (!state1 || !state2) return false;

      // Compare key fields that matter for client prediction
      if (state1.currentTurnIndex !== state2.currentTurnIndex) return false;
      if (state1.roundNumber !== state2.roundNumber) return false;
      if (state1.status !== state2.status) return false;

      // Check if participants exist
      if (!state1.participants || !state2.participants) return false;

      // Compare participant positions and HP (simplified)
      const participants1 = state1.participants instanceof Map ? 
        state1.participants : new Map(Object.entries(state1.participants));
      const participants2 = state2.participants instanceof Map ? 
        state2.participants : new Map(Object.entries(state2.participants));

      if (participants1.size !== participants2.size) return false;

      for (const [entityId, participant1] of participants1) {
        const participant2 = participants2.get(entityId);
        if (!participant2) return false;
        
        if (participant1.currentHP !== participant2.currentHP) return false;
        if (participant1.position.x !== participant2.position.x) return false;
        if (participant1.position.y !== participant2.position.y) return false;
        if (participant1.turnStatus !== participant2.turnStatus) return false;
      }

      return true;
    } catch (error) {
      console.error('Error comparing states:', error);
      return false;
    }
  }

  /**
   * Check if two actions are equal
   */
  private actionsAreEqual(action1: TurnAction, action2: TurnAction): boolean {
    return (
      action1.type === action2.type &&
      action1.entityId === action2.entityId &&
      action1.target === action2.target &&
      action1.itemId === action2.itemId &&
      action1.spellId === action2.spellId &&
      action1.actionId === action2.actionId &&
      JSON.stringify(action1.position) === JSON.stringify(action2.position) &&
      JSON.stringify(action1.parameters) === JSON.stringify(action2.parameters)
    );
  }

  /**
   * Deep clone game state
   */
  private deepCloneGameState(gameState: GameState): GameState {
    // Handle Map objects and Date objects properly
    const cloned = JSON.parse(JSON.stringify(gameState, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));

    // Convert participants back to Map if needed
    if (!(cloned.participants instanceof Map) && typeof cloned.participants === 'object') {
      cloned.participants = new Map(Object.entries(cloned.participants));
    }

    // Convert map entities back to Map if needed
    if (!(cloned.mapState.entities instanceof Map) && typeof cloned.mapState.entities === 'object') {
      cloned.mapState.entities = new Map(Object.entries(cloned.mapState.entities));
    }

    // Convert timestamp back to Date
    if (typeof cloned.timestamp === 'string') {
      cloned.timestamp = new Date(cloned.timestamp);
    }

    // Convert turn history dates back to Date objects
    cloned.turnHistory.forEach((turn: any) => {
      if (typeof turn.startTime === 'string') {
        turn.startTime = new Date(turn.startTime);
      }
      if (typeof turn.endTime === 'string') {
        turn.endTime = new Date(turn.endTime);
      }
    });

    return cloned;
  }

  /**
   * Clean up old predictions to prevent memory leaks
   */
  private cleanupOldPredictions(): void {
    const maxPredictions = 10;
    const predictions = Array.from(this.predictionHistory.entries());
    
    if (predictions.length > maxPredictions) {
      // Sort by timestamp and keep only the most recent
      predictions.sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      // Remove oldest predictions
      for (let i = maxPredictions; i < predictions.length; i++) {
        this.predictionHistory.delete(predictions[i][0]);
      }
    }
  }
}