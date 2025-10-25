// Simple test script to check sample data generation
const fs = require('fs');
const path = require('path');

// Read the sample data files
const charactersData = JSON.parse(fs.readFileSync('./src/data/sample/characters.json', 'utf8'));
const additionalActions = JSON.parse(fs.readFileSync('./additionalActions..js', 'utf8').replace('export default ', ''));
const additionalItems = JSON.parse(fs.readFileSync('./additionalItems.js', 'utf8').replace('export default ', ''));

console.log('=== Sample Data Analysis ===');
console.log('Characters in sample data:', charactersData.characters.length);
console.log('Additional actions:', additionalActions.length);
console.log('Additional items:', additionalItems.length);

// Check first character
const firstChar = charactersData.characters[0];
console.log('\n=== First Character ===');
console.log('Name:', firstChar.name);
console.log('Class:', firstChar.class);
console.log('Level:', firstChar.level);
console.log('Skills:', firstChar.skills?.length || 0);
console.log('Saving Throws:', firstChar.savingThrows?.length || 0);
console.log('Proficiencies:', firstChar.proficiencies?.length || 0);

// Check actions
const generalActions = additionalActions.filter(action => action.isBaseAction === true || action.category === "general");
const classActions = additionalActions.filter(action => action.category === "class_specific");

console.log('\n=== Actions Analysis ===');
console.log('General actions available:', generalActions.length);
console.log('Class-specific actions available:', classActions.length);

// Check items
const equipmentItems = additionalItems.filter(item => item.type === "Armor" || item.type === "Gear" || item.type === "Tool");
const meleeWeapons = additionalItems.filter(item => item.type === "Weapon" && (item.name.includes("Sword") || item.name.includes("Dagger") || item.name.includes("Axe") || item.name.includes("Mace") || item.name.includes("Hammer") || item.name.includes("Staff")));
const rangedWeapons = additionalItems.filter(item => item.type === "Weapon" && (item.name.includes("Bow") || item.name.includes("Crossbow") || item.name.includes("Sling")));
const potions = additionalItems.filter(item => item.name.includes("Potion"));
const magicalItems = additionalItems.filter(item => item.rarity === "Rare" || item.rarity === "Very Rare" || item.rarity === "Legendary");

console.log('\n=== Items Analysis ===');
console.log('Equipment items:', equipmentItems.length);
console.log('Melee weapons:', meleeWeapons.length);
console.log('Ranged weapons:', rangedWeapons.length);
console.log('Potions:', potions.length);
console.log('Magical items:', magicalItems.length);
