// Weapon line parser: parses lines like
// "Scimitar +9 1d6+5 Slashing Martial, Finesse, Light"
// and classic narrative:
// "Longsword. +5 to hit, 1d8+3 slashing damage, reach 5 ft."

export interface ParsedWeaponLine {
	name: string
	attackBonus: number
	damage: string
	damageType: string
	range?: string
	properties?: string[]
}

const DAMAGE_TYPE_RE = /(Bludgeoning|Piercing|Slashing|Fire|Cold|Acid|Poison|Necrotic|Radiant|Force|Thunder|Lightning|Psychic)/i
const DAMAGE_DICE_RE = /(\d+)d(\d+)([+-]\d+)?/i

export function parseWeaponLine(line: string): ParsedWeaponLine | null {
	if (!line || line.trim().length < 3) return null

	const text = line.replace(/\s+/g, ' ').trim()

	// Pattern 1: Table style: Name +Bonus XdY(+Z) Type [, properties]
	// Example: Scimitar +9 1d6+5 Slashing Martial, Finesse, Light
	const tableMatch = text.match(/^([^+\d][A-Za-z \-']+?)\s+\+?(\d{1,2})\s+(\d+d\d+(?:[+-]\d+)?)\s+([A-Za-z]+)\s*(.*)$/i)
	if (tableMatch) {
		const [, name, bonus, dmg, dmgType, props] = tableMatch
		return {
			name: name.trim(),
			attackBonus: parseInt(bonus, 10),
			damage: dmg,
			damageType: dmgType.toLowerCase(),
			properties: props ? props.split(/[,;]/).map(s => s.trim()).filter(Boolean) : undefined,
		}
	}

	// Pattern 2: Narrative: Name. +X to hit, XdY(+Z) type damage, 120 ft.
	const narrativeRe = /^([A-Za-z \-']+?)\.?\s*\+?(\d{1,2})\s+to\s+hit,\s*(\d+d\d+(?:[+-]\d+)?)\s+([a-z]+)\s+damage(?:,?\s*(\d+)\s*(?:ft|feet)\.?\s*)?/i
	const narrativeMatch = text.match(narrativeRe)
	if (narrativeMatch) {
		const [, name, bonus, dmg, dmgType, range] = narrativeMatch
		return {
			name: name.trim(),
			attackBonus: parseInt(bonus, 10),
			damage: dmg,
			damageType: dmgType.toLowerCase(),
			range: range ? `${range} ft.` : undefined,
		}
	}

	// Fallback: try to extract fields piecemeal
	const nameMatch = text.match(/^([A-Za-z \-']+?)[\.,]?\s+/)
	const bonusMatch = text.match(/\+(\d{1,2})/)
	const diceMatch = text.match(DAMAGE_DICE_RE)
	const typeMatch = text.match(DAMAGE_TYPE_RE)

	if (nameMatch && (bonusMatch || diceMatch)) {
		const name = nameMatch[1].trim()
		const attackBonus = bonusMatch ? parseInt(bonusMatch[1], 10) : 0
		const damage = diceMatch ? diceMatch[0] : ''
		const damageType = typeMatch ? typeMatch[0].toLowerCase() : ''
		// Range
		const rangeMatch = text.match(/(\d+)\s*(?:ft|feet)\b/i)
		const range = rangeMatch ? `${rangeMatch[1]} ft.` : undefined
		// Properties (after damage type or at end)
		let properties: string[] | undefined
		const afterTypeIdx = typeMatch ? text.toLowerCase().indexOf(typeMatch[0].toLowerCase()) + typeMatch[0].length : -1
		if (afterTypeIdx !== -1) {
			const tail = text.slice(afterTypeIdx)
			const propList = tail.replace(/^[^,]*,?\s*/, '')
			properties = propList.split(/[,;]/).map(p => p.trim()).filter(Boolean)
		}
		return { name, attackBonus, damage, damageType, range, properties }
	}

	return null
}


