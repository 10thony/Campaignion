import { logger } from '../utils/logger';
import { RoomManager } from './RoomManager';
import { EventBroadcaster } from './EventBroadcaster';
import { GameStateEngine } from './GameStateEngine';
import {
  TestScenario,
  TestSession,
  SimulatedAction,
  LoadTestConfig,
  LoadTestResult,
  ValidationReport,
  NetworkErrorType,
  TestParticipant,
  TestResults,
  PerformanceMetrics,
  TestLog,
  TestError,
} from '../types/testMode';
import { GameState, TurnAction, Participant } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * TestModeService provides comprehensive testing capabilities for the live interaction system
 * Available only to admin users for testing and validation purposes
 */
export class TestModeService {
  private activeSessions = new Map<string, TestSession>();
  private scenarios = new Map<string, TestScenario>();
  private loadTestResults = new Map<string, LoadTestResult>();

  constructor(
    private roomManager: RoomManager,
    private eventBroadcaster: EventBroadcaster,
    private gameStateEngine: GameStateEngine
  ) {
    this.initializeDefaultScenarios();
  }

  /**
   * Create a test interaction with predefined scenario
   * Admin-only functionality
   */
  async createTestInteraction(
    scenarioId: string,
    adminUserId: string,
    options: {
      participantCount?: number;
      aiParticipants?: number;
      duration?: number;
      customSettings?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      const scenario = this.scenarios.get(scenarioId);
      if (!scenario) {
        throw new Error(`Test scenario not found: ${scenarioId}`);
      }

      const sessionId = uuidv4();
      const interactionId = `test_${sessionId}`;

      logger.info('Creating test interaction', {
        sessionId,
        scenarioId,
        adminUserId,
        options,
      });

      // Create initial game state based on scenario
      const gameState = this.createGameStateFromScenario(scenario, interactionId);

      // Create room for the test interaction
      const room = await this.roomManager.createRoom(interactionId, gameState);

      // Create test session
      const testSession: TestSession = {
        id: sessionId,
        scenarioId,
        status: 'preparing',
        startTime: new Date(),
        participants: [],
        results: this.initializeTestResults(),
        logs: [],
        performance: this.initializePerformanceMetrics(),
      };

      this.activeSessions.set(sessionId, testSession);

      // Add AI participants if requested
      if (options.aiParticipants && options.aiParticipants > 0) {
        await this.addAIParticipants(sessionId, options.aiParticipants, scenario);
      }

      logger.info('Test interaction created successfully', {
        sessionId,
        interactionId,
        scenarioId,
        participantCount: testSession.participants.length,
      });

      return sessionId;

    } catch (error) {
      logger.error('Failed to create test interaction', {
        scenarioId,
        adminUserId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Simulate player actions for automated testing
   */
  async simulatePlayerActions(
    sessionId: string,
    actions: SimulatedAction[]
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Test session not found: ${sessionId}`);
      }

      logger.info('Starting action simulation', {
        sessionId,
        actionCount: actions.length,
      });

      session.status = 'running';

      // Sort actions by delay to execute in order
      const sortedActions = [...actions].sort((a, b) => a.delay - b.delay);

      for (const simulatedAction of sortedActions) {
        // Check probability
        if (Math.random() > simulatedAction.probability) {
          this.logTestEvent(sessionId, 'debug', 'action', 
            `Skipped action due to probability`, {
              entityId: simulatedAction.entityId,
              actionType: simulatedAction.action.type,
              probability: simulatedAction.probability,
            });
          continue;
        }

        // Wait for delay
        if (simulatedAction.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, simulatedAction.delay));
        }

        // Execute the action
        await this.executeSimulatedAction(sessionId, simulatedAction);
      }

      logger.info('Action simulation completed', {
        sessionId,
        executedActions: actions.length,
      });

    } catch (error) {
      logger.error('Failed to simulate player actions', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'failed';
        this.addTestError(sessionId, 'system', error instanceof Error ? error.message : String(error));
      }
      
      throw error;
    }
  }

  /**
   * Inject network errors for testing error handling
   */
  async injectNetworkErrors(
    sessionId: string,
    errorType: NetworkErrorType,
    options: {
      targetEntityId?: string;
      duration?: number;
      intensity?: number;
    } = {}
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Test session not found: ${sessionId}`);
      }

      logger.info('Injecting network errors', {
        sessionId,
        errorType,
        options,
      });

      switch (errorType) {
        case 'disconnect':
          await this.simulateDisconnect(sessionId, options.targetEntityId, options.duration || 5000);
          break;
        case 'timeout':
          await this.simulateTimeout(sessionId, options.targetEntityId, options.duration || 3000);
          break;
        case 'packet_loss':
          await this.simulatePacketLoss(sessionId, options.intensity || 0.1, options.duration || 10000);
          break;
        case 'high_latency':
          await this.simulateHighLatency(sessionId, options.intensity || 1000, options.duration || 15000);
          break;
        default:
          throw new Error(`Unknown network error type: ${errorType}`);
      }

      this.logTestEvent(sessionId, 'info', 'network', 
        `Network error injected: ${errorType}`, options);

    } catch (error) {
      logger.error('Failed to inject network errors', {
        sessionId,
        errorType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate state consistency across the system
   */
  async validateStateConsistency(sessionId: string): Promise<ValidationReport> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Test session not found: ${sessionId}`);
      }

      logger.info('Validating state consistency', { sessionId });

      const report: ValidationReport = {
        valid: true,
        errors: [],
        warnings: [],
        summary: {
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0,
          warningCount: 0,
        },
      };

      // Get the room and game state
      const scenario = this.scenarios.get(session.scenarioId);
      if (!scenario) {
        report.errors.push({
          type: 'data_corruption',
          message: 'Scenario not found for session',
          severity: 'critical',
          location: 'TestModeService.validateStateConsistency',
        });
        report.valid = false;
        report.summary.totalChecks++;
        report.summary.failedChecks++;
      } else {
        report.summary.totalChecks++;
        report.summary.passedChecks++;
      }

      // Find the room for this test session
      const rooms = this.roomManager.getAllRooms();
      const testRoom = rooms.find(room => room.interactionId.startsWith('test_'));
      
      if (!testRoom) {
        report.errors.push({
          type: 'state_inconsistency',
          message: 'Test room not found',
          severity: 'critical',
          location: 'TestModeService.validateStateConsistency',
        });
        report.valid = false;
        report.summary.failedChecks++;
      } else {
        // Validate game state consistency
        const gameState = testRoom.gameState;
        
        // Check participant consistency
        report.summary.totalChecks++;
        if (gameState.participants.size !== session.participants.length) {
          report.errors.push({
            type: 'state_inconsistency',
            message: 'Participant count mismatch between game state and session',
            severity: 'major',
            location: 'GameState.participants',
            expectedValue: session.participants.length,
            actualValue: gameState.participants.size,
          });
          report.valid = false;
          report.summary.failedChecks++;
        } else {
          report.summary.passedChecks++;
        }

        // Check initiative order consistency
        report.summary.totalChecks++;
        const initiativeEntityIds = gameState.initiativeOrder.map(entry => entry.entityId);
        const participantEntityIds = Array.from(gameState.participants.keys());
        const missingFromInitiative = participantEntityIds.filter(id => !initiativeEntityIds.includes(id));
        
        if (missingFromInitiative.length > 0) {
          report.errors.push({
            type: 'state_inconsistency',
            message: 'Entities missing from initiative order',
            severity: 'major',
            location: 'GameState.initiativeOrder',
            actualValue: missingFromInitiative,
          });
          report.valid = false;
          report.summary.failedChecks++;
        } else {
          report.summary.passedChecks++;
        }

        // Check turn index bounds
        report.summary.totalChecks++;
        if (gameState.currentTurnIndex >= gameState.initiativeOrder.length) {
          report.errors.push({
            type: 'state_inconsistency',
            message: 'Current turn index out of bounds',
            severity: 'critical',
            location: 'GameState.currentTurnIndex',
            expectedValue: `< ${gameState.initiativeOrder.length}`,
            actualValue: gameState.currentTurnIndex,
          });
          report.valid = false;
          report.summary.failedChecks++;
        } else {
          report.summary.passedChecks++;
        }

        // Check map state consistency
        report.summary.totalChecks++;
        const mapEntityIds = Array.from(gameState.mapState.entities.keys());
        const unmappedParticipants = participantEntityIds.filter(id => !mapEntityIds.includes(id));
        
        if (unmappedParticipants.length > 0) {
          report.warnings.push({
            type: 'potential_issue',
            message: 'Participants not represented on map',
            location: 'GameState.mapState.entities',
            suggestion: 'Ensure all participants have map positions',
          });
          report.summary.warningCount++;
        }
      }



      logger.info('State consistency validation completed', {
        sessionId,
        valid: report.valid,
        totalChecks: report.summary.totalChecks,
        errors: report.errors.length,
        warnings: report.warnings.length,
      });

      return report;

    } catch (error) {
      logger.error('Failed to validate state consistency', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Run load testing with multiple concurrent users
   */
  async runLoadTest(config: LoadTestConfig): Promise<string> {
    try {
      const testId = uuidv4();
      
      logger.info('Starting load test', {
        testId,
        config,
      });

      const result: LoadTestResult = {
        config,
        startTime: new Date(),
        endTime: new Date(),
        totalUsers: 0,
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        errors: [],
        performanceOverTime: [],
      };

      // Create test sessions for each scenario
      const testSessions: string[] = [];
      
      for (const scenarioId of config.scenarios) {
        for (let i = 0; i < config.concurrentUsers; i++) {
          const sessionId = await this.createTestInteraction(
            scenarioId,
            'load-test-admin',
            {
              participantCount: 1,
              aiParticipants: 1,
              duration: config.testDuration / 60, // convert to minutes
            }
          );
          testSessions.push(sessionId);
        }
      }

      result.totalUsers = testSessions.length;

      // Ramp up users gradually
      const rampUpDelay = (config.rampUpTime * 1000) / config.concurrentUsers;
      
      const sessionPromises = testSessions.map(async (sessionId, index) => {
        // Stagger the start times
        await new Promise(resolve => setTimeout(resolve, index * rampUpDelay));
        
        try {
          // Generate actions for this session
          const actionsPerSession = Math.floor(
            (config.actionFrequency * config.testDuration) / 60
          );
          
          const actions: SimulatedAction[] = [];
          for (let i = 0; i < actionsPerSession; i++) {
            actions.push({
              entityId: `test-entity-${index}`,
              action: {
                type: 'move',
                position: {
                  x: Math.floor(Math.random() * 20),
                  y: Math.floor(Math.random() * 20),
                },
              },
              delay: (i * 60000) / config.actionFrequency, // spread actions evenly
              probability: 1.0,
            });
          }

          await this.simulatePlayerActions(sessionId, actions);
          result.successfulActions += actions.length;
          
        } catch (error) {
          result.failedActions++;
          result.errors.push({
            type: 'system',
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          });
        }
      });

      // Wait for all sessions to complete or timeout
      await Promise.allSettled(sessionPromises);

      result.endTime = new Date();
      result.totalActions = result.successfulActions + result.failedActions;
      result.errorRate = result.totalActions > 0 ? result.failedActions / result.totalActions : 0;
      result.throughput = result.totalActions / (config.testDuration / 60); // actions per minute

      // Clean up test sessions
      for (const sessionId of testSessions) {
        await this.cleanupTestSession(sessionId);
      }

      this.loadTestResults.set(testId, result);

      logger.info('Load test completed', {
        testId,
        totalUsers: result.totalUsers,
        totalActions: result.totalActions,
        errorRate: result.errorRate,
        throughput: result.throughput,
      });

      return testId;

    } catch (error) {
      logger.error('Failed to run load test', {
        config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get test session results
   */
  getTestResults(sessionId: string): TestSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get load test results
   */
  getLoadTestResults(testId: string): LoadTestResult | null {
    return this.loadTestResults.get(testId) || null;
  }

  /**
   * List all available test scenarios
   */
  getAvailableScenarios(): TestScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Add a new test scenario
   */
  addTestScenario(scenario: TestScenario): void {
    this.scenarios.set(scenario.id, scenario);
    logger.info('Test scenario added', {
      scenarioId: scenario.id,
      name: scenario.name,
      type: scenario.type,
    });
  }

  /**
   * Clean up a test session
   */
  async cleanupTestSession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return;
      }

      // Mark session as completed
      session.status = 'completed';
      session.endTime = new Date();

      // Clean up any associated rooms
      const interactionId = `test_${sessionId}`;
      const room = this.roomManager.getRoomByInteractionId(interactionId);
      if (room) {
        // Remove all participants
        for (const participant of room.participants.values()) {
          await this.roomManager.leaveRoom(interactionId, participant.userId);
        }
      }

      logger.info('Test session cleaned up', {
        sessionId,
        duration: session.endTime.getTime() - session.startTime.getTime(),
        participantCount: session.participants.length,
      });

    } catch (error) {
      logger.error('Failed to cleanup test session', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Private helper methods

  private initializeDefaultScenarios(): void {
    // Add some default test scenarios
    const combatScenario: TestScenario = {
      id: 'basic-combat',
      name: 'Basic Combat Encounter',
      description: 'A simple 2v2 combat scenario for testing basic functionality',
      type: 'combat',
      participantCount: 4,
      duration: 15,
      entities: [
        {
          id: 'player1',
          name: 'Test Fighter',
          type: 'playerCharacter',
          level: 5,
          stats: { hp: 45, maxHp: 45, ac: 16, str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 10, speed: 30 },
          equipment: [
            { id: 'longsword', name: 'Longsword', type: 'weapon', properties: { damage: '1d8+3' }, equipped: true }
          ],
          position: { x: 2, y: 2 },
        },
        {
          id: 'player2',
          name: 'Test Wizard',
          type: 'playerCharacter',
          level: 5,
          stats: { hp: 28, maxHp: 28, ac: 12, str: 8, dex: 14, con: 12, int: 16, wis: 13, cha: 11, speed: 30 },
          equipment: [
            { id: 'staff', name: 'Quarterstaff', type: 'weapon', properties: { damage: '1d6' }, equipped: true }
          ],
          spells: [
            { id: 'fireball', name: 'Fireball', level: 3, school: 'evocation', castingTime: '1 action', range: '150 feet', components: ['V', 'S', 'M'], duration: 'Instantaneous', description: 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame.' }
          ],
          position: { x: 1, y: 2 },
        },
        {
          id: 'orc1',
          name: 'Orc Warrior',
          type: 'monster',
          level: 1,
          stats: { hp: 15, maxHp: 15, ac: 13, str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10, speed: 30 },
          equipment: [
            { id: 'greataxe', name: 'Greataxe', type: 'weapon', properties: { damage: '1d12+3' }, equipped: true }
          ],
          position: { x: 8, y: 8 },
          behavior: {
            strategy: 'aggressive',
            targetPriority: ['playerCharacter'],
            actionWeights: { attack: 0.7, move: 0.3 },
            decisionDelay: 1000,
          },
        },
        {
          id: 'orc2',
          name: 'Orc Archer',
          type: 'monster',
          level: 1,
          stats: { hp: 12, maxHp: 12, ac: 12, str: 14, dex: 16, con: 14, int: 7, wis: 12, cha: 9, speed: 30 },
          equipment: [
            { id: 'shortbow', name: 'Shortbow', type: 'weapon', properties: { damage: '1d6+3', range: '80/320' }, equipped: true }
          ],
          position: { x: 9, y: 7 },
          behavior: {
            strategy: 'defensive',
            targetPriority: ['playerCharacter'],
            actionWeights: { attack: 0.8, move: 0.2 },
            decisionDelay: 1200,
          },
        },
      ],
      initialState: {
        mapSize: { width: 12, height: 12 },
        terrain: [
          { position: { x: 5, y: 5 }, type: 'wall', properties: {} },
          { position: { x: 5, y: 6 }, type: 'wall', properties: {} },
          { position: { x: 6, y: 5 }, type: 'wall', properties: {} },
        ],
        objectives: [
          {
            id: 'defeat-orcs',
            type: 'defeat',
            target: 'monster',
            description: 'Defeat all orc enemies',
            required: true,
          },
        ],
        environmentalEffects: [],
        turnTimeLimit: 90,
        roundLimit: 20,
      },
      expectedOutcomes: [
        {
          type: 'victory',
          condition: 'All monsters defeated',
          expectedProbability: 0.7,
          description: 'Players should win most encounters',
        },
        {
          type: 'defeat',
          condition: 'All players defeated',
          expectedProbability: 0.2,
          description: 'Players may lose occasionally',
        },
        {
          type: 'timeout',
          condition: 'Round limit reached',
          expectedProbability: 0.1,
          description: 'Combat should rarely timeout',
        },
      ],
      metadata: {
        difficulty: 'medium',
        tags: ['combat', 'basic', 'tutorial'],
        author: 'system',
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      },
    };

    this.scenarios.set(combatScenario.id, combatScenario);

    logger.info('Default test scenarios initialized', {
      scenarioCount: this.scenarios.size,
    });
  }

  private createGameStateFromScenario(scenario: TestScenario, interactionId: string): GameState {
    const gameState: GameState = {
      interactionId,
      status: 'waiting',
      initiativeOrder: scenario.entities.map(entity => ({
        entityId: entity.id,
        entityType: entity.type,
        initiative: Math.floor(Math.random() * 20) + 1,
        userId: entity.type === 'playerCharacter' ? `test-user-${entity.id}` : undefined,
      })).sort((a, b) => b.initiative - a.initiative),
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map(),
      mapState: {
        width: scenario.initialState.mapSize.width,
        height: scenario.initialState.mapSize.height,
        entities: new Map(),
        obstacles: scenario.initialState.terrain.map(t => t.position),
        terrain: scenario.initialState.terrain.map(t => ({
          position: t.position,
          type: t.type,
          properties: t.properties,
        })),
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date(),
    };

    // Add participants and map entities
    for (const entity of scenario.entities) {
      gameState.participants.set(entity.id, {
        entityId: entity.id,
        entityType: entity.type,
        userId: entity.type === 'playerCharacter' ? `test-user-${entity.id}` : undefined,
        currentHP: entity.stats.hp,
        maxHP: entity.stats.maxHp,
        position: entity.position,
        conditions: [],
        inventory: {
          items: entity.equipment.map(eq => ({
            id: eq.id,
            itemId: eq.id,
            quantity: 1,
            properties: eq.properties,
          })),
          equippedItems: entity.equipment.filter(eq => eq.equipped).reduce((acc, eq) => {
            acc[eq.type] = eq.id;
            return acc;
          }, {} as Record<string, string>),
          capacity: 20,
        },
        availableActions: [
          { id: 'move', name: 'Move', type: 'move', available: true, requirements: [] },
          { id: 'attack', name: 'Attack', type: 'attack', available: true, requirements: [] },
          { id: 'end', name: 'End Turn', type: 'interact', available: true, requirements: [] },
        ],
        turnStatus: 'waiting',
      });

      gameState.mapState.entities.set(entity.id, {
        entityId: entity.id,
        position: entity.position,
      });
    }

    return gameState;
  }

  private async addAIParticipants(sessionId: string, count: number, scenario: TestScenario): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    for (let i = 0; i < count; i++) {
      const aiParticipant: TestParticipant = {
        id: `ai-${i}`,
        type: 'ai',
        entityId: `ai-entity-${i}`,
        isConnected: true,
        behavior: {
          strategy: 'random',
          targetPriority: [],
          actionWeights: { move: 0.4, attack: 0.3, end: 0.3 },
          decisionDelay: 2000,
        },
      };

      session.participants.push(aiParticipant);
    }

    logger.debug('AI participants added to test session', {
      sessionId,
      aiCount: count,
      totalParticipants: session.participants.length,
    });
  }

  private async executeSimulatedAction(sessionId: string, simulatedAction: SimulatedAction): Promise<void> {
    try {
      const startTime = Date.now();

      // Convert simulated action to turn action
      const turnAction: TurnAction = {
        ...simulatedAction.action,
        entityId: simulatedAction.entityId,
      };

      // Find the room for this test session
      const interactionId = `test_${sessionId}`;
      const room = this.roomManager.getRoomByInteractionId(interactionId);
      
      if (!room) {
        throw new Error(`Test room not found for session: ${sessionId}`);
      }

      // Process the action
      const success = room.processTurnAction(turnAction);
      
      const responseTime = Date.now() - startTime;

      // Update performance metrics
      const session = this.activeSessions.get(sessionId);
      if (session) {
        this.updatePerformanceMetrics(session, responseTime, success);
      }

      this.logTestEvent(sessionId, 'info', 'action', 
        `Simulated action executed: ${turnAction.type}`, {
          entityId: turnAction.entityId,
          success,
          responseTime,
        });

    } catch (error) {
      this.addTestError(sessionId, 'validation', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private async simulateDisconnect(sessionId: string, entityId?: string, duration: number = 5000): Promise<void> {
    // Simulate participant disconnect
    this.logTestEvent(sessionId, 'info', 'network', 'Simulating disconnect', { entityId, duration });
    
    // Re-connect after duration
    setTimeout(() => {
      this.logTestEvent(sessionId, 'info', 'network', 'Simulating reconnect', { entityId });
    }, duration);
  }

  private async simulateTimeout(sessionId: string, entityId?: string, duration: number = 3000): Promise<void> {
    this.logTestEvent(sessionId, 'info', 'network', 'Simulating timeout', { entityId, duration });
  }

  private async simulatePacketLoss(sessionId: string, intensity: number, duration: number): Promise<void> {
    this.logTestEvent(sessionId, 'info', 'network', 'Simulating packet loss', { intensity, duration });
  }

  private async simulateHighLatency(sessionId: string, latency: number, duration: number): Promise<void> {
    this.logTestEvent(sessionId, 'info', 'network', 'Simulating high latency', { latency, duration });
  }

  private initializeTestResults(): TestResults {
    return {
      outcome: 'timeout',
      duration: 0,
      turnsCompleted: 0,
      roundsCompleted: 0,
      objectivesCompleted: [],
      participantStats: [],
      errors: [],
      warnings: [],
    };
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      throughput: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      },
      networkStats: {
        messagesReceived: 0,
        messagesSent: 0,
        bytesReceived: 0,
        bytesSent: 0,
        connectionCount: 0,
        averageLatency: 0,
      },
      errorRate: 0,
    };
  }

  private updatePerformanceMetrics(session: TestSession, responseTime: number, success: boolean): void {
    const metrics = session.performance;
    
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    
    // Update running average (simplified)
    const totalActions = session.results.participantStats.reduce((sum, stat) => sum + stat.actionsPerformed, 0) + 1;
    metrics.averageResponseTime = ((metrics.averageResponseTime * (totalActions - 1)) + responseTime) / totalActions;
    
    if (!success) {
      session.results.errors.push({
        type: 'validation',
        message: 'Action execution failed',
        timestamp: new Date(),
      });
    }
  }

  private logTestEvent(sessionId: string, level: TestLog['level'], category: TestLog['category'], message: string, data?: Record<string, any>): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    const logEntry: TestLog = {
      id: uuidv4(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    session.logs.push(logEntry);

    // Also log to main logger
    logger[level](`[TestMode:${sessionId}] ${message}`, data);
  }

  private addTestError(sessionId: string, type: TestError['type'], message: string, entityId?: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    const error: TestError = {
      type,
      message,
      timestamp: new Date(),
      entityId,
    };

    session.results.errors.push(error);
  }
}