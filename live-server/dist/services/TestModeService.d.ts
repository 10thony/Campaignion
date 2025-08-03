import { RoomManager } from './RoomManager';
import { EventBroadcaster } from './EventBroadcaster';
import { GameStateEngine } from './GameStateEngine';
import { TestScenario, TestSession, SimulatedAction, LoadTestConfig, LoadTestResult, ValidationReport, NetworkErrorType } from '../types/testMode';
export declare class TestModeService {
    private roomManager;
    private eventBroadcaster;
    private gameStateEngine;
    private activeSessions;
    private scenarios;
    private loadTestResults;
    constructor(roomManager: RoomManager, eventBroadcaster: EventBroadcaster, gameStateEngine: GameStateEngine);
    createTestInteraction(scenarioId: string, adminUserId: string, options?: {
        participantCount?: number;
        aiParticipants?: number;
        duration?: number;
        customSettings?: Record<string, any>;
    }): Promise<string>;
    simulatePlayerActions(sessionId: string, actions: SimulatedAction[]): Promise<void>;
    injectNetworkErrors(sessionId: string, errorType: NetworkErrorType, options?: {
        targetEntityId?: string;
        duration?: number;
        intensity?: number;
    }): Promise<void>;
    validateStateConsistency(sessionId: string): Promise<ValidationReport>;
    runLoadTest(config: LoadTestConfig): Promise<string>;
    getTestResults(sessionId: string): TestSession | null;
    getLoadTestResults(testId: string): LoadTestResult | null;
    getAvailableScenarios(): TestScenario[];
    addTestScenario(scenario: TestScenario): void;
    cleanupTestSession(sessionId: string): Promise<void>;
    private initializeDefaultScenarios;
    private createGameStateFromScenario;
    private addAIParticipants;
    private executeSimulatedAction;
    private simulateDisconnect;
    private simulateTimeout;
    private simulatePacketLoss;
    private simulateHighLatency;
    private initializeTestResults;
    private initializePerformanceMetrics;
    private updatePerformanceMetrics;
    private logTestEvent;
    private addTestError;
}
//# sourceMappingURL=TestModeService.d.ts.map