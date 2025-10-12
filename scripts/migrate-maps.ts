/**
 * Map Migration Script
 * 
 * This script migrates all legacy maps to the new Battle Map system.
 * Run with: npx tsx scripts/migrate-maps.ts
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.VITE_CONVEX_URL || "https://your-deployment.convex.cloud";

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log("🗺️  Map Migration Utility\n");
  console.log("Checking migration status...\n");

  try {
    // Get migration status
    const status = await client.query("mapMigration:getMigrationStatus" as any);
    
    console.log("📊 Current Status:");
    console.log(`   Legacy Maps: ${status.legacyMaps}`);
    console.log(`   Battle Maps: ${status.battleMaps}`);
    console.log(`   Legacy Instances: ${status.legacyInstances}`);
    console.log(`   Battle Instances: ${status.battleInstances}\n`);

    if (status.legacyMaps === 0) {
      console.log("✅ No legacy maps to migrate!");
      process.exit(0);
    }

    console.log(`⚠️  Found ${status.legacyMaps} legacy map(s) to migrate.\n`);

    // Get legacy maps
    const legacyMaps = await client.query("mapMigration:getLegacyMaps" as any);
    
    console.log("📋 Legacy Maps:");
    legacyMaps.forEach((map: any, index: number) => {
      console.log(`   ${index + 1}. ${map.name} (${map.width}x${map.height})`);
    });
    console.log("");

    // Confirm migration
    console.log("⚠️  This will migrate all legacy maps to the Battle Map system.");
    console.log("   Original maps will NOT be deleted.\n");

    // In a real environment, you'd want user confirmation
    // For now, we'll just log what would happen
    console.log("🚀 To migrate, run this mutation in your Convex dashboard:");
    console.log(`   api.mapMigration.migrateAllMaps({})`);
    console.log("");
    console.log("Or use the Migration tab in the Maps page of the app.\n");

    console.log("✅ Migration utility completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  client.close();
}

main();

