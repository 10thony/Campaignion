/// <reference lib="webworker" />

// Worker entry for PDF parsing with optional OCR fallback.
// Receives ArrayBuffer and options; posts progress and final result.

// Minimal types to decouple from app imports inside worker bundle
type StructuredTextItem = { str: string; x: number; y: number; width?: number; height?: number }
type StructuredLine = { y: number; items: StructuredTextItem[]; text: string }
type StructuredPage = { pageNumber: number; lines: StructuredLine[]; rawText: string }

type WorkerRequest = {
	type: 'parse'
	fileBuffer: ArrayBuffer
	fileName: string
	fileSize: number
	ocrAllowed: boolean
}

type WorkerProgress = { type: 'progress'; stage: string; page?: number; totalPages?: number }
type WorkerResult = { type: 'result'; ok: true; parsed: any } | { type: 'result'; ok: false; error: string }

declare const self: DedicatedWorkerGlobalScope

// Post helper
function post(stage: string, page?: number, totalPages?: number) {
	self.postMessage({ type: 'progress', stage, page, totalPages } satisfies WorkerProgress)
}

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
	if (!ev.data || ev.data.type !== 'parse') return
	try {
		post('loading pdf')
		// Use explicit build to avoid tree-shaking export mismatch
		const pdfjs = await import('pdfjs-dist/build/pdf')
		// Import worker URL in worker context as well to keep parity with main bundle
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default as string
		try { (pdfjs as any).GlobalWorkerOptions.workerSrc = workerUrl } catch {}

		const loadingTask = (pdfjs as any).getDocument({ data: ev.data.fileBuffer, verbosity: 0 })
		const pdf = await loadingTask.promise

		const structuredPages: StructuredPage[] = []
		let fullText = ''
		for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
			post('extracting text', pageNum, pdf.numPages)
			try {
				const page = await pdf.getPage(pageNum)
				const textContent = await page.getTextContent()
				const items = textContent.items
					.filter((it: any) => typeof it.str === 'string' && it.str.trim())
					.map((it: any) => ({
						str: it.str,
						x: Math.round(it.transform[4]),
						y: Math.round(it.transform[5]),
						width: it.width,
						height: it.height,
					})) as StructuredTextItem[]
				const rows = new Map<number, StructuredTextItem[]>()
				for (const item of items) {
					const yKey = Math.round(item.y / 2) * 2
					if (!rows.has(yKey)) rows.set(yKey, [])
					rows.get(yKey)!.push(item)
				}
				const sortedKeys = Array.from(rows.keys()).sort((a, b) => b - a)
				const lines: StructuredLine[] = sortedKeys.map(y => {
					const rowItems = rows.get(y)!
					rowItems.sort((a, b) => a.x - b.x)
					return { y, items: rowItems, text: rowItems.map(r => r.str).join(' ') }
				})
				const rawText = lines.map(l => l.text).join('\n')
				structuredPages.push({ pageNumber: pageNum, lines, rawText })
				fullText += rawText + '\n'
			} catch (err) {
				// swallow page failure, continue
			}
		}

		if (!fullText.trim() && ev.data.ocrAllowed) {
			// Attempt OCR for each page
			for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
				post('ocr', pageNum, pdf.numPages)
				const page = await pdf.getPage(pageNum)
				const viewport = page.getViewport({ scale: 2 })
				const canvas = new OffscreenCanvas(viewport.width, viewport.height)
				const ctx = canvas.getContext('2d')!
				await page.render({ canvasContext: ctx as any, viewport }).promise
				const blob = await canvas.convertToBlob({ type: 'image/png' })
				const { recognizeImageBlob } = await import('../lib/characterImport/ocr')
				const result = await recognizeImageBlob(blob)
				const lines: StructuredLine[] = []
				// cluster words by y to approximate lines
				const rows = new Map<number, { x: number; str: string }[]>()
				for (const w of result.words) {
					const yKey = Math.round((w.y0 + w.y1) / 2 / 2) * 2
					if (!rows.has(yKey)) rows.set(yKey, [])
					rows.get(yKey)!.push({ x: Math.round((w.x0 + w.x1) / 2), str: w.text })
				}
				const sorted = Array.from(rows.keys()).sort((a, b) => b - a)
				for (const y of sorted) {
					const row = rows.get(y)!
					row.sort((a, b) => a.x - b.x)
					const text = row.map(r => r.str).join(' ')
					lines.push({ y, items: row.map(r => ({ str: r.str, x: r.x, y } as StructuredTextItem)), text })
				}
				const rawText = lines.map(l => l.text).join('\n')
				structuredPages.push({ pageNumber: pageNum, lines, rawText })
				fullText += rawText + '\n'
			}
		}

		post('extracting sections')
		// Use existing extraction logic by importing pdfParser's internal function via public export
		const { extractCharacterDataFromStructuredPages } = await import('../lib/characterImport/publicExtraction')
		const parsed = extractCharacterDataFromStructuredPages(structuredPages)
		self.postMessage({ type: 'result', ok: true, parsed } satisfies WorkerResult)
	} catch (e: any) {
		self.postMessage({ type: 'result', ok: false, error: e?.message || 'Unknown error' } satisfies WorkerResult)
	}
}

export {}


