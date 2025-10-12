import { ImportedCharacterData, ImportedClassData, ParsedEquipmentData, ParsedActionData, ParsedCharacterData } from './types'
import { CharacterImportError } from './errors'
import { configurePDFWorker, getPDFDocument } from './pdfWorkerConfig'
import { calculateAbilityModifier, calculateProficiencyBonus } from './parser'
import { 
  parseClasses, 
  parseAbilityScores, 
  parseHitPoints, 
  parseArmorClass, 
  parseSpeeds 
} from './pdfParsingHelpers'
import { parseEquipmentEnhanced, parseActionsEnhanced } from './enhancedPdfParser'

// Configure PDF.js worker with fallback strategies
configurePDFWorker()

// PDF parsing utilities for D&D 5e character sheets

export interface PDFParseResult {
  text: string
  numpages: number
  structuredPages: StructuredPage[]
}

export interface StructuredPage {
  pageNumber: number
  lines: StructuredLine[]
  rawText: string
}

export interface StructuredLine {
  y: number
  items: StructuredTextItem[]
  text: string
}

export interface StructuredTextItem {
  str: string
  x: number
  y: number
  width?: number
  height?: number
}

// ParsedCharacterData interface is now defined in types.ts

// Future implementation constants (currently unused)
/*
const DND_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
]

const DND_CLASSES = [
  'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
]

const DND_RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf',
  'Half-Orc', 'Tiefling', 'Aasimar', 'Genasi', 'Goliath', 'Tabaxi'
]

const ABILITY_HEADERS = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA']
const ABILITY_SHORT = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

const SPELL_LEVELS = ['CANTRIPS', '1ST LEVEL', '2ND LEVEL', '3RD LEVEL', '4TH LEVEL', '5TH LEVEL', '6TH LEVEL', '7TH LEVEL', '8TH LEVEL', '9TH LEVEL']

const WEAPON_PATTERNS = [
  /WEAPON\s+ATTACKS?\s*(&\s*CANTRIPS)?/i,
  /MELEE\s+ATTACKS?/i,
  /RANGED\s+ATTACKS?/i,
  /SPELLS?/i
]

const PROFICIENCY_SECTIONS = [
  /===\s*ARMOR\s*===/i,
  /===\s*WEAPONS?\s*===/i,
  /===\s*TOOLS?\s*===/i,
  /===\s*LANGUAGES?\s*===/i,
  /PROFICIENCIES?\s*&\s*LANGUAGES?/i
]

const FEATURE_SECTIONS = [
  /FEATURES?\s*&\s*TRAITS?/i,
  /CLASS\s+FEATURES?/i,
  /RACIAL\s+TRAITS?/i,
  /BACKGROUND\s+FEATURES?/i
]
*/

export async function parsePDFCharacterSheet(file: File): Promise<ParsedCharacterData> {
  try {
    // Convert File to ArrayBuffer for PDF.js
    const arrayBuffer = await file.arrayBuffer()
    
    // Parse the PDF using geometry-aware extraction
    const pdfData = await extractStructuredDataFromPDF(arrayBuffer)
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new CharacterImportError('PDF contains no readable text. This may be a scanned image or corrupted file.')
    }
    
    // Extract character data using geometry-aware heuristics
    const characterData = extractCharacterDataFromStructuredPages(pdfData.structuredPages)
    
    // Validate that we extracted meaningful data
    if (!characterData.name || characterData.name.trim().length === 0) {
      throw new CharacterImportError('Could not find character name in PDF. Please ensure this is a D&D 5e character sheet.')
    }
    
    // Add import metadata
    characterData.importedFrom = 'pdf'
    characterData.importData = {
      rawText: pdfData.text,
      structuredPages: pdfData.structuredPages,
      fileName: file.name,
      fileSize: file.size
    }
    characterData.importedAt = Date.now()
    
    return characterData
    
  } catch (error) {
    if (error instanceof CharacterImportError) {
      throw error
    }
    
    // Handle specific PDF parsing errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF') || error.message.includes('Invalid linearization')) {
        throw new CharacterImportError('Invalid PDF file format. Please ensure this is a valid PDF character sheet.')
      }
      if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new CharacterImportError('Password-protected PDFs are not supported. Please use an unprotected PDF.')
      }
    }
    
    throw new CharacterImportError(`Failed to parse PDF character sheet: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Geometry-aware extraction from PDF with structured data
async function extractStructuredDataFromPDF(arrayBuffer: ArrayBuffer): Promise<PDFParseResult> {
  try {
    const pdf = await getPDFDocument(arrayBuffer)
    let fullText = ''
    const structuredPages: StructuredPage[] = []
    
    // Extract structured data from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const structuredPage = await extractLinesFromPage(page, pageNum)
        structuredPages.push(structuredPage)
        fullText += structuredPage.rawText + '\n'
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNum}:`, pageError)
        // Continue with other pages
      }
    }
    
    return {
      text: fullText.trim(),
      numpages: pdf.numPages,
      structuredPages,
    }
  } catch (error) {
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('worker')) {
        throw new Error('PDF worker failed to load. This may be due to network restrictions. Please try again or use a different PDF.')
      }
      if (error.message.includes('Invalid PDF')) {
        throw new Error('The file does not appear to be a valid PDF document.')
      }
      if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new Error('This PDF is password-protected or encrypted. Please use an unprotected PDF.')
      }
    }
    
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Extract geometry-aware lines from a PDF page
async function extractLinesFromPage(page: any, pageNumber: number): Promise<StructuredPage> {
  const textContent = await page.getTextContent()
  const items = textContent.items
    .filter((item: any) => typeof item.str === 'string' && item.str.trim())
    .map((item: any) => ({
      str: item.str,
      x: Math.round(item.transform[4]),   // x position
      y: Math.round(item.transform[5]),   // y position
      width: item.width,
      height: item.height,
    }))

  // Group by y (rounded), then sort rows by x (left → right)
  const rows = new Map<number, StructuredTextItem[]>()
  for (const item of items) {
    const yKey = Math.round(item.y / 2) * 2 // Group within 2 pixels
    if (!rows.has(yKey)) rows.set(yKey, [])
    rows.get(yKey)!.push(item)
  }

  // Create structured lines sorted top to bottom
  const sortedRowKeys = Array.from(rows.keys()).sort((a, b) => b - a) // top→down
  const lines: StructuredLine[] = sortedRowKeys.map(y => {
    const rowItems = rows.get(y)!
    rowItems.sort((a, b) => a.x - b.x) // left to right
    return {
      y,
      items: rowItems,
      text: rowItems.map(item => item.str).join(' ')
    }
  })

  // Create raw text representation
  const rawText = lines.map(line => line.text).join('\n')

  return {
    pageNumber,
    lines,
    rawText
  }
}

// Main character data extraction using geometry-aware heuristics
export function extractCharacterDataFromStructuredPages(pages: StructuredPage[]): ParsedCharacterData {
  const parseLog: string[] = []
  const confidence: { [key: string]: 'high' | 'medium' | 'low' } = {}
  const uncapturedData: any = {}

  // Combine all text for fallback parsing
  const allText = pages.map(p => p.rawText).join('\n')
  
  parseLog.push(`Processing ${pages.length} pages`)

  // Extract basic identity information
  const name = parseCharacterName(pages, parseLog, confidence)
  const race = parseRace(pages, parseLog, confidence)
  const subrace = parseSubrace(pages, parseLog, confidence)
  const background = parseBackground(pages, parseLog, confidence)
  const alignment = parseAlignment(pages, parseLog, confidence)

  // Extract classes and multiclass information
  const classes = parseClasses(pages, parseLog, confidence)
  const totalLevel = classes.reduce((sum, cls) => sum + cls.level, 0)

  // Extract ability scores using geometry-aware detection
  const abilityScores = parseAbilityScores(pages, parseLog, confidence)

  // Calculate derived values
  const abilityModifiers = {
    strength: calculateAbilityModifier(abilityScores.strength),
    dexterity: calculateAbilityModifier(abilityScores.dexterity),
    constitution: calculateAbilityModifier(abilityScores.constitution),
    intelligence: calculateAbilityModifier(abilityScores.intelligence),
    wisdom: calculateAbilityModifier(abilityScores.wisdom),
    charisma: calculateAbilityModifier(abilityScores.charisma),
  }
  const proficiencyBonus = calculateProficiencyBonus(totalLevel)
  
  // Extract combat stats
  const hitPoints = parseHitPoints(pages, parseLog, confidence)
  const armorClass = parseArmorClass(pages, parseLog, confidence)
  const speeds = parseSpeeds(pages, parseLog, confidence)

  // Extract skills and proficiencies
  const { skills, skillProficiencies } = parseSkillsAndProficiencies(pages, parseLog, confidence)
  const { savingThrows, savingThrowProficiencies } = parseSavingThrows(pages, parseLog, confidence)
  
  // Extract various proficiencies
  const { weaponProficiencies, armorProficiencies, toolProficiencies, languages } = parseProficiencies(pages, parseLog, confidence)
  
  // Extract equipment and items using enhanced parser
  const equipment = parseEquipment(pages, parseLog, confidence)
  
  // Try enhanced parsing if standard parsing found few items
  try {
    const enhancedEquipment = parseEquipmentEnhanced(pages, parseLog, confidence)
    
    // Merge results if enhanced parser found more items
    if (enhancedEquipment && enhancedEquipment.inventory.length > equipment.inventory.length) {
      parseLog.push('Using enhanced equipment parsing results')
      Object.assign(equipment, enhancedEquipment)
    }
  } catch (error) {
    parseLog.push('Enhanced equipment parsing failed, using standard results')
  }

  // Extract features and traits
  const { features, racialTraits } = parseFeaturesAndTraits(pages, parseLog, confidence)

  // Extract spellcasting information
  const spellcasting = parseSpellcasting(pages, classes, abilityModifiers, proficiencyBonus, parseLog, confidence)

  // Extract actions from weapon/spell tables with full combat data
  const parsedActions = parseActions(pages, parseLog, confidence)
  
  // Try enhanced parsing if standard parsing found few actions
  try {
    const enhancedActions = parseActionsEnhanced(pages, parseLog, confidence)
    
    // Merge results if enhanced parser found more actions
    const totalStandardActions = (parsedActions?.weaponAttacks?.length || 0) + 
                                (parsedActions?.spellAttacks?.length || 0) + 
                                (parsedActions?.featureActions?.length || 0)
    const totalEnhancedActions = enhancedActions ? 
                                (enhancedActions.weaponAttacks?.length || 0) + 
                                (enhancedActions.spellAttacks?.length || 0) + 
                                (enhancedActions.featureActions?.length || 0) : 0
    
    if (enhancedActions && totalEnhancedActions > totalStandardActions) {
      parseLog.push('Using enhanced action parsing results')
      Object.assign(parsedActions, enhancedActions)
    }
  } catch (error) {
    parseLog.push('Enhanced action parsing failed, using standard results')
  }

  // Calculate hit dice from classes
  const hitDice = calculateHitDiceFromClasses(classes)

  // Calculate passive scores
  const passivePerception = 10 + abilityModifiers.wisdom + (skills.includes('Perception') ? proficiencyBonus : 0)
  const passiveInvestigation = 10 + abilityModifiers.intelligence + (skills.includes('Investigation') ? proficiencyBonus : 0)
  const passiveInsight = 10 + abilityModifiers.wisdom + (skills.includes('Insight') ? proficiencyBonus : 0)

  // Store any unmapped data
  uncapturedData.rawPages = pages
  uncapturedData.extractedText = allText

  const characterData: ParsedCharacterData = {
    name,
    race,
    subrace,
    classes,
    background,
    alignment,
    level: totalLevel,
    experiencePoints: 0, // Usually not on character sheets
    abilityScores,
    baseAbilityScores: abilityScores, // Assume no bonuses for now
    hitPoints: hitPoints.current || hitPoints.max,
    maxHitPoints: hitPoints.max,
    currentHitPoints: hitPoints.current || hitPoints.max,
    tempHitPoints: hitPoints.temp || 0,
    hitDice,
    armorClass: armorClass.total,
    baseArmorClass: armorClass.base,
    speed: speeds.walking ? `${speeds.walking} ft.` : '30 ft.',
    speeds,
    proficiencyBonus,
    skills,
    skillProficiencies,
    savingThrows,
    savingThrowProficiencies,
    proficiencies: [...weaponProficiencies, ...armorProficiencies, ...toolProficiencies],
    weaponProficiencies,
    armorProficiencies,
    toolProficiencies,
    languages,
    features,
    racialTraits,
    passivePerception,
    passiveInvestigation,
    passiveInsight,
    initiative: abilityModifiers.dexterity,
    equipment: equipment.equipment, // Map equipped items
    inventory: equipment.inventory, // Map inventory items
    
    // Spellcasting
    ...spellcasting,
    
    // Include parsed actions for basic actions field (backward compatibility)
    actions: (parsedActions?.weaponAttacks?.map((a: { name: string }) => a.name) || [])
      .concat(parsedActions?.spellAttacks?.map((a: { name: string }) => a.name) || [])
      .concat(parsedActions?.featureActions?.map((a: { name: string }) => a.name) || []),
    
    // Enhanced parsed data for form mapping
    parsedEquipment: equipment,
    parsedActions: parsedActions,
    
    // Import metadata
    importedFrom: 'pdf',
    uncapturedData,
    confidence,
    parseLog,
  }

  parseLog.push(`Extraction complete. Confidence: ${Object.keys(confidence).filter(k => confidence[k] === 'high').length} high, ${Object.keys(confidence).filter(k => confidence[k] === 'medium').length} medium, ${Object.keys(confidence).filter(k => confidence[k] === 'low').length} low`)
  
  return characterData
}

// Helper function to find text in structured pages
function findTextInPages(pages: StructuredPage[], pattern: RegExp, options: { 
  caseSensitive?: boolean 
  wholeWords?: boolean 
  firstMatch?: boolean 
} = {}): Array<{ text: string, page: number, line: number, confidence: number }> {
  const results: Array<{ text: string, page: number, line: number, confidence: number }> = []
  
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = options.caseSensitive ? line.text : line.text.toLowerCase()
      const searchPattern = options.caseSensitive ? pattern : new RegExp(pattern.source, pattern.flags.includes('i') ? pattern.flags : pattern.flags + 'i')
      
      const match = text.match(searchPattern)
      if (match) {
        let confidence = 0.8 // Base confidence
        
        // Increase confidence based on context
        if (lineIdx < 5) confidence += 0.1 // Early in document
        if (match[1] && match[1].trim().length > 0) confidence += 0.1 // Has captured content
        
        results.push({
          text: match[1] || match[0],
          page: page.pageNumber,
          line: lineIdx,
          confidence: Math.min(1.0, confidence)
        })
        
        if (options.firstMatch) break
      }
    }
    if (options.firstMatch && results.length > 0) break
  }
  
  return results.sort((a, b) => b.confidence - a.confidence)
}

// Helper function to clean extracted text and remove placeholder content
function cleanExtractedText(text: string, fieldType: 'name' | 'race' | 'background'): string {
  if (!text) return text
  
  // Remove common placeholder text patterns
  const placeholderPatterns = [
    /species\s+background\s+experience\s+points/gi,
    /background\s+experience\s+points/gi,
    /species\s+background/gi,
    /experience\s+points/gi,
    /background\s+experience/gi,
    /species\s+experience/gi,
  ]
  
  let cleaned = text.trim()
  
  // Apply placeholder pattern removal
  for (const pattern of placeholderPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  // Additional field-specific cleaning
  switch (fieldType) {
    case 'name':
      // Names should be relatively short and not contain certain words
      if (cleaned.length > 50 || 
          cleaned.toLowerCase().includes('species') || 
          cleaned.toLowerCase().includes('background') || 
          cleaned.toLowerCase().includes('experience')) {
        return ''
      }
      break
    case 'race':
      // Races should be relatively short and not contain certain words
      if (cleaned.length > 30 || 
          cleaned.toLowerCase().includes('background') || 
          cleaned.toLowerCase().includes('experience')) {
        return ''
      }
      break
    case 'background':
      // Backgrounds should be relatively short and not contain certain words
      if (cleaned.length > 30 || 
          cleaned.toLowerCase().includes('species') || 
          cleaned.toLowerCase().includes('experience')) {
        return ''
      }
      break
  }
  
  return cleaned
}

// Parse character name
function parseCharacterName(pages: StructuredPage[], parseLog: string[], confidence: any): string {
  const namePatterns = [
    /(?:character\s*name|name)[:\s]*([^\n\r]{1,50})/i,
    /^([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s*$/m, // Capitalized name on its own line
  ]
  
  for (const pattern of namePatterns) {
    const matches = findTextInPages(pages, pattern, { firstMatch: true })
    if (matches.length > 0) {
      const name = cleanExtractedText(matches[0].text, 'name')
      if (name) {
        const cleanedName = cleanName(name)
        confidence.name = matches[0].confidence > 0.7 ? 'high' : 'medium'
        parseLog.push(`Found character name: "${cleanedName}" (confidence: ${confidence.name})`)
        return cleanedName
      }
    }
  }
  
  // Enhanced fallback: Look for names in the first few lines or prominent positions
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < Math.min(10, page.lines.length); lineIdx++) {
      const line = page.lines[lineIdx]
      
      // Look for single capitalized words that could be names
      const words = line.text.split(/\s+/)
      for (const word of words) {
        // Check if word looks like a name (capitalized, 3+ characters, contains only letters)
        if (/^[A-Z][a-z]{2,}$/.test(word) && word.length >= 3) {
          // Additional validation - not common words or placeholder text
          const commonWords = ['The', 'Character', 'Name', 'Class', 'Level', 'Race', 'Background', 'Player', 'Species', 'Experience']
          if (!commonWords.includes(word)) {
            confidence.name = 'medium'
            parseLog.push(`Found potential character name: "${word}" (confidence: ${confidence.name})`)
            return word
          }
        }
      }
      
      // Also check for names with specific positioning (first significant text item)
      if (line.items.length > 0) {
        const firstItem = line.items[0]
        if (firstItem.str.length >= 3 && /^[A-Z][a-z]+$/.test(firstItem.str)) {
          const commonWords = ['The', 'Character', 'Name', 'Class', 'Level', 'Race', 'Background', 'Player', 'Species', 'Experience']
          if (!commonWords.includes(firstItem.str)) {
            confidence.name = 'medium'
            parseLog.push(`Found character name from position: "${firstItem.str}" (confidence: ${confidence.name})`)
            return firstItem.str
          }
        }
      }
    }
  }
  
  confidence.name = 'low'
  parseLog.push('Could not find character name, using default')
  return 'Unknown Character'
}

// Parse race
function parseRace(pages: StructuredPage[], parseLog: string[], confidence: any): string {
  const racePatterns = [
    /(?:race)[:\s]*([^\n\r]{1,30})/i,
    /(?:species)[:\s]*([^\n\r]{1,30})/i,
  ]
  
  for (const pattern of racePatterns) {
    const matches = findTextInPages(pages, pattern, { firstMatch: true })
    if (matches.length > 0) {
      const race = cleanExtractedText(matches[0].text, 'race')
      if (race) {
        const validatedRace = validateRace(race)
        confidence.race = matches[0].confidence > 0.7 ? 'high' : 'medium'
        parseLog.push(`Found race: "${validatedRace}" (confidence: ${confidence.race})`)
        return validatedRace
      }
    }
  }
  
  confidence.race = 'low'
  parseLog.push('Could not find race, using default')
  return 'Human'
}

// Parse subrace
function parseSubrace(pages: StructuredPage[], parseLog: string[], confidence: any): string | undefined {
  const subracePatterns = [
    /(?:subrace)[:\s]*([^\n\r]+)/i,
    /(?:sub-race)[:\s]*([^\n\r]+)/i,
  ]
  
  for (const pattern of subracePatterns) {
    const matches = findTextInPages(pages, pattern, { firstMatch: true })
    if (matches.length > 0) {
      const subrace = matches[0].text.trim()
      if (subrace && subrace.toLowerCase() !== 'none') {
        confidence.subrace = matches[0].confidence > 0.7 ? 'high' : 'medium'
        parseLog.push(`Found subrace: "${subrace}" (confidence: ${confidence.subrace})`)
        return subrace
      }
    }
  }
  
  parseLog.push('No subrace found')
  return undefined
}

// Parse background
function parseBackground(pages: StructuredPage[], parseLog: string[], confidence: any): string {
  const backgroundPatterns = [
    /(?:background)[:\s]*([^\n\r]{1,30})/i,
  ]
  
  for (const pattern of backgroundPatterns) {
    const matches = findTextInPages(pages, pattern, { firstMatch: true })
    if (matches.length > 0) {
      const background = cleanExtractedText(matches[0].text, 'background')
      if (background) {
        confidence.background = matches[0].confidence > 0.7 ? 'high' : 'medium'
        parseLog.push(`Found background: "${background}" (confidence: ${confidence.background})`)
        return background
      }
    }
  }
  
  confidence.background = 'low'
  parseLog.push('Could not find background, using default')
  return 'Folk Hero'
}

// Parse alignment
function parseAlignment(pages: StructuredPage[], parseLog: string[], confidence: any): string | undefined {
  const alignmentPatterns = [
    /(?:alignment)[:\s]*([^\n\r]+)/i,
  ]
  
  const validAlignments = [
    'Lawful Good', 'Neutral Good', 'Chaotic Good',
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
  ]
  
  for (const pattern of alignmentPatterns) {
    const matches = findTextInPages(pages, pattern, { firstMatch: true })
    if (matches.length > 0) {
      const alignmentText = matches[0].text.trim()
      const alignment = validAlignments.find(a => 
        a.toLowerCase() === alignmentText.toLowerCase() ||
        alignmentText.toLowerCase().includes(a.toLowerCase().split(' ')[0]) &&
        alignmentText.toLowerCase().includes(a.toLowerCase().split(' ')[1])
      )
      
      if (alignment) {
        confidence.alignment = matches[0].confidence > 0.7 ? 'high' : 'medium'
        parseLog.push(`Found alignment: "${alignment}" (confidence: ${confidence.alignment})`)
        return alignment
      }
    }
  }
  
  parseLog.push('No alignment found')
  return undefined
}



// Enhanced skills and proficiencies parsing
function parseSkillsAndProficiencies(pages: StructuredPage[], parseLog: string[], confidence: any): any {
  const skills: string[] = []
  const skillProficiencies: string[] = []
  let foundSkills = 0
  
  // D&D 5e skills list for matching
  const DND_SKILLS = [
    'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
    'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
    'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
    'Sleight of Hand', 'Stealth', 'Survival'
  ]
  
  // Strategy 1: Look for filled circles or checkmarks next to skill names
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = line.text.toLowerCase()
      
      // Check each skill
      for (const skill of DND_SKILLS) {
        const skillLower = skill.toLowerCase()
        
        // Look for patterns indicating proficiency
        const patterns = [
          new RegExp(`●\\s*${skillLower}`, 'i'), // Filled circle
          new RegExp(`\\[x\\]\\s*${skillLower}`, 'i'), // Checked box
          new RegExp(`✓\\s*${skillLower}`, 'i'), // Checkmark
          new RegExp(`${skillLower}\\s*●`, 'i'), // Skill followed by filled circle
          new RegExp(`${skillLower}.*proficient`, 'i'), // Explicit proficiency mention
        ]
        
        for (const pattern of patterns) {
          if (pattern.test(text) && !skillProficiencies.includes(skill)) {
            skills.push(skill)
            skillProficiencies.push(skill)
            foundSkills++
            parseLog.push(`Found skill proficiency: ${skill}`)
            break
          }
        }
        
        // Also check if skill name appears with a modifier suggesting proficiency
        if (text.includes(skillLower)) {
          // Look for ability score modifiers or bonus numbers
          const modifierPattern = new RegExp(`${skillLower}.*?([+-]\\d+)`, 'i')
          const match = text.match(modifierPattern)
          if (match && !skills.includes(skill)) {
            const modifier = parseInt(match[1])
            // If modifier is significantly higher than base ability, likely proficient
            if (modifier >= 3) {
              skills.push(skill)
              skillProficiencies.push(skill)
              foundSkills++
              parseLog.push(`Inferred skill proficiency from modifier: ${skill} (${modifier})`)
            }
          }
        }
      }
    }
  }
  
  // Strategy 2: Look for skills section and parse systematically
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      
      if (/skills?/i.test(line.text)) {
        // Found skills section, parse surrounding lines
        const startIdx = Math.max(0, lineIdx - 2)
        const endIdx = Math.min(page.lines.length, lineIdx + 15)
        
        for (let i = startIdx; i < endIdx; i++) {
          const skillLine = page.lines[i]
          
          for (const skill of DND_SKILLS) {
            if (skillLine.text.toLowerCase().includes(skill.toLowerCase()) && 
                !skills.includes(skill)) {
              // Check for indicators of proficiency nearby
              const hasIndicator = /[●✓]|proficient|expert/i.test(skillLine.text)
              if (hasIndicator) {
                skills.push(skill)
                skillProficiencies.push(skill)
                foundSkills++
                parseLog.push(`Found skill in skills section: ${skill}`)
              }
            }
          }
        }
      }
    }
  }
  
  confidence.skills = foundSkills >= 3 ? 'high' : foundSkills >= 1 ? 'medium' : 'low'
  parseLog.push(`Found ${foundSkills} skill proficiencies (confidence: ${confidence.skills})`)
  
  return { skills, skillProficiencies }
}

function parseSavingThrows(pages: StructuredPage[], parseLog: string[], confidence: any): any {
  const savingThrows: string[] = []
  const savingThrowProficiencies: string[] = []
  let foundSaves = 0
  
  const ABILITY_SAVES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']
  const ABILITY_SHORT = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
  
  // Strategy 1: Look for saving throw section
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      
      if (/saving\s*throws?/i.test(line.text)) {
        // Found saving throws section, parse surrounding lines
        const startIdx = Math.max(0, lineIdx - 2)
        const endIdx = Math.min(page.lines.length, lineIdx + 10)
        
        for (let i = startIdx; i < endIdx; i++) {
          const saveLine = page.lines[i]
          
          for (let j = 0; j < ABILITY_SAVES.length; j++) {
            const ability = ABILITY_SAVES[j]
            const abilityShort = ABILITY_SHORT[j]
            
            // Check for proficiency indicators
            const hasAbility = saveLine.text.toLowerCase().includes(ability.toLowerCase()) ||
                              saveLine.text.toLowerCase().includes(abilityShort.toLowerCase())
            
            if (hasAbility) {
              const hasIndicator = /[●✓]|proficient/i.test(saveLine.text)
              if (hasIndicator && !savingThrowProficiencies.includes(ability)) {
                savingThrows.push(ability)
                savingThrowProficiencies.push(ability)
                foundSaves++
                parseLog.push(`Found saving throw proficiency: ${ability}`)
              }
            }
          }
        }
      }
    }
  }
  
  // Strategy 2: Look for individual saving throw patterns
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      
      for (let j = 0; j < ABILITY_SAVES.length; j++) {
        const ability = ABILITY_SAVES[j]
        const abilityShort = ABILITY_SHORT[j]
        
        // Pattern like "Dexterity +5" or "DEX +5" indicating proficiency
        const patterns = [
          new RegExp(`${ability}\\s*[+]\\d+`, 'i'),
          new RegExp(`${abilityShort}\\s*[+]\\d+`, 'i'),
          new RegExp(`${ability}\\s*save`, 'i')
        ]
        
        for (const pattern of patterns) {
          if (pattern.test(line.text) && !savingThrowProficiencies.includes(ability)) {
            // Extract the modifier to see if it suggests proficiency
            const modMatch = line.text.match(/[+](\d+)/)
            if (modMatch) {
              const modifier = parseInt(modMatch[1])
              // If modifier is 2 or higher, likely has proficiency
              if (modifier >= 2) {
                savingThrows.push(ability)
                savingThrowProficiencies.push(ability)
                foundSaves++
                parseLog.push(`Inferred saving throw proficiency: ${ability} (+${modifier})`)
                break
              }
            }
          }
        }
      }
    }
  }
  
  confidence.savingThrows = foundSaves >= 2 ? 'high' : foundSaves >= 1 ? 'medium' : 'low'
  parseLog.push(`Found ${foundSaves} saving throw proficiencies (confidence: ${confidence.savingThrows})`)
  
  return { savingThrows, savingThrowProficiencies }
}

function parseProficiencies(pages: StructuredPage[], parseLog: string[], confidence: any): any {
  const weaponProficiencies: string[] = []
  const armorProficiencies: string[] = []
  const toolProficiencies: string[] = []
  const languages: string[] = []
  let foundProfs = 0
  
  // Common proficiency types to look for
  const WEAPON_TYPES = [
    'Simple weapons', 'Martial weapons', 'Light armor', 'Medium armor', 'Heavy armor',
    'Shields', 'Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light crossbow',
    'Scimitar', 'Shortsword', 'Longsword', 'Rapier', 'Shortbow', 'Longbow'
  ]
  
  const ARMOR_TYPES = [
    'Light armor', 'Medium armor', 'Heavy armor', 'Shields', 
    'Leather armor', 'Studded leather', 'Chain shirt', 'Scale mail',
    'Chain mail', 'Splint armor', 'Plate armor'
  ]
  
  const COMMON_TOOLS = [
    "Thieves' tools", 'Herbalism kit', 'Disguise kit', 'Forgery kit',
    'Vehicles (land)', 'Vehicles (water)', 'Navigator\'s tools',
    'Carpenter\'s tools', 'Smith\'s tools', 'Tinker\'s tools'
  ]
  
  const COMMON_LANGUAGES = [
    'Common', 'Elvish', 'Dwarvish', 'Halfling', 'Draconic', 'Giant',
    'Gnomish', 'Goblin', 'Orc', 'Abyssal', 'Celestial', 'Infernal'
  ]
  
  // Strategy 1: Look for dedicated proficiency sections
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      
      // Check for proficiency section headers
      if (/proficienc(?:y|ies)/i.test(line.text) || /languages?/i.test(line.text)) {
        // Parse surrounding lines for proficiencies
        const startIdx = Math.max(0, lineIdx)
        const endIdx = Math.min(page.lines.length, lineIdx + 20)
        
        for (let i = startIdx; i < endIdx; i++) {
          const profLine = page.lines[i].text
          
          // Check for weapons
          for (const weapon of WEAPON_TYPES) {
            if (profLine.toLowerCase().includes(weapon.toLowerCase()) && 
                !weaponProficiencies.includes(weapon)) {
              weaponProficiencies.push(weapon)
              foundProfs++
              parseLog.push(`Found weapon proficiency: ${weapon}`)
            }
          }
          
          // Check for armor
          for (const armor of ARMOR_TYPES) {
            if (profLine.toLowerCase().includes(armor.toLowerCase()) && 
                !armorProficiencies.includes(armor)) {
              armorProficiencies.push(armor)
              foundProfs++
              parseLog.push(`Found armor proficiency: ${armor}`)
            }
          }
          
          // Check for tools
          for (const tool of COMMON_TOOLS) {
            if (profLine.toLowerCase().includes(tool.toLowerCase()) && 
                !toolProficiencies.includes(tool)) {
              toolProficiencies.push(tool)
              foundProfs++
              parseLog.push(`Found tool proficiency: ${tool}`)
            }
          }
          
          // Check for languages
          for (const language of COMMON_LANGUAGES) {
            if (profLine.toLowerCase().includes(language.toLowerCase()) && 
                !languages.includes(language)) {
              languages.push(language)
              foundProfs++
              parseLog.push(`Found language: ${language}`)
            }
          }
        }
      }
    }
  }
  
  // Strategy 2: Look for specific patterns throughout the document
  for (const page of pages) {
    for (const line of page.lines) {
      const text = line.text
      
      // Look for equipment section patterns
      if (/equipment|gear|items/i.test(text)) {
        // Check for armor and weapons in equipment lists
        for (const weapon of WEAPON_TYPES) {
          if (text.toLowerCase().includes(weapon.toLowerCase()) && 
              !weaponProficiencies.includes(weapon)) {
            weaponProficiencies.push(weapon)
            foundProfs++
            parseLog.push(`Inferred weapon proficiency from equipment: ${weapon}`)
          }
        }
      }
      
      // Look for racial trait patterns that mention languages
      if (/languages?|speak|read|write/i.test(text)) {
        for (const language of COMMON_LANGUAGES) {
          if (text.toLowerCase().includes(language.toLowerCase()) && 
              !languages.includes(language)) {
            languages.push(language)
            foundProfs++
            parseLog.push(`Found language from traits: ${language}`)
          }
        }
      }
    }
  }
  
  confidence.proficiencies = foundProfs >= 3 ? 'high' : foundProfs >= 1 ? 'medium' : 'low'
  parseLog.push(`Found ${foundProfs} total proficiencies (confidence: ${confidence.proficiencies})`)
  
  return { 
    weaponProficiencies, 
    armorProficiencies, 
    toolProficiencies, 
    languages 
  }
}

function parseEquipment(pages: StructuredPage[], parseLog: string[], confidence: any): any {
  // Enhanced categorized equipment arrays for the improved schema
  const weapons: any[] = []
  const armor: any[] = []
  const gear: any[] = []
  const tools: any[] = []
  const ammunition: any[] = []
  const potions: any[] = []
  const books: any[] = []
  const valuables: any[] = []
  const currency: { copper?: number; silver?: number; electrum?: number; gold?: number; platinum?: number } = {}
  
  // Legacy inventory for backward compatibility
  const inventory: Array<{ name: string; quantity: number; description?: string; weight?: number; value?: number; type: 'weapon' | 'armor' | 'tool' | 'gear' | 'ammunition' | 'potion' | 'book' | 'valuable' | 'currency' }> = []
  const equipment: { headgear?: string; armwear?: string; chestwear?: string; legwear?: string; footwear?: string; mainHand?: string; offHand?: string; accessories: string[] } = { accessories: [] }
  let foundEquipment = 0
  
  parseLog.push('Parsing equipment and items...')
  
  // Helper function to add item to both legacy and enhanced formats
  const addItemToLists = (itemName: string, itemType: string, quantity: number, weight?: number, value?: number, description?: string, equipped?: boolean, properties?: any) => {
    // Add to legacy inventory
    inventory.push({
      name: itemName,
      quantity,
      type: itemType as any,
      weight,
      value,
      description
    })
    
    // Create enhanced item object
    const enhancedItem = {
      name: itemName,
      type: itemType,
      quantity,
      weight,
      value,
      notes: description,
      equipped: equipped || false,
      properties
    }
    
    // Add to appropriate categorized array
    switch (itemType) {
      case 'weapon':
        weapons.push(enhancedItem)
        break
      case 'armor':
        armor.push(enhancedItem)
        break
      case 'tool':
        tools.push(enhancedItem)
        break
      case 'ammunition':
        ammunition.push(enhancedItem)
        break
      case 'potion':
        potions.push(enhancedItem)
        break
      case 'book':
        books.push(enhancedItem)
        break
      case 'valuable':
        valuables.push(enhancedItem)
        break
      default:
        gear.push(enhancedItem)
        break
    }
    
    // Enhanced equipment slot assignment
    assignEquipmentSlot(itemName, itemType, equipment, parseLog)
    foundEquipment++
  }
  
  // Enhanced equipment categories with more comprehensive coverage
  const WEAPONS = [
    'Dagger', 'Dart', 'Handaxe', 'Javelin', 'Light Hammer', 'Mace', 'Quarterstaff',
    'Sickle', 'Spear', 'Light Crossbow', 'Shortbow', 'Sling', 'Battleaxe', 'Flail',
    'Glaive', 'Greataxe', 'Greatsword', 'Halberd', 'Lance', 'Longsword', 'Maul',
    'Morningstar', 'Pike', 'Rapier', 'Scimitar', 'Shortsword', 'Trident', 'War Pick',
    'Warhammer', 'Whip', 'Blowgun', 'Hand Crossbow', 'Heavy Crossbow', 'Longbow', 'Net',
    'Crossbow', 'Bow', 'Sword', 'Axe', 'Hammer', 'Staff', 'Club', 'Mace', 'Spear',
    'Polearm', 'Halberd', 'Glaive', 'Pike', 'Lance', 'Rapier', 'Scimitar', 'Dagger',
    'Throwing', 'Ranged', 'Melee', 'Simple', 'Martial', 'Exotic'
  ]
  
  const ARMOR = [
    'Leather armor', 'Studded leather', 'Hide armor', 'Chain shirt', 'Scale mail',
    'Breastplate', 'Half plate', 'Ring mail', 'Chain mail', 'Splint armor', 'Plate armor',
    'Shield', 'Buckler', 'Padded', 'Leather', 'Studded', 'Hide', 'Chain', 'Scale',
    'Breastplate', 'Half', 'Ring', 'Splint', 'Plate', 'Helmet', 'Gauntlets', 'Greaves',
    'Boots', 'Gloves', 'Bracers', 'Girdle', 'Cloak', 'Robe', 'Vest', 'Tunic'
  ]
  
  const ADVENTURING_GEAR = [
    'Backpack', 'Bedroll', 'Blanket', 'Rope', 'Grappling hook', 'Torch', 'Lantern',
    'Oil flask', 'Rations', 'Waterskin', 'Tinderbox', 'Crowbar', 'Hammer', 'Piton',
    'Tent', 'Manacles', 'Chain', 'Lock', 'Key', 'Spyglass', 'Magnifying glass',
    'Sealing wax', 'Signet ring', 'Parchment', 'Ink', 'Ink pen', 'Quill', 'Bag',
    'Pouch', 'Sack', 'Chest', 'Trunk', 'Barrel', 'Cask', 'Bottle', 'Vial', 'Flask',
    'Cup', 'Bowl', 'Plate', 'Utensil', 'Tool', 'Kit', 'Set', 'Pack', 'Bundle'
  ]
  
  const TOOLS = [
    "Thieves' tools", 'Artisan tools', 'Disguise kit', 'Forgery kit', 'Herbalism kit',
    'Poisoner kit', 'Alchemist supplies', 'Brewer supplies', 'Calligrapher supplies',
    'Carpenter tools', 'Cartographer tools', 'Cobbler tools', 'Cook utensils',
    'Glassblower tools', 'Jeweler tools', 'Leatherworker tools', 'Mason tools',
    'Painter supplies', 'Potter tools', 'Smith tools', 'Tinker tools', 'Weaver tools',
    'Woodcarver tools', 'Navigator tools', 'Gaming set', 'Musical instrument',
    'Tool', 'Kit', 'Supplies', 'Equipment', 'Instrument', 'Set'
  ]

  const AMMUNITION = [
    'Arrow', 'Bolt', 'Dart', 'Bullet', 'Pellet', 'Stone', 'Rock', 'Shuriken',
    'Javelin', 'Spear', 'Dagger', 'Axe', 'Hammer', 'Mace', 'Club', 'Staff',
    'Quiver', 'Case', 'Pouch', 'Bundle', 'Pack', 'Set'
  ]

  const POTIONS = [
    'Potion', 'Elixir', 'Tonic', 'Brew', 'Draught', 'Philter', 'Tincture',
    'Healing', 'Cure', 'Restore', 'Enhance', 'Boost', 'Protection', 'Resistance'
  ]

  const BOOKS = [
    'Book', 'Tome', 'Manual', 'Guide', 'Text', 'Scroll', 'Grimoire', 'Spellbook',
    'Journal', 'Diary', 'Ledger', 'Ledger', 'Map', 'Chart', 'Diagram', 'Blueprint'
  ]

  const VALUABLES = [
    'Gem', 'Jewel', 'Crystal', 'Pearl', 'Diamond', 'Ruby', 'Sapphire', 'Emerald',
    'Gold', 'Silver', 'Platinum', 'Copper', 'Electrum', 'Ingot', 'Bar', 'Coin',
    'Ring', 'Necklace', 'Bracelet', 'Crown', 'Tiara', 'Medallion', 'Amulet'
  ]
  
  // Strategy 1: Look for equipment sections with more flexible patterns
  const equipmentHeaders = [
    /^additional\s+equipment/i,
    /^equipment/i,
    /^gear/i,
    /^inventory/i,
    /^possessions/i,
    /^carrying/i,
    /^wearing/i,
    /^wielding/i,
    /^armed/i,
    /^equipped/i,
    /^belongings/i,
    /^stuff/i,
    /^things/i,
    /^tools/i,
    /^weapons/i,
    /^armor/i,
    /^items?/i,
    /^stuff/i,
    /^belongings/i
  ]

  const equipmentTablePatterns = [
    /^item\s+quantity\s+weight\s+value/i,
    /^equipment\s+quantity\s+weight/i,
    /^gear\s+quantity/i,
    /^name\s+amount\s+weight/i,
    /^description\s+qty\s+wt/i,
    /^name\s+qty\s+weight/i
  ]

  const equipmentListPatterns = [
    /^[•·▪▫-]\s+/,           // Bullet points
    /^\d+\.\s+/,             // Numbered lists
    /^[a-z]\)\s+/i,          // Lettered lists
    /^[a-z]\.\s+/i,          // Lettered lists with period
    /^[ivx]+\.\s+/i,         // Roman numerals
    /^[A-Z]\.\s+/            // Capital letters
  ]

  // Debug logging for all text to help identify equipment sections
  parseLog.push('=== SEARCHING FOR EQUIPMENT SECTIONS ===')
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = line.text.trim()
      
      // Log interesting lines that might contain equipment
      if (text.length > 2 && text.length < 100) {
        parseLog.push(`Line ${lineIdx}: "${text}"`)
      }
    }
  }
  
  // Strategy 1: Look for D&D Beyond specific equipment sections
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = line.text
      
      // Check for equipment section headers
      const isEquipmentHeader = equipmentHeaders.some(pattern => pattern.test(text)) ||
                               equipmentTablePatterns.some(pattern => pattern.test(text)) ||
                               equipmentListPatterns.some(pattern => pattern.test(text))
      
      if (isEquipmentHeader && text.length <= 100) {
        parseLog.push(`Found equipment section at line ${lineIdx}: "${text}"`)
        
        // Parse surrounding lines for equipment with increased range
        const startIdx = lineIdx + 1
        const endIdx = Math.min(page.lines.length, lineIdx + 100) // Increased range
        
        for (let i = startIdx; i < endIdx; i++) {
          const equipLine = page.lines[i]
          const equipText = equipLine.text.trim()
          
          // Skip empty lines and section breaks
          if (!equipText || equipText.length < 2) continue
          
          // Stop if we hit another major section
          if (/^(SPELLS?|FEATURES?|ACTIONS?|ATTACKS?|SKILLS?|PROFICIENCIES?|LANGUAGES?|ADDITIONAL\s+FEATURES)/i.test(equipText)) break
          
          // Enhanced Pattern 1: D&D Beyond table format with NAME, QTY, WEIGHT columns
          // Format: "Studded Leather    1    13 lb."
          const tableRowMatch = equipText.match(/^([A-Za-z\s\-']+?)\s+(\d+)\s+([\d.]+)\s*(?:lb|pound|weight)?/i)
          if (tableRowMatch) {
            const itemName = tableRowMatch[1].trim()
            const quantity = parseInt(tableRowMatch[2])
            const weight = parseFloat(tableRowMatch[3])
            
            const itemType = categorizeItemEnhanced(itemName, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS, AMMUNITION, POTIONS, BOOKS, VALUABLES)
            if (itemType) {
              addItemToLists(itemName, itemType, quantity, weight, undefined, undefined, true)
              parseLog.push(`Found D&D Beyond equipment: ${itemName} (${quantity}) - ${weight} lb`)
            }
          }
          
          // Enhanced Pattern 2: Item with quantity and optional details
          // Format: "Arrow (20)", "Gold pieces (150)", "Longsword +1 (magical)"
          const quantityMatch = equipText.match(/^([A-Za-z\s\-']+?)\s*(?:\(([^)]+)\))?\s*(?:\(([^)]+)\))?/)
          if (quantityMatch && !tableRowMatch) {
            const itemName = quantityMatch[1].trim()
            const firstParen = quantityMatch[2] || ''
            const secondParen = quantityMatch[3] || ''
            
            // Determine if first parenthesis is quantity or properties
            let quantity = 1
            let properties = ''
            
            if (/^\d+$/.test(firstParen)) {
              quantity = parseInt(firstParen)
              properties = secondParen
            } else if (firstParen && !/^\d+$/.test(firstParen)) {
              properties = firstParen
            }
            
            const itemType = categorizeItemEnhanced(itemName, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS, AMMUNITION, POTIONS, BOOKS, VALUABLES)
            if (itemType) {
              addItemToLists(itemName, itemType, quantity, undefined, undefined, properties || undefined, true)
              parseLog.push(`Found equipment with quantity: ${itemName} (${quantity})${properties ? ` - ${properties}` : ''}`)
            }
          }
          
          // Enhanced Pattern 3: Simple item list with better categorization
          else if (!tableRowMatch && !quantityMatch) {
            // Check each equipment category with enhanced matching
            const itemType = categorizeItemEnhanced(equipText, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS, AMMUNITION, POTIONS, BOOKS, VALUABLES)
            if (itemType && !inventory.some(e => e.name.toLowerCase() === equipText.toLowerCase())) {
              // Add to inventory
              inventory.push({
                name: equipText,
                quantity: 1,
                type: itemType as any
              })
              
              // Enhanced equipment slot detection
              assignEquipmentSlot(equipText, itemType, equipment, parseLog)
              
              foundEquipment++
              parseLog.push(`Found equipment: ${equipText} (${itemType})`)
            }
          }
          
          // Enhanced Pattern 4: Bulleted or numbered lists with better parsing
          if (equipmentListPatterns.some(pattern => pattern.test(equipText))) {
            const itemText = equipText.replace(/^[•·▪▫-]\s+/, '').replace(/^\d+\.\s+/, '').replace(/^[a-z]\)\s+/i, '').replace(/^[a-z]\.\s+/i, '').replace(/^[ivx]+\.\s+/i, '').replace(/^[A-Z]\.\s+/, '').trim()
            const itemType = categorizeItemEnhanced(itemText, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS, AMMUNITION, POTIONS, BOOKS, VALUABLES)
            
            if (itemType && !inventory.some(e => e.name.toLowerCase() === itemText.toLowerCase())) {
              // Add to inventory
              inventory.push({
                name: itemText,
                quantity: 1,
                type: itemType as any
              })
              
              // Enhanced equipment slot detection
              assignEquipmentSlot(itemText, itemType, equipment, parseLog)
              
              foundEquipment++
              parseLog.push(`Found bulleted equipment: ${itemText} (${itemType})`)
            }
          }
        }
      }
    }
  }
  
  // Strategy 2: Look for equipment mentioned in weapon attack tables and other sections
  for (const page of pages) {
    for (const line of page.lines) {
      const text = line.text.trim()
      
      // Look for weapon attack entries that might indicate equipment
      if (/^[A-Za-z\s\-']+\s+\+\d+\s+to\s+hit/i.test(text)) {
        const weaponMatch = text.match(/^([A-Za-z\s\-']+)/)
        if (weaponMatch) {
          const weaponName = weaponMatch[1].trim()
          
          // Check if this weapon is already in inventory
          if (!inventory.some(e => e.name.toLowerCase() === weaponName.toLowerCase())) {
            const itemType = categorizeItemEnhanced(weaponName, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS, AMMUNITION, POTIONS, BOOKS, VALUABLES)
            if (itemType) {
              inventory.push({
                name: weaponName,
                quantity: 1,
                type: itemType as any,
                description: 'Found in weapon attacks section'
              })
              
              assignEquipmentSlot(weaponName, itemType, equipment, parseLog)
              foundEquipment++
              parseLog.push(`Found weapon from attack table: ${weaponName}`)
            }
          }
        }
      }
      
      // Look for "wearing", "wielding", "carrying", "equipped with" patterns
      if (/wearing|wielding|carrying|equipped\s+with|armed\s+with|has|owns|possesses/i.test(text)) {
        // Extract items mentioned in these contexts
        const allItems = [...WEAPONS, ...ARMOR, ...ADVENTURING_GEAR, ...TOOLS, ...AMMUNITION, ...POTIONS, ...BOOKS, ...VALUABLES]
        
        for (const item of allItems) {
          if (text.toLowerCase().includes(item.toLowerCase()) && 
              !inventory.some(e => e.name.toLowerCase() === item.toLowerCase())) {
            
            const itemType = categorizeItemEnhanced(item, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS, AMMUNITION, POTIONS, BOOKS, VALUABLES)
            if (itemType) {
              // Add to inventory
              inventory.push({
                name: item,
                quantity: 1,
                type: itemType as any,
                description: 'Mentioned as equipped'
              })
              
              // Enhanced equipment slot detection
              assignEquipmentSlot(item, itemType, equipment, parseLog)
              foundEquipment++
              parseLog.push(`Found equipped item: ${item}`)
            }
          }
        }
      }
      
      // Enhanced currency patterns with better detection
      const currencyPatterns = [
        /(\d+)\s*(gold|silver|copper|platinum|gp|sp|cp|pp|ep)/i,
        /(\d+)\s*(gold\s+pieces?|silver\s+pieces?|copper\s+pieces?|platinum\s+pieces?|electrum\s+pieces?)/i,
        /(\d+)\s*(gp|sp|cp|pp|ep)\s*coins?/i,
        /(\d+)\s*coins?\s*(gold|silver|copper|platinum|electrum)/i
      ]
      
      for (const pattern of currencyPatterns) {
        const currencyMatch = text.match(pattern)
        if (currencyMatch) {
          const amount = parseInt(currencyMatch[1])
          const currencyType = currencyMatch[2].toLowerCase()
          
          const currencyName = currencyType === 'gp' || currencyType === 'gold' ? 'Gold pieces' :
                              currencyType === 'sp' || currencyType === 'silver' ? 'Silver pieces' :
                              currencyType === 'cp' || currencyType === 'copper' ? 'Copper pieces' :
                              currencyType === 'pp' || currencyType === 'platinum' ? 'Platinum pieces' :
                              currencyType === 'ep' || currencyType === 'electrum' ? 'Electrum pieces' :
                              `${currencyType.charAt(0).toUpperCase() + currencyType.slice(1)} pieces`
          
          // Add currency to currency object
          if (currencyType === 'gp' || currencyType === 'gold') {
            currency.gold = (currency.gold || 0) + amount
          } else if (currencyType === 'sp' || currencyType === 'silver') {
            currency.silver = (currency.silver || 0) + amount
          } else if (currencyType === 'cp' || currencyType === 'copper') {
            currency.copper = (currency.copper || 0) + amount
          } else if (currencyType === 'pp' || currencyType === 'platinum') {
            currency.platinum = (currency.platinum || 0) + amount
          } else if (currencyType === 'ep' || currencyType === 'electrum') {
            currency.electrum = (currency.electrum || 0) + amount
          }
          
          // Also add to inventory for display
          if (!inventory.some(e => e.name.toLowerCase().includes(currencyType))) {
            inventory.push({
              name: currencyName,
              quantity: amount,
              type: 'currency'
            })
            foundEquipment++
            parseLog.push(`Found currency: ${amount} ${currencyName}`)
          }
        }
      }
    }
  }

  // Strategy 3: Comprehensive item scanning throughout the document
  parseLog.push('Performing comprehensive item scan...')
  for (const page of pages) {
    for (const line of page.lines) {
      const text = line.text.trim()
      
      // Skip very short lines and headers
      if (text.length < 3 || text.length > 200) continue
      
      // Look for common item patterns that might be missed
      // Pattern: Item name followed by quantity or properties
      const itemPatterns = [
        /^([A-Za-z\s\-']+?)\s*\((\d+)\)/i,           // "Item (5)"
        /^([A-Za-z\s\-']+?)\s*\(([^)]+)\)/i,         // "Item (property)"
        /^([A-Za-z\s\-']+?)\s*\+\d+/i,               // "Item +5"
        /^([A-Za-z\s\-']+?)\s*\d+d\d+/i,             // "Item 1d6"
        /^([A-Za-z\s\-']+?)\s*:\s*/i,                // "Item: description"
        /^([A-Za-z\s\-']+?)\s*-\s*/i,                // "Item - description"
        /^([A-Za-z\s\-']+?)\s*\.\s*/i,               // "Item. description"
        /^([A-Za-z\s\-']+?)\s*$/i                     // "Item" (standalone)
      ]
      
      for (const pattern of itemPatterns) {
        const match = text.match(pattern)
        if (match) {
          const itemName = match[1].trim()
          
          // Skip if it's too short or too long for an item name
          if (itemName.length < 2 || itemName.length > 50) continue
          
          // Skip if it's already in inventory
          if (inventory.some(e => e.name.toLowerCase() === itemName.toLowerCase())) continue
          
          // Skip if it looks like a header or section title
          if (/^(name|race|class|level|background|alignment|ability|skill|proficiency|feature|trait|spell|action|attack|defense|combat|equipment|gear|inventory|possessions|carrying|wearing|wielding|armed|equipped|belongings|stuff|things|tools|weapons|armor|items?|stuff|belongings)$/i.test(itemName)) continue
          
          // Try to categorize the item
          const itemType = categorizeItemEnhanced(itemName, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS, AMMUNITION, POTIONS, BOOKS, VALUABLES)
          if (itemType) {
            // Extract quantity if present
            let quantity = 1
            const quantityMatch = text.match(/\((\d+)\)/)
            if (quantityMatch) {
              quantity = parseInt(quantityMatch[1])
            }
            
            // Extract description if present
            let description = ''
            const descMatch = text.match(/[:\-\.]\s*(.+)/)
            if (descMatch) {
              description = descMatch[1].trim()
            }
            
            addItemToLists(itemName, itemType, quantity, undefined, undefined, description || undefined, false)
            parseLog.push(`Found item via comprehensive scan: ${itemName} (${itemType})`)
            break // Only add each item once per line
          }
        }
      }
    }
  }

  // Strategy 4: Final fallback - look for any capitalized words that might be items
  parseLog.push('Performing final fallback item scan...')
  for (const page of pages) {
    for (const line of page.lines) {
      const text = line.text.trim()
      
      // Skip very short lines, headers, and lines that are too long
      if (text.length < 3 || text.length > 150) continue
      
      // Look for standalone capitalized words that might be items
      // Pattern: Single word or short phrase that's capitalized
      const standaloneItemMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/)
      if (standaloneItemMatch) {
        const itemName = standaloneItemMatch[1].trim()
        
        // Skip if it's too short or too long
        if (itemName.length < 2 || itemName.length > 30) continue
        
        // Skip if it's already in inventory
        if (inventory.some(e => e.name.toLowerCase() === itemName.toLowerCase())) continue
        
        // Skip if it looks like a header or common word
        if (/^(Name|Race|Class|Level|Background|Alignment|Ability|Skill|Proficiency|Feature|Trait|Spell|Action|Attack|Defense|Combat|Equipment|Gear|Inventory|Possessions|Carrying|Wearing|Wielding|Armed|Equipped|Belongings|Stuff|Things|Tools|Weapons|Armor|Items?|Stuff|Belongings|Yes|No|True|False|Current|Maximum|Temp|Temporary|Bonus|Modifier|Score|Points|Hit|Points|Armor|Class|Speed|Initiative|Passive|Perception|Investigation|Insight|Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)$/i.test(itemName)) continue
        
        // Try to categorize the item
        const itemType = categorizeItemEnhanced(itemName, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS, AMMUNITION, POTIONS, BOOKS, VALUABLES)
        if (itemType) {
          inventory.push({
            name: itemName,
            quantity: 1,
            type: itemType as any
          })
          
          assignEquipmentSlot(itemName, itemType, equipment, parseLog)
          foundEquipment++
          parseLog.push(`Found standalone item via fallback scan: ${itemName} (${itemType})`)
        }
      }
    }
  }
  
  confidence.equipment = foundEquipment >= 5 ? 'high' : foundEquipment >= 2 ? 'medium' : 'low'
  parseLog.push(`Found ${foundEquipment} pieces of equipment (confidence: ${confidence.equipment})`)
  
  return {
    // Enhanced categorized arrays (for Convex import)
    weapons,
    armor,
    gear,
    tools,
    ammunition,
    potions,
    books,
    valuables,
    currency,
    // Legacy format (for backward compatibility)
    inventory,
    equipment
  }
}

// Enhanced helper function to categorize items with more comprehensive coverage
function categorizeItemEnhanced(itemName: string, weapons: string[], armor: string[], gear: string[], tools: string[], ammunition: string[], potions: string[], books: string[], valuables: string[]): string | null {
  const itemLower = itemName.toLowerCase()
  
  // Check for exact matches first
  if (weapons.some(w => w.toLowerCase() === itemLower)) return 'weapon'
  if (armor.some(a => a.toLowerCase() === itemLower)) return 'armor'
  if (tools.some(t => t.toLowerCase() === itemLower)) return 'tool'
  if (ammunition.some(a => a.toLowerCase() === itemLower)) return 'ammunition'
  if (potions.some(p => p.toLowerCase() === itemLower)) return 'potion'
  if (books.some(b => b.toLowerCase() === itemLower)) return 'book'
  if (valuables.some(v => v.toLowerCase() === itemLower)) return 'valuable'
  
  // Check for partial matches
  if (weapons.some(w => w.toLowerCase().includes(itemLower) || itemLower.includes(w.toLowerCase()))) return 'weapon'
  if (armor.some(a => a.toLowerCase().includes(itemLower) || itemLower.includes(a.toLowerCase()))) return 'armor'
  if (tools.some(t => t.toLowerCase().includes(itemLower) || itemLower.includes(t.toLowerCase()))) return 'tool'
  if (ammunition.some(a => a.toLowerCase().includes(itemLower) || itemLower.includes(a.toLowerCase()))) return 'ammunition'
  if (potions.some(p => p.toLowerCase().includes(itemLower) || itemLower.includes(p.toLowerCase()))) return 'potion'
  if (books.some(b => b.toLowerCase().includes(itemLower) || itemLower.includes(b.toLowerCase()))) return 'book'
  if (valuables.some(v => v.toLowerCase().includes(itemLower) || itemLower.includes(v.toLowerCase()))) return 'valuable'
  
  // Check for gear as fallback
  if (gear.some(g => g.toLowerCase().includes(itemLower) || itemLower.includes(g.toLowerCase()))) return 'gear'
  
  return null
}

// Enhanced helper function to assign equipment slots with better logic
function assignEquipmentSlot(itemName: string, itemType: string, equipment: any, parseLog: string[]) {
  const itemLower = itemName.toLowerCase()
  
  if (itemType === 'armor') {
    if (itemLower.includes('helmet') || itemLower.includes('hat') || itemLower.includes('crown') || itemLower.includes('cap') || itemLower.includes('hood')) {
      if (!equipment.headgear) {
        equipment.headgear = itemName
        parseLog.push(`Assigned ${itemName} to headgear slot`)
      }
    } else if (itemLower.includes('gloves') || itemLower.includes('gauntlets') || itemLower.includes('bracers') || itemLower.includes('vambraces')) {
      if (!equipment.armwear) {
        equipment.armwear = itemName
        parseLog.push(`Assigned ${itemName} to armwear slot`)
      }
    } else if (itemLower.includes('breastplate') || itemLower.includes('chain') || itemLower.includes('leather') || itemLower.includes('scale') || itemLower.includes('plate') || itemLower.includes('mail')) {
      if (!equipment.chestwear) {
        equipment.chestwear = itemName
        parseLog.push(`Assigned ${itemName} to chestwear slot`)
      }
    } else if (itemLower.includes('boots') || itemLower.includes('shoes') || itemLower.includes('greaves') || itemLower.includes('sabatons')) {
      if (!equipment.footwear) {
        equipment.footwear = itemName
        parseLog.push(`Assigned ${itemName} to footwear slot`)
      }
    } else if (itemLower.includes('shield') || itemLower.includes('buckler')) {
      if (!equipment.offHand) {
        equipment.offHand = itemName
        parseLog.push(`Assigned ${itemName} to off-hand slot`)
      }
    }
  }
  
  if (itemType === 'weapon') {
    if (!equipment.mainHand) {
      equipment.mainHand = itemName
      parseLog.push(`Assigned ${itemName} to main hand slot`)
    } else if (!equipment.offHand && !itemLower.includes('two-handed') && !itemLower.includes('versatile')) {
      equipment.offHand = itemName
      parseLog.push(`Assigned ${itemName} to off-hand slot`)
    }
  }
  
  // Add accessories for items that don't fit other slots
  if (itemType === 'valuable' || itemType === 'book' || itemType === 'tool') {
    if (!equipment.accessories.includes(itemName)) {
      equipment.accessories.push(itemName)
      parseLog.push(`Added ${itemName} to accessories`)
    }
  }
}

function parseFeaturesAndTraits(pages: StructuredPage[], parseLog: string[], confidence: any): any {
  const features: Array<{ name: string; description: string; source: string; uses?: { current: number; max: number } }> = []
  const racialTraits: Array<{ name: string; description: string }> = []
  let foundFeatures = 0
  
  // Common D&D 5e class features for matching
  const CLASS_FEATURES = [
    'Action Surge', 'Second Wind', 'Fighting Style', 'Extra Attack', 'Indomitable',
    'Rage', 'Reckless Attack', 'Danger Sense', 'Feral Instinct', 'Brutal Critical',
    'Bardic Inspiration', 'Jack of All Trades', 'Song of Rest', 'Cutting Words', 'Countercharm',
    'Spellcasting', 'Divine Domain', 'Channel Divinity', 'Destroy Undead', 'Divine Strike',
    'Wild Shape', 'Druidcraft', 'Timeless Body', 'Beast Spells', 'Archdruid',
    'Monk Training', 'Martial Arts', 'Ki', 'Unarmored Defense', 'Stunning Strike',
    'Divine Sense', 'Lay on Hands', 'Divine Smite', 'Aura of Protection', 'Cleansing Touch',
    'Favored Enemy', 'Natural Explorer', 'Hunters Mark', 'Primeval Awareness', 'Vanish',
    'Sneak Attack', 'Thieves Cant', 'Cunning Action', 'Uncanny Dodge', 'Evasion',
    'Sorcerous Origin', 'Font of Magic', 'Metamagic', 'Sorcerous Restoration',
    'Otherworldly Patron', 'Pact Magic', 'Eldritch Invocations', 'Pact Boon', 'Mystic Arcanum',
    'Arcane Recovery', 'Ritual Casting', 'Arcane Tradition', 'Spell Mastery', 'Signature Spells'
  ]
  
  // Common racial traits
  const RACIAL_TRAITS = [
    'Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance', 'Elf Weapon Training',
    'Dwarven Resilience', 'Dwarven Combat Training', 'Stonecunning', 'Dwarven Armor Training',
    'Lucky', 'Brave', 'Halfling Nimbleness', 'Naturally Stealthy',
    'Draconic Ancestry', 'Breath Weapon', 'Damage Resistance',
    'Gnome Cunning', 'Speak with Small Beasts', 'Natural Illusionist',
    'Skill Versatility', 'Extra Language', 'Extra Skill',
    'Relentless Endurance', 'Savage Attacks',
    'Hellish Resistance', 'Infernal Legacy',
    'Healing Hands', 'Light Bearer', 'Celestial Resistance',
    'Stones Endurance', 'Powerful Build', 'Mountain Born'
  ]
  
  // Background features
  const BACKGROUND_FEATURES = [
    'Feature:', 'Specialty:', 'Variant:', 'Guild Membership', 'Retainers', 'Position of Privilege',
    'Shelter of the Faithful', 'Discovery', 'Researcher', 'City Secrets', 'Folk Hero',
    'Rustic Hospitality', 'Ship\'s Passage', 'Bad Reputation', 'Criminal Contact'
  ]
  
  parseLog.push('Parsing features and traits...')
  
  // Strategy 1: Look for dedicated features and traits sections
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = line.text
      
      // Check for section headers
      if (/features?\s*(&|and)?\s*traits?/i.test(text) || 
          /class\s*features?/i.test(text) ||
          /racial\s*traits?/i.test(text) ||
          /abilities?\s*(&|and)?\s*features?/i.test(text)) {
        
        parseLog.push(`Found features section at line ${lineIdx}: "${text}"`)
        
        // Parse the next 15-30 lines for features
        const startIdx = lineIdx + 1
        const endIdx = Math.min(page.lines.length, lineIdx + 30)
        
        for (let i = startIdx; i < endIdx; i++) {
          const featureLine = page.lines[i]
          
          // Skip empty lines and section breaks
          if (!featureLine.text.trim() || featureLine.text.trim().length < 3) continue
          
          // Stop if we hit another major section
          if (/^(EQUIPMENT|ATTACKS?|SPELLS?|INVENTORY)/i.test(featureLine.text)) break
          
          // Check for feature patterns
          const featureText = featureLine.text.trim()
          
          // Pattern 1: Bold feature names followed by description
          if (/^[A-Z][A-Za-z\s]+[.:]\s*/.test(featureText)) {
            const match = featureText.match(/^([A-Z][A-Za-z\s]+)[.:]\s*(.*)/)
            if (match) {
              const featureName = match[1].trim()
              const description = match[2].trim()
              
              // Check if it's a known class feature
              if (CLASS_FEATURES.some(cf => cf.toLowerCase().includes(featureName.toLowerCase()) || 
                                             featureName.toLowerCase().includes(cf.toLowerCase()))) {
                features.push({
                  name: featureName,
                  description: description || 'Class feature',
                  source: 'class'
                })
                foundFeatures++
                parseLog.push(`Found class feature: ${featureName}`)
              }
              // Check if it's a racial trait
              else if (RACIAL_TRAITS.some(rt => rt.toLowerCase().includes(featureName.toLowerCase()) || 
                                               featureName.toLowerCase().includes(rt.toLowerCase()))) {
                racialTraits.push({
                  name: featureName,
                  description: description || 'Racial trait'
                })
                foundFeatures++
                parseLog.push(`Found racial trait: ${featureName}`)
              }
              // Check if it's a background feature
              else if (BACKGROUND_FEATURES.some(bf => bf.toLowerCase().includes(featureName.toLowerCase()) || 
                                                   featureName.toLowerCase().includes(bf.toLowerCase()))) {
                features.push({
                  name: featureName,
                  description: description || 'Background feature',
                  source: 'background'
                })
                foundFeatures++
                parseLog.push(`Found background feature: ${featureName}`)
              }
              // Generic feature
              else {
                features.push({
                  name: featureName,
                  description: description || 'Feature',
                  source: 'unknown'
                })
                foundFeatures++
                parseLog.push(`Found generic feature: ${featureName}`)
              }
            }
          }
          
          // Pattern 2: Look for feature mentions in text
          for (const feature of CLASS_FEATURES) {
            if (featureText.toLowerCase().includes(feature.toLowerCase()) && 
                !features.some(f => f.name.toLowerCase().includes(feature.toLowerCase()))) {
              features.push({
                name: feature,
                description: 'Class feature mentioned in text',
                source: 'class'
              })
              foundFeatures++
              parseLog.push(`Found mentioned class feature: ${feature}`)
            }
          }
          
          // Pattern 3: Look for racial traits
          for (const trait of RACIAL_TRAITS) {
            if (featureText.toLowerCase().includes(trait.toLowerCase()) && 
                !racialTraits.some(rt => rt.name.toLowerCase().includes(trait.toLowerCase()))) {
              racialTraits.push({
                name: trait,
                description: 'Racial trait mentioned in text'
              })
              foundFeatures++
              parseLog.push(`Found mentioned racial trait: ${trait}`)
            }
          }
        }
      }
    }
  }
  
  // Strategy 2: Look for feature mentions throughout the document
  for (const page of pages) {
    for (const line of page.lines) {
      const text = line.text
      
      // Look for feature keywords
      if (/can\s+use|once\s+per|recharge|regain|expend|spend/i.test(text)) {
        // Extract potential feature names
        const words = text.split(/\s+/)
        for (let i = 0; i < words.length - 1; i++) {
          const word = words[i]
          if (/^[A-Z][a-z]+$/.test(word) && word.length > 3) {
            // Check if it's a known feature
            for (const feature of CLASS_FEATURES) {
              if (feature.toLowerCase().includes(word.toLowerCase()) && 
                  !features.some(f => f.name.toLowerCase().includes(feature.toLowerCase()))) {
                features.push({
                  name: feature,
                  description: 'Feature mentioned in context',
                  source: 'class'
                })
                foundFeatures++
                parseLog.push(`Found context feature: ${feature}`)
              }
            }
          }
        }
      }
    }
  }
  
  confidence.features = foundFeatures >= 3 ? 'high' : foundFeatures >= 1 ? 'medium' : 'low'
  parseLog.push(`Found ${foundFeatures} features and traits (confidence: ${confidence.features})`)
  
  return {
    features,
    racialTraits
  }
}

function parseSpellcasting(pages: StructuredPage[], classes: ImportedClassData[], abilityModifiers: any, proficiencyBonus: number, parseLog: string[], confidence: any): any {
  const spellcasting: Array<{ class: string; level: number; spellcastingAbility: string; spells: any[] }> = []
  let foundSpellcasting = 0
  
  parseLog.push('Parsing spellcasting information...')
  
  // Strategy 1: Look for spellcasting sections
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = line.text
      
      // Check for spellcasting section headers
      if (/spells?|spellcasting|magic/i.test(text) && 
          /class|level|ability|modifier/i.test(text)) {
        
        parseLog.push(`Found spellcasting section at line ${lineIdx}: "${text}"`)
        
        // Parse the next 20-40 lines for spellcasting details
        const startIdx = lineIdx + 1
        const endIdx = Math.min(page.lines.length, lineIdx + 40)
        
        let currentClass = ''
        let currentLevel = 0
        let currentAbility = ''
        
        for (let i = startIdx; i < endIdx; i++) {
          const spellLine = page.lines[i]
          
          // Skip empty lines
          if (!spellLine.text.trim()) continue
          
          // Stop if we hit another major section
          if (/^(EQUIPMENT|ATTACKS?|INVENTORY|FEATURES)/i.test(spellLine.text)) break
          
          const spellText = spellLine.text.trim()
          
          // Look for class names
          for (const cls of classes) {
            if (spellText.toLowerCase().includes(cls.name.toLowerCase())) {
              currentClass = cls.name
              currentLevel = cls.level
              parseLog.push(`Found spellcasting class: ${currentClass} (level ${currentLevel})`)
              break
            }
          }
          
          // Look for spellcasting ability
          if (/spellcasting\s+ability|spell\s+ability/i.test(spellText)) {
            const abilityMatch = spellText.match(/(strength|dexterity|constitution|intelligence|wisdom|charisma)/i)
            if (abilityMatch) {
              currentAbility = abilityMatch[1].toLowerCase()
              parseLog.push(`Found spellcasting ability: ${currentAbility}`)
            }
          }
          
          // Look for spell lists
          if (/cantrips?|spells\s+known|spells\s+prepared/i.test(spellText)) {
            // Extract spell information
            const spellMatch = spellText.match(/(\d+)\s+(cantrips?|spells?)/i)
            if (spellMatch && currentClass) {
              const count = parseInt(spellMatch[1])
              const type = spellMatch[2].toLowerCase()
              
              // Add to spellcasting data
              let existingClass = spellcasting.find(sc => sc.class === currentClass)
              if (!existingClass) {
                existingClass = {
                  class: currentClass,
                  level: currentLevel,
                  spellcastingAbility: currentAbility || 'intelligence',
                  spells: []
                }
                spellcasting.push(existingClass)
              }
              
              // Add spell count info
              existingClass.spells.push({
                type: type,
                count: count,
                level: type === 'cantrips' ? 0 : 1
              })
              
              foundSpellcasting++
              parseLog.push(`Found ${count} ${type} for ${currentClass}`)
            }
          }
        }
      }
    }
  }
  
  // Strategy 2: Look for spell lists throughout the document
  for (const page of pages) {
    for (const line of page.lines) {
      const text = line.text
      
      // Look for spell names (usually capitalized and followed by level)
      if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*\([0-9]+\)/i.test(text)) {
        const spellMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(([0-9]+)\)/i)
        if (spellMatch) {
          const spellName = spellMatch[1].trim()
          const spellLevel = parseInt(spellMatch[2])
          
          // Find which class this spell belongs to
          for (const cls of classes) {
            if (cls.name && text.toLowerCase().includes(cls.name.toLowerCase())) {
              let existingClass = spellcasting.find(sc => sc.class === cls.name)
              if (!existingClass) {
                existingClass = {
                  class: cls.name,
                  level: cls.level,
                  spellcastingAbility: 'intelligence', // Default
                  spells: []
                }
                spellcasting.push(existingClass)
              }
              
              // Add spell
              existingClass.spells.push({
                name: spellName,
                level: spellLevel,
                type: spellLevel === 0 ? 'cantrip' : 'spell'
              })
              
              foundSpellcasting++
              parseLog.push(`Found spell: ${spellName} (level ${spellLevel}) for ${cls.name}`)
              break
            }
          }
        }
      }
    }
  }
  
  // Strategy 3: Infer spellcasting from class levels
  for (const cls of classes) {
    if (cls.name && ['Wizard', 'Sorcerer', 'Warlock', 'Cleric', 'Druid', 'Bard', 'Paladin', 'Ranger', 'Artificer'].includes(cls.name)) {
      // Check if we already have spellcasting data for this class
      if (!spellcasting.find(sc => sc.class === cls.name)) {
        const spellcastingAbility = cls.name === 'Wizard' || cls.name === 'Artificer' ? 'intelligence' :
                                   cls.name === 'Cleric' || cls.name === 'Druid' ? 'wisdom' :
                                   'charisma'
        
        spellcasting.push({
          class: cls.name,
          level: cls.level,
          spellcastingAbility,
          spells: []
        })
        
        foundSpellcasting++
        parseLog.push(`Inferred spellcasting for ${cls.name} (${spellcastingAbility})`)
      }
    }
  }
  
  confidence.spellcasting = foundSpellcasting >= 2 ? 'high' : foundSpellcasting >= 1 ? 'medium' : 'low'
  parseLog.push(`Found ${foundSpellcasting} spellcasting entries (confidence: ${confidence.spellcasting})`)
  
  return spellcasting
}

function parseActions(pages: StructuredPage[], parseLog: string[], confidence: any): ParsedActionData {
  const weaponAttacks: Array<{ name: string; attackBonus: number; damage: string; damageType: string; range?: string; properties: any }> = []
  const spellAttacks: Array<{ name: string; attackBonus: number; damage: string; damageType: string; range: string }> = []
  const featureActions: Array<{ name: string; description: string; damage?: string; damageType?: string; saveDC?: number; range?: string; uses?: { current: number; max: number; resetOn: string } }> = []
  let foundActions = 0
  
  parseLog.push('Parsing actions and attacks...')
  
  // Enhanced weapon properties detection
  const weaponProperties = {
    'ammunition': /ammunition|loading|reload/i,
    'finesse': /finesse/i,
    'heavy': /heavy/i,
    'light': /light/i,
    'loading': /loading/i,
    'range': /range|thrown/i,
    'reach': /reach/i,
    'thrown': /thrown/i,
    'two-handed': /two.?handed|versatile/i,
    'versatile': /versatile/i,
    'special': /special/i,
    'martial': /martial/i,
    'simple': /simple/i,
    'exotic': /exotic/i
  }
  
  // Enhanced action list patterns
  const actionListPatterns = [
    /^[•·▪▫-]\s+/,           // Bullet points
    /^\d+\.\s+/,             // Numbered lists
    /^[a-z]\)\s+/i,          // Lettered lists
    /^[a-z]\.\s+/i,          // Lettered lists with period
    /^[ivx]+\.\s+/i,         // Roman numerals
    /^[A-Z]\.\s+/,           // Capital letters
    /^\|\s+/                 // Pipe-separated actions (D&D Beyond format)
  ]
  
  // Debug logging for all text to help identify action sections
  parseLog.push('=== SEARCHING FOR ACTION SECTIONS ===')
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = line.text.trim()
      
      // Log lines that might contain actions or attacks
      if ((text.toLowerCase().includes('attack') || 
           text.toLowerCase().includes('action') || 
           text.toLowerCase().includes('weapon') ||
           text.toLowerCase().includes('spell') ||
           text.toLowerCase().includes('damage')) && 
          text.length > 5 && text.length < 200) {
        parseLog.push(`Action candidate line ${lineIdx}: "${text}"`)
      }
    }
  }
  
  // Strategy 1: Look for D&D Beyond specific action sections
  const actionHeaders = [
    /^actions?/i,
    /^weapon\s+attacks?/i,
    /^spell\s+attacks?/i,
    /^cantrips?/i,
    /^attacks?/i,
    /^combat\s+actions?/i,
    /^standard\s+actions?/i,
    /^bonus\s+actions?/i,
    /^reactions?/i,
    /^features?\s+&\s+traits/i,
    /^additional\s+features?\s+&\s+traits/i
  ]
  
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = line.text
      
      // Check for action section headers
      const isActionHeader = actionHeaders.some(pattern => pattern.test(text))
      
      if (isActionHeader && text.length <= 100) {
        parseLog.push(`Found action section at line ${lineIdx}: "${text}"`)
        
        // Parse surrounding lines for actions with increased range
        const startIdx = lineIdx + 1
        const endIdx = Math.min(page.lines.length, lineIdx + 120) // Increased range
        
        for (let i = startIdx; i < endIdx; i++) {
          const actionLine = page.lines[i]
          const actionText = actionLine.text.trim()
          
          // Skip empty lines and section breaks
          if (!actionText || actionText.length < 2) continue
          
          // Stop if we hit another major section
          if (/^(SPELLS?|FEATURES?|EQUIPMENT|GEAR|ITEMS|INVENTORY|SKILLS?|PROFICIENCIES?|LANGUAGES?|ADDITIONAL\s+FEATURES)/i.test(actionText)) break
          
          // Enhanced Pattern 1: D&D Beyond weapon attack table format
          // Format: "Scimitar +9 to hit, 1d8+5 Slashing damage"
          const weaponAttackMatch = actionText.match(/^([A-Za-z\s\-']+?)\s+(?:(\+?\d+)\s+)?(?:to\s+hit|attack\s+bonus|bonus)?\s*(?:,?\s*)?(?:(\d+d\d+(?:\+\d+)?)\s+)?([a-z]+)\s+damage/i)
          if (weaponAttackMatch) {
            const weaponName = weaponAttackMatch[1].trim()
            const attackBonus = weaponAttackMatch[2] ? parseInt(weaponAttackMatch[2]) : 0
            const damage = weaponAttackMatch[3] || '1d4'
            const damageType = weaponAttackMatch[4] || 'bludgeoning'
            
            // Extract weapon properties from the text
            const properties: any = {}
            for (const [prop, pattern] of Object.entries(weaponProperties)) {
              if (pattern.test(actionText)) {
                properties[prop] = true
              }
            }
            
            // Extract range if present
            const rangeMatch = actionText.match(/(\d+)\s*(?:feet?|ft)/i)
            const range = rangeMatch ? `${rangeMatch[1]} ft` : undefined
            
            weaponAttacks.push({
              name: weaponName,
              attackBonus,
              damage,
              damageType,
              range,
              properties
            })
            
            foundActions++
            parseLog.push(`Found weapon attack: ${weaponName} +${attackBonus} to hit, ${damage} ${damageType} damage`)
          }
          
          // Enhanced Pattern 2: D&D Beyond spell attack format
          // Format: "Eldritch Blast +4 to hit, 1d10 Force damage, 120 ft"
          const spellAttackMatch = actionText.match(/^([A-Za-z\s\-']+?)\s+(?:(\+?\d+)\s+)?(?:to\s+hit|attack\s+bonus|bonus)?\s*(?:,?\s*)?(?:(\d+d\d+(?:\+\d+)?)\s+)?([a-z]+)\s+damage\s*(?:,?\s*)?(?:(\d+)\s*(?:feet?|ft))?/i)
          if (spellAttackMatch) {
            const spellName = spellAttackMatch[1].trim()
            const attackBonus = spellAttackMatch[2] ? parseInt(spellAttackMatch[2]) : 0
            const damage = spellAttackMatch[3] || '1d4'
            const damageType = spellAttackMatch[4] || 'force'
            const range = spellAttackMatch[5] ? `${spellAttackMatch[5]} ft` : '60 ft'
            
            spellAttacks.push({
              name: spellName,
              attackBonus,
              damage,
              damageType,
              range
            })
            
            foundActions++
            parseLog.push(`Found spell attack: ${spellName} +${attackBonus} to hit, ${damage} ${damageType} damage, ${range}`)
          }
          
          // Enhanced Pattern 3: D&D Beyond feature action format with pipe separator
          // Format: "| Sap (Longsword): 1 Action" or "| Flurry of Blows: 1 Bonus Action"
          const pipeActionMatch = actionText.match(/^\|\s*([A-Za-z\s\-']+?)\s*(?:\(([^)]+)\))?\s*:?\s*(.+)/i)
          if (pipeActionMatch && !weaponAttackMatch && !spellAttackMatch) {
            const featureName = pipeActionMatch[1].trim()
            const context = pipeActionMatch[2] || undefined
            const description = pipeActionMatch[3] || ''
            
            // Parse action type from description
            let actionType = 'Action'
            if (/bonus\s+action/i.test(description)) actionType = 'Bonus Action'
            else if (/reaction/i.test(description)) actionType = 'Reaction'
            else if (/free\s+action/i.test(description)) actionType = 'Free Action'
            
            // Extract uses if present
            let uses: { current: number; max: number; resetOn: string } | undefined = undefined
            const usesMatch = description.match(/(\d+)\s*\/\s*(.+?)(?:\s|$)/i)
            if (usesMatch) {
              const max = parseInt(usesMatch[1])
              const resetOn = usesMatch[2].trim()
              uses = {
                current: max,
                max,
                resetOn
              }
            }
            
            // Extract damage information from description if present
            const damageMatch = description.match(/(\d+d\d+(?:\+\d+)?)\s+([a-z]+)/i)
            const damage = damageMatch ? damageMatch[1] : undefined
            const damageType = damageMatch ? damageMatch[2] : undefined
            
            // Extract save DC if present
            const saveDCMatch = description.match(/DC\s+(\d+)/i)
            const saveDC = saveDCMatch ? parseInt(saveDCMatch[1]) : undefined
            
            // Extract range if present
            const rangeMatch = description.match(/(\d+)\s*(?:feet?|ft)/i)
            const range = rangeMatch ? `${rangeMatch[1]} ft` : undefined
            
            featureActions.push({
              name: featureName,
              description: `${actionType}: ${description}`,
              damage,
              damageType,
              saveDC,
              range,
              uses
            })
            
            foundActions++
            parseLog.push(`Found pipe action: ${featureName} (${actionType}) - ${description}`)
          }
          
          // Enhanced Pattern 4: Feature-based action with description
          // Format: "Second Wind (1/rest): Regain 1d10+1 hit points"
          const featureActionMatch = actionText.match(/^([A-Za-z\s\-']+?)\s*(?:\(([^)]+)\))?\s*:?\s*(.+)/i)
          if (featureActionMatch && !weaponAttackMatch && !spellAttackMatch && !pipeActionMatch) {
            const featureName = featureActionMatch[1].trim()
            const usesString = featureActionMatch[2] || undefined
            const description = featureActionMatch[3] || ''
            
            // Parse uses string into proper object format
            let uses: { current: number; max: number; resetOn: string } | undefined = undefined
            if (usesString) {
              // Parse common formats like "1/rest", "2/short rest", "3/long rest"
              const usesMatch = usesString.match(/(\d+)\/(.+)/)
              if (usesMatch) {
                const max = parseInt(usesMatch[1])
                const resetOn = usesMatch[2].trim()
                uses = {
                  current: max,
                  max,
                  resetOn
                }
              }
            }
            
            // Extract damage information from description if present
            const damageMatch = description.match(/(\d+d\d+(?:\+\d+)?)\s+([a-z]+)/i)
            const damage = damageMatch ? damageMatch[1] : undefined
            const damageType = damageMatch ? damageMatch[2] : undefined
            
            // Extract save DC if present
            const saveDCMatch = description.match(/DC\s+(\d+)/i)
            const saveDC = saveDCMatch ? parseInt(saveDCMatch[1]) : undefined
            
            // Extract range if present
            const rangeMatch = description.match(/(\d+)\s*(?:feet?|ft)/i)
            const range = rangeMatch ? `${rangeMatch[1]} ft` : undefined
            
            featureActions.push({
              name: featureName,
              description,
              damage,
              damageType,
              saveDC,
              range,
              uses
            })
            
            foundActions++
            parseLog.push(`Found feature action: ${featureName}${uses ? ` (${uses})` : ''} - ${description}`)
          }
          
          // Enhanced Pattern 5: Simple action list with better parsing
          else if (actionListPatterns.some(pattern => pattern.test(actionText)) && 
                   !weaponAttackMatch && !spellAttackMatch && !pipeActionMatch && !featureActionMatch) {
            const cleanActionText = actionText.replace(/^[•·▪▫-]\s+/, '').replace(/^\d+\.\s+/, '').replace(/^[a-z]\)\s+/i, '').replace(/^[a-z]\.\s+/i, '').replace(/^[ivx]+\.\s+/i, '').replace(/^[A-Z]\.\s+/, '').replace(/^\|\s+/, '').trim()
            
            // Check if it's a weapon or spell attack
            if (weaponAttackMatch || spellAttackMatch) {
              // Already handled above
            } else {
              // Add as feature action
              featureActions.push({
                name: cleanActionText,
                description: 'Action from character sheet'
              })
              
              foundActions++
              parseLog.push(`Found bulleted action: ${cleanActionText}`)
            }
          }
        }
      }
    }
  }
  
  // Strategy 2: Enhanced action mentions throughout document
  for (const page of pages) {
    for (const line of page.lines) {
      const text = line.text.trim()
      
      // Look for "can attack with", "wields", "casts", "uses" patterns
      if (/can\s+attack\s+with|wields?|casts?|uses?|has\s+the\s+ability\s+to/i.test(text)) {
        // Extract actions mentioned in these contexts
        const actionKeywords = ['attack', 'cast', 'use', 'wield', 'throw', 'shoot', 'strike', 'slash', 'pierce', 'bludgeon']
        
        for (const keyword of actionKeywords) {
          if (text.toLowerCase().includes(keyword)) {
            // Try to extract the full action description
            const actionMatch = text.match(new RegExp(`([A-Za-z\\s\\-']+?)\\s+${keyword}`, 'i'))
            if (actionMatch) {
              const actionName = actionMatch[1].trim()
              
              // Check if we already have this action
              if (!featureActions.some(a => a.name.toLowerCase() === actionName.toLowerCase())) {
                featureActions.push({
                  name: actionName,
                  description: `Can ${keyword} with ${actionName}`
                })
                
                foundActions++
                parseLog.push(`Found mentioned action: ${actionName} (${keyword})`)
              }
            }
          }
        }
      }
      
      // Enhanced damage and attack bonus extraction from context
      if (/damage|attack\s+bonus|to\s+hit/i.test(text)) {
        // Look for weapon names that might have been missed
        const weaponKeywords = ['sword', 'axe', 'hammer', 'bow', 'crossbow', 'dagger', 'spear', 'staff', 'mace', 'flail', 'glaive', 'halberd', 'lance', 'rapier', 'scimitar', 'trident', 'whip']
        
        for (const weapon of weaponKeywords) {
          if (text.toLowerCase().includes(weapon) && !weaponAttacks.some(w => w.name.toLowerCase().includes(weapon))) {
            // Extract attack bonus and damage from the text
            const attackBonusMatch = text.match(/(\+?\d+)/)
            const attackBonus = attackBonusMatch ? parseInt(attackBonusMatch[1]) : 0
            
            const damageMatch = text.match(/(\d+d\d+(?:\+\d+)?)/)
            const damage = damageMatch ? damageMatch[1] : '1d4'
            
            const damageTypeMatch = text.match(/(slashing|piercing|bludgeoning|fire|cold|lightning|thunder|acid|poison|necrotic|radiant|force|psychic)/i)
            const damageType = damageTypeMatch ? damageTypeMatch[1] : 'bludgeoning'
            
            weaponAttacks.push({
              name: weapon.charAt(0).toUpperCase() + weapon.slice(1),
              attackBonus,
              damage,
              damageType,
              properties: {}
            })
            
            foundActions++
            parseLog.push(`Found weapon from context: ${weapon} +${attackBonus} to hit, ${damage} ${damageType} damage`)
          }
        }
      }
    }
  }

  // Strategy 3: Comprehensive action scanning throughout the document
  parseLog.push('Performing comprehensive action scan...')
  for (const page of pages) {
    for (const line of page.lines) {
      const text = line.text.trim()
      
      // Skip very short lines and headers
      if (text.length < 3 || text.length > 200) continue
      
      // Look for common action patterns that might be missed
      const actionPatterns = [
        /^([A-Za-z\s\-']+?)\s*\(([^)]+)\)/i,         // "Action (description)"
        /^([A-Za-z\s\-']+?)\s*:\s*/i,                // "Action: description"
        /^([A-Za-z\s\-']+?)\s*-\s*/i,                // "Action - description"
        /^([A-Za-z\s\-']+?)\s*\.\s*/i,               // "Action. description"
        /^([A-Za-z\s\-']+?)\s*\+\d+/i,               // "Action +5"
        /^([A-Za-z\s\-']+?)\s*\d+d\d+/i,             // "Action 1d6"
        /^([A-Za-z\s\-']+?)\s*to\s+hit/i,            // "Action to hit"
        /^([A-Za-z\s\-']+?)\s*damage/i                // "Action damage"
      ]
      
      for (const pattern of actionPatterns) {
        const match = text.match(pattern)
        if (match) {
          const actionName = match[1].trim()
          
          // Skip if it's too short or too long for an action name
          if (actionName.length < 2 || actionName.length > 50) continue
          
          // Skip if it's already captured
          if (weaponAttacks.some(a => a.name.toLowerCase() === actionName.toLowerCase()) ||
              spellAttacks.some(a => a.name.toLowerCase() === actionName.toLowerCase()) ||
              featureActions.some(a => a.name.toLowerCase() === actionName.toLowerCase())) continue
          
          // Skip if it looks like a header or section title
          if (/^(name|race|class|level|background|alignment|ability|skill|proficiency|feature|trait|spell|action|attack|defense|combat|equipment|gear|inventory|possessions|carrying|wearing|wielding|armed|equipped|belongings|stuff|things|tools|weapons|armor|items?|stuff|belongings)$/i.test(actionName)) continue
          
          // Try to determine if this is a weapon attack, spell attack, or feature action
          let actionType = 'feature'
          let attackBonus = 0
          let damage = ''
          let damageType = ''
          let range = ''
          
          // Check if it's a weapon attack
          if (text.toLowerCase().includes('to hit') || text.toLowerCase().includes('attack bonus')) {
            actionType = 'weapon'
            const attackMatch = text.match(/(\+?\d+)/)
            attackBonus = attackMatch ? parseInt(attackMatch[1]) : 0
            
            const damageMatch = text.match(/(\d+d\d+(?:\+\d+)?)/)
            damage = damageMatch ? damageMatch[1] : ''
            
            const damageTypeMatch = text.match(/(slashing|piercing|bludgeoning|fire|cold|lightning|thunder|acid|poison|necrotic|radiant|force|psychic)/i)
            damageType = damageTypeMatch ? damageTypeMatch[1] : ''
            
            const rangeMatch = text.match(/(\d+)\s*(?:feet?|ft)/i)
            range = rangeMatch ? `${rangeMatch[1]} ft` : ''
          }
          // Check if it's a spell attack
          else if (text.toLowerCase().includes('spell') || text.toLowerCase().includes('magic') || text.toLowerCase().includes('cantrip')) {
            actionType = 'spell'
            const attackMatch = text.match(/(\+?\d+)/)
            attackBonus = attackMatch ? parseInt(attackMatch[1]) : 0
            
            const damageMatch = text.match(/(\d+d\d+(?:\+\d+)?)/)
            damage = damageMatch ? damageMatch[1] : ''
            
            const damageTypeMatch = text.match(/(slashing|piercing|bludgeoning|fire|cold|lightning|thunder|acid|poison|necrotic|radiant|force|psychic)/i)
            damageType = damageTypeMatch ? damageTypeMatch[1] : ''
            
            const rangeMatch = text.match(/(\d+)\s*(?:feet?|ft)/i)
            range = rangeMatch ? `${rangeMatch[1]} ft` : '60 ft'
          }
          
          // Extract description
          let description = ''
          const descMatch = text.match(/[:\-\.]\s*(.+)/)
          if (descMatch) {
            description = descMatch[1].trim()
          }
          
          // Add to appropriate array
          if (actionType === 'weapon') {
            weaponAttacks.push({
              name: actionName,
              attackBonus,
              damage: damage || '1d4',
              damageType: damageType || 'bludgeoning',
              range: range || undefined,
              properties: {}
            })
            parseLog.push(`Found weapon action via comprehensive scan: ${actionName}`)
          } else if (actionType === 'spell') {
            spellAttacks.push({
              name: actionName,
              attackBonus,
              damage: damage || '1d4',
              damageType: damageType || 'force',
              range: range || '60 ft'
            })
            parseLog.push(`Found spell action via comprehensive scan: ${actionName}`)
          } else {
            featureActions.push({
              name: actionName,
              description: description || `Action: ${actionName}`,
              damage: damage || undefined,
              damageType: damageType || undefined,
              range: range || undefined
            })
            parseLog.push(`Found feature action via comprehensive scan: ${actionName}`)
          }
          
          foundActions++
          break // Only add each action once per line
        }
      }
    }
  }
  
  confidence.actions = foundActions >= 5 ? 'high' : foundActions >= 2 ? 'medium' : 'low'
  parseLog.push(`Found ${foundActions} actions (confidence: ${confidence.actions})`)
  
  return {
    weaponAttacks,
    spellAttacks,
    featureActions
  }
}

function calculateHitDiceFromClasses(classes: ImportedClassData[]): any[] {
  const hitDiceMap = new Map<string, number>()
  
  classes.forEach(cls => {
    const hitDie = cls.hitDie
    const current = hitDiceMap.get(hitDie) || 0
    hitDiceMap.set(hitDie, current + cls.level)
  })
  
  return Array.from(hitDiceMap.entries()).map(([die, count]) => ({
    die,
    current: count,
    max: count,
  }))
}

// Helper functions
function cleanName(name: string): string {
  return name
    .replace(/[^\w\s\-']/g, '') // Remove special characters except apostrophes and hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

function validateRace(race: string): string {
  const cleanRace = race.trim()
  
  // Common D&D 5e races for validation
  const DND_RACES = [
    'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf',
    'Half-Orc', 'Tiefling', 'Aasimar', 'Genasi', 'Goliath', 'Tabaxi'
  ]
  
  // Check if it's a known race
  const knownRace = DND_RACES.find((dndRace: string) => 
    dndRace.toLowerCase() === cleanRace.toLowerCase()
  )
  
  return knownRace || cleanRace || 'Human'
}
