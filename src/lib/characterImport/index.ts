// Character import system exports

export * from './types'
export * from './schemas'
export * from './parser'
export * from './pdfParser'
export * from './pdfWorkerConfig'
export * from './dataTransformation'

// Re-export commonly used functions
export {
  parseCharacterFile,
  parseJSONCharacterData,
  processImportedCharacter,
  calculateAbilityModifier,
  calculateProficiencyBonus,
} from './parser'

// Export error classes
export { CharacterImportError } from './errors'

export {
  importedCharacterDataSchema as ImportedCharacterDataSchema,
} from './schemas'

export type {
  ImportedCharacterData,
  ParsedCharacterData,
} from './types'

// Re-export data transformation functions
export {
  mapEquipmentToForm,
  mapActionsToForm,
  findOrCreateItemId,
  mapCurrencyToForm,
  mapProficienciesToForm,
  mapSpellsToForm,
  createFormDataFromParsedData,
  // New Convex schema mapping functions
  mapEquipmentToConvexSchema,
  mapActionsToConvexSchema,
} from './dataTransformation'
