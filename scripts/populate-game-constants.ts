#!/usr/bin/env tsx

/**
 * Populate Game Constants Script
 * 
 * This script populates the database with the initial game constants needed
 * for the character import system to work properly.
 * 
 * Run this script as an admin user to populate:
 * - Ability scores
 * - Point buy costs  
 * - D&D classes
 * - Equipment slots
 * - Action costs
 * - Action types
 * - Damage types
 * - Dice types
 * - Item types
 * - Item rarities
 * - Armor categories
 * - Spell levels
 * - Rest types
 * - Character types
 * - User roles
 * - Map cell states
 * - Terrain types
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

// Configuration
const CONVEX_URL = process.env.VITE_CONVEX_URL || 'http://localhost:8000'

async function populateGameConstants() {
  console.log('🚀 Populating Game Constants Database')
  console.log('====================================')
  console.log(`Convex URL: ${CONVEX_URL}`)
  
  try {
    // Create Convex client
    const client = new ConvexHttpClient(CONVEX_URL)
    
    console.log('\n📊 Running populateGameConstants mutation...')
    
    // Call the populate function
    const result = await client.mutation(api.gameConstants.populateGameConstants, {})
    
    console.log('✅ Successfully populated game constants!')
    console.log('\n📋 Results:')
    
    if (Array.isArray(result)) {
      result.forEach((item: any) => {
        console.log(`   ✅ ${item.table}: ${item.id}`)
      })
    } else {
      console.log('   Result:', result)
    }
    
    console.log('\n🎯 Database is now ready for character import!')
    console.log('   The ActionManager, EquipmentManager, and AbilityScoreGenerator')
    console.log('   should now work without crashes.')
    
  } catch (error) {
    console.error('❌ Failed to populate game constants:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Only administrators can populate game constants')) {
        console.log('\n💡 Solution: You need to run this as an admin user.')
        console.log('   Make sure you are logged in with admin privileges.')
      } else if (error.message.includes('Failed to fetch')) {
        console.log('\n💡 Solution: Check your Convex URL and ensure the server is running.')
        console.log('   Current URL:', CONVEX_URL)
      }
    }
    
    process.exit(1)
  }
}

// Run the script
if (import.meta.main) {
  populateGameConstants()
}

export { populateGameConstants }
