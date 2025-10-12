import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { useUser } from "@clerk/clerk-react";

export function NewBattleMapDialog() {
  const [name, setName] = useState("");
  const [cols, setCols] = useState(20);
  const [rows, setRows] = useState(20);
  const [cellSize, setCellSize] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createMap = useMutation(api.battleMaps.create);
  const { setShowNewMap, setSelectedMapId } = useBattleMapUI();
  const { user, isSignedIn } = useUser();

  const handleCreate = async () => {
    setError(null);
    
    // Check authentication
    if (!isSignedIn || !user) {
      setError("Please sign in to create a map");
      return;
    }
    
    if (!name.trim()) {
      setError("Please enter a map name");
      return;
    }
    
    if (cols <= 0 || rows <= 0) {
      setError("Columns and rows must be greater than 0");
      return;
    }
    
    if (cols > 50 || rows > 50) {
      setError("Columns and rows cannot exceed 50");
      return;
    }
    
    if (cellSize < 20 || cellSize > 200) {
      setError("Cell size must be between 20 and 200 pixels");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const id = await createMap({ 
        name: name.trim(), 
        cols, 
        rows, 
        cellSize,
        clerkId: user.id,
      });
      setSelectedMapId(id as unknown as string);
      setShowNewMap(false);
    } catch (err: any) {
      console.error("Failed to create battle map:", err);
      const errorMessage = err?.message || "Failed to create map. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && setShowNewMap(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Battle Map</DialogTitle>
          <DialogDescription>
            Create a new battle map with custom dimensions and terrain.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {!isSignedIn && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              Please sign in to create maps
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Name</Label>
            <Input 
              className="col-span-3" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter map name..."
              disabled={!isSignedIn}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Columns</Label>
            <Input 
              type="number" 
              className="col-span-3" 
              value={cols} 
              onChange={(e) => setCols(Math.max(1, parseInt(e.target.value || "1")))}
              min="1"
              max="50"
              disabled={!isSignedIn}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Rows</Label>
            <Input 
              type="number" 
              className="col-span-3" 
              value={rows} 
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value || "1")))}
              min="1"
              max="50"
              disabled={!isSignedIn}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Cell Size (px)</Label>
            <Input 
              type="number" 
              className="col-span-3" 
              value={cellSize} 
              onChange={(e) => setCellSize(Math.max(20, Math.min(200, parseInt(e.target.value || "40"))))}
              min="20"
              max="200"
              disabled={!isSignedIn}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowNewMap(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !name.trim() || !isSignedIn}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
