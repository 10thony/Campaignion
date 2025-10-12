import { describe, it, expect } from 'vitest'
import { parseWeaponLine } from '../extractors/weaponLineParser'

describe('parseWeaponLine', () => {
	it('parses table style line', () => {
		const res = parseWeaponLine("Scimitar +9 1d6+5 Slashing Martial, Finesse, Light")
		expect(res).toBeTruthy()
		expect(res!.name).toBe('Scimitar')
		expect(res!.attackBonus).toBe(9)
		expect(res!.damage).toBe('1d6+5')
		expect(res!.damageType).toBe('slashing')
		expect(res!.properties).toContain('Finesse')
	})

	it('parses narrative style line', () => {
		const res = parseWeaponLine("Longsword. +5 to hit, 1d8+3 slashing damage, reach 5 ft.")
		expect(res).toBeTruthy()
		expect(res!.name.toLowerCase()).toBe('longsword')
		expect(res!.attackBonus).toBe(5)
		expect(res!.damage).toBe('1d8+3')
		expect(res!.damageType).toBe('slashing')
		expect(res!.range).toBe('5 ft.')
	})
})


