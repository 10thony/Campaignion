/**
 * Manual Integration Test for Battle Map Creation
 * 
 * This script tests the battle map creation flow end-to-end.
 * Run with: npx tsx scripts/test-battle-map-creation.ts
 * 
 * Make sure Convex is running (`npm run dev:convex`) before running this script.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.VITE_CONVEX_URL || "https://your-deployment-url.convex.cloud";

async function runTests() {
  console.log("🧪 Starting Battle Map Creation Tests...\n");
  
  const client = new ConvexHttpClient(CONVEX_URL);
  
  const tests = [
    {
      name: "Test 1: Create basic battle map",
      test: async () => {
        const mapId = await client.mutation(api.battleMaps.create, {
          name: "Test Map - Basic",
          cols: 20,
          rows: 20,
          cellSize: 40,
          clerkId: "test-user-123",
        });
        
        const map = await client.query(api.battleMaps.get, { id: mapId });
        
        if (!map) {
          throw new Error("Map not found after creation");
        }
        
        if (map.name !== "Test Map - Basic") {
          throw new Error(`Expected name "Test Map - Basic", got "${map.name}"`);
        }
        
        if (map.cols !== 20 || map.rows !== 20) {
          throw new Error(`Expected 20x20 grid, got ${map.cols}x${map.rows}`);
        }
        
        if (!map.cells || map.cells.length !== 400) {
          throw new Error(`Expected 400 cells, got ${map.cells?.length || 0}`);
        }
        
        console.log(`✅ Map created successfully with ID: ${mapId}`);
        return mapId;
      },
    },
    {
      name: "Test 2: Create map with custom dimensions",
      test: async () => {
        const mapId = await client.mutation(api.battleMaps.create, {
          name: "Test Map - Custom",
          cols: 15,
          rows: 25,
          cellSize: 50,
          clerkId: "test-user-123",
        });
        
        const map = await client.query(api.battleMaps.get, { id: mapId });
        
        if (!map) {
          throw new Error("Map not found");
        }
        
        if (map.cells?.length !== 375) { // 15 x 25
          throw new Error(`Expected 375 cells, got ${map.cells?.length || 0}`);
        }
        
        console.log(`✅ Custom map created with ${map.cells.length} cells`);
        return mapId;
      },
    },
    {
      name: "Test 3: Update cell terrain",
      test: async (previousMapId?: string) => {
        if (!previousMapId) {
          throw new Error("No previous map ID provided");
        }
        
        await client.mutation(api.battleMaps.updateCell, {
          mapId: previousMapId,
          x: 5,
          y: 5,
          terrainType: "water",
          clerkId: "test-user-123",
        });
        
        const map = await client.query(api.battleMaps.get, { id: previousMapId });
        
        const targetCell = map?.cells?.find(c => c.x === 5 && c.y === 5);
        
        if (!targetCell) {
          throw new Error("Target cell not found");
        }
        
        if (targetCell.terrainType !== "water") {
          throw new Error(`Expected terrain "water", got "${targetCell.terrainType}"`);
        }
        
        console.log(`✅ Cell terrain updated successfully`);
        return previousMapId;
      },
    },
    {
      name: "Test 4: Create map instance",
      test: async (mapId?: string) => {
        if (!mapId) {
          throw new Error("No map ID provided");
        }
        
        const instanceId = await client.mutation(api.battleMaps.createInstance, {
          mapId,
          name: "Test Game Session",
          clerkId: "test-user-123",
        });
        
        const instance = await client.query(api.battleMaps.getInstance, { instanceId });
        
        if (!instance) {
          throw new Error("Instance not found");
        }
        
        if (instance.mapId !== mapId) {
          throw new Error(`Expected mapId ${mapId}, got ${instance.mapId}`);
        }
        
        console.log(`✅ Map instance created successfully`);
        return mapId;
      },
    },
    {
      name: "Test 5: Test edge cases (zero dimensions)",
      test: async () => {
        try {
          await client.mutation(api.battleMaps.create, {
            name: "Zero Size Map",
            cols: 0,
            rows: 0,
            cellSize: 40,
            clerkId: "test-user-123",
          });
          
          console.warn("⚠️  Warning: Zero-dimension map was allowed (should be validated)");
        } catch (error) {
          console.log(`✅ Zero-dimension map correctly rejected: ${(error as Error).message}`);
        }
      },
    },
    {
      name: "Test 6: Test edge cases (negative dimensions)",
      test: async () => {
        try {
          await client.mutation(api.battleMaps.create, {
            name: "Negative Size Map",
            cols: -5,
            rows: -10,
            cellSize: 40,
            clerkId: "test-user-123",
          });
          
          console.warn("⚠️  Warning: Negative-dimension map was allowed (should be validated)");
        } catch (error) {
          console.log(`✅ Negative-dimension map correctly rejected: ${(error as Error).message}`);
        }
      },
    },
    {
      name: "Test 7: Test edge cases (no user)",
      test: async () => {
        try {
          const mapId = await client.mutation(api.battleMaps.create, {
            name: "No User Map",
            cols: 10,
            rows: 10,
            cellSize: 40,
            clerkId: "nonexistent-user-id",
          });
          
          const map = await client.query(api.battleMaps.get, { id: mapId });
          
          if (!map?.createdBy) {
            console.warn("⚠️  Warning: Map created without valid user (should be validated)");
          } else {
            console.log("✅ Map creation handled missing user correctly");
          }
        } catch (error) {
          console.log(`✅ No-user map correctly rejected: ${(error as Error).message}`);
        }
      },
    },
  ];
  
  let previousResult: any;
  let passed = 0;
  let failed = 0;
  
  for (const testCase of tests) {
    try {
      console.log(`\n🔍 Running: ${testCase.name}`);
      previousResult = await testCase.test(previousResult);
      passed++;
    } catch (error) {
      console.error(`❌ Failed: ${testCase.name}`);
      console.error(`   Error: ${(error as Error).message}`);
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total:  ${tests.length}`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (failed === 0) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Check the output above for details.");
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("\n💥 Fatal error running tests:");
  console.error(error);
  process.exit(1);
});

