// PDF parsing helper functions for D&D 5e character sheets
import { ImportedClassData, ImportedFeature, ImportedTrait, ImportedSkillProficiency, ImportedSavingThrowProficiency } from './types'
import { StructuredPage, StructuredLine } from './pdfParser'

// Constants needed
const DND_CLASSES = [
  'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
]

const ABILITY_HEADERS = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA']
const ABILITY_SHORT = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

// Parse classes - handle multiclass
export function parseClasses(pages: StructuredPage[], parseLog: string[], confidence: any): ImportedClassData[] {
  const classPatterns = [
    /(?:class(?:\s*&\s*level)?)[:\s]*([^\n\r]+)/i,
    /(?:classes?)[:\s]*([^\n\r]+)/i,
    // More specific multiclass patterns
    /([A-Za-z\s]+)\s+(\d{1,2})\s*[\/]\s*([A-Za-z\s]+)\s+(\d{1,2})/i, // "Fighter 2 / Rogue 3"
    /(\d{1,2})(?:st|nd|rd|th)?\s+level\s+([A-Za-z\s]+)/gi, // "3rd level Ranger"
  ]
  
  let allClasses: ImportedClassData[] = []
  let bestConfidence = 0
  
  // Try each pattern and collect all potential class matches
  for (const pattern of classPatterns) {
    const matches = findTextInPages(pages, pattern, { firstMatch: false })
    
    for (const match of matches) {
      const classText = match.text
      const classes = parseMulticlassString(classText)
      
      if (classes.length > 0 && match.confidence > bestConfidence) {
        allClasses = classes
        bestConfidence = match.confidence
      }
    }
  }
  
  // If we found classes, use them
  if (allClasses.length > 0) {
    confidence.classes = bestConfidence > 0.7 ? 'high' : 'medium'
    const isMulticlass = allClasses.length > 1
    parseLog.push(`Found ${isMulticlass ? 'multiclass' : 'single class'}: ${allClasses.map(c => `${c.name} ${c.level}`).join(', ')} (confidence: ${confidence.classes})`)
    return allClasses
  }
  
  // Enhanced fallback: search the entire document for class names
  const foundClasses: ImportedClassData[] = []
  const allText = pages.map(p => p.rawText).join(' ')
  
  for (const className of DND_CLASSES) {
    const classPattern = new RegExp(`\\b${className}\\s+(\\d{1,2})\\b`, 'i')
    const levelMatch = allText.match(classPattern)
    
    if (levelMatch) {
      const level = parseInt(levelMatch[1])
      foundClasses.push({
        name: className,
        level,
        hitDie: getClassHitDie(className),
        subclass: extractSubclass(allText, className),
        features: [],
      })
    } else if (allText.toLowerCase().includes(className.toLowerCase())) {
      // Found class name but no level, assume level 1
      foundClasses.push({
        name: className,
        level: 1,
        hitDie: getClassHitDie(className),
        subclass: extractSubclass(allText, className),
        features: [],
      })
    }
  }
  
  if (foundClasses.length > 0) {
    confidence.classes = 'medium'
    parseLog.push(`Found classes from document scan: ${foundClasses.map(c => `${c.name} ${c.level}`).join(', ')} (confidence: ${confidence.classes})`)
    return foundClasses
  }
  
  // Final fallback: try to find any level and assume Fighter
  const levelMatches = findTextInPages(pages, /(?:level|lvl)[:\s]*(\d+)/i, { firstMatch: true })
  const level = levelMatches.length > 0 ? parseInt(levelMatches[0].text) : 1
  
  confidence.classes = 'low'
  parseLog.push(`Could not find class, using Fighter ${level} as fallback`)
  return [{
    name: 'Fighter',
    level,
    hitDie: 'd10',
    subclass: '',
    features: [],
  }]
}

// Parse multiclass string like "Fighter 2 / Monk 6 / Warlock 1" or "Ranger 3 / Rogue 2"
function parseMulticlassString(text: string): ImportedClassData[] {
  const classes: ImportedClassData[] = []
  
  // Enhanced patterns for different multiclass formats
  const patterns = [
    // "Ranger 3 / Rogue 2" format (more specific pattern)
    /([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d{1,2})\s*\/\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d{1,2})/g,
    // "Fighter 2 / Monk 6" format (general slash-separated)
    /([A-Za-z\s\-]+)\s+(\d{1,2})\s*[\/,•]\s*/g,
    // "2nd Level Fighter / 3rd Level Monk" format  
    /(\d+)(?:st|nd|rd|th)?\s+level\s+([A-Za-z\s\-]+)/gi,
    // "Fighter (Level 2) / Monk (Level 6)" format
    /([A-Za-z\s\-]+)\s*\((?:level\s*)?(\d{1,2})\)/gi,
    // Single class with level "Ranger 5" or "5th Level Ranger"
    /(?:^|\s)([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d{1,2})(?:\s|$)/g,
  ]
  
  // Try the multiclass-specific pattern first
  const multiclassPattern = /([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d{1,2})\s*\/\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d{1,2})/g
  let multiclassMatch = multiclassPattern.exec(text)
  
  if (multiclassMatch) {
    // Found multiclass format: "Class1 Level1 / Class2 Level2"
    const class1Name = validateClass(multiclassMatch[1].trim())
    const class1Level = Math.max(1, Math.min(20, parseInt(multiclassMatch[2])))
    const class2Name = validateClass(multiclassMatch[3].trim())
    const class2Level = Math.max(1, Math.min(20, parseInt(multiclassMatch[4])))
    
    classes.push({
      name: class1Name,
      level: class1Level,
      hitDie: getClassHitDie(class1Name),
      subclass: extractSubclass(text, class1Name),
      features: [],
    })
    
    classes.push({
      name: class2Name,
      level: class2Level,
      hitDie: getClassHitDie(class2Name),
      subclass: extractSubclass(text, class2Name),
      features: [],
    })
    
    return classes
  }
  
  // Try other patterns if multiclass pattern didn't match
  for (const pattern of patterns) {
    let match
    pattern.lastIndex = 0 // Reset regex
    
    while ((match = pattern.exec(text)) !== null) {
      let className: string
      let level: number
      
      if (pattern.source.includes('level')) {
        // Pattern with "level" keyword - level comes first
        level = parseInt(match[1])
        className = match[2]
      } else {
        // Standard pattern - class name comes first
        className = match[1]
        level = parseInt(match[2])
      }
      
      className = validateClass(className.trim())
      level = Math.max(1, Math.min(20, level))
      
      // Avoid duplicates
      if (!classes.find(c => c.name === className)) {
        classes.push({
          name: className,
          level,
          hitDie: getClassHitDie(className),
          subclass: extractSubclass(text, className),
          features: [],
        })
      }
    }
  }
  
  // Enhanced fallback: look for individual class patterns in the text
  if (classes.length === 0) {
    const classNames = DND_CLASSES.filter(cls => 
      text.toLowerCase().includes(cls.toLowerCase())
    )
    
    // Try to extract levels for found classes
    for (const className of classNames) {
      // Multiple patterns to find class with level
      const levelPatterns = [
        new RegExp(`${className}\\s+(\\d{1,2})`, 'i'),
        new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+level\\s+${className}`, 'i'),
        new RegExp(`${className}\\s*\\((?:level\\s*)?(\\d{1,2})\\)`, 'i'),
      ]
      
      for (const levelPattern of levelPatterns) {
        const levelMatch = text.match(levelPattern)
        if (levelMatch) {
          const level = parseInt(levelMatch[1])
          if (level >= 1 && level <= 20 && !classes.find(c => c.name === className)) {
            classes.push({
              name: className,
              level,
              hitDie: getClassHitDie(className),
              subclass: extractSubclass(text, className),
              features: [],
            })
            break
          }
        }
      }
    }
  }
  
  return classes
}

// Extract subclass information for a given class
function extractSubclass(text: string, className: string): string {
  const subclassPatterns: Record<string, RegExp[]> = {
    'Fighter': [/champion/i, /battle\s*master/i, /eldritch\s*knight/i],
    'Ranger': [/hunter/i, /beast\s*master/i, /gloom\s*stalker/i],
    'Rogue': [/thief/i, /assassin/i, /arcane\s*trickster/i],
    'Wizard': [/evocation/i, /divination/i, /necromancy/i, /enchantment/i],
    'Cleric': [/life/i, /light/i, /war/i, /tempest/i],
    'Paladin': [/devotion/i, /ancients/i, /vengeance/i],
    'Warlock': [/fiend/i, /great\s*old\s*one/i, /archfey/i],
    'Sorcerer': [/draconic/i, /wild\s*magic/i],
    'Bard': [/lore/i, /valor/i],
    'Barbarian': [/berserker/i, /totem\s*warrior/i],
    'Druid': [/land/i, /moon/i],
    'Monk': [/open\s*hand/i, /shadow/i, /four\s*elements/i],
  }
  
  const patterns = subclassPatterns[className] || []
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      const match = text.match(pattern)
      return match ? match[0] : ''
    }
  }
  
  return ''
}

// Parse ability scores using geometry-aware detection
export function parseAbilityScores(pages: StructuredPage[], parseLog: string[], confidence: any): any {
  const abilityScores = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  }
  
  let foundAbilityHeader = false
  let foundScores = 0
  
  // Strategy 1: Look for ability score headers followed by numeric values in structured layout
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length - 3; lineIdx++) {
      const line = page.lines[lineIdx]
      const nextLine = page.lines[lineIdx + 1]
      const line2 = page.lines[lineIdx + 2]
      const line3 = page.lines[lineIdx + 3]
      
      // Check if this line contains ability score headers
      const hasAbilityHeaders = ABILITY_HEADERS.some(header => 
        line.text.toUpperCase().includes(header)
      ) || ABILITY_SHORT.some(short => 
        line.text.toUpperCase().includes(short)
      )
      
      if (hasAbilityHeaders) {
        foundAbilityHeader = true
        parseLog.push(`Found ability score header on page ${page.pageNumber}, line ${lineIdx}: "${line.text}"`)
        
        // Try to extract scores from multiple following lines
        const possibleLines = [line, nextLine, line2, line3]
        for (const checkLine of possibleLines) {
          if (checkLine) {
            const scoresLine = extractScoresFromLine(checkLine)
            if (scoresLine) {
              Object.assign(abilityScores, scoresLine)
              foundScores = Object.values(scoresLine).filter(v => v !== 10).length
              parseLog.push(`Extracted ability scores from line: "${checkLine.text}"`)
              break
            }
          }
        }
        
        if (foundScores > 0) break
      }
    }
    if (foundScores > 0) break
  }
  
  // Strategy 2: Look for ability scores in box/table format using spatial analysis
  if (foundScores < 3) {
    parseLog.push('Trying spatial ability score detection...')
    const spatialScores = extractAbilityScoresSpatially(pages, parseLog)
    if (spatialScores) {
      Object.assign(abilityScores, spatialScores)
      foundScores = Object.values(spatialScores).filter(v => v !== 10).length
    }
  }
  
  // Strategy 3: Enhanced individual ability score patterns with context
  if (foundScores < 3) {
    parseLog.push('Trying individual ability score pattern matching...')
    const patterns = {
      strength: [
        /(?:strength|str)\s*[:\-]?\s*(\d+)/i,
        /str\s+(\d+)/i,
        /(\d+)\s+str/i,
        /strength\s+score[:\s]*(\d+)/i
      ],
      dexterity: [
        /(?:dexterity|dex)\s*[:\-]?\s*(\d+)/i,
        /dex\s+(\d+)/i,
        /(\d+)\s+dex/i,
        /dexterity\s+score[:\s]*(\d+)/i
      ],
      constitution: [
        /(?:constitution|con)\s*[:\-]?\s*(\d+)/i,
        /con\s+(\d+)/i,
        /(\d+)\s+con/i,
        /constitution\s+score[:\s]*(\d+)/i
      ],
      intelligence: [
        /(?:intelligence|int)\s*[:\-]?\s*(\d+)/i,
        /int\s+(\d+)/i,
        /(\d+)\s+int/i,
        /intelligence\s+score[:\s]*(\d+)/i
      ],
      wisdom: [
        /(?:wisdom|wis)\s*[:\-]?\s*(\d+)/i,
        /wis\s+(\d+)/i,
        /(\d+)\s+wis/i,
        /wisdom\s+score[:\s]*(\d+)/i
      ],
      charisma: [
        /(?:charisma|cha)\s*[:\-]?\s*(\d+)/i,
        /cha\s+(\d+)/i,
        /(\d+)\s+cha/i,
        /charisma\s+score[:\s]*(\d+)/i
      ],
    }
    
    for (const [ability, abilityPatterns] of Object.entries(patterns)) {
      for (const pattern of abilityPatterns) {
        const matches = findTextInPages(pages, pattern, { firstMatch: true })
        if (matches.length > 0) {
          const score = parseInt(matches[0].text)
          if (score >= 1 && score <= 30) {
            abilityScores[ability as keyof typeof abilityScores] = score
            foundScores++
            parseLog.push(`Found ${ability}: ${score} using pattern ${pattern.source}`)
            break // Found this ability, try next one
          }
        }
      }
    }
  }
  
  confidence.abilityScores = foundScores >= 4 ? 'high' : foundScores >= 2 ? 'medium' : 'low'
  parseLog.push(`Found ${foundScores}/6 ability scores (confidence: ${confidence.abilityScores})`)
  
  return abilityScores
}

// Extract ability scores using spatial analysis (looking for boxes or positioned elements)
function extractAbilityScoresSpatially(pages: StructuredPage[], parseLog: string[]): any | null {
  for (const page of pages) {
    const abilityBoxes: Array<{ability: string, score: number, x: number, y: number}> = []
    
    // Look for ability names and nearby numbers within reasonable distance
    for (const line of page.lines) {
      for (const item of line.items) {
        const text = item.str.toLowerCase()
        
        // Check if this item contains an ability name
        let abilityName = ''
        if (text.includes('str') || text.includes('strength')) abilityName = 'strength'
        else if (text.includes('dex') || text.includes('dexterity')) abilityName = 'dexterity'
        else if (text.includes('con') || text.includes('constitution')) abilityName = 'constitution'
        else if (text.includes('int') || text.includes('intelligence')) abilityName = 'intelligence'
        else if (text.includes('wis') || text.includes('wisdom')) abilityName = 'wisdom'
        else if (text.includes('cha') || text.includes('charisma')) abilityName = 'charisma'
        
        if (abilityName) {
          // Look for numbers within 100 pixels horizontally and 50 pixels vertically
          for (const checkLine of page.lines) {
            for (const checkItem of checkLine.items) {
              const dx = Math.abs(checkItem.x - item.x)
              const dy = Math.abs(checkItem.y - item.y)
              
              if (dx <= 100 && dy <= 50) {
                const numberMatch = checkItem.str.match(/^\d{1,2}$/)
                if (numberMatch) {
                  const score = parseInt(numberMatch[0])
                  if (score >= 3 && score <= 20) {
                    abilityBoxes.push({
                      ability: abilityName,
                      score,
                      x: checkItem.x,
                      y: checkItem.y
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Build scores from found boxes
    if (abilityBoxes.length >= 3) {
      const scores: any = {}
      const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
      
      for (const ability of abilities) {
        const boxes = abilityBoxes.filter(b => b.ability === ability)
        if (boxes.length > 0) {
          // Take the most reasonable score if multiple found
          const validScores = boxes.filter(b => b.score >= 6 && b.score <= 18)
          scores[ability] = validScores.length > 0 ? validScores[0].score : boxes[0].score
        }
      }
      
      if (Object.keys(scores).length >= 3) {
        parseLog.push(`Spatial analysis found ${Object.keys(scores).length} ability scores`)
        return scores
      }
    }
  }
  
  return null
}

// Extract numeric scores from a line (looking for 6 numbers in sequence)
function extractScoresFromLine(line: StructuredLine): any | null {
  const numbers = line.text.match(/\b(\d{1,2})\b/g)
  if (numbers && numbers.length >= 6) {
    const scores = numbers.slice(0, 6).map(n => parseInt(n)).filter(n => n >= 3 && n <= 20)
    if (scores.length >= 6) {
      return {
        strength: scores[0],
        dexterity: scores[1],
        constitution: scores[2],
        intelligence: scores[3],
        wisdom: scores[4],
        charisma: scores[5],
      }
    }
  }
  
  // Also try to find 3 or more valid ability scores in a line
  if (numbers && numbers.length >= 3) {
    const scores = numbers.map(n => parseInt(n)).filter(n => n >= 6 && n <= 20)
    if (scores.length >= 3) {
      const result: any = {}
      const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
      
      for (let i = 0; i < Math.min(scores.length, 6); i++) {
        result[abilities[i]] = scores[i]
      }
      
      return result
    }
  }
  
  return null
}

// Parse hit points
export function parseHitPoints(pages: StructuredPage[], parseLog: string[], confidence: any): any {
  const hitPointPatterns = [
    /(?:hit\s*points|hp)\s*(?:maximum)?[:\s]*(\d+)/i,
    /(?:current\s*hit\s*points|current\s*hp)[:\s]*(\d+)/i,
    /(?:temporary\s*hit\s*points|temp\s*hp)[:\s]*(\d+)/i,
  ]
  
  let maxHP = 1
  let currentHP = 1
  let tempHP = 0
  let foundAny = false
  
  for (const pattern of hitPointPatterns) {
    const matches = findTextInPages(pages, pattern, { firstMatch: true })
    if (matches.length > 0) {
      const value = parseInt(matches[0].text)
      if (pattern.source.includes('current')) {
        currentHP = value
      } else if (pattern.source.includes('temp')) {
        tempHP = value
      } else {
        maxHP = value
        if (!foundAny) currentHP = value // Set current to max if not specified
      }
      foundAny = true
    }
  }
  
  confidence.hitPoints = foundAny ? 'high' : 'low'
  parseLog.push(`Hit Points - Max: ${maxHP}, Current: ${currentHP}, Temp: ${tempHP} (confidence: ${confidence.hitPoints})`)
  
  return { max: maxHP, current: currentHP, temp: tempHP }
}

// Parse armor class
export function parseArmorClass(pages: StructuredPage[], parseLog: string[], confidence: any): any {
  const acPatterns = [
    /(?:armor\s*class|ac)[:\s]*(\d+)/i,
    /(?:base\s*ac|base\s*armor\s*class)[:\s]*(\d+)/i,
  ]
  
  let totalAC = 10
  let baseAC = 10
  let foundAny = false
  
  for (const pattern of acPatterns) {
    const matches = findTextInPages(pages, pattern, { firstMatch: true })
    if (matches.length > 0) {
      const value = parseInt(matches[0].text)
      if (pattern.source.includes('base')) {
        baseAC = value
      } else {
        totalAC = value
        if (!foundAny) baseAC = value
      }
      foundAny = true
    }
  }
  
  confidence.armorClass = foundAny ? 'high' : 'low'
  parseLog.push(`Armor Class - Total: ${totalAC}, Base: ${baseAC} (confidence: ${confidence.armorClass})`)
  
  return { total: totalAC, base: baseAC }
}

// Parse speeds
export function parseSpeeds(pages: StructuredPage[], parseLog: string[], confidence: any): any {
  const speedPatterns = [
    /(?:speed)[:\s]*(\d+)\s*(?:ft\.?|feet?)/i,
    /(?:walking)[:\s]*(\d+)\s*(?:ft\.?|feet?)/i,
    /(?:flying?)[:\s]*(\d+)\s*(?:ft\.?|feet?)/i,
    /(?:swim(?:ming)?)[:\s]*(\d+)\s*(?:ft\.?|feet?)/i,
    /(?:climb(?:ing)?)[:\s]*(\d+)\s*(?:ft\.?|feet?)/i,
  ]
  
  const speeds: any = {}
  let foundAny = false
  
  for (const pattern of speedPatterns) {
    const matches = findTextInPages(pages, pattern, { firstMatch: true })
    if (matches.length > 0) {
      const value = parseInt(matches[0].text)
      if (pattern.source.includes('fly')) {
        speeds.flying = value
      } else if (pattern.source.includes('swim')) {
        speeds.swimming = value
      } else if (pattern.source.includes('climb')) {
        speeds.climbing = value
      } else {
        speeds.walking = value
      }
      foundAny = true
    }
  }
  
  if (!speeds.walking) {
    speeds.walking = 30 // Default walking speed
  }
  
  confidence.speeds = foundAny ? 'high' : 'low'
  parseLog.push(`Speeds: ${Object.entries(speeds).map(([k, v]) => `${k}: ${v}ft`).join(', ')} (confidence: ${confidence.speeds})`)
  
  return speeds
}

// Helper functions from the original file
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

function validateClass(className: string): string {
  const cleanClass = className.trim()
  const knownClass = DND_CLASSES.find(dndClass => 
    dndClass.toLowerCase() === cleanClass.toLowerCase()
  )
  return knownClass || cleanClass || 'Fighter'
}

function getClassHitDie(className: string): string {
  const hitDice: Record<string, string> = {
    'Artificer': 'd8',
    'Barbarian': 'd12',
    'Bard': 'd8',
    'Cleric': 'd8',
    'Druid': 'd8',
    'Fighter': 'd10',
    'Monk': 'd8',
    'Paladin': 'd10',
    'Ranger': 'd10',
    'Rogue': 'd8',
    'Sorcerer': 'd6',
    'Warlock': 'd8',
    'Wizard': 'd6',
  }
  return hitDice[className] || 'd8'
}
