/**
 * Simple test to verify shared types are working correctly
 */

import {
  GameState,
  TurnAction,
  ChatMessage,
  ParticipantState,
  JoinRoomInput,
  JoinRoomOutput,
  LiveInteractionRouter,
  RouterInputs,
  RouterOutputs,
} from './src/index';

// Test that we can create instances of the shared types
const testTurnAction: TurnAction = {
  type: 'move',
  entityId: 'test-entity',
  position: { x: 5, y: 10 },
};

const testChatMessage: ChatMessage = {
  id: 'msg-1',
  userId: 'user-1',
  content: 'Hello world',
  type: 'party',
  timestamp: Date.now(),
};

const testJoinRoomInput: JoinRoomInput = {
  interactionId: 'interaction-1',
  entityId: 'entity-1',
  entityType: 'playerCharacter',
};

// Test router input/output types
type TestRouterInputs = RouterInputs;
type TestRouterOutputs = RouterOutputs;

// Test that the router interface is properly defined
type TestRouter = LiveInteractionRouter;

console.log('✅ All shared types are working correctly!');
console.log('Turn Action:', testTurnAction);
console.log('Chat Message:', testChatMessage);
console.log('Join Room Input:', testJoinRoomInput);