import React from 'react';
import { MapToken } from './MapToken';
import { cn } from '@/lib/utils';
import { useTheme } from '../theme/ThemeProvider';

interface MapCellProps {
  x: number;
  y: number;
  cell: {
    x: number;
    y: number;
    state: "inbounds" | "outbounds" | "occupied";
    terrainType?: "normal" | "difficult" | "hazardous" | "magical" | "water" | "ice" | "fire" | "acid" | "poison" | "unstable";
    customColor?: string;
    portalLink?: {
      targetMapId: string;
      targetX: number;
      targetY: number;
      label?: string;
    };
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
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  // Determine cell appearance based on state and terrain
  const getCellAppearance = () => {
    if (!cell) {
      return {
        backgroundColor: isDark ? '#251f33' : '#f3f4f6', // Dusty Grape 800 / Light gray
        borderColor: isDark ? '#382f4c' : '#d1d5db',
        opacity: 0.5
      };
    }

    if (cell.state === 'outbounds') {
      return {
        backgroundColor: isDark ? '#131019' : '#374151', // Dusty Grape 900 / Dark gray
        borderColor: isDark ? '#251f33' : '#1f2937',
        opacity: 0.8
      };
    }

    // Base appearance for inbounds cells
    let backgroundColor = isDark ? '#251f33' : '#ffffff';
    let borderColor = isDark ? '#382f4c' : '#ded9e8';
    let opacity = 1;

    // Apply terrain styling using new palette
    if (cell.customColor) {
      backgroundColor = cell.customColor;
    } else if (cell.terrainType) {
      switch (cell.terrainType) {
        case 'normal':
          backgroundColor = isDark ? '#251f33' : '#f9fafb';
          break;
        case 'difficult':
          backgroundColor = isDark ? 'rgba(244, 13, 102, 0.2)' : 'rgba(183, 9, 76, 0.15)'; // Cherry Rose
          borderColor = isDark ? '#f40d66' : '#b7094c';
          break;
        case 'hazardous':
          backgroundColor = isDark ? 'rgba(214, 35, 118, 0.2)' : 'rgba(160, 26, 88, 0.15)'; // Dark Raspberry
          borderColor = isDark ? '#d62376' : '#a01a58';
          break;
        case 'water':
          backgroundColor = isDark ? 'rgba(31, 174, 218, 0.2)' : 'rgba(23, 128, 161, 0.15)'; // Cerulean
          borderColor = isDark ? '#1faeda' : '#1780a1';
          break;
        case 'magical':
          backgroundColor = isDark ? 'rgba(186, 59, 135, 0.2)' : 'rgba(137, 43, 100, 0.15)'; // Royal Plum
          borderColor = isDark ? '#ba3b87' : '#892b64';
          break;
        case 'ice':
          backgroundColor = isDark ? 'rgba(0, 201, 241, 0.2)' : 'rgba(0, 145, 173, 0.15)'; // Pacific Cyan
          borderColor = isDark ? '#00c9f1' : '#0091ad';
          break;
        case 'fire':
          backgroundColor = isDark ? 'rgba(244, 13, 102, 0.3)' : 'rgba(183, 9, 76, 0.25)'; // Cherry Rose intense
          borderColor = isDark ? '#f40d66' : '#b7094c';
          break;
        case 'acid':
          backgroundColor = isDark ? 'rgba(53, 221, 255, 0.2)' : 'rgba(0, 201, 241, 0.15)'; // Pacific Cyan 200/300
          borderColor = isDark ? '#35ddff' : '#00c9f1';
          break;
        case 'poison':
          backgroundColor = isDark ? 'rgba(158, 83, 155, 0.2)' : 'rgba(114, 60, 112, 0.15)'; // Velvet Purple
          borderColor = isDark ? '#9e539b' : '#723c70';
          break;
        case 'unstable':
          backgroundColor = isDark ? 'rgba(122, 103, 162, 0.2)' : 'rgba(92, 77, 125, 0.15)'; // Dusty Grape
          borderColor = isDark ? '#7a67a2' : '#5c4d7d';
          break;
      }
    }

    return { backgroundColor, borderColor, opacity };
  };

  // Get visual effects based on state - using new palette colors
  const getVisualEffects = () => {
    const effects: string[] = [];

    if (isSelected) {
      effects.push('ring-2 ring-pacific-cyan-500 ring-offset-2');
    }

    if (isInMovementRange) {
      effects.push(isDark ? 'bg-pacific-cyan-300/30' : 'bg-pacific-cyan-400/30');
    }

    if (isInAOE) {
      effects.push(isDark ? 'bg-dark-raspberry-300/30' : 'bg-cherry-rose-400/30');
    }

    if (isMeasurePoint) {
      effects.push('ring-2 ring-rich-cerulean-500 ring-offset-1');
    }

    if (isHovered) {
      effects.push('ring-1 ring-dusty-grape-400');
    }

    if (isInPath) {
      effects.push(isDark ? 'bg-cerulean-300/40' : 'bg-cerulean-400/40');
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
        <div className={`absolute inset-0 rounded-sm ${isDark ? 'bg-pacific-cyan-300/30' : 'bg-pacific-cyan-400/20'}`} />
      )}

      {/* AoE indicator */}
      {isInAOE && !entity && (
        <div className={`absolute inset-0 rounded-sm ${isDark ? 'bg-dark-raspberry-300/30' : 'bg-cherry-rose-400/20'}`} />
      )}

      {/* Measure point indicator */}
      {isMeasurePoint && (
        <div className={`absolute inset-0 rounded-sm flex items-center justify-center ${isDark ? 'bg-rich-cerulean-300/40' : 'bg-rich-cerulean-400/30'}`}>
          <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-rich-cerulean-300' : 'bg-rich-cerulean-600'}`} />
        </div>
      )}

      {/* Path indicator */}
      {isInPath && !entity && (
        <div className={`absolute inset-0 rounded-sm ${isDark ? 'bg-cerulean-300/40' : 'bg-cerulean-400/30'}`} />
      )}

      {/* Portal link indicator */}
      {cell?.portalLink && (
        <div className={`absolute inset-0 rounded-sm border-2 flex items-center justify-center ${isDark ? 'bg-royal-plum-300/30 border-royal-plum-400' : 'bg-royal-plum-50/50 border-royal-plum-500'}`}>
          <div className={`text-xs font-bold ${isDark ? 'text-royal-plum-300' : 'text-royal-plum-600'}`}>🚪</div>
          {cell.portalLink.label && (
            <div className={`absolute -top-6 left-0 right-0 text-[10px] text-center whitespace-nowrap pointer-events-none ${isDark ? 'text-royal-plum-300' : 'text-royal-plum-600'}`}>
              {cell.portalLink.label}
            </div>
          )}
        </div>
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