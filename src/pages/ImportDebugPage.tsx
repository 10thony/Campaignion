import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CharacterImportError, parseCharacterFile } from '@/lib/characterImport'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - vite asset url
import samplePdfUrl from '../../darrow.pdf?url'

export function ImportDebugPage() {
	const [json, setJson] = useState<string>('')
	const [error, setError] = useState<string>('')
	const [isParsing, setIsParsing] = useState(false)

	async function parseBlobAsFile(blob: Blob, name: string) {
		const file = new File([blob], name, { type: 'application/pdf' })
		await handleParse(file)
	}

	async function handleParse(file: File) {
		setError('')
		setJson('')
		setIsParsing(true)
		try {
			const imported = await parseCharacterFile(file)
			// Show the raw data we have, including enhanced fields if present
			const payload: any = {
				name: imported.name,
				raw: imported,
				parsedEquipment: (imported as any).parsedEquipment || imported.originalData?.parsedEquipment,
				parsedActions: (imported as any).parsedActions || imported.originalData?.parsedActions,
				confidence: imported.originalData?.confidence,
				parseLog: imported.originalData?.parseLog,
			}
			setJson(JSON.stringify(payload, null, 2))
		} catch (e: any) {
			setError(e instanceof CharacterImportError ? e.message : (e?.message || 'Unknown error'))
		} finally {
			setIsParsing(false)
		}
	}

	async function handleUseSample() {
		try {
			const res = await fetch(samplePdfUrl)
			const blob = await res.blob()
			await parseBlobAsFile(blob, 'darrow.pdf')
		} catch (e: any) {
			setError(e?.message || 'Failed to load sample PDF')
		}
	}

	return (
		<div className="p-4">
			<Card>
				<CardHeader>
					<CardTitle>Import Debug (PDF → JSON)</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-2 items-end">
						<div className="flex-1">
							<Label htmlFor="file">Choose PDF</Label>
							<Input id="file" type="file" accept=".pdf" disabled={isParsing}
								onChange={async (e) => {
									const file = e.target.files?.[0]
									if (file) await handleParse(file)
								}}
							/>
						</div>
						<Button onClick={handleUseSample} disabled={isParsing}>
							{isParsing ? 'Parsing…' : 'Use sample darrow.pdf'}
						</Button>
					</div>

					{error && (
						<Alert>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{json && (
						<div>
							<Label>Imported JSON (raw)</Label>
							<pre className="mt-2 p-3 bg-muted rounded overflow-auto max-h-[70vh] text-xs">
								{json}
							</pre>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}


