// Character import error classes
export class CharacterImportError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'CharacterImportError'
  }
}
