import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useDrop } from "react-dnd";
import { ItemTypes, DragItem } from "../../lib/dndTypes";
import { BattleToken } from "./BattleToken";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { useRef, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "../ui/button";

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
    dropRef.current = node;
    drop(node);
  }, [drop]);

  // Pan and zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+Left for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
    }
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

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
        
        // Determine if this cell needs rendering
        const needsRendering = 
          color !== terrainColors.normal || 
          editingMode === "terrain" || 
          editingMode === "measure" ||
          editingMode === "aoe" ||
          isAoeCell ||
          isMeasurePoint ||
          isMovementRange ||
          isHovered;

        if (needsRendering) {
          let cellStyle: React.CSSProperties = {
            left: x * map.cellSize,
            top: y * map.cellSize,
            width: map.cellSize,
            height: map.cellSize,
          };

          let cellClass = "absolute pointer-events-auto cursor-pointer transition-all";

          if (isAoeCell) {
            cellStyle.backgroundColor = "rgba(255, 0, 0, 0.3)";
            cellStyle.border = "2px solid rgba(255, 0, 0, 0.6)";
            cellClass += " animate-pulse";
          } else if (isMeasurePoint) {
            cellStyle.backgroundColor = "rgba(59, 130, 246, 0.4)";
            cellStyle.border = "2px solid rgba(59, 130, 246, 0.8)";
          } else if (isMovementRange && !isHovered) {
            cellStyle.backgroundColor = "rgba(250, 204, 21, 0.2)";
            cellStyle.border = "1px solid rgba(250, 204, 21, 0.4)";
          } else if (isMovementRange && isHovered) {
            cellStyle.backgroundColor = "rgba(250, 204, 21, 0.4)";
            cellStyle.border = "2px solid rgba(250, 204, 21, 0.8)";
            cellClass += " ring-2 ring-yellow-400";
          } else if (color !== terrainColors.normal) {
            cellStyle.backgroundColor = color;
            cellClass += " hover:brightness-110";
          } else if (editingMode === "terrain" || editingMode === "measure" || editingMode === "aoe") {
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
      className="w-full h-full overflow-hidden relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : editingMode === 'terrain' ? 'crosshair' : 'default' }}
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
          className="relative bg-gray-100 dark:bg-gray-800 shadow-inner"
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
            <BattleToken key={t._id} token={t} cellSize={map.cellSize} />
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

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-card/95 border backdrop-blur-sm px-3 py-2 rounded-lg text-sm pointer-events-none shadow-lg">
        <div className="font-semibold mb-1 text-foreground">Controls:</div>
        <div className="text-muted-foreground">• Click token to show range</div>
        <div className="text-muted-foreground">• Drag tokens to move</div>
        <div className="text-muted-foreground">• Ctrl+Scroll: Zoom</div>
        <div className="text-muted-foreground">• Ctrl+Drag: Pan</div>
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
      </div>
    </div>
  );
}
