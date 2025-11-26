import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { MapPreview } from './MapPreview';
import { TacticalMapView } from './TacticalMapView';
import { NonCombatMapView } from './NonCombatMapView';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useDatabaseUser } from '../../lib/clerkService';
import { useAuth } from '@clerk/clerk-react';
import { 
  Map, 
  Calendar, 
  Ruler, 
  Settings, 
  X,
  Play,
  Eye,
  Loader2
} from 'lucide-react';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapId: Id<"maps">;
  mode: "detail" | "interactive";
  campaignId?: Id<"campaigns">;
  interactionId?: Id<"interactions">;
  onOpenInteractive?: (mapId: Id<"maps">) => void;
}

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  mapId,
  mode,
  campaignId,
  interactionId,
  onOpenInteractive
}) => {
  const databaseUser = useDatabaseUser();
  const { userId } = useAuth();
  const isDM = databaseUser?.role === 'admin' || databaseUser?.role === 'dm';
  const [mapInstanceId, setMapInstanceId] = useState<Id<"mapInstances"> | null>(null);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);

  // Fetch map data
  const map = useQuery(api.maps.getMap, { mapId });

  // Mutations
  const createMapInstance = useMutation(api.maps.createMapInstance);

  // Find existing map instance for this interaction
  const existingInstance = useQuery(
    api.maps.getMapInstanceByInteraction, 
    interactionId ? { interactionId, mapId } : 'skip'
  );

  // Set map instance ID when found or created
  useEffect(() => {
    if (existingInstance) {
      setMapInstanceId(existingInstance._id);
    }
  }, [existingInstance]);

  // Create map instance for interactive mode if needed
  const handleCreateMapInstance = useCallback(async () => {
    if (!map || !interactionId || !campaignId || !userId) return;

    setIsCreatingInstance(true);
    try {
      const instanceId = await createMapInstance({
        mapId,
        name: `${map.name} - Session`,
        campaignId,
        interactionId,
        clerkId: userId
      });
      setMapInstanceId(instanceId);
    } catch (error) {
      console.error('Failed to create map instance:', error);
    } finally {
      setIsCreatingInstance(false);
    }
  }, [map, interactionId, campaignId, userId, createMapInstance]);

  // Create instance when entering interactive mode
  useEffect(() => {
    if (mode === 'interactive' && !mapInstanceId && !existingInstance && map && interactionId && campaignId) {
      handleCreateMapInstance();
    }
  }, [mode, mapInstanceId, existingInstance, map, interactionId, campaignId, handleCreateMapInstance]);

  // Loading state
  if (!map) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Loading Map...</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading map data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading state for interactive mode
  if (mode === 'interactive' && !mapInstanceId && isCreatingInstance) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Preparing Tactical View...</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Setting up tactical session...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleOpenInteractive = () => {
    if (onOpenInteractive) {
      onOpenInteractive(mapId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Map className="h-5 w-5" />
            {map.name}
            <Badge variant="outline" className="ml-2">
              {mode === 'detail' ? 'Detail View' : 'Tactical Mode'}
            </Badge>
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {mode === 'detail' ? (
            // Detail Mode - Read-only preview with metadata
            <div className="space-y-6">
              {/* Map Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Map Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <MapPreview
                      map={map}
                      cellSize={30}
                      showGrid={true}
                      className="border-2 border-muted rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Map Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Map Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Dimensions:</span>
                        <span>{map.width} × {map.height}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Total Cells:</span>
                        <span>{map.cells.length}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Created:</span>
                        <span>{formatDate(map.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Updated:</span>
                        <span>{formatDate(map.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Open in Tactical Mode Button (DM only) */}
              {isDM && campaignId && interactionId && onOpenInteractive && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Ready to run this map in a live session?
                      </p>
                      <Button
                        onClick={handleOpenInteractive}
                        className="flex items-center gap-2"
                        size="lg"
                      >
                        <Play className="h-4 w-4" />
                        Open in Tactical Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Interactive Mode - Full tactical view (battle or non-combat)
            <div className="h-full">
              {mapInstanceId ? (
                map.mapType === 'nonCombat' ? (
                  <NonCombatMapView
                    instanceId={mapInstanceId}
                    className="h-full"
                    onMapChange={(newInstanceId) => {
                      setMapInstanceId(newInstanceId);
                    }}
                  />
                ) : (
                  <TacticalMapView
                    instanceId={mapInstanceId}
                    className="h-full"
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading tactical view...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 