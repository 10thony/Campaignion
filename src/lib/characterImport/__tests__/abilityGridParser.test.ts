import { describe, it, expect } from 'vitest'
import { parseAbilityGridGeometry } from '../extractors/abilityGridParser'

const dummyPage = (items: Array<{ str: string; x: number; y: number }>) => ({
	pageNumber: 1,
	lines: [
		{ y: 100, items: items as any, text: items.map(i => i.str).join(' ') }
	],
	rawText: items.map(i => i.str).join(' ')
})

describe('parseAbilityGridGeometry', () => {
	it('finds nearby numbers next to ability labels', () => {
		const page = dummyPage([
			{ str: 'STR', x: 10, y: 10 },
			{ str: '16', x: 60, y: 10 },
			{ str: 'DEX', x: 10, y: 40 },
			{ str: '14', x: 60, y: 40 },
			{ str: 'CON', x: 10, y: 70 },
			{ str: '12', x: 60, y: 70 },
		])
		const res = parseAbilityGridGeometry([page as any])
		expect(res.strength).toBe(16)
		expect(res.dexterity).toBe(14)
		expect(res.constitution).toBe(12)
	})
})


