import { Button } from "../ui/button";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";
import { NPCTokenSelector } from "./NPCTokenSelector";
import { PanelDock } from "./PanelDock";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import { Trash2, Save, History, Crosshair } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";

const terrainOptions = [
  { value: "normal", label: "Normal", color: "#ffffff" },
  { value: "difficult", label: "Difficult", color: "#8b4513" },
  { value: "hazardous", label: "Hazardous", color: "#ffa500" },
  { value: "magical", label: "Magical", color: "#9333ea" },
  { value: "water", label: "Water", color: "#3b82f6" },
  { value: "ice", label: "Ice", color: "#bfdbfe" },
  { value: "fire", label: "Fire", color: "#ef4444" },
  { value: "acid", label: "Acid", color: "#84cc16" },
  { value: "poison", label: "Poison", color: "#22c55e" },
  { value: "unstable", label: "Unstable", color: "#9ca3af" },
];

export function BattleMapToolbar() {
  const { 
    selectedMapId, 
    enforceSingleOccupancy, 
    setEnforceSingleOccupancy,
    editingMode,
    setEditingMode,
    selectedTerrain,
    setSelectedTerrain,
    measurePoints,
    clearMeasurePoints,
    aoeTemplate,
    setAoeTemplate,
    // Multi-select functionality
    selectedCells,
    clearSelectedCells,
    isMultiSelectMode,
    setIsMultiSelectMode,
    // Battle map instance management
    currentInstanceId,
    setCurrentInstanceId,
    // View control
    triggerResetView,
  } = useBattleMapUI();
  
  const [npcSelectorOpen, setNpcSelectorOpen] = useState(false);
  const [npcSelectorType, setNpcSelectorType] = useState<"pc" | "npc_friendly" | "npc_foe">("npc_friendly");
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [snapshotDescription, setSnapshotDescription] = useState("");
  
  const tokens = useQuery(
    api.battleTokens.listByMap,
    selectedMapId ? { mapId: selectedMapId } : "skip"
  );
  const createToken = useMutation(api.battleTokens.create);
  const updateCell = useMutation(api.battleMaps.updateCell);
  const getOrCreateInstance = useMutation(api.battleMaps.getOrCreateInstance);
  const saveSnapshot = useMutation(api.battleMaps.saveStateSnapshot);
  const restoreSnapshot = useMutation(api.battleMaps.restoreStateSnapshot);
  const clearBattleMap = useMutation(api.battleMaps.clearBattleMap);
  const getSnapshots = useQuery(
    api.battleMaps.getStateSnapshots,
    currentInstanceId ? { instanceId: currentInstanceId as Id<"battleMapInstances"> } : "skip"
  );
  const { user } = useUser();

  const addToken = async (type: "pc" | "npc_friendly" | "npc_foe") => {
    if (!selectedMapId) return;
    
    // For all token types, open the selector dialog to allow entity selection
    setNpcSelectorType(type);
    setNpcSelectorOpen(true);
  };

  const handleCreateNPCToken = async (data: {
    label: string;
    characterId?: Id<"characters">;
    monsterId?: Id<"monsters">;
    hp?: number;
    maxHp?: number;
    speed?: number;
    size?: number;
  }) => {
    if (!selectedMapId) return;
    
    await createToken({
      mapId: selectedMapId as any,
      x: 0,
      y: 0,
      label: data.label,
      type: npcSelectorType,
      color: npcSelectorType === "npc_friendly" ? "#059669" : "#dc2626",
      size: data.size ?? 1,
      characterId: data.characterId,
      monsterId: data.monsterId,
      hp: data.hp,
      maxHp: data.maxHp,
      speed: data.speed,
    });
  };

  const handleCreateGenericToken = async () => {
    if (!selectedMapId) return;
    
    await createToken({
      mapId: selectedMapId as any,
      x: 0,
      y: 0,
      label: npcSelectorType === "pc" ? "PC" : npcSelectorType === "npc_friendly" ? "Ally" : "Foe",
      type: npcSelectorType,
      color: npcSelectorType === "pc" ? "#2563eb" : npcSelectorType === "npc_friendly" ? "#059669" : "#dc2626",
      size: 1,
    });
  };

  const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    // D&D 5e diagonal rules: every other diagonal costs 10ft instead of 5ft
    const diagonal = Math.min(dx, dy);
    const straight = Math.max(dx, dy) - diagonal;
    return (diagonal * 7.5) + (straight * 5); // Average diagonal cost
  };

  // Ensure we have a battle map instance for the current map
  const ensureInstance = async () => {
    if (!selectedMapId || !user) return null;
    
    if (currentInstanceId) {
      return currentInstanceId;
    }
    
    // Get or create a new instance
    const instanceId = await getOrCreateInstance({
      mapId: selectedMapId as Id<"battleMaps">,
      name: `Instance ${new Date().toLocaleString()}`,
      clerkId: user.id,
    });
    
    setCurrentInstanceId(instanceId);
    return instanceId;
  };

  const handleSaveSnapshot = async () => {
    if (!selectedMapId || !user) return;
    
    const instanceId = await ensureInstance();
    if (!instanceId) return;
    
    await saveSnapshot({
      instanceId: instanceId as Id<"battleMapInstances">,
      description: snapshotDescription || `Snapshot ${new Date().toLocaleString()}`,
      includeMapCells: true,
      clerkId: user.id,
    });
    
    setSnapshotDescription("");
    setSnapshotDialogOpen(false);
  };

  const handleRestoreSnapshot = async (snapshotId: string) => {
    if (!selectedMapId || !user) return;
    
    // Ensure we have a battle map instance
    const instanceId = await ensureInstance();
    if (!instanceId) return;
    
    await restoreSnapshot({
      instanceId: instanceId as Id<"battleMapInstances">,
      snapshotId,
      clerkId: user.id,
    });
    
    setRestoreDialogOpen(false);
  };

  const handleClearBattleMap = async () => {
    if (!currentInstanceId || !user) return;
    
    if (confirm("Are you sure you want to clear all tokens from the battle map? This action cannot be undone.")) {
      await clearBattleMap({
        instanceId: currentInstanceId as Id<"battleMapInstances">,
        clerkId: user.id,
      });
    }
  };

  return (
    <div className="ml-auto flex items-center gap-2 flex-wrap">
      {/* Token controls */}
      <div className="flex items-center gap-2 border-r pr-2">
        <Button 
          variant={editingMode === "token" || editingMode === null ? "default" : "outline"} 
          size="sm"
          onClick={() => setEditingMode(editingMode === "token" ? null : "token")}
        >
          Token Mode
        </Button>
        {(editingMode === "token" || editingMode === null) && (
          <>
            <Button variant="outline" size="sm" onClick={() => addToken("pc")}>
              Add PC
            </Button>
            <Button variant="outline" size="sm" onClick={() => addToken("npc_friendly")}>
              Add Ally
            </Button>
            <Button variant="outline" size="sm" onClick={() => addToken("npc_foe")}>
              Add Foe
            </Button>
          </>
        )}
      </div>

      {/* Multi-select controls */}
      <div className="flex items-center gap-2 border-r pr-2">
        <Button 
          variant={editingMode === "multiselect" ? "default" : "outline"} 
          size="sm"
          onClick={() => {
            if (editingMode === "multiselect") {
              setEditingMode(null);
              clearSelectedCells();
            } else {
              setEditingMode("multiselect");
              clearSelectedCells();
            }
          }}
        >
          🎯 Multi-Select
        </Button>
        {editingMode === "multiselect" && selectedCells.size > 0 && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                if (!selectedMapId || !user) return;
                const updatePromises = Array.from(selectedCells).map(cellKey => {
                  const [x, y] = cellKey.split(',').map(Number);
                  return updateCell({
                    mapId: selectedMapId as any,
                    x,
                    y,
                    terrainType: selectedTerrain as any,
                    clerkId: user.id,
                  });
                });
                try {
                  await Promise.all(updatePromises);
                  clearSelectedCells();
                } catch (e) {
                  console.error("Failed to update cells:", e);
                }
              }}
            >
              Paint Terrain ({selectedCells.size})
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearSelectedCells}
            >
              Clear Selection
            </Button>
          </>
        )}
      </div>

      {/* Tactical tools */}
      <div className="flex items-center gap-2 border-r pr-2">
        <Button 
          variant={editingMode === "measure" ? "default" : "outline"} 
          size="sm"
          onClick={() => {
            if (editingMode === "measure") {
              setEditingMode(null);
              clearMeasurePoints();
            } else {
              setEditingMode("measure");
              clearMeasurePoints();
            }
          }}
        >
          📏 Measure
        </Button>
        {measurePoints.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {measurePoints.length === 1 
              ? "Click end point" 
              : `${calculateDistance(measurePoints[0], measurePoints[1])}ft`}
          </span>
        )}
        {measurePoints.length >= 2 && (
          <Button variant="ghost" size="sm" onClick={clearMeasurePoints}>
            Clear
          </Button>
        )}
        
        <Button 
          variant={editingMode === "aoe" ? "default" : "outline"} 
          size="sm"
          onClick={() => {
            if (editingMode === "aoe") {
              setEditingMode(null);
              setAoeTemplate(null);
            } else {
              setEditingMode("aoe");
              setAoeTemplate({ type: "sphere", size: 3 });
            }
          }}
        >
          🎯 AoE
        </Button>
        {editingMode === "aoe" && aoeTemplate && (
          <div className="flex items-center gap-1">
            <Select 
              value={aoeTemplate.type} 
              onValueChange={(v: any) => setAoeTemplate({ ...aoeTemplate, type: v })}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sphere">Sphere</SelectItem>
                <SelectItem value="cube">Cube</SelectItem>
                <SelectItem value="cone">Cone</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={aoeTemplate.size.toString()} 
              onValueChange={(v) => setAoeTemplate({ ...aoeTemplate, size: parseInt(v) })}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">5ft</SelectItem>
                <SelectItem value="2">10ft</SelectItem>
                <SelectItem value="3">15ft</SelectItem>
                <SelectItem value="4">20ft</SelectItem>
                <SelectItem value="6">30ft</SelectItem>
                <SelectItem value="8">40ft</SelectItem>
                <SelectItem value="12">60ft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* State management controls */}
      <div className="flex items-center gap-2 border-r pr-2">
        <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={!selectedMapId}>
              <Save className="w-4 h-4 mr-1" />
              Save State
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Battle Map State</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter description (optional)"
                value={snapshotDescription}
                onChange={(e) => setSnapshotDescription(e.target.value)}
              />
              <Button onClick={handleSaveSnapshot} className="w-full">
                Save Snapshot
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!currentInstanceId || !getSnapshots?.length}
            >
              <History className="w-4 h-4 mr-1" />
              Restore
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore Previous State</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getSnapshots?.map((snapshot) => (
                <div key={snapshot.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{snapshot.description}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRestoreSnapshot(snapshot.id)}
                  >
                    Restore
                  </Button>
                </div>
              ))}
              {!getSnapshots?.length && (
                <div className="text-center text-gray-500 py-4">
                  No snapshots available
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerResetView}
        >
          <Crosshair className="w-4 h-4 mr-1" />
          Reset View
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClearBattleMap}
          disabled={!currentInstanceId || !tokens?.length}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear Map
        </Button>
      </div>

      {/* General options */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={enforceSingleOccupancy}
            onChange={(e) => setEnforceSingleOccupancy(e.target.checked)}
            className="rounded"
          />
          Single occupancy
        </label>
        <span className="text-xs text-neutral-500">
          Tokens: {tokens?.length ?? 0}
        </span>
      </div>

      {/* Panel Layout Manager */}
      <div className="border-l pl-2">
        <PanelDock />
      </div>

      {/* Entity Token Selector Dialog */}
      <NPCTokenSelector
        open={npcSelectorOpen}
        onOpenChange={setNpcSelectorOpen}
        tokenType={npcSelectorType}
        onSelectNPC={handleCreateNPCToken}
        onSelectMonster={handleCreateNPCToken}
        onCreateGeneric={handleCreateGenericToken}
      />
    </div>
  );
}
