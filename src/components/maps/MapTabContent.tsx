import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { MapInstanceManager } from './MapInstanceManager';
import { MapDetailsModal } from './MapDetailsModal';
import { MapPreview } from './MapPreview';
import { useUser } from '@clerk/clerk-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Plus, Map, Edit, Eye, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui/button';

interface MapTabContentProps {
  userId: string;
  campaignId?: Id<"campaigns">;
  interactionId?: Id<"interactions">;
  onMapInstanceSelected?: (instanceId: Id<"mapInstances">) => void;
  onMapSelected?: (mapId: Id<"maps">) => void;
  isSelectMode?: boolean;
  className?: string;
}

export const MapTabContent: React.FC<MapTabContentProps> = ({
  userId,
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

  // Get Clerk user for filtering
  const { user, isSignedIn } = useUser();
  
  // Fetch all maps and instances (no user sync dependency)
  const allMaps = useQuery(api.maps.getAllMaps);
  const allMapInstances = useQuery(api.maps.getAllMapInstances);

  // Filter maps and instances for the current user on the client side
  // Use Clerk ID for filtering since we now store it directly
  const userMaps = useMemo(() => {
    if (!allMaps || !user) return [];
    // Filter by clerkId, but for now show all maps since existing maps won't have clerkId
    // TODO: Add migration to populate clerkId for existing maps
    return allMaps.filter(map => !map.clerkId || map.clerkId === user.id);
  }, [allMaps, user]);

  const userMapInstances = useMemo(() => {
    if (!allMapInstances || !user) return [];
    // Filter by clerkId, but for now show all instances since existing instances won't have clerkId
    // TODO: Add migration to populate clerkId for existing instances
    return allMapInstances.filter(instance => !instance.clerkId || instance.clerkId === user.id);
  }, [allMapInstances, user]);

  // Show loading state for queries
  if (allMaps === undefined || allMapInstances === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading maps...</p>
        </div>
      </div>
    );
  }

  // Show error if user is not signed in
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-gray-500 mb-2">🔒</div>
          <p className="text-sm text-muted-foreground">Please sign in to access your maps.</p>
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

  return (
    <div className={`w-full ${className}`}>
      <Tabs defaultValue="maps" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="maps">Maps ({userMaps.length})</TabsTrigger>
          <TabsTrigger value="instances">Instances ({userMapInstances.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="maps" className="space-y-4">
          {userMaps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No maps found. Create your first map to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userMaps.map((map) => (
                <Card key={map._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{map.name}</CardTitle>
                      <div className="flex gap-1">
                        {selectMode && (
                          <Checkbox
                            checked={selectedMapId === map._id}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMapId(map._id);
                                onMapSelected?.(map._id);
                              } else {
                                setSelectedMapId(null);
                              }
                            }}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenMapDetails(map._id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMapSelect(map._id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-3">
                      {map.width} × {map.height} grid
                    </div>
                    <MapPreview
                      map={map}
                      cellSize={20}
                      showGrid={false}
                      className="mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleMapSelect(map._id)}
                        className="flex-1"
                      >
                        <Map className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMapDetails(map._id)}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          {userMapInstances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No map instances found. Create an instance from a map to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userMapInstances.map((instance) => {
                const map = userMaps.find(m => m._id === instance.mapId);
                return (
                  <Card key={instance._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{instance.name}</CardTitle>
                        <div className="flex gap-1">
                          {selectMode && (
                            <Checkbox
                              checked={selectedInstanceId === instance._id}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedInstanceId(instance._id);
                                  onMapInstanceSelected?.(instance._id);
                                } else {
                                  setSelectedInstanceId(null);
                                }
                              }}
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInstanceSelect(instance._id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-3">
                        Based on: {map?.name || 'Unknown Map'}
                      </div>
                      {map && (
                        <MapPreview
                          map={map}
                          cellSize={20}
                          showGrid={false}
                          className="mb-3"
                        />
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleInstanceSelect(instance._id)}
                          className="flex-1"
                        >
                          <Map className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Map Instance Manager */}
      {selectedMapId && (
        <div className="mt-6">
          <MapInstanceManager
            mapId={selectedMapId}
            instanceId={selectedInstanceId}
            campaignId={campaignId}
            interactionId={interactionId}
            onInstanceCreated={handleInstanceCreated}
          />
        </div>
      )}

      {/* Map Details Modal */}
      <MapDetailsModal
        isOpen={isMapDetailsOpen}
        onClose={handleCloseMapDetails}
        mapId={mapDetailsId}
      />

      {/* Select Mode Toggle */}
      {!isSelectMode && (
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="select-mode"
            checked={selectMode}
            onCheckedChange={handleModeToggle}
          />
          <Label htmlFor="select-mode">Select Mode</Label>
        </div>
      )}
    </div>
  );
}; 