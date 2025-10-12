import React from 'react';
import { MapToken } from './MapToken';
import { cn } from '@/lib/utils';

interface MapCellProps {
  x: number;
  y: number;
  cell: {
    x: number;
    y: number;
    state: "inbounds" | "outbounds" | "occupied";
    terrainType?: "normal" | "difficult" | "hazardous" | "magical" | "water" | "ice" | "fire" | "acid" | "poison" | "unstable";
    customColor?: string;
  } | null;
  entity?: {
    entityId: string;
    entityType: "playerCharacter" | "npc" | "monster";
    x: number;
    y: number;
    speed: number;
    name: string;
    color: string;
  };
  isSelected: boolean;
  isInMovementRange: boolean;
  isInAOE: boolean;
  isMeasurePoint: boolean;
  isHovered: boolean;
  isInPath: boolean;
  onClick: () => void;
  onHover: () => void;
  cellSize: number;
}

export const MapCell: React.FC<MapCellProps> = React.memo(({
  x,
  y,
  cell,
  entity,
  isSelected,
  isInMovementRange,
  isInAOE,
  isMeasurePoint,
  isHovered,
  isInPath,
  onClick,
  onHover,
  cellSize
}) => {
  // Determine cell appearance based on state and terrain
  const getCellAppearance = () => {
    if (!cell) {
      return {
        backgroundColor: '#f3f4f6', // Light gray for undefined cells
        borderColor: '#d1d5db',
        opacity: 0.5
      };
    }

    if (cell.state === 'outbounds') {
      return {
        backgroundColor: '#374151', // Dark gray for out of bounds
        borderColor: '#1f2937',
        opacity: 0.8
      };
    }

    // Base appearance for inbounds cells
    let backgroundColor = '#ffffff';
    let borderColor = '#d1d5db';
    let opacity = 1;

    // Apply terrain styling
    if (cell.customColor) {
      backgroundColor = cell.customColor;
    } else if (cell.terrainType) {
      switch (cell.terrainType) {
        case 'normal':
          backgroundColor = '#f9fafb';
          break;
        case 'difficult':
          backgroundColor = '#fef3c7'; // Light yellow
          borderColor = '#f59e0b';
          break;
        case 'hazardous':
          backgroundColor = '#fecaca'; // Light red
          borderColor = '#ef4444';
          break;
        case 'water':
          backgroundColor = '#dbeafe'; // Light blue
          borderColor = '#3b82f6';
          break;
        case 'magical':
          backgroundColor = '#f3e8ff'; // Light purple
          borderColor = '#8b5cf6';
          break;
        case 'ice':
          backgroundColor = '#e0f2fe'; // Light cyan
          borderColor = '#06b6d4';
          break;
        case 'fire':
          backgroundColor = '#fed7aa'; // Light orange
          borderColor = '#ea580c';
          break;
        case 'acid':
          backgroundColor = '#dcfce7'; // Light green
          borderColor = '#16a34a';
          break;
        case 'poison':
          backgroundColor = '#fef7cd'; // Light lime
          borderColor = '#84cc16';
          break;
        case 'unstable':
          backgroundColor = '#fce7f3'; // Light pink
          borderColor = '#ec4899';
          break;
      }
    }

    return { backgroundColor, borderColor, opacity };
  };

  // Get visual effects based on state
  const getVisualEffects = () => {
    const effects: string[] = [];

    if (isSelected) {
      effects.push('ring-2 ring-blue-500 ring-offset-2');
    }

    if (isInMovementRange) {
      effects.push('bg-blue-100/50');
    }

    if (isInAOE) {
      effects.push('bg-red-100/50');
    }

    if (isMeasurePoint) {
      effects.push('ring-2 ring-yellow-500 ring-offset-1');
    }

    if (isHovered) {
      effects.push('ring-1 ring-gray-400');
    }

    if (isInPath) {
      effects.push('bg-blue-200/70');
    }

    return effects;
  };

  const appearance = getCellAppearance();
  const effects = getVisualEffects();

  return (
    <div
      className={cn(
        'relative border cursor-pointer transition-all duration-150',
        'hover:shadow-md',
        effects
      )}
      style={{
        backgroundColor: appearance.backgroundColor,
        borderColor: appearance.borderColor,
        opacity: appearance.opacity,
        width: cellSize,
        height: cellSize,
        minWidth: cellSize,
        minHeight: cellSize
      }}
      onClick={onClick}
      onMouseEnter={onHover}
      title={`${x}, ${y}${entity ? ` - ${entity.name}` : ''}${cell?.terrainType ? ` - ${cell.terrainType}` : ''}`}
    >
      {/* Terrain indicator */}
      {cell?.terrainType && cell.terrainType !== 'normal' && (
        <div className="absolute top-0 left-0 w-2 h-2 bg-current opacity-60" />
      )}

      {/* Entity token */}
      {entity && (
        <MapToken
          entity={entity}
          isSelected={isSelected}
          cellSize={cellSize}
        />
      )}

      {/* Movement range indicator */}
      {isInMovementRange && !entity && (
        <div className="absolute inset-0 bg-blue-200/30 rounded-sm" />
      )}

      {/* AoE indicator */}
      {isInAOE && !entity && (
        <div className="absolute inset-0 bg-red-200/30 rounded-sm" />
      )}

      {/* Measure point indicator */}
      {isMeasurePoint && (
        <div className="absolute inset-0 bg-yellow-200/50 rounded-sm flex items-center justify-center">
          <div className="w-1 h-1 bg-yellow-600 rounded-full" />
        </div>
      )}

      {/* Path indicator */}
      {isInPath && !entity && (
        <div className="absolute inset-0 bg-blue-300/50 rounded-sm" />
      )}

      {/* Cell coordinates (for debugging, can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 right-0 text-xs text-gray-400 pointer-events-none">
          {x},{y}
        </div>
      )}
    </div>
  );
});

MapCell.displayName = 'MapCell'; 