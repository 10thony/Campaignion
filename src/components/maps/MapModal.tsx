import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { MapTabContent } from './MapTabContent';
import { Id } from '../../../convex/_generated/dataModel';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  campaignId?: Id<"campaigns">;
  interactionId?: Id<"interactions">;
  onMapInstanceSelected?: (instanceId: Id<"mapInstances">) => void;
  onMapSelected?: (mapId: Id<"maps">) => void;
  isSelectMode?: boolean;
}

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  userId,
  campaignId,
  interactionId,
  onMapInstanceSelected,
  onMapSelected,
  isSelectMode = false
}) => {
  const handleMapInstanceSelected = (instanceId: Id<"mapInstances">) => {
    if (onMapInstanceSelected) {
      onMapInstanceSelected(instanceId);
    }
    onClose();
  };

  const handleMapSelected = (mapId: Id<"maps">) => {
    if (onMapSelected) {
      onMapSelected(mapId);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Management</DialogTitle>
        </DialogHeader>
        <MapTabContent
          userId={userId}
          campaignId={campaignId}
          interactionId={interactionId}
          onMapInstanceSelected={handleMapInstanceSelected}
          onMapSelected={handleMapSelected}
          isSelectMode={isSelectMode}
        />
      </DialogContent>
    </Dialog>
  );
}; 