import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useDrop } from "react-dnd";
import { ItemTypes, DragItem } from "../../lib/dndTypes";
import { BattleToken } from "./BattleToken";
import { TerrainKey } from "./TerrainKey";
import { CombatActionSelector } from "./CombatActionSelector";
import { InitiativePanel } from "./InitiativePanel";
import { DraggablePanel } from "./DraggablePanel";
import { FloatingPanelDock } from "./PanelDock";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { usePanelLayout } from "../../lib/panelLayoutStore";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "../ui/button";
import { Info, Layers, Swords, MapIcon } from "lucide-react";
import { hexToPixel, pixelToHex, hexDistance, getHexesInRange, getHexagonPath, getHexGridDimensions, getHexagonClipPath } from "../../lib/hexUtils";
import { toast } from "sonner";
import { useTheme } from "../theme/ThemeProvider";
import { getTerrainColors, getOverlayColors } from "../../lib/terrainColors";

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
    // Initiative functionality
    initiativeState,
    // View control
    resetView: resetViewTrigger,
  } = useBattleMapUI();
  const { panels } = usePanelLayout();
  const { user } = useUser();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const terrainColors = getTerrainColors(isDark);
  const overlayColors = getOverlayColors(isDark);
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

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.TOKEN,
      drop: async (item: DragItem, monitor) => {
        if (!map) return;
        
        // Check initiative restrictions
        if (initiativeState.isInCombat && initiativeState.currentTurnIndex !== null) {
          const currentEntry = initiativeState.initiativeOrder[initiativeState.currentTurnIndex];
          if (currentEntry && currentEntry.tokenId !== item.id) {
            toast.error(`It's ${currentEntry.label}'s turn. Only the current turn's token can move during combat.`);
            return;
          }
        }
        
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset || !dropRef.current) return;
        const rect = dropRef.current.getBoundingClientRect();
        // Convert pixel coordinates to hex coordinates
        const pixelX = (clientOffset.x - rect.left - item.offsetX) / zoom - panOffset.x;
        const pixelY = (clientOffset.y - rect.top - item.offsetY) / zoom - panOffset.y;
        const hexSize = map.cellSize / 2; // Hex size is half of cellSize for pointy-top hexes
        const { x, y } = pixelToHex(pixelX, pixelY, hexSize);
        try {
          await move({
            id: item.id as Id<"battleTokens">,
            x,
            y,
            enforceSingleOccupancy,
          });
        } catch (e: any) {
          console.error(e);
          const errorMessage = e?.message || "Failed to move token";
          toast.error(errorMessage);
        }
      },
      collect: (m) => ({ isOver: m.isOver() }),
    }),
    [map, move, enforceSingleOccupancy, zoom, panOffset, initiativeState]
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
    // Allow panning with middle mouse button or when holding shift
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
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
    } else if (dropRef.current && map) {
      // Update hovered cell
      const rect = dropRef.current.getBoundingClientRect();
      const pixelX = (e.clientX - rect.left) / zoom - panOffset.x;
      const pixelY = (e.clientY - rect.top) / zoom - panOffset.y;
      const hexSize = map.cellSize / 2; // Calculate inline
      const { x, y } = pixelToHex(pixelX, pixelY, hexSize);
      
      if (x >= 0 && x < map.cols && y >= 0 && y < map.rows) {
        if (hoveredCell?.x !== x || hoveredCell?.y !== y) {
          setHoveredCell({ x, y });
        }
      } else {
        setHoveredCell(null);
      }
    }
  }, [isPanning, panStart, panOffset, lastPanTime, dropRef, map, zoom, hoveredCell]);

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

  // Watch for reset view trigger from store
  useEffect(() => {
    if (resetViewTrigger !== undefined) {
      resetView();
    }
  }, [resetViewTrigger, resetView]);

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

  // Calculate movement range for selected token using hex distance
  const getMovementRange = useCallback(() => {
    if (!selectedTokenForMovement || !tokens || !map) return { range: 0, cells: new Set<string>(), token: null };
    
    const token = tokens.find(t => t._id === selectedTokenForMovement);
    if (!token || !token.speed) return { range: 0, cells: new Set<string>(), token: null };
    
    const range = Math.floor(token.speed / 5); // Convert feet to grid hexes (5ft per hex)
    const cells = new Set<string>();
    
    // Use hex distance calculation
    const hexesInRange = getHexesInRange(token.x, token.y, range, map.cols, map.rows);
    hexesInRange.forEach(hex => {
      cells.add(`${hex.x},${hex.y}`);
    });
    
    return { range, cells, token };
  }, [selectedTokenForMovement, tokens, map]);

  // Calculate AoE affected cells using hex distance
  const getAoeCells = useCallback(() => {
    if (!aoeTemplate || !aoeCenter || !map) return new Set<string>();
    
    const cells = new Set<string>();
    const { type, size } = aoeTemplate;
    
    switch (type) {
      case 'sphere':
        // Circle around center using hex distance
        const hexesInRange = getHexesInRange(aoeCenter.x, aoeCenter.y, size, map.cols, map.rows);
        hexesInRange.forEach(hex => {
          cells.add(`${hex.x},${hex.y}`);
        });
        break;
        
      case 'cube':
        // Hex cube - get hexes within range (cube in hex grid)
        const cubeHexes = getHexesInRange(aoeCenter.x, aoeCenter.y, size, map.cols, map.rows);
        cubeHexes.forEach(hex => {
          cells.add(`${hex.x},${hex.y}`);
        });
        break;
        
      case 'cone':
        // Cone using hex grid (simplified - pointing right from center)
        const coneHexes = getHexesInRange(aoeCenter.x, aoeCenter.y, size, map.cols, map.rows);
        coneHexes.forEach(hex => {
          // Filter to approximate cone shape (rightward direction)
          if (hex.x >= aoeCenter.x) {
            const angle = Math.atan2(hex.y - aoeCenter.y, hex.x - aoeCenter.x);
            if (Math.abs(angle) <= Math.PI / 3) { // 60 degrees each side for hex
              cells.add(`${hex.x},${hex.y}`);
            }
          }
        });
        break;
        
      case 'line':
        // Line in hex grid
        const lineHexes = getHexesInRange(aoeCenter.x, aoeCenter.y, size, map.cols, map.rows);
        lineHexes.forEach(hex => {
          // Filter to approximate line (horizontal)
          if (Math.abs(hex.y - aoeCenter.y) <= 1 && hex.x >= aoeCenter.x && hex.x <= aoeCenter.x + size) {
            cells.add(`${hex.x},${hex.y}`);
          }
        });
        break;
    }
    
    return cells;
  }, [aoeTemplate, aoeCenter, map]);

  // Calculate hex grid dimensions (hooks must be called before early return)
  const hexSize = useMemo(() => (map?.cellSize ?? 40) / 2, [map?.cellSize]);
  const gridDimensions = useMemo(() => {
    if (!map) return { width: 0, height: 0 };
    return getHexGridDimensions(map.cols, map.rows, hexSize);
  }, [map?.cols, map?.rows, hexSize]);
  
  // SVG path for hexagon rendering
  const hexPath = useMemo(() => getHexagonPath(hexSize), [hexSize]);
  // CSS clip-path for hexagon cells (better browser support)
  const hexClipPath = useMemo(() => getHexagonClipPath(hexSize), [hexSize]);

  // Render hex grid background (must be called before early return to satisfy rules of hooks)
  const renderHexGrid = useMemo(() => {
    if (!map) return [];
    const hexes = [];
    const svgSize = hexSize * 2;
    const viewBoxSize = svgSize;
    for (let y = 0; y < map.rows; y++) {
      for (let x = 0; x < map.cols; x++) {
        const pixelPos = hexToPixel(x, y, hexSize);
        hexes.push(
          <svg
            key={`grid-${x}-${y}`}
            className="absolute pointer-events-none"
            style={{
              left: pixelPos.x - hexSize,
              top: pixelPos.y - hexSize,
              width: svgSize,
              height: svgSize,
            }}
            viewBox={`${-hexSize} ${-hexSize} ${viewBoxSize} ${viewBoxSize}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d={hexPath}
              fill="none"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        );
      }
    }
    return hexes;
  }, [map?.rows, map?.cols, hexSize, hexPath]);

  if (!map) return <div className="p-4">Loading map…</div>;

  const handleCellClick = async (x: number, y: number) => {
    if (isPanning) return; // Don't handle clicks while panning

    // Handle token movement if a token is selected for movement
    if (selectedTokenForMovement && tokens && map) {
      const selectedToken = tokens.find(t => t._id === selectedTokenForMovement);
      if (selectedToken && selectedToken.speed) {
        // Check initiative restrictions
        if (initiativeState.isInCombat && initiativeState.currentTurnIndex !== null) {
          const currentEntry = initiativeState.initiativeOrder[initiativeState.currentTurnIndex];
          if (currentEntry && currentEntry.tokenId !== selectedToken._id) {
            const currentTokenLabel = tokens.find(t => t._id === currentEntry.tokenId)?.label || currentEntry.label;
            toast.error(`It's ${currentTokenLabel}'s turn. Only the current turn's token can move during combat.`);
            return;
          }
        }
        
        const movementData = getMovementRange();
        
          // Check if the clicked cell is within movement range using hex distance
          const cellKey = `${x},${y}`;
          const distance = hexDistance(selectedToken.x, selectedToken.y, x, y);
          if (movementData.cells.has(cellKey) && distance <= movementData.range) {
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
            } catch (e: any) {
              console.error("Failed to move token:", e);
              const errorMessage = e?.message || "Failed to move token";
              toast.error(errorMessage);
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
    width: gridDimensions.width,
    height: gridDimensions.height,
  };

  // Render cell overlays for terrain, AoE, measurements, and movement
  const renderCells = () => {
    if (!map) return [];
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
          const pixelPos = hexToPixel(x, y, hexSize);
          let cellStyle: React.CSSProperties = {
            left: pixelPos.x - hexSize,
            top: pixelPos.y - hexSize,
            width: hexSize * 2,
            height: hexSize * 2,
            clipPath: hexClipPath,
            WebkitClipPath: hexClipPath,
          };

          let cellClass = "absolute pointer-events-auto cursor-pointer transition-all";

          if (isSelected) {
            cellStyle.backgroundColor = overlayColors.multiSelect;
            cellStyle.border = `2px solid ${isDark ? 'rgba(0, 201, 241, 0.8)' : 'rgba(0, 145, 173, 0.8)'}`;
            cellClass += " ring-2 ring-pacific-cyan-400";
          } else if (isAoeCell) {
            cellStyle.backgroundColor = overlayColors.aoe;
            cellStyle.border = `2px solid ${isDark ? 'rgba(214, 35, 118, 0.7)' : 'rgba(160, 26, 88, 0.7)'}`;
            cellClass += " animate-pulse";
          } else if (isMeasurePoint) {
            cellStyle.backgroundColor = overlayColors.measurePoint;
            cellStyle.border = `2px solid ${isDark ? 'rgba(61, 146, 196, 0.9)' : 'rgba(46, 111, 149, 0.9)'}`;
          } else if (isMovementRange && !isHovered) {
            // Terrain color takes precedence as background, movement range shown with Pacific Cyan
            if (color !== terrainColors.normal) {
              cellStyle.backgroundColor = color;
            } else {
              cellStyle.backgroundColor = overlayColors.movementRange;
            }
            cellStyle.border = `2px solid ${isDark ? 'rgba(0, 201, 241, 0.6)' : 'rgba(0, 145, 173, 0.6)'}`;
          } else if (isMovementRange && isHovered) {
            // Terrain color takes precedence as background, movement range shown with Pacific Cyan
            if (color !== terrainColors.normal) {
              cellStyle.backgroundColor = color;
            } else {
              cellStyle.backgroundColor = overlayColors.movementHover;
            }
            cellStyle.border = `3px solid ${isDark ? 'rgba(0, 201, 241, 0.9)' : 'rgba(0, 145, 173, 0.9)'}`;
            cellClass += " ring-2 ring-pacific-cyan-400";
          } else if (color !== terrainColors.normal) {
            cellStyle.backgroundColor = color;
            cellClass += " hover:brightness-110";
          } else if (editingMode === "terrain" || editingMode === "measure" || editingMode === "aoe" || editingMode === "multiselect") {
            cellClass += " hover:bg-neutral-200 hover:bg-opacity-30";
          }

          // Calculate hex distance for tooltip
          const distance = movementData.token 
            ? hexDistance(movementData.token.x, movementData.token.y, x, y)
            : 0;

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
                isMovementRange ? `Move here (${distance} hexes)` :
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
          onClick={(e) => {
            // Handle cell clicks on the grid
            if (!isPanning && dropRef.current && map) {
              const rect = dropRef.current.getBoundingClientRect();
              const pixelX = (e.clientX - rect.left) / zoom - panOffset.x;
              const pixelY = (e.clientY - rect.top) / zoom - panOffset.y;
              const hexSize = map.cellSize / 2; // Calculate inline
              const { x, y } = pixelToHex(pixelX, pixelY, hexSize);
              
              if (x >= 0 && x < map.cols && y >= 0 && y < map.rows) {
                handleCellClick(x, y);
              }
            }
          }}
        >
          {/* Hex grid background */}
          {renderHexGrid}
          {renderCells()}
          
          {/* Measurement line */}
          {measurePoints && measurePoints.length === 2 && (() => {
            const startPixel = hexToPixel(measurePoints[0].x, measurePoints[0].y, hexSize);
            const endPixel = hexToPixel(measurePoints[1].x, measurePoints[1].y, hexSize);
            const distance = hexDistance(measurePoints[0].x, measurePoints[0].y, measurePoints[1].x, measurePoints[1].y);
            const measureColor = isDark ? '#3d92c4' : '#2e6f95'; // Rich Cerulean
            return (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: gridDimensions.width, height: gridDimensions.height }}
              >
                <line
                  x1={startPixel.x}
                  y1={startPixel.y}
                  x2={endPixel.x}
                  y2={endPixel.y}
                  stroke={measureColor}
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                <circle
                  cx={startPixel.x}
                  cy={startPixel.y}
                  r="6"
                  fill={measureColor}
                />
                <circle
                  cx={endPixel.x}
                  cy={endPixel.y}
                  r="6"
                  fill={measureColor}
                />
                <text
                  x={(startPixel.x + endPixel.x) / 2}
                  y={(startPixel.y + endPixel.y) / 2 - 10}
                  fill={measureColor}
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {distance} hexes ({(distance * 5).toFixed(0)}ft)
                </text>
              </svg>
            );
          })()}
          
          {tokens?.map((t) => {
            const tokenPixelPos = hexToPixel(t.x, t.y, hexSize);
            return (
              <div
                key={t._id}
                style={{
                  position: 'absolute',
                  left: tokenPixelPos.x,
                  top: tokenPixelPos.y,
                }}
              >
                <BattleToken token={t} cellSize={hexSize * 2} allTokens={tokens} />
              </div>
            );
          })}
          {isOver && (
            <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400" />
          )}
        </div>
      </div>

      {/* Draggable Panels Container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Zoom Controls Panel */}
        {panels.zoom.isVisible && (
          <DraggablePanel
            id="zoom"
            title="Zoom"
            anchor="bottom-right"
            defaultWidth={80}
            minWidth={70}
            maxWidth={100}
            showMinimize={false}
            icon={<span className="text-sm">🔍</span>}
          >
            <div className="flex flex-col gap-1 p-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
                title="Zoom In"
                className="h-8 w-8 p-0 mx-auto"
              >
                +
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
                title="Zoom Out"
                className="h-8 w-8 p-0 mx-auto"
              >
                −
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetView}
                title="Reset View"
                className="h-8 w-8 p-0 text-xs mx-auto"
              >
                ⌂
              </Button>
              <div className="text-xs text-center text-muted-foreground px-1 py-1">
                {Math.round(zoom * 100)}%
              </div>
            </div>
          </DraggablePanel>
        )}

        {/* Controls Panel */}
        <DraggablePanel
          id="controls"
          title="Controls"
          anchor="top-right"
          defaultWidth={280}
          icon={<Info className="h-4 w-4" />}
          minimizedContent={
            <span className="text-xs">
              {selectedTokenForMovement ? "Token selected" : "Drag to interact"}
            </span>
          }
        >
          <div className="px-3 pb-3 text-sm">
            <div className="text-muted-foreground mb-2">• Click token to show range</div>
            <div className="text-muted-foreground mb-2">• Drag tokens to move</div>
            <div className="text-muted-foreground mb-2">• Shift+Click or Middle mouse: Pan</div>
            <div className="text-muted-foreground mb-2">• Scroll wheel: Pan</div>
            <div className="text-muted-foreground mb-2">• Ctrl+Scroll: Zoom</div>
            {selectedTokenForMovement && (
              <div className="font-bold mt-2 text-pacific-cyan-600 dark:text-pacific-cyan-300">
                ⭐ Token selected - movement range shown
                {tokens?.find(t => t._id === selectedTokenForMovement)?.speed && (
                  <div className="text-xs">Speed: {tokens?.find(t => t._id === selectedTokenForMovement)?.speed}ft</div>
                )}
              </div>
            )}
            {editingMode === "terrain" && <div className="font-bold mt-2 text-dusty-grape-600 dark:text-dusty-grape-300">📐 Click cells to paint terrain</div>}
            {editingMode === "measure" && (
              <div className="font-bold mt-2 text-rich-cerulean-600 dark:text-rich-cerulean-300">
                📏 Click two points to measure
                {measurePoints.length === 1 && <div className="text-xs">Click end point</div>}
              </div>
            )}
            {editingMode === "aoe" && (
              <div className="font-bold mt-2 text-dark-raspberry-600 dark:text-dark-raspberry-300">
                🎯 Click to place {aoeTemplate?.type} AoE
                <div className="text-xs">Size: {(aoeTemplate?.size || 0) * 5}ft</div>
              </div>
            )}
            {editingMode === "multiselect" && (
              <div className="font-bold mt-2 text-pacific-cyan-600 dark:text-pacific-cyan-300">
                🎯 Multi-Select Mode
                <div className="text-xs">Click cells to select ({selectedCells.size} selected)</div>
                <div className="text-xs">Use toolbar to apply terrain or AoE</div>
              </div>
            )}
          </div>
        </DraggablePanel>

        {/* Terrain Key Panel */}
        <DraggablePanel
          id="terrain"
          title="Terrain Types & Effects"
          anchor="top-right"
          defaultWidth={280}
          icon={<Layers className="h-4 w-4" />}
          minimizedContent={<span className="text-xs">10 terrain types</span>}
        >
          <div className="max-h-[50vh] overflow-y-auto">
            <TerrainKey className="border-0 shadow-none bg-transparent backdrop-blur-none" />
          </div>
        </DraggablePanel>

        {/* Initiative Panel */}
        <DraggablePanel
          id="initiative"
          title="Initiative Tracker"
          anchor="top-left"
          defaultWidth={320}
          icon={<Swords className="h-4 w-4" />}
          minimizedContent={
            initiativeState.isInCombat ? (
              <span className="text-xs">Round {initiativeState.roundNumber}</span>
            ) : (
              <span className="text-xs">Not in combat</span>
            )
          }
        >
          <div className="max-h-[50vh] overflow-y-auto">
            <InitiativePanel mapId={mapId} />
          </div>
        </DraggablePanel>

        {/* Combat Action Selector Panel */}
        {combatState.isCombatMode && combatState.attackerTokenId && combatState.targetTokenId && tokens && (
          <DraggablePanel
            id="combat"
            title="Combat Actions"
            anchor="free"
            defaultWidth={400}
            icon={<MapIcon className="h-4 w-4" />}
            closable={false}
          >
            <CombatActionSelector
              attacker={tokens.find(t => t._id === combatState.attackerTokenId)!}
              target={tokens.find(t => t._id === combatState.targetTokenId)!}
              attackerEntity={null}
              availableActions={combatState.availableActions}
              onActionSelected={() => {
                clearCombatState();
              }}
              onCancel={() => {
                clearCombatState();
              }}
            />
          </DraggablePanel>
        )}
      </div>

      {/* Floating dock for hidden panels */}
      <FloatingPanelDock />
    </div>
  );
}
