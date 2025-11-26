# Battle Maps Sample Data

## Overview

The battle maps sample data system provides pre-configured tactical maps with terrain, enemies, and allies for testing and demonstration purposes. Each map includes a complete battle scenario with character and monster placement.

## File Structure

### Source Files
- **Data**: `src/data/sample/maps.json` - Contains 8 sample battle maps with full scenario data
- **Service**: `src/lib/sampleDataService.ts` - Frontend service for loading sample data
- **Backend**: `convex/sampleData.ts` - Convex mutation for processing and storing maps
- **UI**: `src/components/SampleDataPanel.tsx` - UI component for loading sample data

## Sample Maps

### 1. Goblin Ambush - Forest Road
- **Difficulty**: Easy
- **Encounter Level**: 1
- **Size**: 20x15
- **Enemies**: 4 Goblins
- **Allies**: Party of 4 (Thorin, Elara, Marcus, Whisper)
- **Terrain**: Rocky outcrops, difficult terrain (undergrowth)

### 2. Orc War Party - Mountain Pass
- **Difficulty**: Medium
- **Encounter Level**: 3
- **Size**: 25x18
- **Enemies**: 3 Orcs
- **Allies**: Sildar Hallwinter, Gundren Rockseeker
- **Terrain**: Narrow paths, cliff edges, difficult terrain, hazardous terrain

### 3. Owlbear Nest - Cave Entrance
- **Difficulty**: Hard
- **Encounter Level**: 4
- **Size**: 16x14
- **Enemies**: 1 Owlbear
- **Allies**: Party of 4 (Thorin, Elara, Marcus, Whisper)
- **Terrain**: Cave entrance, rocky debris, difficult terrain

### 4. Ancient Tomb - Skeleton Guard
- **Difficulty**: Medium
- **Encounter Level**: 2
- **Size**: 22x16
- **Enemies**: 6 Skeletons
- **Allies**: Brother Marcus, Sister Garaele
- **Terrain**: Sarcophagi, magical darkness, difficult terrain

### 5. The Green Dragon's Lair
- **Difficulty**: Very Hard
- **Encounter Level**: 10
- **Size**: 28x20
- **Enemies**: 1 Young Red Dragon
- **Allies**: Party of 4 + Sildar Hallwinter
- **Terrain**: Acid pool, treasure mounds, hazardous terrain, difficult terrain

### 6. Troll Bridge - River Crossing
- **Difficulty**: Very Hard
- **Encounter Level**: 5
- **Size**: 24x14
- **Enemies**: 1 Troll
- **Allies**: Party of 4 (Thorin, Elara, Marcus, Whisper)
- **Terrain**: Bridge, river, unstable terrain

### 7. Tavern Brawl - The Sleeping Giant
- **Difficulty**: Easy
- **Encounter Level**: 1
- **Size**: 18x14
- **Enemies**: 2 Orcs
- **Allies**: Toblen Stonehill, Whisper
- **Terrain**: Tables, bar, chairs, difficult terrain (walls)

### 8. Goblin Stronghold - Main Chamber
- **Difficulty**: Hard
- **Encounter Level**: 3
- **Size**: 30x22
- **Enemies**: 8 Goblins
- **Allies**: Party of 4 + Sildar Hallwinter
- **Terrain**: Barricades, difficult terrain, hazardous terrain

## Terrain Types

The system supports the following terrain types defined in the schema:

1. **normal** - Standard terrain, no effects
2. **difficult** - Costs extra movement
3. **hazardous** - May cause damage or harmful effects
4. **magical** - Magical effects present
5. **water** - Water terrain (rivers, pools)
6. **ice** - Slippery terrain
7. **fire** - Fire hazard
8. **acid** - Acid pools
9. **poison** - Poisonous terrain
10. **unstable** - Unstable ground (may collapse)

## Token Generation

### Enemy Tokens (Monsters)
- Automatically created from the `monsters` table
- Type: `npc_foe`
- Color: Red (#dc2626)
- Includes: HP, max HP, speed, conditions
- Linked to monster record via `monsterId`

### Ally Tokens (Characters)
- Automatically created from the `characters` table
- Type: `pc`
- Color: Blue (#2563eb)
- Includes: HP, max HP, speed, conditions
- Linked to character record via `characterId`

## Usage

### Loading Sample Maps

1. Ensure you have sample characters and monsters loaded first
2. Navigate to the sample data panel
3. Select "maps" from the entity type
4. Click "Load Sample Data"

### Prerequisites

Sample maps require:
- **Characters**: At least 4 player characters (Thorin, Elara, Marcus, Whisper) and 2 NPCs (Sildar, Gundren, Sister Garaele, Toblen)
- **Monsters**: Goblin, Orc, Owlbear, Skeleton, Troll, Young Red Dragon

### Data Flow

1. Frontend reads `maps.json`
2. Service layer processes map data
3. Convex mutation creates:
   - Battle map record with terrain
   - Battle tokens for enemies and allies
4. Tokens are linked to their respective character/monster records

## Customization

To add new maps:

1. Edit `src/data/sample/maps.json`
2. Follow the existing structure
3. Define terrain using coordinate arrays
4. Specify enemies by monster name and position
5. Specify allies by character name and position

Example terrain definition:
```json
"terrain": {
  "road": [[5,0], [6,0]],
  "difficultTerrain": [[1,1], [2,2]],
  "hazardousTerrain": [[10,5], [11,6]]
}
```

## Technical Details

### Schema Alignment

- Tables used: `battleMaps`, `battleTokens`
- Token relationship: Links to `characters` and `monsters` tables
- Terrain system: Cell-based terrain with types and effects

### Position Format

All positions use [x, y] coordinate format:
- x: Column (0 to cols-1)
- y: Row (0 to rows-1)
- Origin (0,0): Top-left corner

### Error Handling

- Missing monsters/characters are skipped with logging
- Invalid coordinates are automatically clamped
- Terrain types fall back to "normal" if undefined
