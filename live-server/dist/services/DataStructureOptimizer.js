"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStructureOptimizer = void 0;
const logger_1 = require("../utils/logger");
class DataStructureOptimizer {
    config;
    optimizerLogger;
    stringPool = new Map();
    stringUsageCount = new Map();
    memoryPools = new Map();
    optimizationHistory = [];
    maxHistorySize = 100;
    constructor(config = {}) {
        this.config = {
            enableArrayOptimization: config.enableArrayOptimization ?? true,
            arrayCompactionThreshold: config.arrayCompactionThreshold || 0.3,
            enableObjectOptimization: config.enableObjectOptimization ?? true,
            objectPropertyThreshold: config.objectPropertyThreshold || 50,
            enableStringOptimization: config.enableStringOptimization ?? true,
            stringDeduplicationThreshold: config.stringDeduplicationThreshold || 10,
            enableMapOptimization: config.enableMapOptimization ?? true,
            mapSizeThreshold: config.mapSizeThreshold || 100,
            enableHistoryOptimization: config.enableHistoryOptimization ?? true,
            maxHistorySize: config.maxHistorySize || 1000,
            historyCompressionRatio: config.historyCompressionRatio || 0.8,
            enableMemoryPooling: config.enableMemoryPooling ?? true,
            poolSizeThreshold: config.poolSizeThreshold || 10,
        };
        this.optimizerLogger = logger_1.logger.child({ component: 'DataStructureOptimizer' });
        this.optimizerLogger.info('DataStructureOptimizer initialized', {
            config: this.config
        });
        this.initializeMemoryPools();
    }
    optimizeGameState(gameState) {
        const results = [];
        try {
            if (this.config.enableObjectOptimization) {
                const participantResult = this.optimizeParticipants(gameState);
                if (participantResult)
                    results.push(participantResult);
            }
            if (this.config.enableHistoryOptimization) {
                const historyResult = this.optimizeTurnHistory(gameState);
                if (historyResult)
                    results.push(historyResult);
            }
            if (this.config.enableHistoryOptimization) {
                const chatResult = this.optimizeChatLog(gameState);
                if (chatResult)
                    results.push(chatResult);
            }
            if (this.config.enableStringOptimization) {
                const stringResult = this.optimizeStrings(gameState);
                if (stringResult)
                    results.push(stringResult);
            }
            if (this.config.enableArrayOptimization) {
                const arrayResult = this.optimizeArrays(gameState);
                if (arrayResult)
                    results.push(arrayResult);
            }
            results.forEach(result => this.addOptimizationResult(result));
            if (results.length > 0) {
                const totalSaved = results.reduce((sum, r) => sum + r.memorySaved, 0);
                this.optimizerLogger.info('Game state optimization completed', {
                    optimizations: results.length,
                    totalMemorySaved: totalSaved,
                    interactionId: gameState.interactionId
                });
            }
        }
        catch (error) {
            this.optimizerLogger.error('Error optimizing game state', {
                error: error instanceof Error ? error.message : String(error),
                interactionId: gameState.interactionId
            });
        }
        return results;
    }
    optimizeParticipants(gameState) {
        if (!this.config.enableObjectOptimization) {
            return null;
        }
        const beforeSize = this.estimateObjectSize(gameState.participants);
        let itemsProcessed = 0;
        try {
            if (gameState.participants instanceof Map) {
                const mapSize = gameState.participants.size;
                if (mapSize < this.config.mapSizeThreshold) {
                    const participantsObj = {};
                    for (const [key, value] of gameState.participants) {
                        participantsObj[key] = this.optimizeParticipantState(value);
                        itemsProcessed++;
                    }
                    gameState.participants = participantsObj;
                    const afterSize = this.estimateObjectSize(gameState.participants);
                    const memorySaved = beforeSize - afterSize;
                    if (memorySaved > 0) {
                        return {
                            type: 'map',
                            description: `Converted participants Map to Object (${mapSize} entries)`,
                            memoryBefore: beforeSize,
                            memoryAfter: afterSize,
                            memorySaved,
                            itemsProcessed,
                            timestamp: new Date()
                        };
                    }
                }
            }
            else {
                const participants = gameState.participants;
                for (const [key, participant] of Object.entries(participants)) {
                    participants[key] = this.optimizeParticipantState(participant);
                    itemsProcessed++;
                }
                const afterSize = this.estimateObjectSize(gameState.participants);
                const memorySaved = beforeSize - afterSize;
                if (memorySaved > 0) {
                    return {
                        type: 'object',
                        description: `Optimized participant objects (${itemsProcessed} participants)`,
                        memoryBefore: beforeSize,
                        memoryAfter: afterSize,
                        memorySaved,
                        itemsProcessed,
                        timestamp: new Date()
                    };
                }
            }
        }
        catch (error) {
            this.optimizerLogger.error('Error optimizing participants', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
        return null;
    }
    optimizeTurnHistory(gameState) {
        if (!this.config.enableHistoryOptimization || !gameState.turnHistory) {
            return null;
        }
        const beforeSize = this.estimateArraySize(gameState.turnHistory);
        const originalLength = gameState.turnHistory.length;
        try {
            if (originalLength > this.config.maxHistorySize) {
                const excessCount = originalLength - this.config.maxHistorySize;
                gameState.turnHistory.splice(0, excessCount);
            }
            const compressionThreshold = Math.floor(gameState.turnHistory.length * this.config.historyCompressionRatio);
            let compressedCount = 0;
            for (let i = 0; i < compressionThreshold; i++) {
                const turn = gameState.turnHistory[i];
                if (turn && !this.isTurnCompressed(turn)) {
                    gameState.turnHistory[i] = this.compressTurnRecord(turn);
                    compressedCount++;
                }
            }
            const afterSize = this.estimateArraySize(gameState.turnHistory);
            const memorySaved = beforeSize - afterSize;
            if (memorySaved > 0 || originalLength > this.config.maxHistorySize) {
                return {
                    type: 'history',
                    description: `Optimized turn history (trimmed: ${Math.max(0, originalLength - gameState.turnHistory.length)}, compressed: ${compressedCount})`,
                    memoryBefore: beforeSize,
                    memoryAfter: afterSize,
                    memorySaved,
                    itemsProcessed: compressedCount + Math.max(0, originalLength - gameState.turnHistory.length),
                    timestamp: new Date()
                };
            }
        }
        catch (error) {
            this.optimizerLogger.error('Error optimizing turn history', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
        return null;
    }
    optimizeChatLog(gameState) {
        if (!this.config.enableHistoryOptimization || !gameState.chatLog) {
            return null;
        }
        const beforeSize = this.estimateArraySize(gameState.chatLog);
        const originalLength = gameState.chatLog.length;
        try {
            const maxChatSize = Math.floor(this.config.maxHistorySize * 0.5);
            if (originalLength > maxChatSize) {
                const excessCount = originalLength - maxChatSize;
                gameState.chatLog.splice(0, excessCount);
            }
            let optimizedCount = 0;
            for (let i = 0; i < gameState.chatLog.length; i++) {
                const message = gameState.chatLog[i];
                if (message) {
                    gameState.chatLog[i] = this.optimizeChatMessage(message);
                    optimizedCount++;
                }
            }
            const afterSize = this.estimateArraySize(gameState.chatLog);
            const memorySaved = beforeSize - afterSize;
            if (memorySaved > 0 || originalLength > maxChatSize) {
                return {
                    type: 'history',
                    description: `Optimized chat log (trimmed: ${Math.max(0, originalLength - gameState.chatLog.length)}, optimized: ${optimizedCount})`,
                    memoryBefore: beforeSize,
                    memoryAfter: afterSize,
                    memorySaved,
                    itemsProcessed: optimizedCount + Math.max(0, originalLength - gameState.chatLog.length),
                    timestamp: new Date()
                };
            }
        }
        catch (error) {
            this.optimizerLogger.error('Error optimizing chat log', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
        return null;
    }
    optimizeStrings(obj) {
        if (!this.config.enableStringOptimization) {
            return null;
        }
        const beforeSize = this.estimateObjectSize(obj);
        let itemsProcessed = 0;
        try {
            this.deduplicateStrings(obj, (original, deduplicated) => {
                if (original !== deduplicated) {
                    itemsProcessed++;
                }
            });
            const afterSize = this.estimateObjectSize(obj);
            const memorySaved = beforeSize - afterSize;
            if (memorySaved > 0) {
                return {
                    type: 'string',
                    description: `Deduplicated strings (${itemsProcessed} strings optimized)`,
                    memoryBefore: beforeSize,
                    memoryAfter: afterSize,
                    memorySaved,
                    itemsProcessed,
                    timestamp: new Date()
                };
            }
        }
        catch (error) {
            this.optimizerLogger.error('Error optimizing strings', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
        return null;
    }
    optimizeArrays(obj) {
        if (!this.config.enableArrayOptimization) {
            return null;
        }
        const beforeSize = this.estimateObjectSize(obj);
        let itemsProcessed = 0;
        try {
            this.compactArrays(obj, (array, compacted) => {
                if (array.length !== compacted.length) {
                    itemsProcessed++;
                }
            });
            const afterSize = this.estimateObjectSize(obj);
            const memorySaved = beforeSize - afterSize;
            if (memorySaved > 0) {
                return {
                    type: 'array',
                    description: `Compacted sparse arrays (${itemsProcessed} arrays optimized)`,
                    memoryBefore: beforeSize,
                    memoryAfter: afterSize,
                    memorySaved,
                    itemsProcessed,
                    timestamp: new Date()
                };
            }
        }
        catch (error) {
            this.optimizerLogger.error('Error optimizing arrays', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
        return null;
    }
    getFromPool(poolName) {
        if (!this.config.enableMemoryPooling) {
            return null;
        }
        const pool = this.memoryPools.get(poolName);
        if (!pool) {
            return null;
        }
        if (pool.pool.length > 0) {
            const item = pool.pool.pop();
            pool.hits++;
            return item;
        }
        else {
            pool.misses++;
            return pool.factory();
        }
    }
    returnToPool(poolName, item) {
        if (!this.config.enableMemoryPooling) {
            return false;
        }
        const pool = this.memoryPools.get(poolName);
        if (!pool || pool.pool.length >= pool.maxSize) {
            return false;
        }
        try {
            pool.reset(item);
            pool.pool.push(item);
            return true;
        }
        catch (error) {
            this.optimizerLogger.error('Error returning item to pool', {
                poolName,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    getPoolStats() {
        const stats = {};
        for (const [name, pool] of this.memoryPools) {
            const totalRequests = pool.hits + pool.misses;
            stats[name] = {
                size: pool.pool.length,
                maxSize: pool.maxSize,
                hits: pool.hits,
                misses: pool.misses,
                hitRate: totalRequests > 0 ? pool.hits / totalRequests : 0
            };
        }
        return stats;
    }
    getOptimizationHistory() {
        return [...this.optimizationHistory];
    }
    reset() {
        this.optimizationHistory.length = 0;
        this.stringPool.clear();
        this.stringUsageCount.clear();
        for (const pool of this.memoryPools.values()) {
            pool.pool.length = 0;
            pool.hits = 0;
            pool.misses = 0;
        }
        this.optimizerLogger.info('DataStructureOptimizer reset completed');
    }
    shutdown() {
        this.optimizerLogger.info('Shutting down DataStructureOptimizer');
        this.reset();
        this.memoryPools.clear();
        this.optimizerLogger.info('DataStructureOptimizer shutdown completed');
    }
    initializeMemoryPools() {
        if (!this.config.enableMemoryPooling) {
            return;
        }
        this.memoryPools.set('turnRecord', {
            name: 'turnRecord',
            pool: [],
            factory: () => ({
                entityId: '',
                turnNumber: 0,
                roundNumber: 0,
                actions: [],
                startTime: new Date(),
                status: 'completed'
            }),
            reset: (item) => {
                item.entityId = '';
                item.turnNumber = 0;
                item.roundNumber = 0;
                item.actions.length = 0;
                item.startTime = new Date();
                item.status = 'completed';
                delete item.endTime;
                delete item.userId;
            },
            maxSize: 50,
            hits: 0,
            misses: 0
        });
        this.memoryPools.set('chatMessage', {
            name: 'chatMessage',
            pool: [],
            factory: () => ({
                id: '',
                userId: '',
                content: '',
                type: 'party',
                timestamp: Date.now()
            }),
            reset: (item) => {
                item.id = '';
                item.userId = '';
                item.content = '';
                item.type = 'party';
                item.timestamp = Date.now();
                delete item.entityId;
                delete item.recipients;
            },
            maxSize: 100,
            hits: 0,
            misses: 0
        });
        this.optimizerLogger.info('Memory pools initialized', {
            poolCount: this.memoryPools.size,
            pools: Array.from(this.memoryPools.keys())
        });
    }
    optimizeParticipantState(participant) {
        const optimized = { ...participant };
        for (const [key, value] of Object.entries(optimized)) {
            if (value === undefined) {
                delete optimized[key];
            }
        }
        if (optimized.inventory) {
            optimized.inventory = this.optimizeInventory(optimized.inventory);
        }
        return optimized;
    }
    optimizeInventory(inventory) {
        const optimized = { ...inventory };
        if (optimized.items && Array.isArray(optimized.items)) {
            optimized.items = optimized.items.filter(item => item && item.quantity > 0);
        }
        return optimized;
    }
    compressTurnRecord(turn) {
        const compressed = { ...turn };
        if (compressed.actions && compressed.actions.length > 0) {
            compressed.actions = compressed.actions.map(action => ({
                type: action.type,
                entityId: action.entityId,
                ...(action.target && { target: action.target }),
                ...(action.position && { position: action.position })
            }));
        }
        compressed.__compressed = true;
        return compressed;
    }
    isTurnCompressed(turn) {
        return !!turn.__compressed;
    }
    optimizeChatMessage(message) {
        const optimized = { ...message };
        if (optimized.content && optimized.content.length >= this.config.stringDeduplicationThreshold) {
            optimized.content = this.deduplicateString(optimized.content);
        }
        if (optimized.recipients && optimized.recipients.length === 0) {
            delete optimized.recipients;
        }
        return optimized;
    }
    deduplicateStrings(obj, callback) {
        if (typeof obj === 'string') {
            return;
        }
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                if (typeof obj[i] === 'string' && obj[i].length >= this.config.stringDeduplicationThreshold) {
                    const original = obj[i];
                    obj[i] = this.deduplicateString(obj[i]);
                    if (callback)
                        callback(original, obj[i]);
                }
                else if (typeof obj[i] === 'object' && obj[i] !== null) {
                    this.deduplicateStrings(obj[i], callback);
                }
            }
        }
        else if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string' && value.length >= this.config.stringDeduplicationThreshold) {
                    const original = value;
                    obj[key] = this.deduplicateString(value);
                    if (callback)
                        callback(original, obj[key]);
                }
                else if (typeof value === 'object' && value !== null) {
                    this.deduplicateStrings(value, callback);
                }
            }
        }
    }
    deduplicateString(str) {
        if (str.length < this.config.stringDeduplicationThreshold) {
            return str;
        }
        const existing = this.stringPool.get(str);
        if (existing) {
            const count = this.stringUsageCount.get(str) || 0;
            this.stringUsageCount.set(str, count + 1);
            return existing;
        }
        else {
            this.stringPool.set(str, str);
            this.stringUsageCount.set(str, 1);
            return str;
        }
    }
    compactArrays(obj, callback) {
        if (Array.isArray(obj)) {
            const originalLength = obj.length;
            const nullCount = obj.filter(item => item == null).length;
            const nullRatio = nullCount / originalLength;
            if (nullRatio >= this.config.arrayCompactionThreshold) {
                const compacted = obj.filter(item => item != null);
                if (callback)
                    callback(obj, compacted);
                obj.length = 0;
                obj.push(...compacted);
            }
            for (const item of obj) {
                if (typeof item === 'object' && item !== null) {
                    this.compactArrays(item, callback);
                }
            }
        }
        else if (typeof obj === 'object' && obj !== null) {
            for (const value of Object.values(obj)) {
                if (typeof value === 'object' && value !== null) {
                    this.compactArrays(value, callback);
                }
            }
        }
    }
    estimateObjectSize(obj) {
        if (obj === null || obj === undefined) {
            return 0;
        }
        if (typeof obj === 'string') {
            return obj.length * 2;
        }
        if (typeof obj === 'number') {
            return 8;
        }
        if (typeof obj === 'boolean') {
            return 1;
        }
        if (Array.isArray(obj)) {
            return obj.reduce((sum, item) => sum + this.estimateObjectSize(item), 0) + (obj.length * 8);
        }
        if (typeof obj === 'object') {
            let size = 0;
            for (const [key, value] of Object.entries(obj)) {
                size += key.length * 2;
                size += this.estimateObjectSize(value);
                size += 16;
            }
            return size;
        }
        return 0;
    }
    estimateArraySize(arr) {
        return arr.reduce((sum, item) => sum + this.estimateObjectSize(item), 0) + (arr.length * 8);
    }
    addOptimizationResult(result) {
        this.optimizationHistory.push(result);
        if (this.optimizationHistory.length > this.maxHistorySize) {
            this.optimizationHistory.shift();
        }
    }
}
exports.DataStructureOptimizer = DataStructureOptimizer;
//# sourceMappingURL=DataStructureOptimizer.js.map