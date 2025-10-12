// Inventory line parser for table and list styles

export interface ParsedInventoryLine {
	name: string
	quantity: number
	weight?: number
	notes?: string
}

// Accepts:
// - "Arrows 20 1 lb."
// - "Rations 10 20 lb"
// - "Rope, hempen 50 ft 10 lb" (weight optional capture)
// - Table style: "ItemName    2    3 lb."
export function parseInventoryLine(line: string): ParsedInventoryLine | null {
	if (!line || line.trim().length < 2) return null
	const text = line.replace(/\s+/g, ' ').trim()

	// Pattern 1: Name Qty Weight lb
	let m = text.match(/^(.+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s*(?:lb|lbs?\.?)/i)
	if (m) {
		return {
			name: m[1].trim(),
			quantity: parseInt(m[2], 10),
			weight: parseFloat(m[3]),
		}
	}

	// Pattern 2: Name Qty (no weight)
	m = text.match(/^(.+?)\s+(\d+)$/)
	if (m) {
		return {
			name: m[1].trim(),
			quantity: parseInt(m[2], 10),
		}
	}

	// Pattern 3: Name maybe commas then qty weight variant like "Rope, hempen 50 ft 10 lb"
	m = text.match(/^(.+?)\s+(\d+)\s*(?:ft|m)?\s+(\d+(?:\.\d+)?)\s*(?:lb|lbs?\.?)/i)
	if (m) {
		return {
			name: m[1].trim(),
			quantity: parseInt(m[2], 10),
			weight: parseFloat(m[3]),
		}
	}

	// Fallback: single item name
	if (/^[A-Za-z][A-Za-z \-',\.]+$/.test(text)) {
		return {
			name: text.trim(),
			quantity: 1,
		}
	}

	return null
}


