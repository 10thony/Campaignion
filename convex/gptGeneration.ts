import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPEN_AI_API_KEY;
  if (!apiKey) {
    throw new Error("OPEN_AI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
};

// Monster schema based on convex/schema.ts
const monsterPrompt = `Generate a creative and balanced D&D 5e monster. Return ONLY a valid JSON object with this exact structure:

{
  "name": "string (creative monster name)",
  "source": "string (e.g., 'Custom Creation')",
  "size": "string (one of: Tiny, Small, Medium, Large, Huge, Gargantuan)",
  "type": "string (e.g., 'Beast', 'Dragon', 'Humanoid', 'Undead', etc.)",
  "tags": ["array of strings (optional subtypes)"],
  "alignment": "string (e.g., 'Lawful Good', 'Chaotic Evil', 'Neutral', etc.)",
  "armorClass": number (10-25),
  "armorType": "string (e.g., 'natural armor', 'plate armor')",
  "hitPoints": number (based on CR, typically 10-500),
  "hitDice": {
    "count": number (1-20),
    "die": "string (one of: d4, d6, d8, d10, d12)"
  },
  "proficiencyBonus": number (2-9, based on CR),
  "speed": {
    "walk": "string (e.g., '30 ft.')",
    "swim": "string (optional, e.g., '40 ft.')",
    "fly": "string (optional, e.g., '60 ft.')",
    "burrow": "string (optional)",
    "climb": "string (optional)"
  },
  "abilityScores": {
    "strength": number (1-30),
    "dexterity": number (1-30),
    "constitution": number (1-30),
    "intelligence": number (1-30),
    "wisdom": number (1-30),
    "charisma": number (1-30)
  },
  "savingThrows": ["array of strings (e.g., ['Strength +5', 'Constitution +7'])"],
  "skills": ["array of strings (e.g., ['Perception +4', 'Stealth +6'])"],
  "damageVulnerabilities": ["array of strings"],
  "damageResistances": ["array of strings"],
  "damageImmunities": ["array of strings"],
  "conditionImmunities": ["array of strings"],
  "senses": {
    "darkvision": "string (optional, e.g., '60 ft.')",
    "blindsight": "string (optional)",
    "tremorsense": "string (optional)",
    "truesight": "string (optional)",
    "passivePerception": number (10-25)
  },
  "languages": "string (e.g., 'Common, Draconic')",
  "challengeRating": "string (e.g., '1', '1/2', '1/4', '5', '20')",
  "experiencePoints": number (based on CR),
  "traits": [
    {
      "name": "string (trait name)",
      "description": "string (trait description)"
    }
  ],
  "actions": [
    {
      "name": "string (action name)",
      "description": "string (action description with attack rolls and damage)"
    }
  ],
  "reactions": [
    {
      "name": "string",
      "description": "string"
    }
  ],
  "legendaryActions": [
    {
      "name": "string",
      "description": "string"
    }
  ],
  "environment": ["array of strings (e.g., ['Forest', 'Mountain', 'Underdark'])"
  ]
}

Make the monster creative, balanced, and thematically consistent.`;

// Character schema
const characterPrompt = `Generate a creative D&D 5e character. Return ONLY a valid JSON object with this exact structure:

{
  "name": "string (creative character name)",
  "race": "string (D&D race like 'Human', 'Elf', 'Dwarf', 'Dragonborn', etc.)",
  "class": "string (D&D class like 'Fighter', 'Wizard', 'Rogue', 'Cleric', etc.)",
  "background": "string (e.g., 'Soldier', 'Noble', 'Folk Hero', 'Sage')",
  "alignment": "string (e.g., 'Lawful Good', 'Chaotic Neutral')",
  "level": number (1-20),
  "abilityScores": {
    "strength": number (8-18 for level 1, can be higher for higher levels),
    "dexterity": number (8-18),
    "constitution": number (8-18),
    "intelligence": number (8-18),
    "wisdom": number (8-18),
    "charisma": number (8-18)
  },
  "hitPoints": number (based on class hit die and constitution modifier),
  "armorClass": number (10-20, based on armor and dexterity),
  "speed": "string (typically '30 ft.' for most races)",
  "proficiencyBonus": number (2-6, based on level),
  "skills": ["array of strings (e.g., ['Perception', 'Athletics', 'Stealth'])"],
  "savingThrows": ["array of strings (two ability names based on class)"],
  "proficiencies": ["array of strings (armor, weapons, tools)"],
  "languages": ["array of strings (e.g., ['Common', 'Elvish', 'Dwarvish'])"],
  "traits": ["array of strings (racial and background traits)"]
}

Make the character well-rounded, with ability scores appropriate for their class and level.`;

// Item schema
const itemPrompt = `Generate a creative D&D 5e magic item or equipment. Return ONLY a valid JSON object with this exact structure:

{
  "name": "string (creative item name)",
  "type": "string (one of: Weapon, Armor, Potion, Scroll, Wondrous Item, Ring, Rod, Staff, Wand, Ammunition, Adventuring Gear, Tool, Mount, Vehicle, Treasure, Other)",
  "rarity": "string (one of: Common, Uncommon, Rare, Very Rare, Legendary, Artifact, Unique)",
  "description": "string (detailed description of the item's appearance and history)",
  "effects": "string (what the item does mechanically)",
  "weight": number (in pounds, optional),
  "cost": number (in gold pieces, optional),
  "attunement": boolean (true if requires attunement),
  "typeOfArmor": "string (optional, one of: Light, Medium, Heavy, Shield - only for Armor type)",
  "armorClass": number (optional, for armor items),
  "abilityModifiers": {
    "strength": number (optional, +/- modifier),
    "dexterity": number (optional),
    "constitution": number (optional),
    "intelligence": number (optional),
    "wisdom": number (optional),
    "charisma": number (optional)
  }
}

Make the item interesting and balanced for its rarity level.`;

// Action schema
const actionPrompt = `Generate a creative D&D 5e action (ability, spell, or feature). Return ONLY a valid JSON object with this exact structure:

{
  "name": "string (creative action name)",
  "description": "string (detailed description of what the action does, including mechanics)",
  "actionCost": "string (one of: Action, Bonus Action, Reaction, No Action, Special)",
  "type": "string (one of: MELEE_ATTACK, RANGED_ATTACK, SPELL, COMMONLY_AVAILABLE_UTILITY, CLASS_FEATURE, BONUS_ACTION, REACTION, OTHER)",
  "requiresConcentration": boolean (only true for concentration spells),
  "sourceBook": "string (e.g., 'PHB', 'Custom', 'Homebrew')",
  "category": "string (one of: general, class_specific, race_specific, feat_specific)",
  "attackBonusAbilityScore": "string (optional, e.g., 'Strength', 'Dexterity')",
  "isProficient": boolean (optional),
  "damageRolls": [
    {
      "dice": {
        "count": number (1-10),
        "type": "string (one of: D4, D6, D8, D10, D12, D20)"
      },
      "modifier": number (0-10),
      "damageType": "string (e.g., BLUDGEONING, FIRE, NECROTIC, etc.)"
    }
  ],
  "spellLevel": number (optional, 0-9, only for spell type actions),
  "castingTime": "string (optional, e.g., '1 action', '1 bonus action', '1 minute')",
  "range": "string (optional, e.g., 'Self', '60 feet', 'Touch')",
  "components": {
    "verbal": boolean,
    "somatic": boolean,
    "material": "string (optional, description of material components)"
  },
  "duration": "string (optional, e.g., 'Instantaneous', '1 hour', 'Concentration, up to 1 minute')",
  "savingThrow": {
    "ability": "string (e.g., 'Dexterity', 'Wisdom')",
    "onSave": "string (what happens on successful save)"
  },
  "spellEffectDescription": "string (optional, for spells)",
  "requiredClass": "string (optional, e.g., 'Wizard', 'Fighter')",
  "requiredLevel": number (optional, minimum level 1-20),
  "requiredSubclass": "string (optional)",
  "usesPer": "string (optional, one of: Short Rest, Long Rest, Day, Special)",
  "maxUses": number (optional, if limited uses),
  "isBaseAction": boolean (true for core D&D actions like Attack, Dodge, Hide, etc.),
  "tags": ["array of strings for categorization (e.g., ['combat', 'utility', 'healing'])"],
  "prerequisites": ["array of strings describing requirements"]
}

Make the action balanced and appropriate for D&D 5e, with clear mechanics and usage.`;

// Quest schema
const questPrompt = `Generate an engaging D&D 5e quest. Return ONLY a valid JSON object with this exact structure:

{
  "name": "string (compelling quest name)",
  "description": "string (detailed quest description including objectives, challenges, and story hooks)",
  "status": "string (one of: idle, in_progress, completed, NotStarted, InProgress, Failed)",
  "questType": "string (optional, one of: Main, Side, Personal, Guild, Faction)",
  "difficulty": "string (optional, one of: Easy, Medium, Hard, Deadly)",
  "estimatedSessions": number (optional, how many game sessions this might take, 1-10),
  "requiredLevel": number (optional, recommended character level 1-20),
  "rewards": {
    "xp": number (experience points reward),
    "gold": number (gold pieces reward)
  },
  "completionXP": number (total XP for completing the quest),
  "dmNotes": "string (notes for the DM about running this quest)",
  "isRepeatable": boolean (can this quest be done multiple times)
}

Make the quest engaging with clear objectives and appropriate rewards for the difficulty level.`;

// Generate entity using GPT
export const generateEntity = action({
  args: {
    entityType: v.union(
      v.literal("monster"),
      v.literal("character"),
      v.literal("item"),
      v.literal("quest"),
      v.literal("action")
    ),
    additionalContext: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const openai = getOpenAIClient();

      // Select the appropriate prompt based on entity type
      let systemPrompt = "";
      switch (args.entityType) {
        case "monster":
          systemPrompt = monsterPrompt;
          break;
        case "character":
          systemPrompt = characterPrompt;
          break;
        case "item":
          systemPrompt = itemPrompt;
          break;
        case "quest":
          systemPrompt = questPrompt;
          break;
        case "action":
          systemPrompt = actionPrompt;
          break;
      }

      // Add any additional context provided by the user
      const userMessage = args.additionalContext
        ? `Generate a ${args.entityType} with the following additional requirements: ${args.additionalContext}`
        : `Generate a creative and balanced ${args.entityType}.`;

      // Call OpenAI API with low temperature for consistent, structured output
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini as mentioned in the requirements
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.2, // Low temperature for more deterministic output
        response_format: { type: "json_object" }, // Ensure JSON response
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      // Parse the JSON response
      const generatedEntity = JSON.parse(content);

      return {
        success: true,
        data: generatedEntity,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      console.error("Error generating entity with GPT:", error);
      return {
        success: false,
        error: error.message || "Failed to generate entity",
      };
    }
  },
});

