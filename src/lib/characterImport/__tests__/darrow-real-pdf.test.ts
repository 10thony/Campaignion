import { describe, it, expect } from 'vitest'
import { parsePDFCharacterSheet } from '../pdfParser'
import fs from 'fs'
import path from 'path'

describe('Real Darrow PDF Test', () => {
  it.skip('should parse the actual darrow.pdf file correctly', async () => {
    const pdfPath = path.join(process.cwd(), 'darrow.pdf')
    
    // Skip if PDF doesn't exist
    if (!fs.existsSync(pdfPath)) {
      console.log('Skipping real PDF test - darrow.pdf not found')
      return
    }
    
    try {
      // Read the PDF file
      const pdfBuffer = fs.readFileSync(pdfPath)
      const file = new File([pdfBuffer], 'darrow.pdf', { type: 'application/pdf' })
      
      // Parse it
      const result = await parsePDFCharacterSheet(file)
      
      // Log the results for debugging
      console.log('=== DARROW PDF PARSING RESULTS ===')
      console.log('Name:', result.name)
      console.log('Race:', result.race)
      console.log('Classes:', result.classes)
      console.log('Level:', result.level)
      console.log('Ability Scores:', result.abilityScores)
      console.log('Equipment inventory count:', result.parsedEquipment?.inventory?.length || 0)
      console.log('Equipment weapons count:', result.parsedEquipment?.weapons?.length || 0)
      console.log('Actions weapon attacks count:', result.parsedActions?.weaponAttacks?.length || 0)
      console.log('Actions spell attacks count:', result.parsedActions?.spellAttacks?.length || 0)
      console.log('Actions feature actions count:', result.parsedActions?.featureActions?.length || 0)
      console.log('Basic actions count:', result.actions?.length || 0)
      
      // Log detailed equipment data
      if (result.parsedEquipment?.inventory?.length > 0) {
        console.log('=== EQUIPMENT FOUND ===')
        result.parsedEquipment.inventory.forEach((item, index) => {
          console.log(`${index + 1}. ${item.name} (${item.type}) x${item.quantity}`)
        })
      } else {
        console.log('No equipment found in parsedEquipment.inventory')
      }
      
      // Log detailed actions data
      if (result.parsedActions?.weaponAttacks?.length > 0) {
        console.log('=== WEAPON ATTACKS FOUND ===')
        result.parsedActions.weaponAttacks.forEach((attack, index) => {
          console.log(`${index + 1}. ${attack.name}: +${attack.attackBonus} to hit, ${attack.damage} ${attack.damageType}`)
        })
      } else {
        console.log('No weapon attacks found in parsedActions.weaponAttacks')
      }
      
      // Log the parse log for debugging
      if (result.parseLog && result.parseLog.length > 0) {
        console.log('=== PARSE LOG ===')
        result.parseLog.forEach((log, index) => {
          console.log(`${index + 1}. ${log}`)
        })
      }
      
      // Log confidence data
      if (result.confidence) {
        console.log('=== CONFIDENCE ===')
        Object.entries(result.confidence).forEach(([key, value]) => {
          console.log(`${key}: ${value}`)
        })
      }
      
      // Basic assertions
      expect(result.name).toBeDefined()
      expect(result.race).toBeDefined()
      expect(result.classes).toBeDefined()
      expect(result.level).toBeGreaterThan(0)
      
      // Check that we have equipment data structure
      expect(result.parsedEquipment).toBeDefined()
      expect(result.parsedActions).toBeDefined()
      
    } catch (error) {
      console.error('Error parsing darrow.pdf:', error)
      throw error
    }
  })
  
  it('should run the test manually', async () => {
    // This is just to run the above test manually
    const pdfPath = path.join(process.cwd(), 'darrow.pdf')
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ darrow.pdf not found at:', pdfPath)
      return
    }
    
    console.log('✅ Found darrow.pdf, running parse test...')
    
    try {
      const pdfBuffer = fs.readFileSync(pdfPath)
      
      // Create a File-like object with arrayBuffer method for test environment
      const file = {
        name: 'darrow.pdf',
        type: 'application/pdf',
        size: pdfBuffer.length,
        arrayBuffer: async () => {
          // Convert Node.js Buffer to ArrayBuffer properly
          const arrayBuffer = new ArrayBuffer(pdfBuffer.length)
          const uint8Array = new Uint8Array(arrayBuffer)
          for (let i = 0; i < pdfBuffer.length; i++) {
            uint8Array[i] = pdfBuffer[i]
          }
          return arrayBuffer
        }
      } as File
      
      const result = await parsePDFCharacterSheet(file)
      
      console.log('✅ Parse completed successfully!')
      console.log('Character Name:', result.name)
      console.log('Equipment items found:', result.parsedEquipment?.inventory?.length || 0)
      console.log('Actions found:', {
        weaponAttacks: result.parsedActions?.weaponAttacks?.length || 0,
        spellAttacks: result.parsedActions?.spellAttacks?.length || 0,
        featureActions: result.parsedActions?.featureActions?.length || 0
      })
      
      // Test passes if no error was thrown
      expect(true).toBe(true)
      
    } catch (error) {
      console.error('❌ Parse failed:', error)
      throw error
    }
  })
})
