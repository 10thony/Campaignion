import type { StructuredPage } from '../pdfParser'

export interface ParsedAbilityScores {
	strength: number
	dexterity: number
	constitution: number
	intelligence: number
	wisdom: number
	charisma: number
}

const DEFAULT_SCORES: ParsedAbilityScores = {
	strength: 10,
	dexterity: 10,
	constitution: 10,
	intelligence: 10,
	wisdom: 10,
	charisma: 10,
}

// Geometry-aware grid detection: find tokens STR/DEX/... and nearest 1-2 digit numbers nearby
export function parseAbilityGridGeometry(pages: StructuredPage[]): ParsedAbilityScores {
	const scores: ParsedAbilityScores = { ...DEFAULT_SCORES }
	const abilities = [
		{ key: 'strength', labels: ['str', 'strength'] },
		{ key: 'dexterity', labels: ['dex', 'dexterity'] },
		{ key: 'constitution', labels: ['con', 'constitution'] },
		{ key: 'intelligence', labels: ['int', 'intelligence'] },
		{ key: 'wisdom', labels: ['wis', 'wisdom'] },
		{ key: 'charisma', labels: ['cha', 'charisma'] },
	] as const

	for (const page of pages) {
		for (const line of page.lines) {
			for (const item of line.items) {
				const token = item.str.toLowerCase()
				const ability = abilities.find(a => a.labels.some(l => token.includes(l)))
				if (!ability) continue
				let bestDist = Number.POSITIVE_INFINITY
				let bestScore: number | undefined
				for (const otherLine of page.lines) {
					for (const other of otherLine.items) {
						const m = other.str.match(/^\d{1,2}$/)
						if (!m) continue
						const val = parseInt(m[0], 10)
						if (val < 1 || val > 30) continue
						const dx = Math.abs(other.x - item.x)
						const dy = Math.abs(other.y - item.y)
						const dist = dx + dy
						if (dist < bestDist && dx <= 120 && dy <= 60) {
							bestDist = dist
							bestScore = val
						}
					}
				}
				if (bestScore !== undefined) {
					(scores as any)[ability.key] = bestScore
				}
			}
		}
	}

	return scores
}


