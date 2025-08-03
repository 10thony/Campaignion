/**
 * Core type definitions for the live interaction system
 * These types are shared between client and server
 */
export interface Position {
    x: number;
    y: number;
}
export interface StatusEffect {
    id: string;
    name: string;
    duration: number;
    effects: Record<string, any>;
}
export interface InventoryItem {
    id: string;
    itemId: string;
    quantity: number;
    properties: Record<string, any>;
}
export interface InventoryState {
    items: InventoryItem[];
    equippedItems: Record<string, string>;
    capacity: number;
}
export interface ActionRequirement {
    type: string;
    value: any;
    met: boolean;
}
export interface Action {
    id: string;
    name: string;
    type: 'move' | 'attack' | 'useItem' | 'cast' | 'interact';
    available: boolean;
    requirements: ActionRequirement[];
}
export interface ParticipantState {
    entityId: string;
    entityType: 'playerCharacter' | 'npc' | 'monster';
    userId?: string | undefined;
    currentHP: number;
    maxHP: number;
    position: Position;
    conditions: StatusEffect[];
    inventory: InventoryState;
    availableActions: Action[];
    turnStatus: 'waiting' | 'active' | 'completed' | 'skipped';
}
export interface InitiativeEntry {
    entityId: string;
    entityType: 'playerCharacter' | 'npc' | 'monster';
    initiative: number;
    userId?: string | undefined;
}
export interface EntityPosition {
    entityId: string;
    position: Position;
    facing?: number;
}
export interface TerrainTile {
    position: Position;
    type: string;
    properties: Record<string, any>;
}
export interface MapState {
    width: number;
    height: number;
    entities: Map<string, EntityPosition>;
    obstacles: Position[];
    terrain: TerrainTile[];
}
export interface TurnAction {
    type: 'move' | 'attack' | 'useItem' | 'cast' | 'interact' | 'end';
    entityId: string;
    target?: string | undefined;
    position?: Position | undefined;
    itemId?: string | undefined;
    spellId?: string | undefined;
    actionId?: string | undefined;
    parameters?: Record<string, any> | undefined;
}
export interface TurnRecord {
    entityId: string;
    turnNumber: number;
    roundNumber: number;
    actions: TurnAction[];
    startTime: Date;
    endTime?: Date | undefined;
    status: 'completed' | 'skipped' | 'timeout';
}
export interface ChatMessage {
    id: string;
    userId: string;
    entityId?: string | undefined;
    content: string;
    type: 'party' | 'dm' | 'private' | 'system';
    recipients?: string[] | undefined;
    timestamp: number;
}
export interface GameState {
    interactionId: string;
    status: 'waiting' | 'active' | 'paused' | 'completed';
    initiativeOrder: InitiativeEntry[];
    currentTurnIndex: number;
    roundNumber: number;
    participants: Map<string, ParticipantState>;
    mapState: MapState;
    turnHistory: TurnRecord[];
    chatLog: ChatMessage[];
    timestamp: Date;
}
export interface Participant {
    userId: string;
    entityId: string;
    entityType: 'playerCharacter' | 'npc' | 'monster';
    connectionId: string;
    isConnected: boolean;
    lastActivity: Date;
}
export interface InteractionRoom {
    id: string;
    interactionId: string;
    participants: Map<string, Participant>;
    gameState: GameState;
    lastActivity: Date;
    status: 'active' | 'paused' | 'completed';
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
}
export interface GameError {
    code: string;
    message: string;
    details?: Record<string, any>;
}
export interface StateDelta {
    type: 'participant' | 'turn' | 'map' | 'initiative' | 'chat';
    changes: Record<string, any>;
    timestamp: number;
}
export type EntityType = 'playerCharacter' | 'npc' | 'monster';
export type TurnStatus = 'waiting' | 'active' | 'completed' | 'skipped';
export type GameStatus = 'waiting' | 'active' | 'paused' | 'completed';
export type RoomStatus = 'active' | 'paused' | 'completed';
export type ChatType = 'party' | 'dm' | 'private' | 'system';
export type ActionType = 'move' | 'attack' | 'useItem' | 'cast' | 'interact' | 'end';
export type TurnRecordStatus = 'completed' | 'skipped' | 'timeout';
export type StateDeltaType = 'participant' | 'turn' | 'map' | 'initiative' | 'chat';
//# sourceMappingURL=core.d.ts.map