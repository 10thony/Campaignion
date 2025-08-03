// Test Mode type definitions for the live interaction system

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  type: 'combat' | 'social' | 'puzzle' | 'mixed';
  participantCount: number;
  duration: number; // in minutes
  entities: TestEntity[];
  initialState: TestGameState;
  expectedOutcomes: TestOutcome[];
  metadata: TestScenarioMetadata;
}

export interface TestEntity {
  id: string;
  name: string;
  type: 'playerCharacter' | 'npc' | 'monster';
  level: number;
  stats: EntityStats;
  equipment: TestEquipment[];
  spells?: TestSpell[];
  position: { x: number; y: number };
  behavior?: AIBehavior;
}

export interface EntityStats {
  hp: number;
  maxHp: number;
  ac: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  speed: number;
}

export interface TestEquipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'tool';
  properties: Record<string, any>;
  equipped: boolean;
}

export interface TestSpell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
}

export interface AIBehavior {
  strategy: 'aggressive' | 'defensive' | 'support' | 'random';
  targetPriority: string[];
  actionWeights: Record<string, number>;
  decisionDelay: number; // milliseconds
}

export interface TestGameState {
  mapSize: { width: number; height: number };
  terrain: TerrainFeature[];
  objectives: TestObjective[];
  environmentalEffects: EnvironmentalEffect[];
  turnTimeLimit: number;
  roundLimit?: number;
}

export interface TerrainFeature {
  position: { x: number; y: number };
  type: 'wall' | 'difficult' | 'hazard' | 'cover';
  properties: Record<string, any>;
}

export interface TestObjective {
  id: string;
  type: 'defeat' | 'survive' | 'reach' | 'protect' | 'collect';
  target: string;
  description: string;
  required: boolean;
}

export interface EnvironmentalEffect {
  id: string;
  name: string;
  type: 'damage' | 'healing' | 'condition' | 'movement';
  area: { x: number; y: number; radius: number };
  effect: Record<string, any>;
  duration: number;
}

export interface TestOutcome {
  type: 'victory' | 'defeat' | 'timeout' | 'objective_complete';
  condition: string;
  expectedProbability: number; // 0-1
  description: string;
}

export interface TestScenarioMetadata {
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  tags: string[];
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  averageRating?: number;
}

export interface SimulatedAction {
  entityId: string;
  action: {
    type: 'move' | 'attack' | 'useItem' | 'cast' | 'interact' | 'end';
    target?: string;
    position?: { x: number; y: number };
    itemId?: string;
    spellId?: string;
    parameters?: Record<string, any>;
  };
  delay: number; // milliseconds before executing
  probability: number; // 0-1, chance this action will be taken
}

export interface TestSession {
  id: string;
  scenarioId: string;
  status: 'preparing' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  participants: TestParticipant[];
  results: TestResults;
  logs: TestLog[];
  performance: PerformanceMetrics;
}

export interface TestParticipant {
  id: string;
  type: 'human' | 'ai' | 'simulated';
  entityId: string;
  userId?: string;
  connectionId?: string;
  isConnected: boolean;
  behavior?: AIBehavior;
}

export interface TestResults {
  outcome: 'victory' | 'defeat' | 'timeout' | 'error';
  duration: number; // milliseconds
  turnsCompleted: number;
  roundsCompleted: number;
  objectivesCompleted: TestObjective[];
  participantStats: ParticipantStats[];
  errors: TestError[];
  warnings: string[];
}

export interface ParticipantStats {
  entityId: string;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  actionsPerformed: number;
  averageActionTime: number;
  disconnections: number;
}

export interface TestError {
  type: 'validation' | 'network' | 'timeout' | 'system';
  message: string;
  timestamp: Date;
  entityId?: string;
  actionData?: any;
  stack?: string;
}

export interface TestLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'action' | 'state' | 'network' | 'performance' | 'validation';
  message: string;
  data?: Record<string, any>;
  entityId?: string;
  userId?: string;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number; // actions per second
  memoryUsage: MemoryUsage;
  networkStats: NetworkStats;
  errorRate: number;
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface NetworkStats {
  messagesReceived: number;
  messagesSent: number;
  bytesReceived: number;
  bytesSent: number;
  connectionCount: number;
  averageLatency: number;
}

export interface LoadTestConfig {
  concurrentUsers: number;
  rampUpTime: number; // seconds
  testDuration: number; // seconds
  actionFrequency: number; // actions per minute per user
  scenarios: string[]; // scenario IDs to test
  targetMetrics: {
    maxResponseTime: number;
    maxErrorRate: number;
    minThroughput: number;
  };
}

export interface LoadTestResult {
  config: LoadTestConfig;
  startTime: Date;
  endTime: Date;
  totalUsers: number;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  averageResponseTime: number;
  maxResponseTime: number;
  throughput: number;
  errorRate: number;
  errors: TestError[];
  performanceOverTime: PerformanceSnapshot[];
}

export interface PerformanceSnapshot {
  timestamp: Date;
  activeUsers: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
}

export type NetworkErrorType = 'disconnect' | 'timeout' | 'packet_loss' | 'high_latency';

export interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningCount: number;
  };
}

export interface ValidationError {
  type: 'state_inconsistency' | 'rule_violation' | 'data_corruption';
  message: string;
  severity: 'critical' | 'major' | 'minor';
  location: string;
  expectedValue?: any;
  actualValue?: any;
}

export interface ValidationWarning {
  type: 'performance' | 'best_practice' | 'potential_issue';
  message: string;
  location: string;
  suggestion?: string;
}