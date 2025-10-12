#!/usr/bin/env tsx

/**
 * Populate D&D Classes Script
 * 
 * This script populates the database with D&D classes from the classes.json file.
 * It reads the JSON data and creates entries in the dndClasses table.
 * 
 * Run this script as an admin user to populate D&D classes.
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import { readFileSync } from 'fs'
import { join } from 'path'

// Configuration
const CONVEX_URL = process.env.VITE_CONVEX_URL || 'http://localhost:8000'

interface DndClassData {
  name: string
  hitDie: string
  primaryAbility: string
  savingThrowProficiencies: string[]
  armorProficiencies: string[]
  weaponProficiencies: string[]
  description: string
  sourceBook: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

async function populateDndClasses() {
  console.log('🚀 Populating D&D Classes Database')
  console.log('================================')
  console.log(`Convex URL: ${CONVEX_URL}`)
  
  try {
    // Read classes.json file
    const classesJsonPath = join(process.cwd(), 'json', 'classes.json')
    console.log(`📖 Reading classes from: ${classesJsonPath}`)
    
    const classesJsonData = JSON.parse(readFileSync(classesJsonPath, 'utf-8'))
    const classesData = classesJsonData.dndClasses as DndClassData[]
    
    console.log(`📊 Found ${classesData.length} D&D classes to populate`)
    
    // Create Convex client
    const client = new ConvexHttpClient(CONVEX_URL)
    
    console.log('\n📊 Running populateDndClasses mutation...')
    
    // Call the populate function
    const result = await client.mutation(api.gameConstants.populateDndClasses, {
      classesData: classesData
    })
    
    console.log('✅ Successfully populated D&D classes!')
    console.log('\n📋 Results:')
    
    if (Array.isArray(result)) {
      result.forEach((item: any) => {
        console.log(`   ✅ ${item.name}: ${item.id}`)
      })
    } else {
      console.log('   Result:', result)
    }
    
    console.log('\n🎯 D&D Classes database is now ready!')
    console.log('   Characters can now properly reference class data.')
    
  } catch (error) {
    console.error('❌ Failed to populate D&D classes:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Only administrators can populate D&D classes')) {
        console.log('\n💡 Solution: You need to run this as an admin user.')
        console.log('   Make sure you are logged in with admin privileges.')
      } else if (error.message.includes('Failed to fetch')) {
        console.log('\n💡 Solution: Check your Convex URL and ensure the server is running.')
        console.log('   Current URL:', CONVEX_URL)
      } else if (error.message.includes('ENOENT')) {
        console.log('\n💡 Solution: Make sure the classes.json file exists in the json/ directory.')
      }
    }
    
    process.exit(1)
  }
}

// Run the script
if (import.meta.main) {
  populateDndClasses()
}

export { populateDndClasses }
