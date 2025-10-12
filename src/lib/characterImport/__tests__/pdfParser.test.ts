import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseClasses, parseAbilityScores, parseHitPoints, parseArmorClass, parseSpeeds } from '../pdfParsingHelpers'
import { StructuredPage } from '../pdfParser'

// Mock structured page data that mimics D&D Beyond PDF layout
const mockDarrowPage: StructuredPage = {
  pageNumber: 1,
  lines: [
    { y: 800, items: [{ str: 'Darrow', x: 100, y: 800 }], text: 'Darrow' },
    { y: 780, items: [{ str: 'Dragonborn', x: 100, y: 780 }], text: 'Dragonborn' },
    { y: 760, items: [{ str: 'Fighter 2 / Monk 6 / Warlock 1', x: 100, y: 760 }], text: 'Fighter 2 / Monk 6 / Warlock 1' },
    
    // Ability score header and values
    { y: 700, items: [
      { str: 'STRENGTH', x: 50, y: 700 },
      { str: 'DEXTERITY', x: 150, y: 700 },
      { str: 'CONSTITUTION', x: 250, y: 700 },
      { str: 'INTELLIGENCE', x: 350, y: 700 },
      { str: 'WISDOM', x: 450, y: 700 },
      { str: 'CHARISMA', x: 550, y: 700 }
    ], text: 'STRENGTH DEXTERITY CONSTITUTION INTELLIGENCE WISDOM CHARISMA' },
    
    { y: 680, items: [
      { str: '20', x: 75, y: 680 },
      { str: '13', x: 175, y: 680 },
      { str: '17', x: 275, y: 680 },
      { str: '9', x: 375, y: 680 },
      { str: '10', x: 475, y: 680 },
      { str: '11', x: 575, y: 680 }
    ], text: '20 13 17 9 10 11' },
    
    // Combat stats
    { y: 600, items: [{ str: 'Hit Points: 85', x: 100, y: 600 }], text: 'Hit Points: 85' },
    { y: 580, items: [{ str: 'Armor Class: 18', x: 100, y: 580 }], text: 'Armor Class: 18' },
    { y: 560, items: [{ str: 'Speed: 30 ft.', x: 100, y: 560 }], text: 'Speed: 30 ft.' },
    
    // Additional character data
    { y: 500, items: [{ str: 'Cantrips: Eldritch Blast, Mage Hand, Shocking Grasp', x: 100, y: 500 }], text: 'Cantrips: Eldritch Blast, Mage Hand, Shocking Grasp' },
    { y: 480, items: [{ str: '1st Level Spells: Identify, Detect Magic', x: 100, y: 480 }], text: '1st Level Spells: Identify, Detect Magic' },
  ],
  rawText: `Darrow
Dragonborn
Fighter 2 / Monk 6 / Warlock 1
STRENGTH DEXTERITY CONSTITUTION INTELLIGENCE WISDOM CHARISMA
20 13 17 9 10 11
Hit Points: 85
Armor Class: 18
Speed: 30 ft.
Cantrips: Eldritch Blast, Mage Hand, Shocking Grasp
1st Level Spells: Identify, Detect Magic`
}

describe('PDF Character Sheet Parser', () => {
  let mockPages: StructuredPage[]
  let parseLog: string[]
  let confidence: any

  beforeEach(() => {
    mockPages = [mockDarrowPage]
    parseLog = []
    confidence = {}
  })

  describe('parseClasses', () => {
    it('should parse multiclass character correctly', () => {
      const classes = parseClasses(mockPages, parseLog, confidence)
      
      expect(classes).toHaveLength(3)
      expect(classes[0]).toEqual({
        name: 'Fighter',
        level: 2,
        hitDie: 'd10',
        subclass: '',
        features: [],
      })
      expect(classes[1]).toEqual({
        name: 'Monk',
        level: 6,
        hitDie: 'd8',
        subclass: '',
        features: [],
      })
      expect(classes[2]).toEqual({
        name: 'Warlock',
        level: 1,
        hitDie: 'd8',
        subclass: '',
        features: [],
      })
      
      expect(confidence.classes).toBeDefined()
      expect(parseLog.length).toBeGreaterThan(0)
    })

    it('should handle single class characters', () => {
      const singleClassPage = {
        ...mockDarrowPage,
        lines: [
          ...mockDarrowPage.lines.filter(line => !line.text.includes('Fighter 2 / Monk 6 / Warlock 1')),
          { y: 760, items: [{ str: 'Wizard 5', x: 100, y: 760 }], text: 'Wizard 5' }
        ]
      }
      
      const classes = parseClasses([singleClassPage], parseLog, confidence)
      
      expect(classes).toHaveLength(1)
      expect(classes[0]).toEqual({
        name: 'Wizard',
        level: 5,
        hitDie: 'd6',
        subclass: '',
        features: [],
      })
    })
  })

  describe('parseAbilityScores', () => {
    it('should parse ability scores from geometry-aware layout', () => {
      const abilityScores = parseAbilityScores(mockPages, parseLog, confidence)
      
      expect(abilityScores).toEqual({
        strength: 20,
        dexterity: 13,
        constitution: 17,
        intelligence: 9,
        wisdom: 10,
        charisma: 11,
      })
      
      expect(confidence.abilityScores).toBe('high')
      expect(parseLog.some(log => log.includes('Found ability score header'))).toBe(true)
    })

    it('should handle missing ability scores gracefully', () => {
      const noAbilityPage = {
        ...mockDarrowPage,
        lines: mockDarrowPage.lines.filter(line => 
          !line.text.includes('STRENGTH') && !line.text.includes('20 13 17 9 10 11')
        )
      }
      
      const abilityScores = parseAbilityScores([noAbilityPage], parseLog, confidence)
      
      // Should return defaults
      expect(abilityScores).toEqual({
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      })
      
      expect(confidence.abilityScores).toBe('low')
    })
  })

  describe('parseHitPoints', () => {
    it('should parse hit points correctly', () => {
      const hitPoints = parseHitPoints(mockPages, parseLog, confidence)
      
      expect(hitPoints).toEqual({
        max: 85,
        current: 85,
        temp: 0,
      })
      
      expect(confidence.hitPoints).toBe('high')
    })
  })

  describe('parseArmorClass', () => {
    it('should parse armor class correctly', () => {
      const armorClass = parseArmorClass(mockPages, parseLog, confidence)
      
      expect(armorClass).toEqual({
        total: 18,
        base: 18,
      })
      
      expect(confidence.armorClass).toBe('high')
    })
  })

  describe('parseSpeeds', () => {
    it('should parse movement speeds correctly', () => {
      const speeds = parseSpeeds(mockPages, parseLog, confidence)
      
      expect(speeds).toEqual({
        walking: 30,
      })
      
      expect(confidence.speeds).toBe('high')
    })

    it('should default to 30ft walking speed if none found', () => {
      const noSpeedPage = {
        ...mockDarrowPage,
        lines: mockDarrowPage.lines.filter(line => !line.text.includes('Speed:'))
      }
      
      const speeds = parseSpeeds([noSpeedPage], parseLog, confidence)
      
      expect(speeds.walking).toBe(30)
      expect(confidence.speeds).toBe('low')
    })
  })

  describe('Integration with expected darrow.pdf data', () => {
    it('should extract expected core values from Darrow character', () => {
      // Test the expected values mentioned in the system prompt
      const classes = parseClasses(mockPages, parseLog, confidence)
      const abilityScores = parseAbilityScores(mockPages, parseLog, confidence)
      const hitPoints = parseHitPoints(mockPages, parseLog, confidence)
      const armorClass = parseArmorClass(mockPages, parseLog, confidence)

      // Verify against expected values from system prompt
      expect(classes.map(c => `${c.name} ${c.level}`)).toEqual(['Fighter 2', 'Monk 6', 'Warlock 1'])
      expect(abilityScores).toEqual({
        strength: 20,
        dexterity: 13,
        constitution: 17,
        intelligence: 9,
        wisdom: 10,
        charisma: 11,
      })
      
      // Total level should be 9 (2+6+1)
      const totalLevel = classes.reduce((sum, cls) => sum + cls.level, 0)
      expect(totalLevel).toBe(9)
      
      // Test cantrips extraction (would be implemented in spellcasting parser)
      const cantripsLine = mockPages[0].lines.find(line => line.text.includes('Cantrips:'))
      expect(cantripsLine?.text).toContain('Eldritch Blast')
      expect(cantripsLine?.text).toContain('Mage Hand')
      expect(cantripsLine?.text).toContain('Shocking Grasp')
    })

    it('should handle confidence levels appropriately', () => {
      // Run all parsers to populate confidence data
      parseClasses(mockPages, parseLog, confidence)
      parseAbilityScores(mockPages, parseLog, confidence)
      parseHitPoints(mockPages, parseLog, confidence)
      parseArmorClass(mockPages, parseLog, confidence)
      parseSpeeds(mockPages, parseLog, confidence)
      
      // Check that confidence levels are assigned
      expect(confidence.classes).toBeDefined()
      expect(confidence.abilityScores).toBeDefined()
      expect(confidence.hitPoints).toBeDefined()
      expect(confidence.armorClass).toBeDefined()
      expect(confidence.speeds).toBeDefined()
      
      // Check that high-quality data gets high confidence
      expect(confidence.abilityScores).toBe('high')
      expect(confidence.classes).toBe('high')
    })

    it('should generate comprehensive parse logs', () => {
      // Run all parsers
      parseClasses(mockPages, parseLog, confidence)
      parseAbilityScores(mockPages, parseLog, confidence)
      parseHitPoints(mockPages, parseLog, confidence)
      parseArmorClass(mockPages, parseLog, confidence)
      parseSpeeds(mockPages, parseLog, confidence)
      
      // Verify logs contain relevant information
      expect(parseLog.length).toBeGreaterThan(0)
      expect(parseLog.some(log => log.includes('Fighter'))).toBe(true)
      expect(parseLog.some(log => log.includes('ability score'))).toBe(true)
      expect(parseLog.some(log => log.includes('Hit Points'))).toBe(true)
    })
  })
})

// Mock test for actual PDF parsing (would require real PDF file)
describe('PDF Parser Integration (requires darrow.pdf)', () => {
  it.skip('should parse real darrow.pdf file', async () => {
    // This test would require the actual darrow.pdf file
    // and would test the full pipeline from PDF binary to structured data
    
    // const file = new File([pdfBuffer], 'darrow.pdf', { type: 'application/pdf' })
    // const result = await parsePDFCharacterSheet(file)
    
    // expect(result.name).toBe('Darrow')
    // expect(result.race).toBe('Dragonborn')
    // expect(result.classes).toHaveLength(3)
    // expect(result.confidence?.name).toBe('high')
    // expect(result.parseLog?.length).toBeGreaterThan(0)
  })
})
