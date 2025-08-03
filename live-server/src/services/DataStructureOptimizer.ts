import { logger } from '../utils/logger';
import { GameState, ParticipantState, TurnRecord, ChatMessage } from '../types';

export interface OptimizationConfig {
  // Array optimization
  enableArrayOptimization?: boolean;
  arrayCompactionThreshold?: number; // Percentage of null/undefined elements
  
  // Object optimization
  enableObjectOptimization?: boolean;
  objectPropertyThreshold?: number; // Number of properties before optimization
  
  // String optimization
  enableStringOptimization?: boolean;
  stringDeduplicationThreshold?: number; // Minimum string length for deduplication
  
  // Map/Set optimization
  enableMapOptimization?: boolean;
  mapSizeThreshold?: number; // Size threshold for Map to Object conversion
  
  // History optimization
  enableHistoryOptimization?: boolean;
  maxHistorySize?: number;
  historyCompressionRatio?: number; // Compress when history exceeds this ratio
  
  // Memory pooling
  enableMemoryPooling?: boolean;
  poolSizeThreshold?: number;
}

export interface OptimizationResult {
  type: 'array' | 'object' | 'string' | 'map' | 'history' | 'pool';
  description: string;
  memoryBefore: number;
  memoryAfter: number;
  memorySaved: number;
  itemsProcessed: number;
  timestamp: Date;
}

export interface MemoryPool<T> {
  name: string;
  pool: T[];
  factory: () => T;
  reset: (item: T) => void;
  maxSize: number;
  hits: number;
  misses: number;
}

export class DataStructureOptimizer {
  private readonly config: Required<OptimizationConfig>;
  private readonly optimizerLogger;
  
  // String deduplication
  private stringPool = new Map<string, string>();
  private stringUsageCount = new Map<string, number>();
  
  // Memory pools
  private memoryPools = new Map<string, MemoryPool<any>>();
  
  // Optimization history
  private optimizationHistory: OptimizationResult[] = [];
  private maxHistorySize = 100;

  constructor(config: OptimizationConfig = {}) {
    this.config = {
      enableArrayOptimization: config.enableArrayOptimization ?? true,
      arrayCompactionThreshold: config.arrayCompactionThreshold || 0.3, // 30% empty
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
    
    this.optimizerLogger = logger.child({ component: 'DataStructureOptimizer' });
    
    this.optimizerLogger.info('DataStructureOptimizer initialized', {
      config: this.config
    });
    
    this.initializeMemoryPools();
  }

  /**
   * Optimize a game state for memory efficiency
   */
  public optimizeGameState(gameState: GameState): OptimizationResult[] {
    const results: OptimizationResult[] = [];
    
    try {
      // Optimize participants
      if (this.config.enableObjectOptimization) {
        const participantResult = this.optimizeParticipants(gameState);
        if (participantResult) results.push(participantResult);
      }
      
      // Optimize turn history
      if (this.config.enableHistoryOptimization) {
        const historyResult = this.optimizeTurnHistory(gameState);
        if (historyResult) results.push(historyResult);
      }
      
      // Optimize chat log
      if (this.config.enableHistoryOptimization) {
        const chatResult = this.optimizeChatLog(gameState);
        if (chatResult) results.push(chatResult);
      }
      
      // Optimize strings
      if (this.config.enableStringOptimization) {
        const stringResult = this.optimizeStrings(gameState);
        if (stringResult) results.push(stringResult);
      }
      
      // Optimize arrays
      if (this.config.enableArrayOptimization) {
        const arrayResult = this.optimizeArrays(gameState);
        if (arrayResult) results.push(arrayResult);
      }
      
      // Add to history
      results.forEach(result => this.addOptimizationResult(result));
      
      if (results.length > 0) {
        const totalSaved = results.reduce((sum, r) => sum + r.memorySaved, 0);
        this.optimizerLogger.info('Game state optimization completed', {
          optimizations: results.length,
          totalMemorySaved: totalSaved,
          interactionId: gameState.interactionId
        });
      }
      
    } catch (error) {
      this.optimizerLogger.error('Error optimizing game state', {
        error: error instanceof Error ? error.message : String(error),
        interactionId: gameState.interactionId
      });
    }
    
    return results;
  }

  /**
   * Optimize participants data structure
   */
  public optimizeParticipants(gameState: GameState): OptimizationResult | null {
    if (!this.config.enableObjectOptimization) {
      return null;
    }

    const beforeSize = this.estimateObjectSize(gameState.participants);
    let itemsProcessed = 0;
    
    try {
      // Convert Map to Object if it's more efficient
      if (gameState.participants instanceof Map) {
        const mapSize = gameState.participants.size;
        
        if (mapSize < this.config.mapSizeThreshold) {
          const participantsObj: Record<string, ParticipantState> = {};
          
          for (const [key, value] of gameState.participants) {
            participantsObj[key] = this.optimizeParticipantState(value);
            itemsProcessed++;
          }
          
          // Replace Map with Object
          (gameState as any).participants = participantsObj;
          
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
      } else {
        // Optimize existing object structure
        const participants = gameState.participants as Record<string, ParticipantState>;
        
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
    } catch (error) {
      this.optimizerLogger.error('Error optimizing participants', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return null;
  }

  /**
   * Optimize turn history
   */
  public optimizeTurnHistory(gameState: GameState): OptimizationResult | null {
    if (!this.config.enableHistoryOptimization || !gameState.turnHistory) {
      return null;
    }

    const beforeSize = this.estimateArraySize(gameState.turnHistory);
    const originalLength = gameState.turnHistory.length;
    
    try {
      // Trim history if too long
      if (originalLength > this.config.maxHistorySize) {
        const excessCount = originalLength - this.config.maxHistorySize;
        gameState.turnHistory.splice(0, excessCount);
      }
      
      // Compress old entries
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
    } catch (error) {
      this.optimizerLogger.error('Error optimizing turn history', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return null;
  }

  /**
   * Optimize chat log
   */
  public optimizeChatLog(gameState: GameState): OptimizationResult | null {
    if (!this.config.enableHistoryOptimization || !gameState.chatLog) {
      return null;
    }

    const beforeSize = this.estimateArraySize(gameState.chatLog);
    const originalLength = gameState.chatLog.length;
    
    try {
      // Trim chat log if too long
      const maxChatSize = Math.floor(this.config.maxHistorySize * 0.5); // Chat gets half the history size
      
      if (originalLength > maxChatSize) {
        const excessCount = originalLength - maxChatSize;
        gameState.chatLog.splice(0, excessCount);
      }
      
      // Optimize chat messages
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
    } catch (error) {
      this.optimizerLogger.error('Error optimizing chat log', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return null;
  }

  /**
   * Optimize strings through deduplication
   */
  public optimizeStrings(obj: any): OptimizationResult | null {
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
    } catch (error) {
      this.optimizerLogger.error('Error optimizing strings', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return null;
  }

  /**
   * Optimize arrays by compacting sparse arrays
   */
  public optimizeArrays(obj: any): OptimizationResult | null {
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
    } catch (error) {
      this.optimizerLogger.error('Error optimizing arrays', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return null;
  }

  /**
   * Get or create an object from memory pool
   */
  public getFromPool<T>(poolName: string): T | null {
    if (!this.config.enableMemoryPooling) {
      return null;
    }

    const pool = this.memoryPools.get(poolName) as MemoryPool<T> | undefined;
    if (!pool) {
      return null;
    }

    if (pool.pool.length > 0) {
      const item = pool.pool.pop()!;
      pool.hits++;
      return item;
    } else {
      pool.misses++;
      return pool.factory();
    }
  }

  /**
   * Return an object to memory pool
   */
  public returnToPool<T>(poolName: string, item: T): boolean {
    if (!this.config.enableMemoryPooling) {
      return false;
    }

    const pool = this.memoryPools.get(poolName) as MemoryPool<T> | undefined;
    if (!pool || pool.pool.length >= pool.maxSize) {
      return false;
    }

    try {
      pool.reset(item);
      pool.pool.push(item);
      return true;
    } catch (error) {
      this.optimizerLogger.error('Error returning item to pool', {
        poolName,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Get memory pool statistics
   */
  public getPoolStats(): { [poolName: string]: { size: number; maxSize: number; hits: number; misses: number; hitRate: number } } {
    const stats: any = {};
    
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

  /**
   * Get optimization history
   */
  public getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  /**
   * Clear optimization history and reset pools
   */
  public reset(): void {
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

  /**
   * Shutdown the optimizer
   */
  public shutdown(): void {
    this.optimizerLogger.info('Shutting down DataStructureOptimizer');
    
    this.reset();
    this.memoryPools.clear();
    
    this.optimizerLogger.info('DataStructureOptimizer shutdown completed');
  }

  /**
   * Initialize memory pools for common objects
   */
  private initializeMemoryPools(): void {
    if (!this.config.enableMemoryPooling) {
      return;
    }

    // Turn record pool
    this.memoryPools.set('turnRecord', {
      name: 'turnRecord',
      pool: [],
      factory: () => ({
        entityId: '',
        turnNumber: 0,
        roundNumber: 0,
        actions: [],
        startTime: new Date(),
        status: 'completed' as const
      }),
      reset: (item: any) => {
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

    // Chat message pool
    this.memoryPools.set('chatMessage', {
      name: 'chatMessage',
      pool: [],
      factory: () => ({
        id: '',
        userId: '',
        content: '',
        type: 'party' as const,
        timestamp: Date.now()
      }),
      reset: (item: any) => {
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

  /**
   * Optimize a participant state object
   */
  private optimizeParticipantState(participant: ParticipantState): ParticipantState {
    // Remove undefined properties
    const optimized = { ...participant };
    
    for (const [key, value] of Object.entries(optimized)) {
      if (value === undefined) {
        delete (optimized as any)[key];
      }
    }
    
    // Optimize nested objects
    if (optimized.inventory) {
      optimized.inventory = this.optimizeInventory(optimized.inventory);
    }
    
    return optimized;
  }

  /**
   * Optimize inventory structure
   */
  private optimizeInventory(inventory: any): any {
    const optimized = { ...inventory };
    
    // Compact items array
    if (optimized.items && Array.isArray(optimized.items)) {
      optimized.items = optimized.items.filter(item => item && item.quantity > 0);
    }
    
    return optimized;
  }

  /**
   * Compress a turn record for long-term storage
   */
  private compressTurnRecord(turn: TurnRecord): TurnRecord {
    const compressed = { ...turn };
    
    // Compress actions array - keep only essential data
    if (compressed.actions && compressed.actions.length > 0) {
      compressed.actions = compressed.actions.map(action => ({
        type: action.type,
        entityId: action.entityId,
        // Remove detailed parameters for old turns
        ...(action.target && { target: action.target }),
        ...(action.position && { position: action.position })
      }));
    }
    
    // Mark as compressed
    (compressed as any).__compressed = true;
    
    return compressed;
  }

  /**
   * Check if a turn record is compressed
   */
  private isTurnCompressed(turn: TurnRecord): boolean {
    return !!(turn as any).__compressed;
  }

  /**
   * Optimize a chat message
   */
  private optimizeChatMessage(message: ChatMessage): ChatMessage {
    const optimized = { ...message };
    
    // Deduplicate content string
    if (optimized.content && optimized.content.length >= this.config.stringDeduplicationThreshold) {
      optimized.content = this.deduplicateString(optimized.content);
    }
    
    // Remove empty recipients array
    if (optimized.recipients && optimized.recipients.length === 0) {
      delete optimized.recipients;
    }
    
    return optimized;
  }

  /**
   * Deduplicate strings recursively
   */
  private deduplicateStrings(obj: any, callback?: (original: string, deduplicated: string) => void): void {
    if (typeof obj === 'string') {
      return;
    }
    
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'string' && obj[i].length >= this.config.stringDeduplicationThreshold) {
          const original = obj[i];
          obj[i] = this.deduplicateString(obj[i]);
          if (callback) callback(original, obj[i]);
        } else if (typeof obj[i] === 'object' && obj[i] !== null) {
          this.deduplicateStrings(obj[i], callback);
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.length >= this.config.stringDeduplicationThreshold) {
          const original = value;
          obj[key] = this.deduplicateString(value);
          if (callback) callback(original, obj[key]);
        } else if (typeof value === 'object' && value !== null) {
          this.deduplicateStrings(value, callback);
        }
      }
    }
  }

  /**
   * Deduplicate a single string
   */
  private deduplicateString(str: string): string {
    if (str.length < this.config.stringDeduplicationThreshold) {
      return str;
    }

    const existing = this.stringPool.get(str);
    if (existing) {
      // Increment usage count
      const count = this.stringUsageCount.get(str) || 0;
      this.stringUsageCount.set(str, count + 1);
      return existing;
    } else {
      // Add to pool
      this.stringPool.set(str, str);
      this.stringUsageCount.set(str, 1);
      return str;
    }
  }

  /**
   * Compact sparse arrays recursively
   */
  private compactArrays(obj: any, callback?: (original: any[], compacted: any[]) => void): void {
    if (Array.isArray(obj)) {
      const originalLength = obj.length;
      const nullCount = obj.filter(item => item == null).length;
      const nullRatio = nullCount / originalLength;
      
      if (nullRatio >= this.config.arrayCompactionThreshold) {
        const compacted = obj.filter(item => item != null);
        if (callback) callback(obj, compacted);
        
        // Replace array contents
        obj.length = 0;
        obj.push(...compacted);
      }
      
      // Recursively process array elements
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          this.compactArrays(item, callback);
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
          this.compactArrays(value, callback);
        }
      }
    }
  }

  /**
   * Estimate object size in bytes (rough approximation)
   */
  private estimateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) {
      return 0;
    }
    
    if (typeof obj === 'string') {
      return obj.length * 2; // Rough estimate for UTF-16
    }
    
    if (typeof obj === 'number') {
      return 8; // 64-bit number
    }
    
    if (typeof obj === 'boolean') {
      return 1;
    }
    
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + this.estimateObjectSize(item), 0) + (obj.length * 8); // Array overhead
    }
    
    if (typeof obj === 'object') {
      let size = 0;
      for (const [key, value] of Object.entries(obj)) {
        size += key.length * 2; // Key size
        size += this.estimateObjectSize(value); // Value size
        size += 16; // Property overhead
      }
      return size;
    }
    
    return 0;
  }

  /**
   * Estimate array size in bytes
   */
  private estimateArraySize(arr: any[]): number {
    return arr.reduce((sum, item) => sum + this.estimateObjectSize(item), 0) + (arr.length * 8);
  }

  /**
   * Add optimization result to history
   */
  private addOptimizationResult(result: OptimizationResult): void {
    this.optimizationHistory.push(result);
    
    if (this.optimizationHistory.length > this.maxHistorySize) {
      this.optimizationHistory.shift();
    }
  }
}