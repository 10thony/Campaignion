import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Read JSON files
import generalActions from "../json/generalActions.json";
import classSpecificActions1 from "../json/classSpecificActions1.json";
import classSpecificActions2 from "../json/classSpecificActions2.json";

const client = new ConvexHttpClient(process.env.CONVEX_URL!);

interface ActionData {
  name: string;
  actionCost: string;
  type: string;
  description: string;
  requiresConcentration: boolean;
}

interface GeneralAction extends ActionData {
  // General actions don't have additional fields
}

interface ClassSpecificAction extends ActionData {
  className?: string;
}

async function populateGeneralActions() {
  console.log("Populating general actions...");
  
  for (const action of generalActions.actions) {
    try {
      await client.mutation(api.actions.createAction, {
        name: action.name,
        description: action.description,
        actionCost: action.actionCost as any,
        type: action.type as any,
        requiresConcentration: action.requiresConcentration,
        sourceBook: "Player's Handbook", // Default source book
        category: "general",
        isBaseAction: true,
        tags: ["core", "general"]
      });
      console.log(`✓ Added general action: ${action.name}`);
    } catch (error) {
      console.error(`✗ Failed to add general action: ${action.name}`, error);
    }
  }
}

async function populateClassSpecificActions() {
  console.log("Populating class-specific actions...");
  
  // Combine both class-specific action files
  const allClassActions = [
    ...classSpecificActions1.classActions,
    ...classSpecificActions2.classActions
  ];
  
  for (const classData of allClassActions) {
    for (const action of classData.actions) {
      try {
        await client.mutation(api.actions.createAction, {
          name: action.name,
          description: action.description,
          actionCost: action.actionCost as any,
          type: action.type as any,
          requiresConcentration: action.requiresConcentration,
          sourceBook: "Player's Handbook", // Default source book
          category: "class_specific",
          requiredClass: classData.className,
          className: classData.className, // Legacy field
          tags: ["class", classData.className.toLowerCase()],
          isBaseAction: false
        });
        console.log(`✓ Added ${classData.className} action: ${action.name}`);
      } catch (error) {
        console.error(`✗ Failed to add ${classData.className} action: ${action.name}`, error);
      }
    }
  }
}

async function main() {
  console.log("Starting action population...");
  
  try {
    await populateGeneralActions();
    await populateClassSpecificActions();
    
    console.log("\n✅ Action population completed successfully!");
    console.log(`- General actions: ${generalActions.actions.length}`);
    
    const totalClassActions = classSpecificActions1.classActions.reduce(
      (sum, classData) => sum + classData.actions.length, 0
    ) + classSpecificActions2.classActions.reduce(
      (sum, classData) => sum + classData.actions.length, 0
    );
    
    console.log(`- Class-specific actions: ${totalClassActions}`);
    
  } catch (error) {
    console.error("❌ Action population failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
