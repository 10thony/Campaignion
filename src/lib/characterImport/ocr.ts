// Lazy OCR wrapper for tesseract.js. Only dynamic import when called.

export interface OCRWordBox {
	text: string
	x0: number
	y0: number
	x1: number
	y1: number
}

export interface OCRPageResult {
	text: string
	words: OCRWordBox[]
}

export async function recognizeImageBlob(blob: Blob): Promise<OCRPageResult> {
	// Dynamically import tesseract only here to keep main bundle small
	const { createWorker } = await import('tesseract.js')
	const worker = await createWorker({ logger: undefined })
	await worker.load()
	await worker.loadLanguage('eng')
	await worker.initialize('eng')
	try {
		const { data } = await worker.recognize(blob, { preserve_interword_spaces: '1' } as any)
		const words: OCRWordBox[] = (data.words || []).map((w: any) => ({
			text: (w.text || '').trim(),
			x0: w.bbox?.x0 ?? 0,
			y0: w.bbox?.y0 ?? 0,
			x1: w.bbox?.x1 ?? 0,
			y1: w.bbox?.y1 ?? 0,
		})).filter((w: OCRWordBox) => w.text)
		return { text: data.text || '', words }
	} finally {
		await worker.terminate()
	}
}


