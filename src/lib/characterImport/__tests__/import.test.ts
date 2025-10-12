import { describe, it, expect } from 'vitest'
import { 
  parseJSONCharacterData, 
  processImportedCharacter,
  calculateAbilityModifier,
  calculateProficiencyBonus,
  CharacterImportError 
} from '../parser'

describe('Character Import System', () => {
  const mockBasicCharacterData = {
    name: "Test Paladin",
    race: "Human",
    class: "Paladin",
    background: "Noble",
    alignment: "Lawful Good",
    level: 5,
    abilityScores: {
      strength: 16,
      dexterity: 10,
      constitution: 14,
      intelligence: 12,
      wisdom: 13,
      charisma: 15
    },
    hitPoints: 45,
    armorClass: 18,
    skills: ["Athletics", "Insight", "Intimidation", "Religion"],
    savingThrows: ["Wisdom", "Charisma"],
    proficiencies: ["All armor", "Shields", "Simple weapons", "Martial weapons"]
  }

  const mockMulticlassCharacterData = {
    name: "Elara Moonwhisper", 
    race: "Half-Elf",
    classes: [
      {
        name: "Ranger",
        level: 3,
        hitDie: "d10",
        subclass: "Hunter",
        features: ["Favored Enemy", "Natural Explorer", "Fighting Style", "Spellcasting"]
      },
      {
        name: "Rogue",
        level: 2,
        hitDie: "d8", 
        subclass: "",
        features: ["Expertise", "Sneak Attack", "Thieves' Cant", "Cunning Action"]
      }
    ],
    background: "Outlander",
    alignment: "Chaotic Good",
    level: 5,
    experiencePoints: 6500,
    abilityScores: {
      strength: 13,
      dexterity: 17,
      constitution: 14,
      intelligence: 12,
      wisdom: 15,
      charisma: 14
    },
    hitPoints: 42,
    armorClass: 15,
    skills: ["Stealth", "Perception", "Survival", "Investigation", "Insight"],
    savingThrows: ["Strength", "Dexterity"],
    proficiencies: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons"],
    speed: "30 ft."
  }

  describe('Basic Parsing', () => {
    it('should parse basic character data', () => {
      const result = parseJSONCharacterData(mockBasicCharacterData)
      
      expect(result.name).toBe("Test Paladin")
      expect(result.race).toBe("Human")
      expect(result.classes).toHaveLength(1)
      expect(result.classes[0].name).toBe("Paladin")
      expect(result.classes[0].level).toBe(5)
      expect(result.level).toBe(5)
      expect(result.abilityScores.strength).toBe(16)
    })

    it('should parse multiclass character data', () => {
      const result = parseJSONCharacterData(mockMulticlassCharacterData)
      
      expect(result.name).toBe("Elara Moonwhisper")
      expect(result.race).toBe("Half-Elf")
      expect(result.classes).toHaveLength(2)
      expect(result.classes[0].name).toBe("Ranger")
      expect(result.classes[0].level).toBe(3)
      expect(result.classes[1].name).toBe("Rogue")
      expect(result.classes[1].level).toBe(2)
      expect(result.level).toBe(5)
    })

    it('should handle missing optional fields', () => {
      const minimalData = {
        name: "Basic Fighter",
        race: "Human", 
        class: "Fighter",
        background: "Soldier",
        level: 1,
        abilityScores: {
          strength: 15,
          dexterity: 13,
          constitution: 14,
          intelligence: 10,
          wisdom: 12,
          charisma: 8
        },
        hitPoints: 12,
        armorClass: 16,
        skills: [],
        savingThrows: [],
        proficiencies: []
      }

      const result = parseJSONCharacterData(minimalData)
      expect(result.name).toBe("Basic Fighter")
      expect(result.classes[0].name).toBe("Fighter")
      expect(result.alignment).toBeUndefined()
      expect(result.speed).toBeUndefined()
    })
  })

  describe('Character Processing', () => {
    it('should calculate derived stats correctly', () => {
      const importedData = parseJSONCharacterData(mockBasicCharacterData)
      const processed = processImportedCharacter(importedData)

      expect(processed.passivePerception).toBeDefined()
      expect(processed.passiveInvestigation).toBeDefined()
      expect(processed.passiveInsight).toBeDefined()
      expect(processed.initiative).toBeDefined()
      expect(processed.hitDice).toBeDefined()
    })

    it('should set spellcasting info for caster classes', () => {
      const casterData = {
        ...mockBasicCharacterData,
        class: "Cleric"
      }

      const importedData = parseJSONCharacterData(casterData)
      const processed = processImportedCharacter(importedData)

      expect(processed.spellcastingAbility).toBe("Wisdom")
      expect(processed.spellSaveDC).toBeDefined()
      expect(processed.spellAttackBonus).toBeDefined()
    })

    it('should calculate hit dice for multiclass characters', () => {
      const importedData = parseJSONCharacterData(mockMulticlassCharacterData)
      const processed = processImportedCharacter(importedData)

      expect(processed.hitDice).toBeDefined()
      expect(processed.hitDice?.length).toBeGreaterThan(0)
      
      // Should have d10s for Ranger levels and d8s for Rogue levels
      const d10HitDie = processed.hitDice?.find(die => die.die === 'd10')
      const d8HitDie = processed.hitDice?.find(die => die.die === 'd8')
      
      expect(d10HitDie?.max).toBe(3) // 3 Ranger levels
      expect(d8HitDie?.max).toBe(2)  // 2 Rogue levels
    })
  })

  describe('Helper Functions', () => {
    it('should calculate ability modifiers correctly', () => {
      expect(calculateAbilityModifier(8)).toBe(-1)
      expect(calculateAbilityModifier(10)).toBe(0)
      expect(calculateAbilityModifier(12)).toBe(1)
      expect(calculateAbilityModifier(16)).toBe(3)
      expect(calculateAbilityModifier(20)).toBe(5)
    })

    it('should calculate proficiency bonus correctly', () => {
      expect(calculateProficiencyBonus(1)).toBe(2)
      expect(calculateProficiencyBonus(4)).toBe(2)
      expect(calculateProficiencyBonus(5)).toBe(3)
      expect(calculateProficiencyBonus(8)).toBe(3)
      expect(calculateProficiencyBonus(9)).toBe(4)
      expect(calculateProficiencyBonus(17)).toBe(6)
      expect(calculateProficiencyBonus(20)).toBe(6)
    })
  })

  describe('Error Handling', () => {
    it('should throw error for invalid JSON', () => {
      expect(() => {
        parseJSONCharacterData({ invalid: "data" })
      }).toThrow(CharacterImportError)
    })

    it('should throw error for missing required fields', () => {
      expect(() => {
        parseJSONCharacterData({ name: "Test" })
      }).toThrow(CharacterImportError)
    })
  })

  describe('D&D Beyond Format', () => {
    it('should parse D&D Beyond character export', () => {
      const dndBeyondData = {
        name: "Gandalf the Grey",
        race: {
          fullName: "Variant Human",
          baseName: "Human",
          subRaceShortName: "Variant",
          weightSpeeds: { normal: { walk: 30 } }
        },
        classes: [{
          definition: { name: "Wizard" },
          level: 20,
          subclassDefinition: { name: "School of Evocation" }
        }],
        background: { definition: { name: "Sage" } },
        alignmentId: 5, // True Neutral
        currentXp: 355000,
        stats: [
          { value: 10 }, // STR
          { value: 14 }, // DEX  
          { value: 12 }, // CON
          { value: 20 }, // INT
          { value: 16 }, // WIS
          { value: 14 }  // CHA
        ],
        baseHitPoints: 164,
        armorClass: 15,
        modifiers: [
          { type: "proficiency", subType: "ability-check", friendlySubtypeName: "Arcana" },
          { type: "proficiency", subType: "ability-check", friendlySubtypeName: "History" },
          { type: "proficiency", subType: "saving-throws", friendlySubtypeName: "Intelligence" },
          { type: "proficiency", subType: "saving-throws", friendlySubtypeName: "Wisdom" }
        ],

        languages: [
          { definition: { name: "Common" } },
          { definition: { name: "Draconic" } }
        ]
      }

      const result = parseJSONCharacterData(dndBeyondData)
      
      expect(result.name).toBe("Gandalf the Grey")
      expect(result.race).toBe("Variant Human")
      expect(result.subrace).toBe("Variant")
      expect(result.classes[0].name).toBe("Wizard")
      expect(result.classes[0].level).toBe(20)
      expect(result.classes[0].subclass).toBe("School of Evocation")
      expect(result.background).toBe("Sage")
      expect(result.alignment).toBe("True Neutral")
      expect(result.experiencePoints).toBe(355000)
      expect(result.abilityScores.intelligence).toBe(20)
      expect(result.hitPoints).toBe(164)
      expect(result.armorClass).toBe(15)
      expect(result.skills).toContain("Arcana")
      expect(result.skills).toContain("History")
      expect(result.savingThrows).toContain("Intelligence")
      expect(result.savingThrows).toContain("Wisdom")
      expect(result.speed).toBe("30 ft.")
      expect(result.languages).toContain("Common")
      expect(result.languages).toContain("Draconic")
      expect(result.importSource).toBe("dnd_beyond")
    })
  })
})
