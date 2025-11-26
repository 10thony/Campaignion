/**
 * Terrain color definitions using the Campaignion color palette
 * 
 * This file provides terrain colors for both light and dark themes,
 * using the warm-to-cool gradient from Cherry Rose → Pacific Cyan.
 */

export const terrainColors = {
  light: {
    normal: 'rgba(232, 211, 231, 0.3)',      // Velvet Purple 50
    difficult: 'rgba(183, 9, 76, 0.25)',     // Cherry Rose
    hazardous: 'rgba(160, 26, 88, 0.35)',    // Dark Raspberry
    magical: 'rgba(137, 43, 100, 0.4)',      // Royal Plum
    water: 'rgba(23, 128, 161, 0.5)',        // Cerulean
    ice: 'rgba(0, 145, 173, 0.4)',           // Pacific Cyan
    fire: 'rgba(183, 9, 76, 0.5)',           // Cherry Rose (intense)
    acid: 'rgba(0, 201, 241, 0.4)',          // Pacific Cyan 300
    poison: 'rgba(114, 60, 112, 0.4)',       // Velvet Purple
    unstable: 'rgba(92, 77, 125, 0.5)',      // Dusty Grape
  },
  dark: {
    normal: 'rgba(30, 25, 35, 0.5)',
    difficult: 'rgba(244, 13, 102, 0.3)',    // Cherry Rose 300
    hazardous: 'rgba(214, 35, 118, 0.4)',    // Dark Raspberry 300
    magical: 'rgba(186, 59, 135, 0.45)',     // Royal Plum 300
    water: 'rgba(31, 174, 218, 0.5)',        // Cerulean 300
    ice: 'rgba(0, 201, 241, 0.45)',          // Pacific Cyan 300
    fire: 'rgba(244, 13, 102, 0.55)',        // Cherry Rose 300 (intense)
    acid: 'rgba(53, 221, 255, 0.4)',         // Pacific Cyan 200
    poison: 'rgba(158, 83, 155, 0.45)',      // Velvet Purple 300
    unstable: 'rgba(122, 103, 162, 0.5)',    // Dusty Grape 300
  },
} as const;

/**
 * Get terrain colors based on theme
 * @param isDark - Whether dark mode is active
 */
export function getTerrainColors(isDark: boolean): Record<string, string> {
  return isDark ? terrainColors.dark : terrainColors.light;
}

/**
 * Entity type color mappings using the new palette
 */
export const entityColors = {
  light: {
    playerCharacter: '#2e6f95',  // Rich Cerulean
    npc: '#5c4d7d',              // Dusty Grape
    monster: '#b7094c',          // Cherry Rose
    default: '#455e89',          // Dusk Blue
    selected: '#0091ad',         // Pacific Cyan
    currentTurn: '#892b64',      // Royal Plum
  },
  dark: {
    playerCharacter: '#3d92c4',  // Rich Cerulean 300
    npc: '#7a67a2',              // Dusty Grape 300
    monster: '#f40d66',          // Cherry Rose 300
    default: '#5c7aad',          // Dusk Blue 300
    selected: '#00c9f1',         // Pacific Cyan 300
    currentTurn: '#ba3b87',      // Royal Plum 300
  },
} as const;

/**
 * Get entity colors based on theme
 * @param isDark - Whether dark mode is active
 */
export function getEntityColors(isDark: boolean) {
  return isDark ? entityColors.dark : entityColors.light;
}

/**
 * HP bar color thresholds using the new palette
 */
export const hpBarColors = {
  light: {
    healthy: '#0091ad',        // Pacific Cyan - > 50%
    wounded: '#a01a58',        // Dark Raspberry - 25-50%
    critical: '#b7094c',       // Cherry Rose - < 25%
  },
  dark: {
    healthy: '#00c9f1',        // Pacific Cyan 300 - > 50%
    wounded: '#d62376',        // Dark Raspberry 300 - 25-50%
    critical: '#f40d66',       // Cherry Rose 300 - < 25%
  },
} as const;

/**
 * Get HP bar color based on percentage and theme
 * @param hpPercent - Current HP as percentage (0-100)
 * @param isDark - Whether dark mode is active
 */
export function getHpBarColor(hpPercent: number, isDark: boolean): string {
  const colors = isDark ? hpBarColors.dark : hpBarColors.light;
  if (hpPercent > 50) return colors.healthy;
  if (hpPercent > 25) return colors.wounded;
  return colors.critical;
}

/**
 * Selection ring colors for different states
 */
export const selectionColors = {
  light: {
    movement: 'rgba(183, 9, 76, 0.6)',       // Cherry Rose for movement
    attack: 'rgba(160, 26, 88, 0.6)',        // Dark Raspberry for attack
    target: 'rgba(137, 43, 100, 0.6)',       // Royal Plum for target
    selected: 'rgba(0, 145, 173, 0.6)',      // Pacific Cyan for selection
    hover: 'rgba(92, 77, 125, 0.4)',         // Dusty Grape for hover
  },
  dark: {
    movement: 'rgba(244, 13, 102, 0.6)',     // Cherry Rose 300 for movement
    attack: 'rgba(214, 35, 118, 0.6)',       // Dark Raspberry 300 for attack
    target: 'rgba(186, 59, 135, 0.6)',       // Royal Plum 300 for target
    selected: 'rgba(0, 201, 241, 0.6)',      // Pacific Cyan 300 for selection
    hover: 'rgba(122, 103, 162, 0.4)',       // Dusty Grape 300 for hover
  },
} as const;

/**
 * Get selection colors based on theme
 * @param isDark - Whether dark mode is active
 */
export function getSelectionColors(isDark: boolean) {
  return isDark ? selectionColors.dark : selectionColors.light;
}

/**
 * Map overlay colors for movement range, AoE, etc.
 */
export const overlayColors = {
  light: {
    movementRange: 'rgba(0, 145, 173, 0.25)',    // Pacific Cyan
    movementHover: 'rgba(0, 145, 173, 0.45)',    // Pacific Cyan (stronger)
    attackRange: 'rgba(183, 9, 76, 0.25)',       // Cherry Rose
    attackHover: 'rgba(183, 9, 76, 0.45)',       // Cherry Rose (stronger)
    aoe: 'rgba(160, 26, 88, 0.35)',              // Dark Raspberry
    measurePoint: 'rgba(46, 111, 149, 0.5)',     // Rich Cerulean
    multiSelect: 'rgba(0, 145, 173, 0.35)',      // Pacific Cyan
  },
  dark: {
    movementRange: 'rgba(0, 201, 241, 0.25)',    // Pacific Cyan 300
    movementHover: 'rgba(0, 201, 241, 0.45)',    // Pacific Cyan 300 (stronger)
    attackRange: 'rgba(244, 13, 102, 0.25)',     // Cherry Rose 300
    attackHover: 'rgba(244, 13, 102, 0.45)',     // Cherry Rose 300 (stronger)
    aoe: 'rgba(214, 35, 118, 0.35)',             // Dark Raspberry 300
    measurePoint: 'rgba(61, 146, 196, 0.5)',     // Rich Cerulean 300
    multiSelect: 'rgba(0, 201, 241, 0.35)',      // Pacific Cyan 300
  },
} as const;

/**
 * Get overlay colors based on theme
 * @param isDark - Whether dark mode is active
 */
export function getOverlayColors(isDark: boolean) {
  return isDark ? overlayColors.dark : overlayColors.light;
}

/**
 * Terrain information with effects (unchanged from original)
 */
export const terrainInfo: Record<string, { 
  description: string; 
  movementCost: string; 
  icon: string;
  effects: string[];
}> = {
  normal: { 
    description: "Standard terrain", 
    movementCost: "1", 
    icon: "🟫",
    effects: ["No special effects"]
  },
  difficult: { 
    description: "Harder to move through", 
    movementCost: "2", 
    icon: "🟤",
    effects: ["Double movement cost", "Difficult terrain"]
  },
  hazardous: { 
    description: "Dangerous terrain", 
    movementCost: "2", 
    icon: "⚠️",
    effects: ["Double movement cost", "Risk of injury", "May require saves"]
  },
  magical: { 
    description: "Magical effects", 
    movementCost: "1", 
    icon: "✨",
    effects: ["Magical properties", "May enhance abilities", "Unpredictable effects"]
  },
  water: { 
    description: "Water terrain", 
    movementCost: "2", 
    icon: "💧",
    effects: ["Double movement cost", "Swimming required", "May cause drowning"]
  },
  ice: { 
    description: "Slippery surface", 
    movementCost: "2", 
    icon: "🧊",
    effects: ["Double movement cost", "Risk of falling", "Dexterity saves required"]
  },
  fire: { 
    description: "Burning terrain", 
    movementCost: "2", 
    icon: "🔥",
    effects: ["Double movement cost", "Fire damage", "Constitution saves vs burning"]
  },
  acid: { 
    description: "Corrosive surface", 
    movementCost: "2", 
    icon: "🧪",
    effects: ["Double movement cost", "Acid damage", "Equipment damage risk"]
  },
  poison: { 
    description: "Toxic environment", 
    movementCost: "2", 
    icon: "☠️",
    effects: ["Double movement cost", "Poison damage", "Constitution saves vs poisoning"]
  },
  unstable: { 
    description: "Shifting ground", 
    movementCost: "2", 
    icon: "🌋",
    effects: ["Double movement cost", "Risk of falling", "Unstable footing"]
  },
};

export type TerrainType = keyof typeof terrainColors.light;

