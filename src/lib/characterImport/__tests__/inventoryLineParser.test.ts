import { describe, it, expect } from 'vitest'
import { parseInventoryLine } from '../extractors/inventoryLineParser'

describe('parseInventoryLine', () => {
	it('parses table-like row with weight', () => {
		const res = parseInventoryLine('Arrows 20 1 lb.')
		expect(res).toEqual({ name: 'Arrows', quantity: 20, weight: 1 })
	})

	it('parses name and qty only', () => {
		const res = parseInventoryLine('Rations 10')
		expect(res).toEqual({ name: 'Rations', quantity: 10 })
	})

	it('parses complex rope line', () => {
		const res = parseInventoryLine('Rope, hempen 50 ft 10 lb')
		expect(res).toEqual({ name: 'Rope, hempen', quantity: 50, weight: 10 })
	})
})


