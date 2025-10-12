import React, { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import "./BulkItemGenerator.css";

interface BulkItemGeneratorProps {
  onGenerationComplete?: () => void;
}

const predefinedItems = [
  {
    name: "Flamekissed Longsword",
    type: "Weapon" as const,
    rarity: "Rare" as const,
    description: "This finely forged longsword glows faintly with an inner fire. Flames dance along the blade when drawn.",
    effects: "Deals an additional 1d6 fire damage on hit. Once per day, cast *flame blade* without components.",
    weight: 3,
    cost: 1500,
    attunement: true
  },
  {
    name: "Cloak of Muffled Whispers",
    type: "Wondrous Item" as const,
    rarity: "Uncommon" as const,
    description: "A dusky gray cloak that dampens sound around the wearer, making them harder to detect.",
    effects: "Grants advantage on Dexterity (Stealth) checks. Once per long rest, cast *silence* centered on yourself.",
    weight: 1,
    cost: 600,
    attunement: true
  },
  {
    name: "Elixir of Stoneform",
    type: "Potion" as const,
    rarity: "Very Rare" as const,
    description: "Thick and silvery, this potion turns the drinker's skin to stone temporarily.",
    effects: "Grants resistance to bludgeoning, piercing, and slashing damage for 10 minutes.",
    weight: 0.5,
    cost: 2500
  },
  {
    name: "Scroll of Shifting Realms",
    type: "Scroll" as const,
    rarity: "Legendary" as const,
    description: "An ancient scroll inscribed with planar glyphs that shimmer with chaotic energy.",
    effects: "Cast *plane shift* once. Consumed on use.",
    weight: 0.1,
    cost: 10000
  },
  {
    name: "Spectral Saddle",
    type: "Mount" as const,
    rarity: "Rare" as const,
    description: "This ornate saddle allows the user to summon a spectral steed from the ether.",
    effects: "Use an action to summon a phantom steed (as *phantom steed* spell) once per long rest.",
    weight: 10,
    cost: 1800,
    attunement: false
  }
];

const BulkItemGenerator: React.FC<BulkItemGeneratorProps> = ({ onGenerationComplete }) => {
  const { user } = useUser();
  const createBulkItems = useMutation(api.items.createBulkItems);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerateItems = async () => {
    if (!user) {
      setError("You must be signed in to generate items.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      await createBulkItems({ 
        items: predefinedItems,
        clerkId: user.id
      });
      setSuccess(true);
      onGenerationComplete?.();
    } catch (err) {
      console.error("Error generating items:", err);
      setError(err instanceof Error ? err.message : "Failed to generate items. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bulk-item-generator">
      <button
        className="generate-items-button"
        onClick={handleGenerateItems}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating Items..." : "Generate Sample Items"}
      </button>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          Successfully generated {predefinedItems.length} sample items!
        </div>
      )}
      
      <div className="items-preview">
        <h4>Items to be generated:</h4>
        <ul>
          {predefinedItems.map((item, index) => (
            <li key={index}>
              <strong>{item.name}</strong> - {item.type} ({item.rarity})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BulkItemGenerator; 