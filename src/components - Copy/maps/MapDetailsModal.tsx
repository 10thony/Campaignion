import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { MapCreator } from './MapCreator';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface MapDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  mapId: Id<"maps">;
  mapName?: string;
}

export const MapDetailsModal: React.FC<MapDetailsModalProps> = ({
  isOpen,
  onClose,
  userId,
  mapId,
  mapName
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirm) return;
    }
    onClose();
  };

  const handleMapCreated = () => {
    setHasUnsavedChanges(false);
    // Don't close the modal automatically - let user decide when to close
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">
            Map Details - {mapName || 'Untitled Map'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          <MapCreator
            userId={userId}
            mapId={mapId}
            onMapCreated={handleMapCreated}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 