import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Button } from "../ui/button";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function BattleTokenDialog() {
  const { editingTokenId, setEditingTokenId } = useBattleMapUI();
  const token = useQuery(
    api.battleTokens.get,
    editingTokenId ? { id: editingTokenId } : "skip"
  );

  const update = useMutation(api.battleTokens.update);
  const remove = useMutation(api.battleTokens.remove);

  if (!editingTokenId) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && setEditingTokenId(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Token</DialogTitle>
          <DialogDescription>
            Customize the token's appearance and combat statistics.
          </DialogDescription>
        </DialogHeader>
        {token ? (
          <div className="grid gap-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Basic Information</h3>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="col-span-1">Label</Label>
                <Input
                  className="col-span-3"
                  value={token.label}
                  onChange={(e) =>
                    update({ id: token._id, label: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="col-span-1">Type</Label>
                <Select
                  value={token.type}
                  onValueChange={(v) =>
                    update({
                      id: token._id,
                      type: v as "pc" | "npc_friendly" | "npc_foe",
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pc">PC</SelectItem>
                    <SelectItem value="npc_friendly">NPC (Friendly)</SelectItem>
                    <SelectItem value="npc_foe">NPC (Foe)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="col-span-1">Color</Label>
                <Input
                  type="color"
                  className="col-span-3 h-10"
                  value={token.color}
                  onChange={(e) => update({ id: token._id, color: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="col-span-1">Size (tiles)</Label>
                <Input
                  type="number"
                  min={1}
                  max={4}
                  className="col-span-3"
                  value={token.size}
                  onChange={(e) =>
                    update({ id: token._id, size: parseInt(e.target.value || "1") })
                  }
                />
              </div>
            </div>

            {/* Combat Stats */}
            <div className="space-y-3 border-t pt-3">
              <h3 className="font-semibold text-sm">Combat Stats</h3>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="col-span-1">Speed (ft)</Label>
                <Input
                  type="number"
                  min={0}
                  className="col-span-3"
                  value={token.speed ?? ""}
                  placeholder="30"
                  onChange={(e) =>
                    update({ 
                      id: token._id, 
                      speed: e.target.value ? parseInt(e.target.value) : undefined 
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="col-span-1">Current HP</Label>
                <Input
                  type="number"
                  min={0}
                  className="col-span-3"
                  value={token.hp ?? ""}
                  placeholder="Current HP"
                  onChange={(e) =>
                    update({ 
                      id: token._id, 
                      hp: e.target.value ? parseInt(e.target.value) : undefined 
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="col-span-1">Max HP</Label>
                <Input
                  type="number"
                  min={0}
                  className="col-span-3"
                  value={token.maxHp ?? ""}
                  placeholder="Max HP"
                  onChange={(e) =>
                    update({ 
                      id: token._id, 
                      maxHp: e.target.value ? parseInt(e.target.value) : undefined 
                    })
                  }
                />
              </div>
              {token.hp !== undefined && token.maxHp !== undefined && (
                <div className="col-span-4">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ 
                        width: `${Math.min(100, (token.hp / token.maxHp) * 100)}%`,
                        backgroundColor: 
                          token.hp / token.maxHp > 0.5 ? '#22c55e' : 
                          token.hp / token.maxHp > 0.25 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <p className="text-xs text-center mt-1 text-gray-600">
                    {token.hp} / {token.maxHp} HP ({Math.round((token.hp / token.maxHp) * 100)}%)
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-4 border-t pt-4">
              <Button variant="destructive" onClick={async () => {
                await remove({ id: token._id });
                setEditingTokenId(null);
              }}>
                Delete
              </Button>
              <Button variant="outline" onClick={() => setEditingTokenId(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div>Loading…</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
