// Re-export shared schemas (be selective to avoid conflicts)
export type {
  GameState,
  ParticipantState,
  TurnAction,
  ChatMessage,
  GameEvent,
  Position,
  MapState,
  ValidationResult as SharedValidationResult,
  EntityType,
  TurnStatus,
  GameStatus,
  ChatType,
  ActionType
} from '@campaignion/shared-types';

export {
  GameStateSchema,
  ParticipantStateSchema,
  TurnActionSchema,
  ChatMessageSchema,
  GameEventSchema
} from '@campaignion/shared-types';

// Export local schemas that extend shared ones (selective to avoid conflicts)
export {
  validateGameAction,
  validateTurnTransition,
  validateChatMessage as validateLocalChatMessage
} from './validators';
// Re-export specific types from stateDelta to avoid conflicts
export { 
  StateDeltaSchema, 
  ParticipantDeltaSchema, 
  TurnDeltaSchema, 
  MapDeltaSchema, 
  InitiativeDeltaSchema, 
  ChatDeltaSchema, 
  TypedStateDeltaSchema, 
  BatchDeltaSchema,
  type StateDelta,
  type ParticipantDelta,
  type TurnDelta,
  type MapDelta,
  type InitiativeDelta,
  type ChatDelta,
  type TypedStateDelta,
  type BatchDelta
} from './stateDelta';