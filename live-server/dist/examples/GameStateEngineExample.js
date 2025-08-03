"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateEngineExample = void 0;
exports.runGameStateEngineExample = runGameStateEngineExample;
const GameStateEngine_1 = require("../services/GameStateEngine");
class GameStateEngineExample {
    gameEngine;
    constructor() {
        const initialState = {
            interactionId: 'example-interaction',
            status: 'active',
            initiativeOrder: [
                { entityId: 'player1', entityType: 'playerCharacter', initiative: 18, userId: 'user1' },
                { entityId: 'goblin1', entityType: 'monster', initiative: 15 },
                { entityId: 'player2', entityType: 'playerCharacter', initiative: 12, userId: 'user2' }
            ],
            currentTurnIndex: 0,
            roundNumber: 1,
            participants: new Map([
                ['player1', {
                        entityId: 'player1',
                        entityType: 'playerCharacter',
                        userId: 'user1',
                        currentHP: 25,
                        maxHP: 25,
                        position: { x: 1, y: 1 },
                        conditions: [],
                        inventory: {
                            items: [
                                { id: 'potion1', itemId: 'healing_potion', quantity: 3, properties: {} },
                                { id: 'sword1', itemId: 'longsword', quantity: 1, properties: { damage: '1d8+3' } }
                            ],
                            equippedItems: { weapon: 'sword1' },
                            capacity: 20
                        },
                        availableActions: [
                            { id: 'move', name: 'Move', type: 'move', available: true, requirements: [] },
                            { id: 'attack', name: 'Attack', type: 'attack', available: true, requirements: [] },
                            { id: 'use_item', name: 'Use Item', type: 'useItem', available: true, requirements: [] }
                        ],
                        turnStatus: 'active'
                    }],
                ['goblin1', {
                        entityId: 'goblin1',
                        entityType: 'monster',
                        currentHP: 7,
                        maxHP: 7,
                        position: { x: 3, y: 2 },
                        conditions: [],
                        inventory: { items: [], equippedItems: {}, capacity: 0 },
                        availableActions: [
                            { id: 'move', name: 'Move', type: 'move', available: true, requirements: [] },
                            { id: 'attack', name: 'Scimitar Attack', type: 'attack', available: true, requirements: [] }
                        ],
                        turnStatus: 'waiting'
                    }],
                ['player2', {
                        entityId: 'player2',
                        entityType: 'playerCharacter',
                        userId: 'user2',
                        currentHP: 18,
                        maxHP: 20,
                        position: { x: 2, y: 3 },
                        conditions: [],
                        inventory: {
                            items: [
                                { id: 'bow1', itemId: 'shortbow', quantity: 1, properties: { damage: '1d6+2' } },
                                { id: 'arrows1', itemId: 'arrows', quantity: 20, properties: {} }
                            ],
                            equippedItems: { weapon: 'bow1' },
                            capacity: 15
                        },
                        availableActions: [
                            { id: 'move', name: 'Move', type: 'move', available: true, requirements: [] },
                            { id: 'attack', name: 'Ranged Attack', type: 'attack', available: true, requirements: [] }
                        ],
                        turnStatus: 'waiting'
                    }]
            ]),
            mapState: {
                width: 10,
                height: 10,
                entities: new Map([
                    ['player1', { entityId: 'player1', position: { x: 1, y: 1 } }],
                    ['goblin1', { entityId: 'goblin1', position: { x: 3, y: 2 } }],
                    ['player2', { entityId: 'player2', position: { x: 2, y: 3 } }]
                ]),
                obstacles: [
                    { x: 5, y: 5 },
                    { x: 6, y: 5 },
                    { x: 7, y: 5 }
                ],
                terrain: [
                    { position: { x: 4, y: 4 }, type: 'difficult', properties: { movementCost: 2 } }
                ]
            },
            turnHistory: [],
            chatLog: [],
            timestamp: new Date()
        };
        this.gameEngine = new GameStateEngine_1.GameStateEngine(initialState, {
            turnTimeoutMs: 30000,
            autoAdvanceTurns: true,
            enableActionValidation: true
        });
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.gameEngine.on('turnStarted', (event) => {
            console.log(`🎯 Turn started for ${event.entityId} (${event.timeLimit}ms timeout)`);
            this.logCurrentGameState();
        });
        this.gameEngine.on('turnCompleted', (event) => {
            console.log(`✅ Turn completed by ${event.entityId}`);
            console.log(`   Actions: ${event.actions.map((a) => a.type).join(', ')}`);
        });
        this.gameEngine.on('turnSkipped', (event) => {
            console.log(`⏭️  Turn skipped for ${event.entityId} (${event.reason})`);
        });
        this.gameEngine.on('newRound', (event) => {
            console.log(`🔄 New round started! Round ${event.roundNumber}`);
        });
        this.gameEngine.on('stateDelta', (delta) => {
            console.log(`📊 State delta:`, Object.keys(delta.changes));
        });
        this.gameEngine.on('gamePaused', (event) => {
            console.log(`⏸️  Game paused: ${event.reason}`);
        });
        this.gameEngine.on('gameResumed', () => {
            console.log(`▶️  Game resumed`);
        });
    }
    async simulateCombatEncounter() {
        console.log('🏹 Starting combat encounter simulation...\n');
        try {
            console.log('--- Turn 1: Player1 ---');
            await this.processAction({
                type: 'move',
                entityId: 'player1',
                position: { x: 2, y: 1 }
            });
            console.log('\n--- Turn 2: Goblin ---');
            await this.processAction({
                type: 'move',
                entityId: 'goblin1',
                position: { x: 2, y: 2 }
            });
            console.log('\n--- Turn 3: Player2 ---');
            await this.processAction({
                type: 'attack',
                entityId: 'player2',
                target: 'goblin1'
            });
            console.log('\n--- Turn 4: Player1 (Round 2) ---');
            await this.processAction({
                type: 'attack',
                entityId: 'player1',
                target: 'goblin1'
            });
            console.log('\n--- Turn 5: Goblin ---');
            await this.processAction({
                type: 'attack',
                entityId: 'goblin1',
                target: 'player1'
            });
            console.log('\n--- Turn 6: Player2 ---');
            await this.processAction({
                type: 'end',
                entityId: 'player2'
            });
            console.log('\n--- Turn 7: Player1 (Round 3) ---');
            await this.processAction({
                type: 'useItem',
                entityId: 'player1',
                itemId: 'healing_potion'
            });
            console.log('\n🎉 Combat encounter simulation completed!');
            this.logFinalState();
        }
        catch (error) {
            console.error('❌ Error during simulation:', error);
        }
    }
    async demonstrateTurnManagement() {
        console.log('⏰ Demonstrating turn management...\n');
        console.log('Manually skipping current turn...');
        this.gameEngine.skipTurn('Player disconnected');
        console.log('Waiting for potential timeout...');
        this.gameEngine.advanceTurn();
        this.gameEngine.advanceTurn();
        console.log('Turn management demonstration completed.\n');
    }
    demonstrateInitiativeChanges() {
        console.log('🎲 Demonstrating initiative order changes...\n');
        const newOrder = [
            { entityId: 'player2', entityType: 'playerCharacter', initiative: 22, userId: 'user2' },
            { entityId: 'player1', entityType: 'playerCharacter', initiative: 18, userId: 'user1' },
            { entityId: 'goblin1', entityType: 'monster', initiative: 12 }
        ];
        console.log('Updating initiative order...');
        this.gameEngine.updateInitiativeOrder(newOrder);
        console.log('Initiative order updated!\n');
    }
    async demonstratePauseResume() {
        console.log('⏸️ Demonstrating pause and resume...\n');
        console.log('Pausing game...');
        this.gameEngine.pause('DM needs to check rules');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Resuming game...');
        this.gameEngine.resume();
        console.log('Pause/resume demonstration completed.\n');
    }
    async processAction(action) {
        const result = await this.gameEngine.processTurnAction(action);
        if (result.valid) {
            console.log(`   ✅ Action successful: ${action.type}`);
            if (action.position) {
                console.log(`      Moved to (${action.position.x}, ${action.position.y})`);
            }
            if (action.target) {
                console.log(`      Target: ${action.target}`);
            }
            if (action.itemId) {
                console.log(`      Used item: ${action.itemId}`);
            }
        }
        else {
            console.log(`   ❌ Action failed: ${result.errors.join(', ')}`);
        }
    }
    logCurrentGameState() {
        const state = this.gameEngine.getGameState();
        const currentEntity = this.gameEngine.getCurrentTurnEntity();
        console.log(`   Round ${state.roundNumber}, Turn ${state.currentTurnIndex + 1}`);
        console.log(`   Current turn: ${currentEntity?.entityId || 'None'}`);
        state.participants.forEach((participant, key) => {
            console.log(`   ${participant.entityId}: ${participant.currentHP}/${participant.maxHP} HP at (${participant.position.x}, ${participant.position.y})`);
        });
    }
    logFinalState() {
        const state = this.gameEngine.getGameState();
        console.log('\n📊 Final Game State:');
        console.log(`   Status: ${state.status}`);
        console.log(`   Round: ${state.roundNumber}`);
        console.log(`   Total turns played: ${state.turnHistory.length}`);
        console.log('\n👥 Final Participant States:');
        state.participants.forEach((participant, key) => {
            console.log(`   ${participant.entityId}:`);
            console.log(`     HP: ${participant.currentHP}/${participant.maxHP}`);
            console.log(`     Position: (${participant.position.x}, ${participant.position.y})`);
            console.log(`     Items: ${participant.inventory.items.length}`);
        });
        console.log('\n📜 Turn History:');
        state.turnHistory.forEach((turn, index) => {
            console.log(`   ${index + 1}. ${turn.entityId}: ${turn.actions.map(a => a.type).join(', ')} (${turn.status})`);
        });
    }
    cleanup() {
        this.gameEngine.cleanup();
        console.log('🧹 GameStateEngine example cleaned up');
    }
}
exports.GameStateEngineExample = GameStateEngineExample;
async function runGameStateEngineExample() {
    const example = new GameStateEngineExample();
    try {
        await example.simulateCombatEncounter();
        await example.demonstrateTurnManagement();
        example.demonstrateInitiativeChanges();
        await example.demonstratePauseResume();
    }
    finally {
        example.cleanup();
    }
}
//# sourceMappingURL=GameStateEngineExample.js.map