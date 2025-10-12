import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Id } from "../../../convex/_generated/dataModel";
import CharacterCreationModal, { NPCCreationModal } from "./NPCCreationModal";
import { CharacterFormData } from "./NPCCreationModal/types/npcForm";

const CharacterCreationModalExample: React.FC = () => {
  const [isNPCCreationOpen, setIsNPCCreationOpen] = useState(false);
  const [isPlayerCharacterCreationOpen, setIsPlayerCharacterCreationOpen] = useState(false);
  const [isReadOnlyOpen, setIsReadOnlyOpen] = useState(false);

  // Example character data for read-only mode
  const exampleCharacterData: Partial<CharacterFormData> = {
    name: "Gandalf the Grey",
    race: "Maia",
    class: "Wizard",
    background: "Sage",
    alignment: "Neutral Good",
    level: 20,
    hitPoints: 120,
    armorClass: 15,
    proficiencyBonus: 6,
    abilityScores: {
      strength: 12,
      dexterity: 14,
      constitution: 16,
      intelligence: 20,
      wisdom: 18,
      charisma: 16,
    },
    skills: ["Arcana", "History", "Insight", "Investigation", "Religion"],
    savingThrows: ["Intelligence", "Wisdom"],
    proficiencies: ["Staff", "Dagger", "Light Armor"],
    traits: ["Divine Sense", "Lay on Hands", "Divine Smite"],
    languages: ["Common", "Elvish", "Dwarvish", "Ancient Tongues"],
    equipment: ["Staff of Power", "Glamdring", "Narya", "Wizard's Robes"],
    description: "A wise and powerful wizard who has walked Middle-earth for countless ages. Known for his wisdom, magical prowess, and ability to inspire hope in the darkest of times.",
  };

  const handleSuccess = (characterId: Id<"npcs"> | Id<"playerCharacters">) => {
    console.log("Character created successfully:", characterId);
    // Handle success (e.g., show notification, refresh data, etc.)
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Character Creation Modal Examples</h1>
        <p className="text-muted-foreground">
          Examples of how to use the updated CharacterCreationModal for different use cases
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* NPC Creation Example */}
        <Card>
          <CardHeader>
            <CardTitle>NPC Creation</CardTitle>
            <CardDescription>
              Create a new non-player character using the legacy NPCCreationModal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setIsNPCCreationOpen(true)}
              className="w-full"
            >
              Create NPC
            </Button>
          </CardContent>
        </Card>

        {/* Player Character Creation Example */}
        <Card>
          <CardHeader>
            <CardTitle>Player Character Creation</CardTitle>
            <CardDescription>
              Create a new player character using the new CharacterCreationModal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setIsPlayerCharacterCreationOpen(true)}
              className="w-full"
              variant="secondary"
            >
              Create Player Character
            </Button>
          </CardContent>
        </Card>

        {/* Read-Only Example */}
        <Card>
          <CardHeader>
            <CardTitle>Read-Only View</CardTitle>
            <CardDescription>
              View character data in read-only mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setIsReadOnlyOpen(true)}
              className="w-full"
              variant="outline"
            >
              View Character
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Legacy NPC Creation Modal */}
      <NPCCreationModal
        isOpen={isNPCCreationOpen}
        onClose={() => setIsNPCCreationOpen(false)}
        onSuccess={handleSuccess}
        characterType="NonPlayerCharacter"
      />

      {/* New Character Creation Modal - Player Character */}
      <CharacterCreationModal
        isOpen={isPlayerCharacterCreationOpen}
        onClose={() => setIsPlayerCharacterCreationOpen(false)}
        onSuccess={handleSuccess}
        characterType="PlayerCharacter"
        title="Create New Player Character"
        description="Create a new player character for your campaign"
      />

      {/* Read-Only Character View */}
      <CharacterCreationModal
        isOpen={isReadOnlyOpen}
        onClose={() => setIsReadOnlyOpen(false)}
        onSuccess={handleSuccess}
        characterType="NonPlayerCharacter"
        isReadOnly={true}
        initialData={exampleCharacterData}
        title="Character Details"
        description="View detailed information about this character"
      />
    </div>
  );
};

export default CharacterCreationModalExample; 