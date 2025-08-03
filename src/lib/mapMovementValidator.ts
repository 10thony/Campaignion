// Map Movement Validation Utilities for Live Interactions

interface Position {
  x: number;
  y: number;
}

interface MapState {
  width: number;
  height: number;
  entities: Record<string, { entityId: string; position: Position; facing?: number }>;
  obstacles: Position[];
  terrain: Array<{ position: Position; type: string; properties: Record<string, any> }>;
}

interface ParticipantState {
  entityId: string;
  entityType: 'playerCharacter' | 'npc' | 'monster';
  userId?: string;
  currentHP: number;
  maxHP: number;
  position: Position;
  conditions: Array<{
    id: string;
    name: string;
    duration: number;
    effects: Record<string, any>;
  }>;
  inventory: {
    items: Array<{
      id: string;
      itemId: string;
      quantity: number;
      properties: Record<string, any>;
    }>;
    equippedItems: Record<string, string>;
    capacity: number;
  };
  availableActions: Array<{
    id: string;
    name: string;
    type: 'move' | 'attack' | 'useItem' | 'cast' | 'interact';
    available: boolean;
    requirements: Array<{
      type: string;
      value: any;
      met: boolean;
    }>;
  }>;
  turnStatus: 'waiting' | 'active' | 'completed' | 'skipped';
}

export interface MovementValidationResult {
  isValid: boolean;
  reason?: string;
  cost?: number;
  path?: Position[];
}

export interface AttackValidationResult {
  isValid: boolean;
  reason?: string;
  range?: number;
  hasLineOfSight?: boolean;
}

export class MapMovementValidator {
  /**
   * Validates if a movement from one position to another is legal
   */
  static validateMovement(
    from: Position,
    to: Position,
    mapState: MapState,
    participant: ParticipantState,
    maxMovementRange: number = 6
  ): MovementValidationResult {
    // Check bounds
    if (!this.isWithinBounds(to, mapState)) {
      return {
        isValid: false,
        reason: 'Destination is outside map boundaries',
      };
    }

    // Check if destination is occupied
    if (this.isPositionOccupied(to, mapState, participant.entityId)) {
      return {
        isValid: false,
        reason: 'Destination is occupied by another entity',
      };
    }

    // Check if destination is blocked by obstacles
    if (this.isPositionBlocked(to, mapState)) {
      return {
        isValid: false,
        reason: 'Destination is blocked by an obstacle',
      };
    }

    // Calculate movement cost
    const path = this.findPath(from, to, mapState, participant.entityId);
    if (!path) {
      return {
        isValid: false,
        reason: 'No valid path to destination',
      };
    }

    const movementCost = this.calculateMovementCost(path, mapState);
    
    // Check if movement is within range
    if (movementCost > maxMovementRange) {
      return {
        isValid: false,
        reason: `Movement cost (${movementCost}) exceeds maximum range (${maxMovementRange})`,
        cost: movementCost,
      };
    }

    // Check for movement-restricting conditions
    const movementRestrictions = this.getMovementRestrictions(participant);
    if (movementRestrictions.length > 0) {
      return {
        isValid: false,
        reason: `Movement restricted by conditions: ${movementRestrictions.join(', ')}`,
      };
    }

    return {
      isValid: true,
      cost: movementCost,
      path,
    };
  }

  /**
   * Validates if an attack from one position to another is legal
   */
  static validateAttack(
    from: Position,
    to: Position,
    mapState: MapState,
    participant: ParticipantState,
    attackRange: number = 5
  ): AttackValidationResult {
    // Check if target position has an entity
    const targetEntity = Object.values(mapState.entities).find(
      entity => entity.position.x === to.x && entity.position.y === to.y
    );

    if (!targetEntity) {
      return {
        isValid: false,
        reason: 'No target at specified position',
      };
    }

    // Can't attack self
    if (targetEntity.entityId === participant.entityId) {
      return {
        isValid: false,
        reason: 'Cannot attack yourself',
      };
    }

    // Calculate distance
    const distance = this.calculateDistance(from, to);
    
    if (distance > attackRange) {
      return {
        isValid: false,
        reason: `Target is out of range (${distance} > ${attackRange})`,
        range: distance,
      };
    }

    // Check line of sight
    const hasLineOfSight = this.hasLineOfSight(from, to, mapState);
    if (!hasLineOfSight) {
      return {
        isValid: false,
        reason: 'No line of sight to target',
        range: distance,
        hasLineOfSight: false,
      };
    }

    // Check for attack-restricting conditions
    const attackRestrictions = this.getAttackRestrictions(participant);
    if (attackRestrictions.length > 0) {
      return {
        isValid: false,
        reason: `Attack restricted by conditions: ${attackRestrictions.join(', ')}`,
      };
    }

    return {
      isValid: true,
      range: distance,
      hasLineOfSight: true,
    };
  }

  /**
   * Gets all valid movement positions for a participant
   */
  static getValidMovementPositions(
    participant: ParticipantState,
    mapState: MapState,
    maxMovementRange: number = 6
  ): Set<string> {
    const validPositions = new Set<string>();
    const currentPos = participant.position;

    // Check all positions within potential range
    for (let x = 0; x < mapState.width; x++) {
      for (let y = 0; y < mapState.height; y++) {
        const targetPos = { x, y };
        const validation = this.validateMovement(
          currentPos,
          targetPos,
          mapState,
          participant,
          maxMovementRange
        );

        if (validation.isValid) {
          validPositions.add(`${x},${y}`);
        }
      }
    }

    return validPositions;
  }

  /**
   * Gets all valid attack targets for a participant
   */
  static getValidAttackTargets(
    participant: ParticipantState,
    mapState: MapState,
    attackRange: number = 5
  ): Set<string> {
    const validTargets = new Set<string>();
    const currentPos = participant.position;

    Object.values(mapState.entities).forEach(entity => {
      if (entity.entityId !== participant.entityId) {
        const validation = this.validateAttack(
          currentPos,
          entity.position,
          mapState,
          participant,
          attackRange
        );

        if (validation.isValid) {
          validTargets.add(`${entity.position.x},${entity.position.y}`);
        }
      }
    });

    return validTargets;
  }

  /**
   * Checks if a position is within map bounds
   */
  private static isWithinBounds(position: Position, mapState: MapState): boolean {
    return (
      position.x >= 0 &&
      position.x < mapState.width &&
      position.y >= 0 &&
      position.y < mapState.height
    );
  }

  /**
   * Checks if a position is occupied by another entity
   */
  private static isPositionOccupied(
    position: Position,
    mapState: MapState,
    excludeEntityId?: string
  ): boolean {
    return Object.values(mapState.entities).some(
      entity =>
        entity.entityId !== excludeEntityId &&
        entity.position.x === position.x &&
        entity.position.y === position.y
    );
  }

  /**
   * Checks if a position is blocked by obstacles
   */
  private static isPositionBlocked(position: Position, mapState: MapState): boolean {
    return mapState.obstacles.some(
      obstacle => obstacle.x === position.x && obstacle.y === position.y
    );
  }

  /**
   * Finds a path between two positions using A* algorithm
   */
  private static findPath(
    from: Position,
    to: Position,
    mapState: MapState,
    entityId: string
  ): Position[] | null {
    // Simple pathfinding - for now just check if direct path is clear
    // In a full implementation, this would use A* or similar algorithm
    
    const path: Position[] = [];
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    
    let current = { ...from };
    path.push({ ...current });
    
    while (current.x !== to.x || current.y !== to.y) {
      // Move towards target
      if (current.x !== to.x) {
        current.x += dx;
      } else if (current.y !== to.y) {
        current.y += dy;
      }
      
      // Check if this step is valid
      if (
        !this.isWithinBounds(current, mapState) ||
        this.isPositionBlocked(current, mapState) ||
        (current.x !== to.x || current.y !== to.y) && this.isPositionOccupied(current, mapState, entityId)
      ) {
        return null; // Path blocked
      }
      
      path.push({ ...current });
    }
    
    return path;
  }

  /**
   * Calculates movement cost for a path considering terrain
   */
  private static calculateMovementCost(path: Position[], mapState: MapState): number {
    let totalCost = 0;
    
    for (let i = 1; i < path.length; i++) {
      const position = path[i];
      let stepCost = 1; // Base movement cost
      
      // Check for terrain modifiers
      const terrain = mapState.terrain.find(
        t => t.position.x === position.x && t.position.y === position.y
      );
      
      if (terrain) {
        const modifier = this.getTerrainMovementModifier(terrain.type);
        stepCost += Math.abs(modifier); // Terrain increases movement cost
      }
      
      totalCost += stepCost;
    }
    
    return totalCost;
  }

  /**
   * Calculates Manhattan distance between two positions
   */
  private static calculateDistance(from: Position, to: Position): number {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }

  /**
   * Checks if there's a clear line of sight between two positions
   */
  private static hasLineOfSight(from: Position, to: Position, mapState: MapState): boolean {
    // Bresenham's line algorithm to check for obstacles along the line
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1;
    const sy = from.y < to.y ? 1 : -1;
    let err = dx - dy;
    
    let x = from.x;
    let y = from.y;
    
    while (true) {
      // Check if current position blocks line of sight
      if (x !== from.x || y !== from.y) { // Don't check starting position
        if (this.isPositionBlocked({ x, y }, mapState)) {
          return false;
        }
      }
      
      if (x === to.x && y === to.y) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    
    return true;
  }

  /**
   * Gets movement restrictions from participant conditions
   */
  private static getMovementRestrictions(participant: ParticipantState): string[] {
    const restrictions: string[] = [];
    
    participant.conditions.forEach(condition => {
      // Check for movement-restricting conditions
      if (condition.name.toLowerCase().includes('paralyzed')) {
        restrictions.push('Paralyzed');
      } else if (condition.name.toLowerCase().includes('restrained')) {
        restrictions.push('Restrained');
      } else if (condition.name.toLowerCase().includes('grappled')) {
        restrictions.push('Grappled');
      } else if (condition.name.toLowerCase().includes('stunned')) {
        restrictions.push('Stunned');
      }
    });
    
    return restrictions;
  }

  /**
   * Gets attack restrictions from participant conditions
   */
  private static getAttackRestrictions(participant: ParticipantState): string[] {
    const restrictions: string[] = [];
    
    participant.conditions.forEach(condition => {
      // Check for attack-restricting conditions
      if (condition.name.toLowerCase().includes('paralyzed')) {
        restrictions.push('Paralyzed');
      } else if (condition.name.toLowerCase().includes('stunned')) {
        restrictions.push('Stunned');
      } else if (condition.name.toLowerCase().includes('unconscious')) {
        restrictions.push('Unconscious');
      }
    });
    
    return restrictions;
  }

  /**
   * Gets terrain movement modifier
   */
  private static getTerrainMovementModifier(terrainType: string): number {
    switch (terrainType.toLowerCase()) {
      case 'soft':
        return -1;
      case 'rough':
        return -3;
      case 'intense':
        return -5;
      case 'brutal':
        return -7;
      case 'deadly':
        return -9;
      default:
        return 0;
    }
  }
}

/**
 * Utility functions for map-based interactions
 */
export const MapUtils = {
  /**
   * Converts position to string key
   */
  positionToKey: (position: Position): string => `${position.x},${position.y}`,

  /**
   * Converts string key to position
   */
  keyToPosition: (key: string): Position => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  },

  /**
   * Gets adjacent positions (4-directional)
   */
  getAdjacentPositions: (position: Position): Position[] => [
    { x: position.x - 1, y: position.y },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y - 1 },
    { x: position.x, y: position.y + 1 },
  ],

  /**
   * Gets all positions within a certain range
   */
  getPositionsInRange: (center: Position, range: number): Position[] => {
    const positions: Position[] = [];
    
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance <= range && distance > 0) {
          positions.push({
            x: center.x + dx,
            y: center.y + dy,
          });
        }
      }
    }
    
    return positions;
  },

  /**
   * Checks if two positions are adjacent
   */
  areAdjacent: (pos1: Position, pos2: Position): boolean => {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  },

  /**
   * Gets the direction from one position to another
   */
  getDirection: (from: Position, to: Position): string => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'east' : 'west';
    } else {
      return dy > 0 ? 'south' : 'north';
    }
  },
};