import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { MapInstanceManager } from './MapInstanceManager';
import { MapDetailsModal } from './MapDetailsModal';
import { MapPreview } from './MapPreview';
import { useDatabaseUser } from '../../lib/clerkService';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Plus, Map, Edit, Eye, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui/button';

interface MapTabProps {
  campaignId?: Id<"campaigns">;
  interactionId?: Id<"interactions">;
  onMapInstanceSelected?: (instanceId: Id<"mapInstances">) => void;
  onMapSelected?: (mapId: Id<"maps">) => void;
  isSelectMode?: boolean;
  className?: string;
}

export const MapTab: React.FC<MapTabProps> = ({
  campaignId,
  interactionId,
  onMapInstanceSelected,
  onMapSelected,
  isSelectMode = false,
  className = ""
}) => {
  const [selectedMapId, setSelectedMapId] = useState<Id<"maps"> | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<Id<"mapInstances"> | null>(null);
  const [isMapDetailsOpen, setIsMapDetailsOpen] = useState(false);
  const [mapDetailsId, setMapDetailsId] = useState<Id<"maps"> | null>(null);
  const [selectMode, setSelectMode] = useState(isSelectMode);

  // Get database user to ensure proper authentication sync
  const databaseUser = useDatabaseUser();
  
  // Only make queries if user is properly synced to database
  const maps = useQuery(api.maps.getUserMaps, databaseUser ? {} : 'skip');
  const mapInstances = useQuery(api.maps.getUserMapInstances, databaseUser ? {} : 'skip');

  // Show loading state if user hasn't been synced yet
  if (!databaseUser) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Show loading state for queries
  if (maps === undefined || mapInstances === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading maps...</p>
        </div>
      </div>
    );
  }

  const handleMapSelect = (mapId: Id<"maps">) => {
    if (selectMode && onMapSelected) {
      // In select mode, call the callback and don't set internal state
      onMapSelected(mapId);
    } else {
      // In view mode, set internal state for instance creation
      setSelectedMapId(mapId);
      setSelectedInstanceId(null);
    }
  };

  const handleInstanceCreated = (instanceId: Id<"mapInstances">) => {
    setSelectedInstanceId(instanceId);
    if (onMapInstanceSelected) {
      onMapInstanceSelected(instanceId);
    }
  };

  const handleInstanceSelect = (instanceId: Id<"mapInstances">) => {
    setSelectedInstanceId(instanceId);
    if (onMapInstanceSelected) {
      onMapInstanceSelected(instanceId);
    }
  };

  const handleOpenMapDetails = (mapId: Id<"maps">) => {
    setMapDetailsId(mapId);
    setIsMapDetailsOpen(true);
  };

  const handleCloseMapDetails = () => {
    setIsMapDetailsOpen(false);
    setMapDetailsId(null);
  };

  const handleModeToggle = (checked: boolean) => {
    setSelectMode(checked);
    // Clear selection when switching modes
    setSelectedMapId(null);
    setSelectedInstanceId(null);
  };

  const selectedMap = mapDetailsId ? maps.find(m => m._id === mapDetailsId) : null;

  return (
    <div className="w-full">
      <Tabs defaultValue="maps" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="maps" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Maps
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Instances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maps" className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Checkbox
              id="select-mode"
              checked={selectMode}
              onCheckedChange={handleModeToggle}
            />
            <Label htmlFor="select-mode" className="text-sm font-medium">
              {selectMode ? (
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  Select Mode - Click maps to select them
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-gray-600" />
                  View Mode - Click maps to view details
                </span>
              )}
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maps.map((map) => (
              <Card
                key={map._id}
                className={`transition-all hover:shadow-md cursor-pointer ${
                  selectedMapId === map._id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleMapSelect(map._id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">{map.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMapDetails(map._id);
                        }}
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="View/Edit Map Details"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!selectMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMapSelect(map._id);
                          }}
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Select for Instance Creation"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Map Preview */}
                  <div className="mb-4">
                    <MapPreview
                      map={map}
                      cellSize={8}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                  
                  {/* Map Information */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Dimensions: {map.width} × {map.height}</p>
                    <p>Cells: {map.cells.length}</p>
                    <p>Created: {new Date(map.createdAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {maps.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No maps created yet. Create your first map to get started!
            </div>
          )}

          {selectedMapId && !selectMode && (
            <Card>
              <CardHeader>
                <CardTitle>Create Instance</CardTitle>
              </CardHeader>
              <CardContent>
                                  <MapInstanceManager
                    mapId={selectedMapId}
                    campaignId={campaignId}
                  interactionId={interactionId}
                  onInstanceCreated={handleInstanceCreated}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapInstances.map((instance) => (
              <Card
                key={instance._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedInstanceId === instance._id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleInstanceSelect(instance._id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{instance.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Entities: {instance.currentPositions.length}</p>
                    <p>Moves: {instance.movementHistory.length}</p>
                    <p>Created: {new Date(instance.createdAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {mapInstances.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No map instances created yet. Select a map from the Maps tab to create an instance!
            </div>
          )}

          {selectedInstanceId && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Instance</CardTitle>
              </CardHeader>
              <CardContent>
                <MapInstanceManager
                  mapId={selectedMapId!}
                  instanceId={selectedInstanceId}
                  campaignId={campaignId}
                  interactionId={interactionId}
                  onInstanceCreated={handleInstanceCreated}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Map Details Modal */}
      <MapDetailsModal
        isOpen={isMapDetailsOpen}
        onClose={handleCloseMapDetails}
        mapId={mapDetailsId!}
        mapName={selectedMap?.name}
      />
    </div>
  );
}; 