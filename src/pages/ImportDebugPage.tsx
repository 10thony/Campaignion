import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CharacterImportError, parseCharacterFile } from '@/lib/characterImport'
import { Upload, FileText } from 'lucide-react'

export function ImportDebugPage() {
	const [json, setJson] = useState<string>('')
	const [error, setError] = useState<string>('')
	const [isParsing, setIsParsing] = useState(false)
	const [fileName, setFileName] = useState<string>('')

	async function handleParse(file: File) {
		setError('')
		setJson('')
		setFileName(file.name)
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

	return (
		<div className="p-4 max-w-6xl mx-auto">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<FileText className="w-6 h-6 text-primary" />
						<CardTitle>Character Import Debug Tool</CardTitle>
					</div>
					<CardDescription>
						Upload a D&D 5e character sheet PDF to view the parsed JSON data. 
						This tool helps debug the character import functionality.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
						<Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
						<Label 
							htmlFor="file" 
							className="cursor-pointer inline-block"
						>
							<div className="space-y-2">
								<div className="text-lg font-medium">
									{isParsing ? 'Parsing PDF...' : 'Choose a character sheet PDF'}
								</div>
								<div className="text-sm text-muted-foreground">
									Click to browse or drag and drop
								</div>
							</div>
						</Label>
						<Input 
							id="file" 
							type="file" 
							accept=".pdf" 
							disabled={isParsing}
							className="hidden"
							onChange={async (e) => {
								const file = e.target.files?.[0]
								if (file) await handleParse(file)
							}}
						/>
					</div>

					{fileName && !error && (
						<div className="flex items-center gap-2">
							<Badge variant="secondary" className="text-sm">
								<FileText className="w-3 h-3 mr-1" />
								{fileName}
							</Badge>
						</div>
					)}

					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{json && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label className="text-lg">Parsed JSON Output</Label>
								<Badge variant="outline">Ready to import</Badge>
							</div>
							<pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto max-h-[70vh] text-xs font-mono">
								{json}
							</pre>
						</div>
					)}

					{!json && !error && !isParsing && (
						<div className="text-center text-muted-foreground py-8">
							<p className="mb-2">No file uploaded yet</p>
							<p className="text-sm">
								Upload a D&D 5e character sheet PDF to see the parsed data
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}


