// Test to ensure regex flags are handled correctly
import { describe, it, expect } from 'vitest'

describe('Regex Flags Handling', () => {
  it('should not duplicate regex flags when adding case insensitive flag', () => {
    // Simulate the scenario that was causing the error
    const pattern = /(?:class(?:\s*&\s*level)?)[:\s]*([^\n\r]+)/i // Already has 'i' flag
    
    // This is what was happening before the fix (would cause "ii" flags)
    const badPattern = () => new RegExp(pattern.source, pattern.flags + 'i')
    
    // This is the fixed version
    const goodPattern = () => new RegExp(pattern.source, pattern.flags.includes('i') ? pattern.flags : pattern.flags + 'i')
    
    // Test that our fix works
    expect(() => goodPattern()).not.toThrow()
    expect(goodPattern().flags).toBe('i') // Should still be just 'i', not 'ii'
    
    // Test with pattern that doesn't have 'i' flag
    const patternWithoutI = /test/g
    const withAddedI = new RegExp(patternWithoutI.source, patternWithoutI.flags.includes('i') ? patternWithoutI.flags : patternWithoutI.flags + 'i')
    expect(withAddedI.flags).toBe('gi')
  })

  it('should handle various regex flag combinations', () => {
    const testCases = [
      { pattern: /test/i, expected: 'i' },
      { pattern: /test/g, expected: 'gi' },
      { pattern: /test/gi, expected: 'gi' },
      { pattern: /test/gim, expected: 'gim' },
      { pattern: /test/, expected: 'i' },
    ]

    testCases.forEach(({ pattern, expected }) => {
      const result = new RegExp(pattern.source, pattern.flags.includes('i') ? pattern.flags : pattern.flags + 'i')
      expect(result.flags).toBe(expected)
    })
  })
})
