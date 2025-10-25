import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useDrop } from "react-dnd";
import { ItemTypes, DragItem } from "../../lib/dndTypes";
import { BattleToken } from "./BattleToken";
import { TerrainKey } from "./TerrainKey";
import { CombatActionSelector } from "./CombatActionSelector";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { useRef, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "../ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

// Terrain color mapping
const terrainColors: Record<string, string> = {
  normal: "rgba(255, 255, 255, 0.1)",
  difficult: "rgba(139, 69, 19, 0.3)", // brown
  hazardous: "rgba(255, 165, 0, 0.3)", // orange
  magical: "rgba(147, 51, 234, 0.3)", // purple
  water: "rgba(59, 130, 246, 0.4)", // blue
  ice: "rgba(191, 219, 254, 0.5)", // light blue
  fire: "rgba(239, 68, 68, 0.4)", // red
  acid: "rgba(132, 204, 22, 0.4)", // lime
  poison: "rgba(34, 197, 94, 0.4)", // green
  unstable: "rgba(156, 163, 175, 0.4)", // gray
};

export function MapBoard({ mapId }: { mapId: string }) {
  const map = useQuery(api.battleMaps.get, { id: mapId as Id<"battleMaps"> });
  const tokens = useQuery(api.battleTokens.listByMap, {
    mapId: mapId as Id<"battleMaps">,
  });
  const move = useMutation(api.battleTokens.move);
  const updateCell = useMutation(api.battleMaps.updateCell);
  const { 
    enforceSingleOccupancy, 
    editingMode, 
    selectedTerrain,
    measurePoints,
    setMeasurePoints,
    aoeTemplate,
    selectedTokenForMovement,
    setSelectedTokenForMovement,
    // Multi-select functionality
    selectedCells,
    addSelectedCell,
    removeSelectedCell,
    // Combat functionality
    combatState,
    clearCombatState,
  } = useBattleMapUI();
  const { user } = useUser();
  const dropRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [aoeCenter, setAoeCenter] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  // Pan and zoom state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastPanTime, setLastPanTime] = useState(0);
  const [, setPanVelocity] = useState({ x: 0, y: 0 });
  
  // Controls dialog state
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.TOKEN,
      drop: async (item: DragItem, monitor) => {
        if (!map) return;
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset || !dropRef.current) return;
        const rect = dropRef.current.getBoundingClientRect();
        const x = Math.floor(
          (clientOffset.x - rect.left - item.offsetX) / map.cellSize
        );
        const y = Math.floor(
          (clientOffset.y - rect.top - item.offsetY) / map.cellSize
        );
        try {
          await move({
            id: item.id as Id<"battleTokens">,
            x,
            y,
            enforceSingleOccupancy,
          });
        } catch (e) {
          console.error(e);
          // Could show a toast
        }
      },
      collect: (m) => ({ isOver: m.isOver() }),
    }),
    [map, move, enforceSingleOccupancy]
  );

  // Combine the drop ref with our dropRef for calculations
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      (dropRef as any).current = node;
    }
    drop(node);
  }, [drop]);

  // Enhanced pan and zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Allow panning with left mouse button
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setLastPanTime(Date.now());
      setPanVelocity({ x: 0, y: 0 });
      e.preventDefault();
      e.stopPropagation();
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastPanTime;
      
      if (deltaTime > 0) {
        const newOffset = {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        };
        
        // Calculate velocity for momentum
        const velocity = {
          x: (newOffset.x - panOffset.x) / deltaTime,
          y: (newOffset.y - panOffset.y) / deltaTime
        };
        
        setPanOffset(newOffset);
        setPanVelocity(velocity);
        setLastPanTime(currentTime);
      }
      
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isPanning, panStart, panOffset, lastPanTime]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isPanning]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Prevent context menu when panning
    if (isPanning) {
      e.preventDefault();
    }
  }, [isPanning]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Zoom with Ctrl+Scroll or just scroll
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.25, Math.min(4, prev * delta)));
    } else if (!isPanning) {
      // Pan with scroll wheel when not in panning mode
      e.preventDefault();
      const panSpeed = 50;
      setPanOffset(prev => ({
        x: prev.x - e.deltaX * panSpeed,
        y: prev.y - e.deltaY * panSpeed
      }));
    }
  }, [isPanning]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setPanVelocity({ x: 0, y: 0 });
  }, []);

  // Touch support for mobile devices
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
      setLastPanTime(Date.now());
      setPanVelocity({ x: 0, y: 0 });
      e.preventDefault();
    }
  }, [panOffset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      const currentTime = Date.now();
      const deltaTime = currentTime - lastPanTime;
      
      if (deltaTime > 0) {
        const newOffset = {
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y
        };
        
        const velocity = {
          x: (newOffset.x - panOffset.x) / deltaTime,
          y: (newOffset.y - panOffset.y) / deltaTime
        };
        
        setPanOffset(newOffset);
        setPanVelocity(velocity);
        setLastPanTime(currentTime);
      }
      
      e.preventDefault();
    }
  }, [isPanning, panStart, panOffset, lastPanTime]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isPanning) {
      setIsPanning(false);
      e.preventDefault();
    }
  }, [isPanning]);

  // Calculate movement range for selected token
  const getMovementRange = useCallback(() => {
    if (!selectedTokenForMovement || !tokens || !map) return { range: 0, cells: new Set<string>(), token: null };
    
    const token = tokens.find(t => t._id === selectedTokenForMovement);
    if (!token || !token.speed) return { range: 0, cells: new Set<string>(), token: null };
    
    const range = Math.floor(token.speed / 5); // Convert feet to grid squares (5ft per square)
    const cells = new Set<string>();
    
    // Simple range calculation - show all cells within movement range
    for (let y = Math.max(0, token.y - range); y <= Math.min(map.rows - 1, token.y + range); y++) {
      for (let x = Math.max(0, token.x - range); x <= Math.min(map.cols - 1, token.x + range); x++) {
        const distance = Math.abs(x - token.x) + Math.abs(y - token.y); // Manhattan distance
        if (distance <= range) {
          cells.add(`${x},${y}`);
        }
      }
    }
    
    return { range, cells, token };
  }, [selectedTokenForMovement, tokens, map]);

  // Calculate AoE affected cells
  const getAoeCells = useCallback(() => {
    if (!aoeTemplate || !aoeCenter || !map) return new Set<string>();
    
    const cells = new Set<string>();
    const { type, size } = aoeTemplate;
    
    switch (type) {
      case 'sphere':
        // Circle around center
        for (let y = Math.max(0, aoeCenter.y - size); y <= Math.min(map.rows - 1, aoeCenter.y + size); y++) {
          for (let x = Math.max(0, aoeCenter.x - size); x <= Math.min(map.cols - 1, aoeCenter.x + size); x++) {
            const distance = Math.sqrt((x - aoeCenter.x) ** 2 + (y - aoeCenter.y) ** 2);
            if (distance <= size) {
              cells.add(`${x},${y}`);
            }
          }
        }
        break;
        
      case 'cube':
        // Square around center
        for (let y = Math.max(0, aoeCenter.y - size); y <= Math.min(map.rows - 1, aoeCenter.y + size); y++) {
          for (let x = Math.max(0, aoeCenter.x - size); x <= Math.min(map.cols - 1, aoeCenter.x + size); x++) {
            cells.add(`${x},${y}`);
          }
        }
        break;
        
      case 'cone':
        // 90-degree cone (simplified - pointing right from center)
        for (let y = Math.max(0, aoeCenter.y - size); y <= Math.min(map.rows - 1, aoeCenter.y + size); y++) {
          for (let x = aoeCenter.x; x <= Math.min(map.cols - 1, aoeCenter.x + size); x++) {
            const distance = Math.sqrt((x - aoeCenter.x) ** 2 + (y - aoeCenter.y) ** 2);
            if (distance <= size && x >= aoeCenter.x) {
              const angle = Math.atan2(y - aoeCenter.y, x - aoeCenter.x);
              if (Math.abs(angle) <= Math.PI / 4) { // 45 degrees each side
                cells.add(`${x},${y}`);
              }
            }
          }
        }
        break;
        
      case 'line':
        // Horizontal line from center
        for (let x = aoeCenter.x; x <= Math.min(map.cols - 1, aoeCenter.x + size); x++) {
          cells.add(`${x},${aoeCenter.y}`);
          // Add thickness
          if (aoeCenter.y > 0) cells.add(`${x},${aoeCenter.y - 1}`);
          if (aoeCenter.y < map.rows - 1) cells.add(`${x},${aoeCenter.y + 1}`);
        }
        break;
    }
    
    return cells;
  }, [aoeTemplate, aoeCenter, map]);

  if (!map) return <div className="p-4">Loading map…</div>;

  const handleCellClick = async (x: number, y: number) => {
    if (isPanning) return; // Don't handle clicks while panning

    // Handle token movement if a token is selected for movement
    if (selectedTokenForMovement && tokens && map) {
      const selectedToken = tokens.find(t => t._id === selectedTokenForMovement);
      if (selectedToken && selectedToken.speed) {
        const movementData = getMovementRange();
        
        // Check if the clicked cell is within movement range
        const cellKey = `${x},${y}`;
        if (movementData.cells.has(cellKey)) {
          // Check for collision with other tokens (if single occupancy is enforced)
          if (enforceSingleOccupancy) {
            const isOccupied = tokens.some(token => 
              token._id !== selectedToken._id && 
              token.x === x && token.y === y
            );
            if (isOccupied) {
              console.log("Cannot move to occupied cell");
              return;
            }
          }
          
          // Move the token
          try {
            await move({
              id: selectedToken._id,
              x,
              y,
            });
            
            // Clear movement selection after successful move
            setSelectedTokenForMovement(null);
          } catch (e) {
            console.error("Failed to move token:", e);
          }
        }
        return; // Don't process other editing modes when moving
      }
    }

    switch (editingMode) {
      case "terrain":
        if (selectedTerrain && user) {
          try {
            await updateCell({
              mapId: map._id,
              x,
              y,
              terrainType: selectedTerrain as any,
              clerkId: user.id,
            });
          } catch (e) {
            console.error("Failed to update cell:", e);
          }
        }
        break;

      case "measure":
        if (measurePoints.length === 0) {
          setMeasurePoints([{ x, y }]);
        } else if (measurePoints.length === 1) {
          setMeasurePoints([...measurePoints, { x, y }]);
        } else {
          // Reset and start new measurement
          setMeasurePoints([{ x, y }]);
        }
        break;

      case "aoe":
        setAoeCenter({ x, y });
        break;

      case "multiselect":
        const cellKey = `${x},${y}`;
        if (selectedCells.has(cellKey)) {
          removeSelectedCell(x, y);
        } else {
          addSelectedCell(x, y);
        }
        break;
    }
  };

  const getCellColor = (x: number, y: number) => {
    const cell = map.cells?.find(c => c.x === x && c.y === y);
    if (cell?.customColor) return cell.customColor;
    if (cell?.terrainType) return terrainColors[cell.terrainType] || terrainColors.normal;
    return terrainColors.normal;
  };

  const gridStyle: React.CSSProperties = {
    width: map.cols * map.cellSize,
    height: map.rows * map.cellSize,
    backgroundSize: `${map.cellSize}px ${map.cellSize}px`,
    backgroundImage:
      "linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)",
  };

  // Render cell overlays for terrain, AoE, measurements, and movement
  const renderCells = () => {
    const cells = [];
    const aoeCells = getAoeCells();
    const movementData = getMovementRange();
    const movementCells = movementData.cells;
    
    for (let y = 0; y < map.rows; y++) {
      for (let x = 0; x < map.cols; x++) {
        const color = getCellColor(x, y);
        const isAoeCell = aoeCells.has(`${x},${y}`);
        const isMeasurePoint = measurePoints.some(p => p.x === x && p.y === y);
        const isMovementRange = movementCells.has(`${x},${y}`);
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
        const isSelected = selectedCells.has(`${x},${y}`);
        
        // Determine if this cell needs rendering
        const needsRendering = 
          color !== terrainColors.normal || 
          editingMode === "terrain" || 
          editingMode === "measure" ||
          editingMode === "aoe" ||
          editingMode === "multiselect" ||
          isAoeCell ||
          isMeasurePoint ||
          isMovementRange ||
          isHovered ||
          isSelected;

        if (needsRendering) {
          let cellStyle: React.CSSProperties = {
            left: x * map.cellSize,
            top: y * map.cellSize,
            width: map.cellSize,
            height: map.cellSize,
          };

          let cellClass = "absolute pointer-events-auto cursor-pointer transition-all";

          if (isSelected) {
            cellStyle.backgroundColor = "rgba(34, 197, 94, 0.3)";
            cellStyle.border = "2px solid rgba(34, 197, 94, 0.8)";
            cellClass += " ring-2 ring-green-400";
          } else if (isAoeCell) {
            cellStyle.backgroundColor = "rgba(255, 0, 0, 0.3)";
            cellStyle.border = "2px solid rgba(255, 0, 0, 0.6)";
            cellClass += " animate-pulse";
          } else if (isMeasurePoint) {
            cellStyle.backgroundColor = "rgba(59, 130, 246, 0.4)";
            cellStyle.border = "2px solid rgba(59, 130, 246, 0.8)";
          } else if (isMovementRange && !isHovered) {
            // Terrain color takes precedence as background, movement range shown as yellow border
            if (color !== terrainColors.normal) {
              cellStyle.backgroundColor = color;
            } else {
              cellStyle.backgroundColor = "rgba(250, 204, 21, 0.2)";
            }
            cellStyle.border = "2px solid rgba(250, 204, 21, 0.6)";
          } else if (isMovementRange && isHovered) {
            // Terrain color takes precedence as background, movement range shown as yellow border
            if (color !== terrainColors.normal) {
              cellStyle.backgroundColor = color;
            } else {
              cellStyle.backgroundColor = "rgba(250, 204, 21, 0.4)";
            }
            cellStyle.border = "3px solid rgba(250, 204, 21, 0.8)";
            cellClass += " ring-2 ring-yellow-400";
          } else if (color !== terrainColors.normal) {
            cellStyle.backgroundColor = color;
            cellClass += " hover:brightness-110";
          } else if (editingMode === "terrain" || editingMode === "measure" || editingMode === "aoe" || editingMode === "multiselect") {
            cellClass += " hover:bg-neutral-200 hover:bg-opacity-30";
          }

          cells.push(
            <div
              key={`${x}-${y}`}
              className={cellClass}
              style={cellStyle}
              onClick={() => handleCellClick(x, y)}
              onMouseEnter={() => setHoveredCell({ x, y })}
              onMouseLeave={() => setHoveredCell(null)}
              title={
                isAoeCell ? "AoE Target" :
                isMeasurePoint ? "Measurement Point" :
                isMovementRange ? `Move here (${Math.abs(x - (movementData.token?.x || 0)) + Math.abs(y - (movementData.token?.y || 0))} squares)` :
                map.cells?.find(c => c.x === x && c.y === y)?.terrainType || "normal"
              }
            />
          );
        }
      }
    }
    return cells;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        cursor: isPanning ? 'grabbing' : 
                editingMode === 'terrain' ? 'crosshair' : 
                editingMode === 'multiselect' ? 'crosshair' :
                editingMode === 'measure' ? 'crosshair' :
                editingMode === 'aoe' ? 'crosshair' :
                'grab'
      }}
    >
      <div
        className="absolute"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <div
          ref={setRefs}
          className="relative bg-gray-100 dark:bg-gray-300 shadow-inner"
          style={gridStyle}
        >
          {renderCells()}
          
          {/* Measurement line */}
          {measurePoints.length === 2 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: map.cols * map.cellSize, height: map.rows * map.cellSize }}
            >
              <line
                x1={(measurePoints[0].x + 0.5) * map.cellSize}
                y1={(measurePoints[0].y + 0.5) * map.cellSize}
                x2={(measurePoints[1].x + 0.5) * map.cellSize}
                y2={(measurePoints[1].y + 0.5) * map.cellSize}
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray="5,5"
              />
              <circle
                cx={(measurePoints[0].x + 0.5) * map.cellSize}
                cy={(measurePoints[0].y + 0.5) * map.cellSize}
                r="6"
                fill="#3b82f6"
              />
              <circle
                cx={(measurePoints[1].x + 0.5) * map.cellSize}
                cy={(measurePoints[1].y + 0.5) * map.cellSize}
                r="6"
                fill="#3b82f6"
              />
            </svg>
          )}
          
          {tokens?.map((t) => (
            <BattleToken key={t._id} token={t} cellSize={map.cellSize} allTokens={tokens} />
          ))}
          {isOver && (
            <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400" />
          )}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-card border rounded-lg shadow-lg p-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
          title="Zoom In"
          className="h-8 w-8 p-0"
        >
          +
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
          title="Zoom Out"
          className="h-8 w-8 p-0"
        >
          −
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetView}
          title="Reset View"
          className="h-8 w-8 p-0 text-xs"
        >
          ⌂
        </Button>
        <div className="text-xs text-center text-muted-foreground px-1 py-1">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Collapsible Controls Dialog */}
      <div className="absolute top-4 right-4 bg-card/95 border backdrop-blur-sm rounded-lg shadow-lg pointer-events-auto max-w-xs">
        <button
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-t-lg"
        >
          <div className="font-semibold text-foreground text-sm">Controls</div>
          {isControlsCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        {!isControlsCollapsed && (
          <div className="px-3 pb-3 text-sm">
            <div className="text-muted-foreground mb-2">• Click token to show range</div>
            <div className="text-muted-foreground mb-2">• Drag tokens to move</div>
            <div className="text-muted-foreground mb-2">• Middle/Right mouse: Pan</div>
            <div className="text-muted-foreground mb-2">• Scroll wheel: Pan</div>
            <div className="text-muted-foreground mb-2">• Ctrl+Scroll: Zoom</div>
            {selectedTokenForMovement && (
              <div className="font-bold mt-2 text-yellow-600 dark:text-yellow-400">
                ⭐ Token selected - movement range shown
                {tokens?.find(t => t._id === selectedTokenForMovement)?.speed && (
                  <div className="text-xs">Speed: {tokens?.find(t => t._id === selectedTokenForMovement)?.speed}ft</div>
                )}
              </div>
            )}
            {editingMode === "terrain" && <div className="font-bold mt-2 text-yellow-600 dark:text-yellow-400">📐 Click cells to paint terrain</div>}
            {editingMode === "measure" && (
              <div className="font-bold mt-2 text-blue-600 dark:text-blue-400">
                📏 Click two points to measure
                {measurePoints.length === 1 && <div className="text-xs">Click end point</div>}
              </div>
            )}
            {editingMode === "aoe" && (
              <div className="font-bold mt-2 text-red-600 dark:text-red-400">
                🎯 Click to place {aoeTemplate?.type} AoE
                <div className="text-xs">Size: {(aoeTemplate?.size || 0) * 5}ft</div>
              </div>
            )}
            {editingMode === "multiselect" && (
              <div className="font-bold mt-2 text-green-600 dark:text-green-400">
                🎯 Multi-Select Mode
                <div className="text-xs">Click cells to select ({selectedCells.size} selected)</div>
                <div className="text-xs">Use toolbar to apply terrain or AoE</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terrain Key - positioned dynamically based on controls state */}
      <div 
        className="absolute right-4" 
        style={{ 
          top: isControlsCollapsed ? '4rem' : '20rem' // When collapsed, position below the controls header
        }}
      >
        <TerrainKey />
      </div>
      
      {/* Combat Action Selector */}
      {combatState.isCombatMode && combatState.attackerTokenId && combatState.targetTokenId && tokens && (
        <div className="absolute top-4 left-4 z-20">
          <CombatActionSelector
            attacker={tokens.find(t => t._id === combatState.attackerTokenId)!}
            target={tokens.find(t => t._id === combatState.targetTokenId)!}
            attackerEntity={null} // Will be populated by the component
            availableActions={combatState.availableActions}
            onActionSelected={() => {
              clearCombatState();
            }}
            onCancel={() => {
              clearCombatState();
            }}
          />
        </div>
      )}
    </div>
  );
}
