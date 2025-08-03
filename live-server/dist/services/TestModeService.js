"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestModeService = void 0;
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
class TestModeService {
    roomManager;
    eventBroadcaster;
    gameStateEngine;
    activeSessions = new Map();
    scenarios = new Map();
    loadTestResults = new Map();
    constructor(roomManager, eventBroadcaster, gameStateEngine) {
        this.roomManager = roomManager;
        this.eventBroadcaster = eventBroadcaster;
        this.gameStateEngine = gameStateEngine;
        this.initializeDefaultScenarios();
    }
    async createTestInteraction(scenarioId, adminUserId, options = {}) {
        try {
            const scenario = this.scenarios.get(scenarioId);
            if (!scenario) {
                throw new Error(`Test scenario not found: ${scenarioId}`);
            }
            const sessionId = (0, uuid_1.v4)();
            const interactionId = `test_${sessionId}`;
            logger_1.logger.info('Creating test interaction', {
                sessionId,
                scenarioId,
                adminUserId,
                options,
            });
            const gameState = this.createGameStateFromScenario(scenario, interactionId);
            const room = await this.roomManager.createRoom(interactionId, gameState);
            const testSession = {
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
            if (options.aiParticipants && options.aiParticipants > 0) {
                await this.addAIParticipants(sessionId, options.aiParticipants, scenario);
            }
            logger_1.logger.info('Test interaction created successfully', {
                sessionId,
                interactionId,
                scenarioId,
                participantCount: testSession.participants.length,
            });
            return sessionId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create test interaction', {
                scenarioId,
                adminUserId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    async simulatePlayerActions(sessionId, actions) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error(`Test session not found: ${sessionId}`);
            }
            logger_1.logger.info('Starting action simulation', {
                sessionId,
                actionCount: actions.length,
            });
            session.status = 'running';
            const sortedActions = [...actions].sort((a, b) => a.delay - b.delay);
            for (const simulatedAction of sortedActions) {
                if (Math.random() > simulatedAction.probability) {
                    this.logTestEvent(sessionId, 'debug', 'action', `Skipped action due to probability`, {
                        entityId: simulatedAction.entityId,
                        actionType: simulatedAction.action.type,
                        probability: simulatedAction.probability,
                    });
                    continue;
                }
                if (simulatedAction.delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, simulatedAction.delay));
                }
                await this.executeSimulatedAction(sessionId, simulatedAction);
            }
            logger_1.logger.info('Action simulation completed', {
                sessionId,
                executedActions: actions.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to simulate player actions', {
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
    async injectNetworkErrors(sessionId, errorType, options = {}) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error(`Test session not found: ${sessionId}`);
            }
            logger_1.logger.info('Injecting network errors', {
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
            this.logTestEvent(sessionId, 'info', 'network', `Network error injected: ${errorType}`, options);
        }
        catch (error) {
            logger_1.logger.error('Failed to inject network errors', {
                sessionId,
                errorType,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    async validateStateConsistency(sessionId) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error(`Test session not found: ${sessionId}`);
            }
            logger_1.logger.info('Validating state consistency', { sessionId });
            const report = {
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
            }
            else {
                report.summary.totalChecks++;
                report.summary.passedChecks++;
            }
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
            }
            else {
                const gameState = testRoom.gameState;
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
                }
                else {
                    report.summary.passedChecks++;
                }
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
                }
                else {
                    report.summary.passedChecks++;
                }
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
                }
                else {
                    report.summary.passedChecks++;
                }
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
            logger_1.logger.info('State consistency validation completed', {
                sessionId,
                valid: report.valid,
                totalChecks: report.summary.totalChecks,
                errors: report.errors.length,
                warnings: report.warnings.length,
            });
            return report;
        }
        catch (error) {
            logger_1.logger.error('Failed to validate state consistency', {
                sessionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    async runLoadTest(config) {
        try {
            const testId = (0, uuid_1.v4)();
            logger_1.logger.info('Starting load test', {
                testId,
                config,
            });
            const result = {
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
            const testSessions = [];
            for (const scenarioId of config.scenarios) {
                for (let i = 0; i < config.concurrentUsers; i++) {
                    const sessionId = await this.createTestInteraction(scenarioId, 'load-test-admin', {
                        participantCount: 1,
                        aiParticipants: 1,
                        duration: config.testDuration / 60,
                    });
                    testSessions.push(sessionId);
                }
            }
            result.totalUsers = testSessions.length;
            const rampUpDelay = (config.rampUpTime * 1000) / config.concurrentUsers;
            const sessionPromises = testSessions.map(async (sessionId, index) => {
                await new Promise(resolve => setTimeout(resolve, index * rampUpDelay));
                try {
                    const actionsPerSession = Math.floor((config.actionFrequency * config.testDuration) / 60);
                    const actions = [];
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
                            delay: (i * 60000) / config.actionFrequency,
                            probability: 1.0,
                        });
                    }
                    await this.simulatePlayerActions(sessionId, actions);
                    result.successfulActions += actions.length;
                }
                catch (error) {
                    result.failedActions++;
                    result.errors.push({
                        type: 'system',
                        message: error instanceof Error ? error.message : String(error),
                        timestamp: new Date(),
                    });
                }
            });
            await Promise.allSettled(sessionPromises);
            result.endTime = new Date();
            result.totalActions = result.successfulActions + result.failedActions;
            result.errorRate = result.totalActions > 0 ? result.failedActions / result.totalActions : 0;
            result.throughput = result.totalActions / (config.testDuration / 60);
            for (const sessionId of testSessions) {
                await this.cleanupTestSession(sessionId);
            }
            this.loadTestResults.set(testId, result);
            logger_1.logger.info('Load test completed', {
                testId,
                totalUsers: result.totalUsers,
                totalActions: result.totalActions,
                errorRate: result.errorRate,
                throughput: result.throughput,
            });
            return testId;
        }
        catch (error) {
            logger_1.logger.error('Failed to run load test', {
                config,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    getTestResults(sessionId) {
        return this.activeSessions.get(sessionId) || null;
    }
    getLoadTestResults(testId) {
        return this.loadTestResults.get(testId) || null;
    }
    getAvailableScenarios() {
        return Array.from(this.scenarios.values());
    }
    addTestScenario(scenario) {
        this.scenarios.set(scenario.id, scenario);
        logger_1.logger.info('Test scenario added', {
            scenarioId: scenario.id,
            name: scenario.name,
            type: scenario.type,
        });
    }
    async cleanupTestSession(sessionId) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                return;
            }
            session.status = 'completed';
            session.endTime = new Date();
            const interactionId = `test_${sessionId}`;
            const room = this.roomManager.getRoomByInteractionId(interactionId);
            if (room) {
                for (const participant of room.participants.values()) {
                    await this.roomManager.leaveRoom(interactionId, participant.userId);
                }
            }
            logger_1.logger.info('Test session cleaned up', {
                sessionId,
                duration: session.endTime.getTime() - session.startTime.getTime(),
                participantCount: session.participants.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup test session', {
                sessionId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    initializeDefaultScenarios() {
        const combatScenario = {
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
        logger_1.logger.info('Default test scenarios initialized', {
            scenarioCount: this.scenarios.size,
        });
    }
    createGameStateFromScenario(scenario, interactionId) {
        const gameState = {
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
                    }, {}),
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
    async addAIParticipants(sessionId, count, scenario) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        for (let i = 0; i < count; i++) {
            const aiParticipant = {
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
        logger_1.logger.debug('AI participants added to test session', {
            sessionId,
            aiCount: count,
            totalParticipants: session.participants.length,
        });
    }
    async executeSimulatedAction(sessionId, simulatedAction) {
        try {
            const startTime = Date.now();
            const turnAction = {
                ...simulatedAction.action,
                entityId: simulatedAction.entityId,
            };
            const interactionId = `test_${sessionId}`;
            const room = this.roomManager.getRoomByInteractionId(interactionId);
            if (!room) {
                throw new Error(`Test room not found for session: ${sessionId}`);
            }
            const success = room.processTurnAction(turnAction);
            const responseTime = Date.now() - startTime;
            const session = this.activeSessions.get(sessionId);
            if (session) {
                this.updatePerformanceMetrics(session, responseTime, success);
            }
            this.logTestEvent(sessionId, 'info', 'action', `Simulated action executed: ${turnAction.type}`, {
                entityId: turnAction.entityId,
                success,
                responseTime,
            });
        }
        catch (error) {
            this.addTestError(sessionId, 'validation', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    async simulateDisconnect(sessionId, entityId, duration = 5000) {
        this.logTestEvent(sessionId, 'info', 'network', 'Simulating disconnect', { entityId, duration });
        setTimeout(() => {
            this.logTestEvent(sessionId, 'info', 'network', 'Simulating reconnect', { entityId });
        }, duration);
    }
    async simulateTimeout(sessionId, entityId, duration = 3000) {
        this.logTestEvent(sessionId, 'info', 'network', 'Simulating timeout', { entityId, duration });
    }
    async simulatePacketLoss(sessionId, intensity, duration) {
        this.logTestEvent(sessionId, 'info', 'network', 'Simulating packet loss', { intensity, duration });
    }
    async simulateHighLatency(sessionId, latency, duration) {
        this.logTestEvent(sessionId, 'info', 'network', 'Simulating high latency', { latency, duration });
    }
    initializeTestResults() {
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
    initializePerformanceMetrics() {
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
    updatePerformanceMetrics(session, responseTime, success) {
        const metrics = session.performance;
        metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
        metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
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
    logTestEvent(sessionId, level, category, message, data) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return;
        }
        const logEntry = {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            level,
            category,
            message,
            data,
        };
        session.logs.push(logEntry);
        logger_1.logger[level](`[TestMode:${sessionId}] ${message}`, data);
    }
    addTestError(sessionId, type, message, entityId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return;
        }
        const error = {
            type,
            message,
            timestamp: new Date(),
            entityId,
        };
        session.results.errors.push(error);
    }
}
exports.TestModeService = TestModeService;
//# sourceMappingURL=TestModeService.js.map