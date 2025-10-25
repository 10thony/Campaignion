import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";

type NPCTokenSelectorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenType: "pc" | "npc_friendly" | "npc_foe";
  onSelectNPC: (data: {
    label: string;
    characterId?: Id<"characters">;
    hp?: number;
    maxHp?: number;
    speed?: number;
    size?: number;
  }) => void;
  onSelectMonster: (data: {
    label: string;
    monsterId?: Id<"monsters">;
    hp?: number;
    maxHp?: number;
    speed?: number;
    size?: number;
  }) => void;
  onCreateGeneric: () => void;
};

const sizeToTiles: Record<string, number> = {
  "Tiny": 0.5,
  "Small": 1,
  "Medium": 1,
  "Large": 2,
  "Huge": 3,
  "Gargantuan": 4,
};

export function NPCTokenSelector({
  open,
  onOpenChange,
  tokenType,
  onSelectNPC,
  onSelectMonster,
  onCreateGeneric,
}: NPCTokenSelectorProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(tokenType === "pc" ? "pcs" : "npcs");

  // Query all characters (both PCs and NPCs)
  const allCharacters = useQuery(api.characters.getCharacters);
  const pcs = allCharacters?.filter(c => c.characterType === "player") ?? [];
  const npcs = allCharacters?.filter(c => c.characterType === "npc") ?? [];

  // Query all monsters
  const allMonsters = useQuery(api.monsters.getMonsters) ?? [];

  // Filter by search
  const filteredPCs = pcs.filter(pc =>
    pc.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredNPCs = npcs.filter(npc =>
    npc.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMonsters = allMonsters.filter(monster =>
    monster.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectPC = (pc: typeof pcs[0]) => {
    const constitutionMod = pc.abilityModifiers?.constitution ?? 
      Math.floor((pc.abilityScores.constitution - 10) / 2);
    
    // Calculate HP from level and con modifier
    const totalLevel = pc.classes?.[0]?.level ?? pc.level ?? 1;
    const estimatedHP = Math.floor(totalLevel * (6 + constitutionMod)); // Rough estimate
    
    // Get speed (default to 30ft if not specified)
    const speed = 30; // PCs typically use standard 30ft unless specified otherwise

    onSelectNPC({
      label: pc.name,
      characterId: pc._id,
      hp: estimatedHP,
      maxHp: estimatedHP,
      speed: speed,
      size: 1, // PCs are typically medium
    });
    onOpenChange(false);
  };

  const handleSelectNPC = (npc: typeof npcs[0]) => {
    const constitutionMod = npc.abilityModifiers?.constitution ?? 
      Math.floor((npc.abilityScores.constitution - 10) / 2);
    
    // Calculate HP from level and con modifier
    const totalLevel = npc.classes?.[0]?.level ?? npc.level ?? 1;
    const estimatedHP = Math.floor(totalLevel * (6 + constitutionMod)); // Rough estimate
    
    // Get speed (default to 30ft if not specified)
    const speed = 30; // NPCs typically use standard 30ft unless specified otherwise

    onSelectNPC({
      label: npc.name,
      characterId: npc._id,
      hp: estimatedHP,
      maxHp: estimatedHP,
      speed: speed,
      size: 1, // NPCs are typically medium
    });
    onOpenChange(false);
  };

  const handleSelectMonster = (monster: typeof allMonsters[0]) => {
    // Parse walk speed (e.g., "30 ft." -> 30)
    const walkSpeed = monster.speed.walk 
      ? parseInt(monster.speed.walk.replace(/\D/g, '')) 
      : 30;

    onSelectMonster({
      label: monster.name,
      monsterId: monster._id,
      hp: monster.hitPoints,
      maxHp: monster.hitPoints,
      speed: walkSpeed,
      size: sizeToTiles[monster.size] ?? 1,
    });
    onOpenChange(false);
  };

  const handleGeneric = () => {
    onCreateGeneric();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Add {tokenType === "pc" ? "PC" : tokenType === "npc_friendly" ? "Ally" : "Enemy"} Token
          </DialogTitle>
          <DialogDescription>
            Select an existing character or monster, or create a generic token
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid w-full ${tokenType === "pc" ? "grid-cols-4" : "grid-cols-3"}`}>
              {tokenType === "pc" && (
                <TabsTrigger value="pcs">
                  PCs ({filteredPCs.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="npcs">
                NPCs ({filteredNPCs.length})
              </TabsTrigger>
              <TabsTrigger value="monsters">
                Monsters ({filteredMonsters.length})
              </TabsTrigger>
              <TabsTrigger value="generic">Generic</TabsTrigger>
            </TabsList>

            {tokenType === "pc" && (
              <TabsContent value="pcs" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {filteredPCs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No PCs found. {search && "Try adjusting your search."}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPCs.map((pc) => (
                        <div
                          key={pc._id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => handleSelectPC(pc)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{pc.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {pc.race} {pc.class}
                              {pc.level && ` • Level ${Math.floor(pc.level)}`}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPC(pc);
                          }}>
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            )}

            <TabsContent value="npcs" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {filteredNPCs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No NPCs found. {search && "Try adjusting your search."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNPCs.map((npc) => (
                      <div
                        key={npc._id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleSelectNPC(npc)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{npc.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {npc.race} {npc.class}
                            {npc.level && ` • Level ${Math.floor(npc.level)}`}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          handleSelectNPC(npc);
                        }}>
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="monsters" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {filteredMonsters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No monsters found. {search && "Try adjusting your search."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMonsters.map((monster) => (
                      <div
                        key={monster._id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleSelectMonster(monster)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{monster.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              CR {monster.challengeRating}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {monster.size} {monster.type}
                            {" • "}
                            {monster.hitPoints} HP
                            {" • "}
                            AC {monster.armorClass}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMonster(monster);
                        }}>
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="generic" className="mt-4">
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground text-center">
                  Create a generic {tokenType === "pc" ? "PC" : tokenType === "npc_friendly" ? "ally" : "enemy"} token
                  <br />
                  without linking to an existing character or monster.
                </p>
                <Button onClick={handleGeneric} size="lg">
                  Create Generic Token
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

