import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { MapGrid } from './MapGrid';
import { MapToolbar } from './MapToolbar';
import { useDatabaseUser } from '../../lib/clerkService';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { MapTool } from './TacticalMapView';

// Local state for in-progress actions (non-combat version)
interface LocalMapState {
  selectedTokenId: string | null;
  hoveredCell: { x: number; y: number } | null;
  movementPreview: {
    path: Array<{ x: number; y: number }>;
    cost: number;
    valid: boolean;
  } | null;
  measurePoints: Array<{ x: number; y: number }> | null;
  terrainBrush: {
    type: 'normal' | 'difficult' | 'hazardous' | 'water' | 'magical';
    active: boolean;
  };
}

interface NonCombatMapViewProps {
  instanceId: Id<"mapInstances">;
  className?: string;
  onMapChange?: (newInstanceId: Id<"mapInstances">) => void;
}

export const NonCombatMapView: React.FC<NonCombatMapViewProps> = ({
  instanceId,
  className = "",
  onMapChange
}) => {
  const databaseUser = useDatabaseUser();
  const isDM = databaseUser?.role === 'admin' || databaseUser?.role === 'dm';
  // Non-combat maps only have select, move, measure, terrain, and info tools (no combat tools like aoe)
  const [activeTool, setActiveTool] = useState<MapTool>('select');
  const [localState, setLocalState] = useState<LocalMapState>({
    selectedTokenId: null,
    hoveredCell: null,
    movementPreview: null,
    measurePoints: null,
    terrainBrush: {
      type: 'difficult',
      active: false
    }
  });

  // Fetch map instance and map data
  const mapInstance = useQuery(api.maps.getMapInstance, { instanceId });
  const map = useQuery(api.maps.getMap, { 
    mapId: mapInstance?.mapId 
  });

  // Mutations
  const moveEntity = useMutation(api.maps.moveEntity);
  const updateMapCells = useMutation(api.maps.updateMapCells);
  const navigateToLinkedMap = useMutation(api.maps.navigateToLinkedMap);

  // Calculate movement range for selected token
  const movementRange = useMemo(() => {
    if (!localState.selectedTokenId || !mapInstance || !map) return null;
    
    const token = mapInstance.currentPositions.find(
      pos => pos.entityId === localState.selectedTokenId
    );
    if (!token) return null;

    // Simple movement calculation - can be enhanced with pathfinding
    const range = token.speed / 5; // Convert feet to grid squares (5ft per square)
    return Math.floor(range);
  }, [localState.selectedTokenId, mapInstance, map]);

  // Handle cell click based on active tool
  const handleCellClick = useCallback(async (x: number, y: number) => {
    // Check if this cell has a portal link
    const cell = map?.cells?.find(c => c.x === x && c.y === y);
    if (cell?.portalLink) {
      // If we have a selected entity, navigate it to the linked map
      if (localState.selectedTokenId && mapInstance) {
        try {
          const newInstanceId = await navigateToLinkedMap({
            instanceId,
            targetMapId: cell.portalLink.targetMapId as Id<"maps">,
            targetX: cell.portalLink.targetX,
            targetY: cell.portalLink.targetY,
            entityId: localState.selectedTokenId,
          });
          
          // Notify parent component of map change
          if (onMapChange) {
            onMapChange(newInstanceId);
          }
          
          // Clear selection after navigation
          setLocalState(prev => ({
            ...prev,
            selectedTokenId: null,
            movementPreview: null
          }));
        } catch (error) {
          console.error('Failed to navigate to linked map:', error);
        }
      }
      return;
    }

    switch (activeTool) {
      case 'select':
        // Select token at this position
        const tokenAtPosition = mapInstance?.currentPositions.find(
          pos => pos.x === x && pos.y === y
        );
        setLocalState(prev => ({
          ...prev,
          selectedTokenId: tokenAtPosition?.entityId || null
        }));
        break;

      case 'move':
        if (localState.selectedTokenId && localState.movementPreview?.valid) {
          // Confirm movement
          moveEntity({
            instanceId,
            entityId: localState.selectedTokenId,
            toX: x,
            toY: y
          });
          setLocalState(prev => ({
            ...prev,
            selectedTokenId: null,
            movementPreview: null
          }));
        }
        break;

      case 'measure':
        setLocalState(prev => ({
          ...prev,
          measurePoints: prev.measurePoints 
            ? [...prev.measurePoints, { x, y }]
            : [{ x, y }]
        }));
        break;

      case 'terrain':
        if (isDM && localState.terrainBrush.active) {
          updateMapCells({
            mapId: map!._id,
            updates: [{
              x,
              y,
              terrainType: localState.terrainBrush.type
            }]
          });
        }
        break;

      case 'info':
        // Show info panel for this cell/token
        break;

      case 'aoe':
        // Not available in non-combat mode
        break;
    }
  }, [activeTool, localState, mapInstance, map, moveEntity, updateMapCells, instanceId, isDM, navigateToLinkedMap, onMapChange]);

  // Handle cell hover for movement preview
  const handleCellHover = useCallback((x: number, y: number) => {
    if (activeTool === 'move' && localState.selectedTokenId && movementRange) {
      const token = mapInstance?.currentPositions.find(
        pos => pos.entityId === localState.selectedTokenId
      );
      if (!token) return;

      // Calculate distance (simple Manhattan distance for now)
      const distance = Math.abs(x - token.x) + Math.abs(y - token.y);
      const valid = distance <= movementRange;

      setLocalState(prev => ({
        ...prev,
        hoveredCell: { x, y },
        movementPreview: {
          path: [{ x: token.x, y: token.y }, { x, y }], // Simple straight line for now
          cost: distance,
          valid
        }
      }));
    } else {
      setLocalState(prev => ({
        ...prev,
        hoveredCell: { x, y }
      }));
    }
  }, [activeTool, localState.selectedTokenId, movementRange, mapInstance]);

  // Clear local state when tool changes
  useEffect(() => {
    setLocalState(prev => ({
      ...prev,
      movementPreview: null,
      measurePoints: null,
    }));
  }, [activeTool]);

  // Loading state
  if (!mapInstance || !map) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  // Ensure we're treating this as a non-combat map
  const isNonCombat = map.mapType === 'nonCombat';

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar - non-combat version hides combat tools */}
      <MapToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        isDM={isDM}
        isNonCombat={isNonCombat}
        onClearMeasurements={() => setLocalState(prev => ({ ...prev, measurePoints: null }))}
        onClearAOE={() => {}} // Not used in non-combat
      />

      {/* Main map area */}
      <div className="flex-1 relative overflow-hidden bg-gray-100 rounded-lg">
        <MapGrid
          map={map}
          mapInstance={mapInstance}
          selectedTokenId={localState.selectedTokenId}
          hoveredCell={localState.hoveredCell}
          movementPreview={localState.movementPreview}
          measurePoints={localState.measurePoints}
          aoeTemplate={null} // No AoE in non-combat mode
          onCellClick={handleCellClick}
          onCellHover={handleCellHover}
          isDM={isDM}
        />
      </div>

      {/* Status panel */}
      <div className="mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {mapInstance.name}
                </Badge>
                <Badge variant="secondary">
                  {map.width} × {map.height}
                </Badge>
                {isNonCombat && (
                  <Badge variant="default">
                    Non-Combat
                  </Badge>
                )}
                {localState.selectedTokenId && (
                  <Badge variant="default">
                    Token Selected
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {localState.measurePoints && localState.measurePoints.length >= 2 && (
                  <Badge variant="outline">
                    Distance: {calculateDistance(localState.measurePoints[0], localState.measurePoints[1])}ft
                  </Badge>
                )}
                {localState.movementPreview && (
                  <Badge variant="outline">
                    Move Cost: {localState.movementPreview.cost * 5}ft
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper function to calculate distance between two points
function calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
  const dx = Math.abs(point2.x - point1.x);
  const dy = Math.abs(point2.y - point1.y);
  // Use 5e diagonal movement rules (alternating 5ft and 10ft)
  const diagonal = Math.min(dx, dy);
  const straight = Math.max(dx, dy) - diagonal;
  return (diagonal * 7.5) + (straight * 5); // Average diagonal cost
}

