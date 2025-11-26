import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@clerk/clerk-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PortalLinkManagerProps {
  mapId: Id<"maps">;
  cellX: number;
  cellY: number;
  currentPortalLink?: {
    targetMapId: string;
    targetX: number;
    targetY: number;
    label?: string;
  } | null;
  onClose?: () => void;
}

export const PortalLinkManager: React.FC<PortalLinkManagerProps> = ({
  mapId,
  cellX,
  cellY,
  currentPortalLink,
  onClose
}) => {
  const { userId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTargetMapId, setSelectedTargetMapId] = useState<string>(
    currentPortalLink?.targetMapId || ''
  );
  const [targetX, setTargetX] = useState<number>(currentPortalLink?.targetX ?? 0);
  const [targetY, setTargetY] = useState<number>(currentPortalLink?.targetY ?? 0);
  const [label, setLabel] = useState<string>(currentPortalLink?.label || '');

  const maps = useQuery(api.maps.list, { clerkId: userId || undefined });
  const setCellPortalLink = useMutation(api.maps.setCellPortalLink);

  const targetMap = selectedTargetMapId
    ? maps?.find(m => m._id === selectedTargetMapId)
    : null;

  const handleSave = async () => {
    if (!selectedTargetMapId || !userId) {
      toast.error('Please select a target map');
      return;
    }

    if (targetX < 0 || targetY < 0) {
      toast.error('Target coordinates must be positive');
      return;
    }

    if (targetMap && (targetX >= targetMap.width || targetY >= targetMap.height)) {
      toast.error(`Target coordinates must be within map bounds (${targetMap.width}×${targetMap.height})`);
      return;
    }

    try {
      await setCellPortalLink({
        mapId,
        x: cellX,
        y: cellY,
        portalLink: {
          targetMapId: selectedTargetMapId as Id<"maps">,
          targetX,
          targetY,
          label: label.trim() || undefined,
        },
        clerkId: userId,
      });

      toast.success('Portal link saved successfully');
      setIsOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to save portal link:', error);
      toast.error('Failed to save portal link');
    }
  };

  const handleRemove = async () => {
    if (!userId) return;

    try {
      await setCellPortalLink({
        mapId,
        x: cellX,
        y: cellY,
        portalLink: undefined,
        clerkId: userId,
      });

      toast.success('Portal link removed');
      setIsOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to remove portal link:', error);
      toast.error('Failed to remove portal link');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <LinkIcon className="h-3 w-3 mr-1" />
          {currentPortalLink ? 'Edit Link' : 'Add Portal'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentPortalLink ? 'Edit Portal Link' : 'Create Portal Link'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Cell Position</Label>
            <div className="text-sm text-muted-foreground">
              ({cellX}, {cellY})
            </div>
          </div>

          <div>
            <Label htmlFor="targetMap">Target Map *</Label>
            <Select
              value={selectedTargetMapId}
              onValueChange={setSelectedTargetMapId}
            >
              <SelectTrigger id="targetMap">
                <SelectValue placeholder="Select a target map" />
              </SelectTrigger>
              <SelectContent>
                {maps?.map(map => (
                  <SelectItem key={map._id} value={map._id}>
                    <div className="flex items-center gap-2">
                      <span>{map.name}</span>
                      {map.mapType === 'nonCombat' && (
                        <Badge variant="secondary" className="text-xs">
                          Non-Combat
                        </Badge>
                      )}
                      {map.mapType === 'battle' && (
                        <Badge variant="default" className="text-xs">
                          Battle
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetMap && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetX">Target X *</Label>
                <Input
                  id="targetX"
                  type="number"
                  min="0"
                  max={targetMap.width - 1}
                  value={targetX}
                  onChange={(e) => setTargetX(parseInt(e.target.value) || 0)}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Max: {targetMap.width - 1}
                </div>
              </div>
              <div>
                <Label htmlFor="targetY">Target Y *</Label>
                <Input
                  id="targetY"
                  type="number"
                  min="0"
                  max={targetMap.height - 1}
                  value={targetY}
                  onChange={(e) => setTargetY(parseInt(e.target.value) || 0)}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Max: {targetMap.height - 1}
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="label">Label (Optional)</Label>
            <Input
              id="label"
              placeholder="e.g., 'Stairs to 2nd Floor' or 'Door to Shop'"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-1">
              This text will be displayed on the portal cell
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            {currentPortalLink && (
              <Button variant="destructive" onClick={handleRemove}>
                <X className="h-4 w-4 mr-1" />
                Remove Link
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!selectedTargetMapId}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

