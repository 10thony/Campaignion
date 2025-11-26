import React, { useState, useCallback, useMemo } from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import { MapCell } from './MapCell';
import { MapToken } from './MapToken';
import { cn } from '@/lib/utils';

interface MapGridProps {
  map: {
    _id: Id<"maps">;
    width: number;
    height: number;
    cells: Array<{
      x: number;
      y: number;
      state: "inbounds" | "outbounds" | "occupied";
      terrainType?: "normal" | "difficult" | "hazardous" | "magical" | "water" | "ice" | "fire" | "acid" | "poison" | "unstable";
      customColor?: string;
    }>;
  };
  mapInstance: {
    _id: Id<"mapInstances">;
    currentPositions: Array<{
      entityId: string;
      entityType: "playerCharacter" | "npc" | "monster";
      x: number;
      y: number;
      speed: number;
      name: string;
      color: string;
    }>;
  };
  selectedTokenId: string | null;
  hoveredCell: { x: number; y: number } | null;
  movementPreview: {
    path: Array<{ x: number; y: number }>;
    cost: number;
    valid: boolean;
  } | null;
  measurePoints: Array<{ x: number; y: number }> | null;
  aoeTemplate: {
    type: 'sphere' | 'cube' | 'cone' | 'line';
    size: number;
    center: { x: number; y: number };
    direction?: number;
  } | null;
  onCellClick: (x: number, y: number) => void;
  onCellHover: (x: number, y: number) => void;
  isDM: boolean;
  cellSize?: number;
}

export const MapGrid: React.FC<MapGridProps> = ({
  map,
  mapInstance,
  selectedTokenId,
  hoveredCell,
  movementPreview,
  measurePoints,
  aoeTemplate,
  onCellClick,
  onCellHover,
  isDM,
  cellSize = 40
}) => {
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Create a 2D grid from the cells array for easier access
  const grid = useMemo(() => {
    const grid: Array<Array<typeof map.cells[0] | null>> = [];
    for (let y = 0; y < map.height; y++) {
      grid[y] = [];
      for (let x = 0; x < map.width; x++) {
        grid[y][x] = null;
      }
    }
    
    map.cells.forEach(cell => {
      if (cell.y < map.height && cell.x < map.width) {
        grid[cell.y][cell.x] = cell;
      }
    });
    
    return grid;
  }, [map.cells, map.width, map.height]);

  // Create a map of entity positions for quick lookup
  const entityPositions = useMemo(() => {
    const positions = new Map<string, typeof mapInstance.currentPositions[0]>();
    mapInstance.currentPositions.forEach(entity => {
      positions.set(`${entity.x},${entity.y}`, entity);
    });
    return positions;
  }, [mapInstance.currentPositions]);

  // Calculate movement range cells
  const movementRangeCells = useMemo(() => {
    if (!movementPreview || !selectedTokenId) return new Set<string>();
    
    const range = movementPreview.cost;
    const cells = new Set<string>();
    
    // Simple flood fill for movement range (can be enhanced with proper pathfinding)
    const token = mapInstance.currentPositions.find(pos => pos.entityId === selectedTokenId);
    if (!token) return cells;
    
    for (let y = Math.max(0, token.y - range); y <= Math.min(map.height - 1, token.y + range); y++) {
      for (let x = Math.max(0, token.x - range); x <= Math.min(map.width - 1, token.x + range); x++) {
        const distance = Math.abs(x - token.x) + Math.abs(y - token.y);
        if (distance <= range) {
          cells.add(`${x},${y}`);
        }
      }
    }
    
    return cells;
  }, [movementPreview, selectedTokenId, mapInstance.currentPositions, map.height, map.width]);

  // Calculate AoE affected cells
  const aoeCells = useMemo(() => {
    if (!aoeTemplate) return new Set<string>();
    
    const cells = new Set<string>();
    const { type, size, center } = aoeTemplate;
    
    switch (type) {
      case 'sphere':
        // Circle around center
        for (let y = Math.max(0, center.y - size); y <= Math.min(map.height - 1, center.y + size); y++) {
          for (let x = Math.max(0, center.x - size); x <= Math.min(map.width - 1, center.x + size); x++) {
            const distance = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
            if (distance <= size) {
              cells.add(`${x},${y}`);
            }
          }
        }
        break;
        
      case 'cube':
        // Square around center
        for (let y = Math.max(0, center.y - size); y <= Math.min(map.height - 1, center.y + size); y++) {
          for (let x = Math.max(0, center.x - size); x <= Math.min(map.width - 1, center.x + size); x++) {
            cells.add(`${x},${y}`);
          }
        }
        break;
        
      case 'cone':
        // Cone shape (simplified)
        if (aoeTemplate.direction !== undefined) {
          const angle = aoeTemplate.direction;
          for (let y = Math.max(0, center.y - size); y <= Math.min(map.height - 1, center.y + size); y++) {
            for (let x = Math.max(0, center.x - size); x <= Math.min(map.width - 1, center.x + size); x++) {
              const distance = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
              if (distance <= size) {
                // Simple cone check (can be enhanced)
                const cellAngle = Math.atan2(y - center.y, x - center.x);
                const angleDiff = Math.abs(cellAngle - angle);
                if (angleDiff <= Math.PI / 4) { // 45-degree cone
                  cells.add(`${x},${y}`);
                }
              }
            }
          }
        }
        break;
        
      case 'line':
        // Line shape (simplified)
        if (aoeTemplate.direction !== undefined) {
          const angle = aoeTemplate.direction;
          for (let i = 0; i < size; i++) {
            const x = Math.round(center.x + Math.cos(angle) * i);
            const y = Math.round(center.y + Math.sin(angle) * i);
            if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
              cells.add(`${x},${y}`);
            }
          }
        }
        break;
    }
    
    return cells;
  }, [aoeTemplate, map.width, map.height]);

  // Pan and zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  // Calculate grid container styles
  const gridStyle = {
    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
    transformOrigin: '0 0',
    width: map.width * cellSize,
    height: map.height * cellSize,
    display: 'grid',
    gridTemplateColumns: `repeat(${map.width}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${map.height}, ${cellSize}px)`,
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Grid Container */}
      <div 
        className="absolute"
        style={gridStyle}
      >
        {/* Render cells */}
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const entity = entityPositions.get(`${x},${y}`);
            const isInMovementRange = movementRangeCells.has(`${x},${y}`);
            const isInAOE = aoeCells.has(`${x},${y}`);
            const isMeasurePoint = measurePoints?.some(point => point.x === x && point.y === y);
            const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
            
            return (
              <MapCell
                key={`${x},${y}`}
                x={x}
                y={y}
                cell={cell ? {
                  ...cell,
                  portalLink: cell.portalLink ? {
                    targetMapId: cell.portalLink.targetMapId as string,
                    targetX: cell.portalLink.targetX,
                    targetY: cell.portalLink.targetY,
                    label: cell.portalLink.label
                  } : undefined
                } : null}
                entity={entity}
                isSelected={entity?.entityId === selectedTokenId}
                isInMovementRange={isInMovementRange}
                isInAOE={isInAOE}
                isMeasurePoint={isMeasurePoint}
                isHovered={isHovered}
                isInPath={movementPreview?.path.some(point => point.x === x && point.y === y)}
                onClick={() => onCellClick(x, y)}
                onHover={() => onCellHover(x, y)}
                cellSize={cellSize}
              />
            );
          })
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
          className="w-8 h-8 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
          className="w-8 h-8 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center justify-center"
        >
          −
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="w-8 h-8 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center justify-center text-xs"
        >
          ⌂
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
        <div>Left click: Select/Move</div>
        <div>Ctrl+Left drag: Pan</div>
        <div>Scroll: Zoom</div>
      </div>
    </div>
  );
}; 