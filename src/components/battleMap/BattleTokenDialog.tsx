import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Button } from "../ui/button";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { CharacterModal } from "../modals/CharacterModal";
import { MonsterModal } from "../modals/MonsterModal";
import { Id } from "../../../convex/_generated/dataModel";
import { NPCTokenSelector } from "./NPCTokenSelector";

export function BattleTokenDialog() {
  const { editingTokenId, setEditingTokenId } = useBattleMapUI();
  const token = useQuery(
    api.battleTokens.get,
    editingTokenId ? { id: editingTokenId } : "skip"
  );

  const update = useMutation(api.battleTokens.update);
  const remove = useMutation(api.battleTokens.remove);

  // State for entity modals
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showMonsterModal, setShowMonsterModal] = useState(false);
  const [showEntitySelector, setShowEntitySelector] = useState(false);

  // Get affiliated entity data
  const affiliatedCharacter = useQuery(
    api.characters.getCharacterWithActions,
    token?.characterId ? { characterId: token.characterId } : "skip"
  );

  const affiliatedMonster = useQuery(
    api.monsters.getMonsterById,
    token?.monsterId ? { monsterId: token.monsterId } : "skip"
  );

  // Handlers for entity selection
  const handleEntitySelect = async (data: {
    label: string;
    characterId?: Id<"characters">;
    monsterId?: Id<"monsters">;
    hp?: number;
    maxHp?: number;
    speed?: number;
    size?: number;
  }) => {
    if (!token) return;
    
    await update({
      id: token._id,
      label: data.label,
      characterId: data.characterId,
      monsterId: data.monsterId,
      hp: data.hp,
      maxHp: data.maxHp,
      speed: data.speed,
      size: data.size,
    });
    
    setShowEntitySelector(false);
  };

  const handleRemoveEntity = async () => {
    if (!token) return;
    
    await update({
      id: token._id,
      characterId: undefined,
      monsterId: undefined,
    });
  };

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

            {/* Affiliated Entity */}
            <div className="space-y-3 border-t pt-3">
              <h3 className="font-semibold text-sm">Affiliated Entity</h3>
              <div className="flex justify-end gap-2 mb-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowEntitySelector(true)}
                >
                  {token.characterId || token.monsterId ? "Change Entity" : "Link Entity"}
                </Button>
                {(token.characterId || token.monsterId) && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleRemoveEntity}
                  >
                    Remove Link
                  </Button>
                )}
              </div>
              
              {token.characterId && affiliatedCharacter && (
                <div className="p-3 border rounded-lg bg-blue-950/50 border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-100">{affiliatedCharacter.name}</div>
                      <div className="text-sm text-blue-300">
                        {affiliatedCharacter.race} {affiliatedCharacter.class}
                        {affiliatedCharacter.level && ` • Level ${affiliatedCharacter.level}`}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowCharacterModal(true)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
              {token.monsterId && affiliatedMonster && (
                <div className="p-3 border rounded-lg bg-red-950/50 border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-red-100">{affiliatedMonster.name}</div>
                      <div className="text-sm text-red-300">
                        {affiliatedMonster.size} {affiliatedMonster.type}
                        {" • "}CR {affiliatedMonster.challengeRating}
                        {" • "}{affiliatedMonster.hitPoints} HP
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowMonsterModal(true)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
              {!token.characterId && !token.monsterId && (
                <div className="p-3 border rounded-lg bg-gray-950/50 border-gray-800 text-center text-gray-400">
                  No entity linked to this token
                </div>
              )}
            </div>

            {/* Entity Actions */}
            {(affiliatedCharacter || affiliatedMonster) && (
              <div className="space-y-3 border-t pt-3">
                <h3 className="font-semibold text-sm">Available Actions</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {affiliatedCharacter?.resolvedActions && affiliatedCharacter.resolvedActions.length > 0 ? (
                    affiliatedCharacter.resolvedActions.map((action, index) => (
                      <div key={index} className="p-2 border rounded bg-blue-950/50 border-blue-800">
                        <div className="font-medium text-blue-100">{action.name}</div>
                        <div className="text-sm text-blue-300">
                          {action.type && <span className="font-medium">{action.type}</span>}
                          {action.range && <span> • Range: {action.range}</span>}
                          {action.damageRolls && action.damageRolls.length > 0 && (
                            <span> • Damage: {action.damageRolls.map(d => `${d.dice.count}${d.dice.type.toLowerCase()}+${d.modifier}`).join(', ')}</span>
                          )}
                          {action.description && (
                            <div className="mt-1 text-xs text-blue-200">{action.description}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : affiliatedMonster?.actions && affiliatedMonster.actions.length > 0 ? (
                    affiliatedMonster.actions.map((action, index) => (
                      <div key={index} className="p-2 border rounded bg-red-950/50 border-red-800">
                        <div className="font-medium text-red-100">{action.name}</div>
                        <div className="text-sm text-red-300">
                          {action.type && <span className="font-medium">{action.type}</span>}
                          {action.range && <span> • Range: {action.range}</span>}
                          {action.damage && <span> • Damage: {action.damage}</span>}
                          {action.description && (
                            <div className="mt-1 text-xs text-red-200">{action.description}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 border rounded bg-gray-950/50 border-gray-800 text-center text-gray-400">
                      No actions available for this entity
                    </div>
                  )}
                </div>
              </div>
            )}

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

      {/* Character Modal */}
      {affiliatedCharacter && (
        <CharacterModal
          open={showCharacterModal}
          onOpenChange={setShowCharacterModal}
          mode="view"
          character={affiliatedCharacter}
          characterType={affiliatedCharacter.characterType || "npc"}
          onSuccess={() => setShowCharacterModal(false)}
        />
      )}

      {/* Monster Modal */}
      {affiliatedMonster && (
        <MonsterModal
          open={showMonsterModal}
          onOpenChange={setShowMonsterModal}
          mode="view"
          monster={affiliatedMonster}
          onSuccess={() => setShowMonsterModal(false)}
        />
      )}

      {/* Entity Selector Modal */}
      <NPCTokenSelector
        open={showEntitySelector}
        onOpenChange={setShowEntitySelector}
        tokenType={token?.type || "pc"}
        onSelectNPC={handleEntitySelect}
        onSelectMonster={handleEntitySelect}
        onCreateGeneric={() => {
          // For generic tokens, just update the label
          if (token) {
            update({
              id: token._id,
              label: token.type === "pc" ? "PC" : token.type === "npc_friendly" ? "Ally" : "Foe",
              characterId: undefined,
              monsterId: undefined,
            });
          }
          setShowEntitySelector(false);
        }}
      />
    </Dialog>
  );
}
