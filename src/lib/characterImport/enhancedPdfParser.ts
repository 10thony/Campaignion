// Enhanced PDF parser with improved patterns for D&D Beyond character sheets
import { StructuredPage, StructuredLine } from './pdfParser'
import { ParsedEquipmentData, ParsedActionData } from './types'

// Enhanced equipment parsing with more comprehensive patterns
export function parseEquipmentEnhanced(pages: StructuredPage[], parseLog: string[], confidence: any): ParsedEquipmentData {
  const inventory: Array<{
    name: string
    quantity: number
    description?: string
    weight?: number
    value?: number
    type: 'weapon' | 'armor' | 'tool' | 'gear' | 'ammunition' | 'potion' | 'book' | 'valuable' | 'currency'
  }> = []
  
  const equipment = {
    headgear: undefined as string | undefined,
    armwear: undefined as string | undefined,
    chestwear: undefined as string | undefined,
    legwear: undefined as string | undefined,
    footwear: undefined as string | undefined,
    mainHand: undefined as string | undefined,
    offHand: undefined as string | undefined,
    accessories: [] as string[]
  }
  
  const currency = {
    copper: 0,
    silver: 0,
    electrum: 0,
    gold: 0,
    platinum: 0
  }
  
  let foundEquipment = 0
  parseLog.push('=== ENHANCED EQUIPMENT PARSING ===')
  
  // Comprehensive weapon list for better matching
  const WEAPONS = [
    'longsword', 'shortsword', 'rapier', 'scimitar', 'dagger', 'handaxe', 'battleaxe', 'greataxe',
    'mace', 'warhammer', 'maul', 'spear', 'javelin', 'halberd', 'glaive', 'pike', 'trident',
    'quarterstaff', 'club', 'greatsword', 'flail', 'morningstar', 'war pick', 'whip',
    'shortbow', 'longbow', 'light crossbow', 'heavy crossbow', 'hand crossbow', 'sling',
    'dart', 'blowgun', 'net', 'lance', 'unarmed strike', 'unarmed', 'fist',
    'eldritch blast', 'shocking grasp', 'produce flame' // Include cantrips as weapon-like
  ]
  
  const ARMOR = [
    'padded armor', 'leather armor', 'studded leather', 'hide armor', 'chain shirt', 'scale mail',
    'breastplate', 'half plate', 'ring mail', 'chain mail', 'splint armor', 'plate armor',
    'shield', 'buckler', 'padded', 'leather', 'studded', 'hide', 'chain', 'scale', 'plate'
  ]
  
  const ADVENTURING_GEAR = [
    'backpack', 'bedroll', 'blanket', 'rope', 'grappling hook', 'torch', 'lantern',
    'oil', 'rations', 'waterskin', 'tinderbox', 'crowbar', 'hammer', 'piton',
    'tent', 'manacles', 'chain', 'lock', 'key', 'spyglass', 'magnifying glass',
    'caltrops', 'chalk', 'climbing kit', 'clothes', 'common', 'component pouch',
    'fishing tackle', 'flask', 'grapnel', 'ink', 'paper', 'parchment', 'perfume',
    'pick', 'pole', 'pot', 'iron', 'pouch', 'quiver', 'robes', 'rope', 'hemp',
    'sack', 'scale', 'merchant', 'sealing wax', 'signet ring', 'soap', 'spell book',
    'spellbook', 'string', 'tinder box', 'torch', 'travel', 'vial', 'whetstone',
    'arrows', 'bolts', 'bullets', 'sling bullets', 'crossbow bolts'
  ]
  
  const TOOLS = [
    "alchemist's supplies", "brewer's supplies", "calligrapher's supplies", "carpenter's tools",
    "cartographer's tools", "cobbler's tools", "cook's utensils", "glassblower's tools",
    "jeweler's tools", "leatherworker's tools", "mason's tools", "painter's supplies",
    "potter's tools", "smith's tools", "tinker's tools", "weaver's tools", "woodcarver's tools",
    "thieves' tools", "gaming set", "musical instrument", "navigator's tools", "poisoner's kit",
    "herbalism kit", "healer's kit", "disguise kit", "forgery kit"
  ]
  
  // Strategy 1: D&D Beyond specific equipment table parsing
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = line.text.trim()
      
      if (!text || text.length < 2) continue
      
      // Pattern 1: D&D Beyond equipment table format
      // Look for table headers like "NAME QTY WEIGHT" or "EQUIPMENT"
      if (/^(equipment|gear|inventory|name\s+qty|name\s+weight|item\s+qty)/i.test(text)) {
        parseLog.push(`Found equipment section: "${text}"`)
        
        // Look at the next 50 lines for equipment items
        for (let i = lineIdx + 1; i < Math.min(page.lines.length, lineIdx + 50); i++) {
          const itemLine = page.lines[i]
          const itemText = itemLine.text.trim()
          
          if (!itemText || itemText.length < 2) continue
          
          // Stop if we hit another major section
          if (/^(spells?|features?|actions?|attacks?|skills?|abilities|proficiencies|additional\s+features)/i.test(itemText)) break
          
          // Pattern: D&D Beyond table format: "ItemName 1 2 lb."
          const tableMatch = itemText.match(/^([A-Za-z\s\-,'\.\+]+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s*(?:lb|lbs?\.?)?\s*$/i)
          if (tableMatch) {
            const itemName = tableMatch[1].trim()
            const quantity = parseInt(tableMatch[2])
            const weight = parseFloat(tableMatch[3])
            
            const itemType = categorizeItemEnhanced(itemName, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS)
            if (itemType) {
              inventory.push({ name: itemName, quantity, weight, type: itemType as any })
              foundEquipment++
              parseLog.push(`Found table equipment: ${itemName} x${quantity} (${weight} lb)`)
            }
          }
          // Pattern: Simple quantity format "ItemName 1"
          else if (itemText.match(/^([A-Za-z\s\-,'\.\+]+?)\s+(\d+)\s*$/)) {
            const simpleMatch = itemText.match(/^([A-Za-z\s\-,'\.\+]+?)\s+(\d+)\s*$/)
            if (simpleMatch) {
              const itemName = simpleMatch[1].trim()
              const quantity = parseInt(simpleMatch[2])
              
              const itemType = categorizeItemEnhanced(itemName, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS)
              if (itemType) {
                inventory.push({ name: itemName, quantity, type: itemType as any })
                foundEquipment++
                parseLog.push(`Found simple equipment: ${itemName} x${quantity}`)
              }
            }
          }
          // Pattern: Just item name (single item)
          else if (itemText.match(/^[A-Za-z\s\-,'\.\+]+$/)) {
            const itemType = categorizeItemEnhanced(itemText, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS)
            if (itemType) {
              inventory.push({ name: itemText, quantity: 1, type: itemType as any })
              foundEquipment++
              parseLog.push(`Found single equipment: ${itemText}`)
            }
          }
        }
      }
      
      // Pattern 2: Look for currency mentions
      const currencyMatch = text.match(/(\d+)\s*(cp|sp|ep|gp|pp|copper|silver|electrum|gold|platinum)/gi)
      if (currencyMatch) {
        currencyMatch.forEach(match => {
          const [, amount, type] = match.match(/(\d+)\s*(cp|sp|ep|gp|pp|copper|silver|electrum|gold|platinum)/i) || []
          if (amount && type) {
            const value = parseInt(amount)
            const coinType = type.toLowerCase()
            
            if (coinType.includes('cp') || coinType.includes('copper')) currency.copper += value
            else if (coinType.includes('sp') || coinType.includes('silver')) currency.silver += value
            else if (coinType.includes('ep') || coinType.includes('electrum')) currency.electrum += value
            else if (coinType.includes('gp') || coinType.includes('gold')) currency.gold += value
            else if (coinType.includes('pp') || coinType.includes('platinum')) currency.platinum += value
            
            parseLog.push(`Found currency: ${amount} ${type}`)
          }
        })
      }
      
      // Pattern 3: Look for standalone item mentions in descriptive text
      const itemName = text.toLowerCase()
      
      // Check all item categories for mentions
      const allItems = [...WEAPONS, ...ARMOR, ...ADVENTURING_GEAR, ...TOOLS]
      allItems.forEach(item => {
        if (itemName.includes(item) && !inventory.some(invItem => invItem.name.toLowerCase().includes(item))) {
          const itemType = categorizeItemEnhanced(item, WEAPONS, ARMOR, ADVENTURING_GEAR, TOOLS)
          if (itemType) {
            inventory.push({ name: item, quantity: 1, type: itemType as any })
            foundEquipment++
            parseLog.push(`Found item mention: ${item} (${itemType})`)
          }
        }
      })
    }
  }
  
  confidence.equipment = foundEquipment >= 5 ? 'high' : foundEquipment >= 2 ? 'medium' : 'low'
  parseLog.push(`Enhanced equipment parsing found ${foundEquipment} items (confidence: ${confidence.equipment})`)
  
  return {
    inventory,
    equipment,
    currency
  }
}

// Enhanced action parsing with more comprehensive patterns
export function parseActionsEnhanced(pages: StructuredPage[], parseLog: string[], confidence: any): ParsedActionData {
  const weaponAttacks: Array<{
    name: string
    attackBonus: number
    damage: string
    damageType: string
    range?: string
    properties: any
  }> = []
  
  const spellAttacks: Array<{
    name: string
    attackBonus: number
    damage: string
    damageType: string
    range: string
    saveDC?: number
  }> = []
  
  const featureActions: Array<{
    name: string
    description: string
    damage?: string
    damageType?: string
    saveDC?: number
    range?: string
    uses?: { current: number; max: number; resetOn: string }
  }> = []
  
  let foundActions = 0
  parseLog.push('=== ENHANCED ACTION PARSING ===')
  
  // Common D&D spells and abilities to look for
  const COMMON_SPELLS = [
    'eldritch blast', 'shocking grasp', 'produce flame', 'magic hand', 'mage hand',
    'cantrips', 'identify', 'detect magic', 'shield', 'cure wounds', 'healing word',
    'fireball', 'lightning bolt', 'hold person', 'counterspell', 'dispel magic'
  ]
  
  const COMMON_FEATURES = [
    'second wind', 'action surge', 'fighting style', 'extra attack', 'flurry of blows',
    'patient defense', 'step of the wind', 'stunning strike', 'ki points', 'unarmored defense',
    'martial arts', 'deflect missiles', 'slow fall', 'wholeness of body', 'evasion',
    'pact magic', 'otherworldly patron', 'eldritch invocations', 'hex', 'hexblade',
    'weapon mastery', 'topple', 'sap', 'vex', 'push', 'nick', 'light', 'finesse',
    'two-weapon fighting', 'alert', 'draconic ancestry', 'breath weapon', 'damage resistance'
  ]
  
  // Strategy 1: Look for D&D Beyond weapon attacks table
  for (const page of pages) {
    for (let lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
      const line = page.lines[lineIdx]
      const text = line.text.trim()
      
      if (!text || text.length < 2) continue
      
      // Pattern 1: D&D Beyond weapon attack table format
      // "Scimitar +9 1d6+5 Slashing Martial, Finesse, Light, Nick"
      const weaponTableMatch = text.match(/^([A-Za-z\s\-']+?)\s+\+?(\d+)\s+(\d+d\d+(?:[+-]\d+)?)\s+([A-Za-z]+)\s*(.*)$/i)
      if (weaponTableMatch) {
        const [, name, bonus, damage, damageType, properties] = weaponTableMatch
        weaponAttacks.push({
          name: name.trim(),
          attackBonus: parseInt(bonus),
          damage,
          damageType: damageType.toLowerCase(),
          properties: { description: properties.trim() }
        })
        foundActions++
        parseLog.push(`Found weapon attack table entry: ${name} +${bonus} ${damage} ${damageType}`)
      }
      
      // Pattern 2: Classic attack format with damage
      // "Longsword. +5 to hit, 1d8+3 slashing damage"
      const attackMatch = text.match(/^([A-Za-z\s\-']+)\.\s*\+?(\d+)\s+to\s+hit,?\s*(\d+d\d+(?:[+-]\d+)?)\s+([a-z]+)\s+damage/i)
      if (attackMatch && !weaponTableMatch) {
        const [, name, bonus, damage, damageType] = attackMatch
        weaponAttacks.push({
          name: name.trim(),
          attackBonus: parseInt(bonus),
          damage,
          damageType,
          properties: {}
        })
        foundActions++
        parseLog.push(`Found weapon attack: ${name} +${bonus} to hit, ${damage} ${damageType}`)
      }
      
      // Pattern 3: Spell attack format
      // "Eldritch Blast. +4 to hit, 1d10 force damage, 120 ft"
      const spellMatch = text.match(/^([A-Za-z\s\-']+)\.\s*\+?(\d+)\s+to\s+hit,?\s*(\d+d\d+(?:[+-]\d+)?)\s+([a-z]+)\s+damage,?\s*(\d+)\s*(?:ft|feet)/i)
      if (spellMatch) {
        const [, name, bonus, damage, damageType, range] = spellMatch
        spellAttacks.push({
          name: name.trim(),
          attackBonus: parseInt(bonus),
          damage,
          damageType,
          range: `${range} ft`
        })
        foundActions++
        parseLog.push(`Found spell attack: ${name} +${bonus} to hit, ${damage} ${damageType}, ${range} ft`)
      }
      
      // Pattern 4: Feature actions with usage
      // "Second Wind (1/rest). Regain 1d10+1 hit points"
      const featureMatch = text.match(/^([A-Za-z\s\-']+)\s*(?:\(([^)]+)\))?\.\s*(.+)/i)
      if (featureMatch && !attackMatch && !spellMatch && !weaponTableMatch) {
        const [, name, uses, description] = featureMatch
        
        let usesData: { current: number; max: number; resetOn: string } | undefined = undefined
        if (uses) {
          const usesMatch = uses.match(/(\d+)\/(.+)/)
          if (usesMatch) {
            usesData = {
              current: parseInt(usesMatch[1]),
              max: parseInt(usesMatch[1]),
              resetOn: usesMatch[2].trim()
            }
          }
        }
        
        featureActions.push({
          name: name.trim(),
          description,
          uses: usesData
        })
        foundActions++
        parseLog.push(`Found feature action: ${name}`)
      }
      
      // Pattern 5: Look for action section headers and detailed parsing
      if (/^(actions?|attacks?|combat|weapon\s+attacks?|spell\s+attacks?|=== actions ===)/i.test(text)) {
        parseLog.push(`Found action section: "${text}"`)
        
        // Look at the next 50 lines for actions
        for (let i = lineIdx + 1; i < Math.min(page.lines.length, lineIdx + 50); i++) {
          const actionLine = page.lines[i]
          const actionText = actionLine.text.trim()
          
          if (!actionText || actionText.length < 3) continue
          
          // Stop if we hit another major section
          if (/^(spells?|features?|equipment|inventory|skills?|abilities|additional\s+features)/i.test(actionText)) break
          
          // Parse multi-line action descriptions
          const actionDescMatch = actionText.match(/^([A-Za-z\s\-']+)\s*(?:\(([^)]+)\))?[:\.]?\s*(.*)/)
          if (actionDescMatch) {
            const [, actionName, usage, description] = actionDescMatch
            
            // Check if it's a known spell or feature
            const isSpell = COMMON_SPELLS.some(spell => actionName.toLowerCase().includes(spell))
            const isFeature = COMMON_FEATURES.some(feature => actionName.toLowerCase().includes(feature))
            
            if (isSpell && !spellAttacks.some(s => s.name.toLowerCase() === actionName.toLowerCase())) {
              spellAttacks.push({
                name: actionName.trim(),
                attackBonus: 0,
                damage: '1d4',
                damageType: 'force',
                range: '60 ft'
              })
              foundActions++
              parseLog.push(`Found spell from section: ${actionName}`)
            } else if (isFeature && !featureActions.some(f => f.name.toLowerCase() === actionName.toLowerCase())) {
              featureActions.push({
                name: actionName.trim(),
                description: description || `Class feature: ${actionName}`
              })
              foundActions++
              parseLog.push(`Found feature from section: ${actionName}`)
            }
          }
        }
      }
      
      // Pattern 6: Look for specific spell mentions
      COMMON_SPELLS.forEach(spell => {
        if (text.toLowerCase().includes(spell) && !spellAttacks.some(s => s.name.toLowerCase().includes(spell))) {
          spellAttacks.push({
            name: spell,
            attackBonus: 0,
            damage: '1d4',
            damageType: 'force',
            range: '60 ft'
          })
          foundActions++
          parseLog.push(`Found spell mention: ${spell}`)
        }
      })
      
      // Pattern 7: Look for specific feature mentions
      COMMON_FEATURES.forEach(feature => {
        if (text.toLowerCase().includes(feature) && !featureActions.some(f => f.name.toLowerCase().includes(feature))) {
          featureActions.push({
            name: feature,
            description: `Class feature: ${feature}`
          })
          foundActions++
          parseLog.push(`Found feature mention: ${feature}`)
        }
      })
    }
  }
  
  confidence.actions = foundActions >= 5 ? 'high' : foundActions >= 2 ? 'medium' : 'low'
  parseLog.push(`Enhanced action parsing found ${foundActions} actions (confidence: ${confidence.actions})`)
  
  // Additional debug info
  parseLog.push(`- Weapon attacks: ${weaponAttacks.length}`)
  parseLog.push(`- Spell attacks: ${spellAttacks.length}`)
  parseLog.push(`- Feature actions: ${featureActions.length}`)
  
  return {
    weaponAttacks,
    spellAttacks,
    featureActions
  }
}

// Enhanced helper function to categorize items
function categorizeItemEnhanced(itemName: string, weapons: string[], armor: string[], gear: string[], tools: string[]): string | null {
  const name = itemName.toLowerCase()
  
  // Check for exact matches first
  if (weapons.some(w => w.toLowerCase() === name)) return 'weapon'
  if (armor.some(a => a.toLowerCase() === name)) return 'armor'
  if (tools.some(t => t.toLowerCase() === name)) return 'tool'
  if (gear.some(g => g.toLowerCase() === name)) return 'gear'
  
  // Check for partial matches
  if (weapons.some(w => name.includes(w.toLowerCase()) || w.toLowerCase().includes(name))) return 'weapon'
  if (armor.some(a => name.includes(a.toLowerCase()) || a.toLowerCase().includes(name))) return 'armor'
  if (tools.some(t => name.includes(t.toLowerCase()) || t.toLowerCase().includes(name))) return 'tool'
  if (gear.some(g => name.includes(g.toLowerCase()) || g.toLowerCase().includes(name))) return 'gear'
  
  // Check for ammunition
  if (/(arrow|bolt|bullet|sling stone|dart)/i.test(name)) return 'ammunition'
  
  // Check for common gear patterns
  if (/(rope|torch|lantern|oil|ration|water|tent|bedroll|pack|bag|pouch|coin|money|clothes|common)/i.test(name)) {
    return 'gear'
  }
  
  // Check for tools patterns
  if (/(kit|tool|instrument|thieves|lock|pick|supplies)/i.test(name)) {
    return 'tool'
  }
  
  // Check for potions
  if (/(potion|elixir|draught)/i.test(name)) {
    return 'potion'
  }
  
  // Check for books
  if (/(book|tome|manual|scroll|spellbook)/i.test(name)) {
    return 'book'
  }
  
  // Check for valuables
  if (/(gem|jewelry|ring|necklace|crown|gold|silver|platinum|diamond|ruby|emerald)/i.test(name)) {
    return 'valuable'
  }
  
  return 'gear' // Default fallback
}

// Helper function to categorize items (backward compatibility)
function categorizeItem(itemName: string, weapons: string[], armor: string[]): string | null {
  return categorizeItemEnhanced(itemName, weapons, armor, [], [])
}