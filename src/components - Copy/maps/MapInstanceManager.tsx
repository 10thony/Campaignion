import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { MapPreview } from './MapPreview';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { Alert, AlertDescription } from '../ui/alert';
import { Undo2, RotateCcw, Users, Sword, Skull } from 'lucide-react';

interface MapInstanceManagerProps {
  userId: string;
  mapId: Id<"maps">;
  instanceId?: Id<"mapInstances">;
  campaignId?: Id<"campaigns">;
  interactionId?: Id<"interactions">;
  onInstanceCreated?: (instanceId: Id<"mapInstances">) => void;
}

type EntityType = 'playerCharacter' | 'npc' | 'monster';
type TerrainType = 'normal' | 'soft' | 'rough' | 'intense' | 'brutal' | 'deadly';

interface Entity {
  id: string;
  type: EntityType;
  name: string;
  speed: number;
  color: string;
  x: number;
  y: number;
}

const TERRAIN_MODIFIERS = {
  normal: 0,
  soft: -1,
  rough: -3,
  intense: -5,
  brutal: -7,
  deadly: -9,
};



export const MapInstanceManager: React.FC<MapInstanceManagerProps> = ({
  userId,
  mapId,
  instanceId,
  campaignId,
  interactionId,
  onInstanceCreated
}) => {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>('soft');
  const [selectedAbilityScores, setSelectedAbilityScores] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('#000000');
  const [instanceName, setInstanceName] = useState('');
  const [isCreatingInstance, setIsCreatingInstance] = useState(!instanceId);
  const [error, setError] = useState<string | null>(null);

  const map = useQuery(api.maps.getMap, { mapId });
  const instance = useQuery(api.maps.getMapInstance, instanceId ? { instanceId } : 'skip');
  
  const createMapInstance = useMutation(api.maps.createMapInstance);
  const updateMapCells = useMutation(api.maps.updateMapCells);
  const moveEntity = useMutation(api.maps.moveEntity);
  const resetMapInstance = useMutation(api.maps.resetMapInstance);
  const undoLastMove = useMutation(api.maps.undoLastMove);

  const abilityScores = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

  useEffect(() => {
    if (instance && !instanceName) {
      setInstanceName(instance.name);
    }
  }, [instance, instanceName]);

  const handleCreateInstance = async () => {
    if (!instanceName.trim()) {
      setError('Instance name is required');
      return;
    }

    try {
      const newInstanceId = await createMapInstance({
        mapId,
        name: instanceName,
        clerkId: userId,
        campaignId,
        interactionId,
      });
      
      setIsCreatingInstance(false);
      if (onInstanceCreated) {
        onInstanceCreated(newInstanceId);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create instance');
    }
  };

  const handleCellClick = async (x: number, y: number) => {
    if (!map || !instance) return;

    try {
      if (selectedEntity) {
        // Move entity
        await moveEntity({
          instanceId: instance._id,
          entityId: selectedEntity.id,
          toX: x,
          toY: y,
        });
        setSelectedEntity(null);
      } else {
        // Update terrain or place entity
        const updatedCells = map.cells.map(cell => {
          if (cell.x === x && cell.y === y) {
            return {
              ...cell,
              terrain: selectedTerrain,
              terrainModifier: TERRAIN_MODIFIERS[selectedTerrain],
              affectedAbilityScores: selectedAbilityScores,
              customColor: customColor !== '#000000' ? customColor : undefined,
            };
          }
          return cell;
        });

        await updateMapCells({
          mapId: map._id,
          cells: updatedCells,
        });
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cell');
    }
  };

  const handlePlaceEntity = (entity: Entity) => {
    setSelectedEntity(entity);
  };

  const handleUndoMove = async () => {
    if (!instance) return;

    try {
      await undoLastMove({ instanceId: instance._id });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo move');
    }
  };

  const handleResetInstance = async () => {
    if (!instance) return;

    try {
      await resetMapInstance({ instanceId: instance._id });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset instance');
    }
  };

  if (!map) return <div>Loading map...</div>;

  if (isCreatingInstance) {
    return (
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Map Instance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instanceName">Instance Name</Label>
              <Input
                id="instanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Enter instance name"
              />
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button onClick={handleCreateInstance}>Create Instance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!instance) return <div>Loading instance...</div>;

  // Create a map with current positions overlaid
  const mapWithPositions = {
    ...map,
    cells: map.cells.map(cell => {
      const entityAtPosition = instance.currentPositions.find(
        pos => pos.x === cell.x && pos.y === cell.y
      );
      
      if (entityAtPosition) {
        return {
          ...cell,
          state: 'occupied' as const,
          occupant: {
            id: entityAtPosition.entityId,
            type: entityAtPosition.entityType,
            color: entityAtPosition.color,
            speed: entityAtPosition.speed,
            name: entityAtPosition.name,
          },
        };
      }
      return cell;
    }),
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{instance.name}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndoMove}
            disabled={instance.movementHistory.length === 0}
          >
            <Undo2 className="w-4 h-4 mr-2" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetInstance}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Display */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Map</CardTitle>
            </CardHeader>
            <CardContent>
              <MapPreview
                map={mapWithPositions}
                cellSize={40}
                interactive={true}
                onCellClick={handleCellClick}
                showTerrainInfo={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Entity Placement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Entities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {instance.currentPositions.map((entity) => (
                <div
                  key={entity.entityId}
                  className={`p-2 rounded cursor-pointer border-2 ${
                    selectedEntity?.id === entity.entityId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => handlePlaceEntity({
                    id: entity.entityId,
                    type: entity.entityType,
                    name: entity.name,
                    speed: entity.speed,
                    color: entity.color,
                    x: entity.x,
                    y: entity.y,
                  })}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: entity.color }}
                    />
                    <span className="text-sm font-medium">{entity.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {entity.entityType} • Speed: {entity.speed}ft
                  </div>
                </div>
              ))}
              {instance.currentPositions.length === 0 && (
                <p className="text-sm text-gray-500">No entities placed</p>
              )}
            </CardContent>
          </Card>

          {/* Terrain Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sword className="w-4 h-4" />
                Terrain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Terrain Type</Label>
                <Select value={selectedTerrain} onValueChange={(value: TerrainType) => setSelectedTerrain(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal (0)</SelectItem>
                    <SelectItem value="soft">Soft (-1)</SelectItem>
                    <SelectItem value="rough">Rough (-3)</SelectItem>
                    <SelectItem value="intense">Intense (-5)</SelectItem>
                    <SelectItem value="brutal">Brutal (-7)</SelectItem>
                    <SelectItem value="deadly">Deadly (-9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Affected Ability Scores</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {abilityScores.map((ability) => (
                    <label key={ability} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAbilityScores.includes(ability)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAbilityScores([...selectedAbilityScores, ability]);
                          } else {
                            setSelectedAbilityScores(selectedAbilityScores.filter(a => a !== ability));
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{ability}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Custom Color</Label>
                <Input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Movement History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skull className="w-4 h-4" />
                Movement History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {instance.movementHistory.slice(-5).reverse().map((move, index) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-medium">{move.entityId}</div>
                    <div className="text-gray-500">
                      ({move.fromX},{move.fromY}) → ({move.toX},{move.toY})
                    </div>
                    <div className="text-gray-400">{move.distance}ft</div>
                  </div>
                ))}
                {instance.movementHistory.length === 0 && (
                  <p className="text-sm text-gray-500">No movements recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 