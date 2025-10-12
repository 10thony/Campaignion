import React, { useState } from 'react'
import { Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  parseCharacterFile, 
  parseJSONCharacterData,
  processImportedCharacter,
  CharacterImportError,
  ImportedCharacterData,
  createFormDataFromParsedData,
  mapEquipmentToForm,
  mapActionsToForm
} from '@/lib/characterImport'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

interface CharacterImportCardProps {
  onImportSuccess: (characterId: string, characterData: ImportedCharacterData) => void
  onImportError: (error: string) => void
  disabled?: boolean
  enableServerImport?: boolean // If true, immediately saves to server after parsing
}

export function CharacterImportCard({ 
  onImportSuccess, 
  onImportError, 
  disabled = false,
  enableServerImport = false
}: CharacterImportCardProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importMethod, setImportMethod] = useState<'file' | 'json' | 'dnd_beyond'>('file')
  const [jsonInput, setJsonInput] = useState('')
  const [dndBeyondUrl, setDndBeyondUrl] = useState('')
  const [lastImportStatus, setLastImportStatus] = useState<'success' | 'error' | null>(null)
  
  // Convex mutation for server-side import
  const importParsedCharacter = useMutation(api.importParsedCharacter.default)
  
  // Helper function to extract actions from character data
  const extractActionsFromCharacterData = (characterData: ImportedCharacterData): any[] => {
    // Check if we have enhanced parsed data (either in originalData or directly)
    const parsedActions = (characterData as any).parsedActions || characterData.originalData?.parsedActions
    
    if (parsedActions) {
      // Convert parsed actions to action format
      const actions: any[] = []
      
      // Add weapon attacks
      parsedActions.weaponAttacks?.forEach((weapon: any) => {
        actions.push({
          name: weapon.name,
          type: 'weapon_attack',
          description: `${weapon.name}: +${weapon.attackBonus} to hit, ${weapon.damage} ${weapon.damageType} damage${weapon.range ? `, ${weapon.range}` : ''}`,
          attackBonus: weapon.attackBonus,
          damage: weapon.damage,
          damageType: weapon.damageType,
          range: weapon.range,
          properties: weapon.properties
        })
      })
      
      // Add spell attacks
      parsedActions.spellAttacks?.forEach((spell: any) => {
        actions.push({
          name: spell.name,
          type: 'spell_attack',
          description: `${spell.name}: +${spell.attackBonus} to hit, ${spell.damage} ${spell.damageType} damage, ${spell.range}`,
          attackBonus: spell.attackBonus,
          damage: spell.damage,
          damageType: spell.damageType,
          range: spell.range,
          saveDC: spell.saveDC
        })
      })
      
      // Add feature actions
      parsedActions.featureActions?.forEach((feature: any) => {
        actions.push({
          name: feature.name,
          type: 'feature_action',
          description: feature.description,
          damage: feature.damage,
          damageType: feature.damageType,
          saveDC: feature.saveDC,
          range: feature.range,
          uses: feature.uses
        })
      })
      
      return actions
    }
    
    // Fallback to basic actions if no enhanced data
    return characterData.actions?.map(action => ({
      name: action,
      type: 'basic_action',
      description: `Basic action: ${action}`
    })) || []
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setLastImportStatus(null)

    try {
      // First, parse the character data client-side
      const characterData = await parseCharacterFile(file)
      const processedData = processImportedCharacter(characterData)
      
      if (enableServerImport) {
        // Import directly to server
        const result = await importParsedCharacter({
          parsedCharacter: {
            ...processedData,
            // Convert any actions data for server processing
            parsedActions: extractActionsFromCharacterData(processedData),
          }
        })
        
        // Transform parsed data to form format
        const formData = createFormDataFromParsedData(processedData)
        onImportSuccess(result.characterId, { ...processedData, formData })
        setLastImportStatus('success')
      } else {
        // Transform parsed data to form format for preview/editing
        const formData = createFormDataFromParsedData(processedData)
        onImportSuccess('', { ...processedData, formData }) // Empty characterId means not yet saved
        setLastImportStatus('success')
      }
      
    } catch (error) {
      let errorMessage = 'Failed to import character file'
      
      if (error instanceof CharacterImportError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        // Handle specific PDF worker errors with helpful messages
        if (error.message.includes('worker')) {
          errorMessage = 'PDF processing encountered a network issue. Please try again or use a JSON export instead.'
        } else if (error.message.includes('CORS')) {
          errorMessage = 'PDF processing blocked by browser security. Please try again or use a JSON export.'
        } else {
          errorMessage = error.message
        }
      }
      
      onImportError(errorMessage)
      setLastImportStatus('error')
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleJsonImport = async () => {
    if (!jsonInput.trim()) {
      onImportError('Please enter JSON character data')
      return
    }

    setIsImporting(true)
    setLastImportStatus(null)

    try {
      const jsonData = JSON.parse(jsonInput)
      const characterData = parseJSONCharacterData(jsonData)
      const processedData = processImportedCharacter(characterData)
      
      if (enableServerImport) {
        // Import directly to server
        const result = await importParsedCharacter({
          parsedCharacter: {
            ...processedData,
            parsedActions: extractActionsFromCharacterData(processedData),
          }
        })
        
        // Transform parsed data to form format
        const formData = createFormDataFromParsedData(processedData)
        onImportSuccess(result.characterId, { ...processedData, formData })
        setLastImportStatus('success')
      } else {
        // Transform parsed data to form format for preview/editing
        const formData = createFormDataFromParsedData(processedData)
        onImportSuccess('', { ...processedData, formData })
        setLastImportStatus('success')
      }
      
      setJsonInput('')
    } catch (error) {
      const errorMessage = error instanceof CharacterImportError 
        ? error.message 
        : error instanceof SyntaxError
        ? 'Invalid JSON format'
        : 'Failed to import character data'
      onImportError(errorMessage)
      setLastImportStatus('error')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDndBeyondImport = () => {
    // Placeholder for D&D Beyond integration
    onImportError('D&D Beyond integration is not yet available. Please use JSON export instead.')
  }

  const downloadSampleJson = () => {
    const sampleCharacter = {
      name: "Elara Moonwhisper",
      race: "Half-Elf",
      subrace: "",
      classes: [
        {
          name: "Ranger",
          level: 3,
          hitDie: "d10",
          subclass: "Hunter",
          features: ["Favored Enemy", "Natural Explorer", "Fighting Style", "Spellcasting"]
        },
        {
          name: "Rogue",
          level: 2,
          hitDie: "d8",
          subclass: "",
          features: ["Expertise", "Sneak Attack", "Thieves' Cant", "Cunning Action"]
        }
      ],
      background: "Outlander",
      alignment: "Chaotic Good",
      level: 5,
      experiencePoints: 6500,
      abilityScores: {
        strength: 13,
        dexterity: 17,
        constitution: 14,
        intelligence: 12,
        wisdom: 15,
        charisma: 14
      },
      hitPoints: 42,
      maxHitPoints: 42,
      currentHitPoints: 42,
      tempHitPoints: 0,
      armorClass: 15,
      skills: ["Stealth", "Perception", "Survival", "Investigation", "Insight"],
      savingThrows: ["Strength", "Dexterity"],
      proficiencies: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons"],
      languages: ["Common", "Elvish", "Sylvan"],
      speed: "30 ft.",
      racialTraits: [
        {
          name: "Darkvision",
          description: "You can see in dim light within 60 feet as if it were bright light."
        },
        {
          name: "Fey Ancestry",
          description: "You have advantage on saving throws against being charmed."
        }
      ],
      features: [
        {
          name: "Favored Enemy",
          description: "You have studied, tracked, and learned to hunt a certain type of creature.",
          source: "class"
        }
      ]
    }

    const blob = new Blob([JSON.stringify(sampleCharacter, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-dnd-character.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import D&D 5e Character
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Import Method Selection */}
        <div className="flex gap-2">
          <Button
            variant={importMethod === 'file' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setImportMethod('file')}
            disabled={disabled}
          >
            <FileText className="h-4 w-4 mr-2" />
            File Upload
          </Button>
          <Button
            variant={importMethod === 'json' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setImportMethod('json')}
            disabled={disabled}
          >
            JSON Data
          </Button>
          <Button
            variant={importMethod === 'dnd_beyond' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setImportMethod('dnd_beyond')}
            disabled={disabled}
          >
            D&D Beyond
          </Button>
        </div>

        {/* File Upload Method */}
        {importMethod === 'file' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="character-file">
                Character File (JSON, PDF, or TXT)
              </Label>
              <Input
                id="character-file"
                type="file"
                accept=".json,.pdf,.txt"
                onChange={handleFileUpload}
                disabled={disabled || isImporting}
                className="mt-1"
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Supported formats: JSON character exports, PDF character sheets (D&D Beyond printable).
                PDF parsing uses geometry-aware extraction to identify ability scores, classes, and other character data.
                {enableServerImport ? ' Characters will be saved directly to your account.' : ' You can preview and edit before saving.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* JSON Data Method */}
        {importMethod === 'json' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="json-input">
                Paste JSON Character Data
              </Label>
              <textarea
                id="json-input"
                className="w-full mt-1 p-3 border rounded-md min-h-[200px] font-mono text-sm"
                placeholder="Paste your character JSON data here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                disabled={disabled || isImporting}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleJsonImport}
                disabled={disabled || isImporting || !jsonInput.trim()}
              >
                {isImporting ? 'Importing...' : 'Import Character'}
              </Button>
              <Button
                variant="outline"
                onClick={downloadSampleJson}
                disabled={disabled}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample
              </Button>
            </div>
          </div>
        )}

        {/* D&D Beyond Method */}
        {importMethod === 'dnd_beyond' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="dnd-beyond-url">
                D&D Beyond Character URL
              </Label>
              <Input
                id="dnd-beyond-url"
                type="url"
                placeholder="https://www.dndbeyond.com/characters/..."
                value={dndBeyondUrl}
                onChange={(e) => setDndBeyondUrl(e.target.value)}
                disabled={disabled || isImporting}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleDndBeyondImport}
              disabled={disabled || isImporting || !dndBeyondUrl.trim()}
            >
              {isImporting ? 'Importing...' : 'Import from D&D Beyond'}
            </Button>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                D&D Beyond integration is coming soon. For now, please export your character 
                as JSON from D&D Beyond and use the JSON import method.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Status Indicator */}
        {lastImportStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Character imported successfully! You can now review and customize the data.
            </AlertDescription>
          </Alert>
        )}

        {lastImportStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Import failed. Please check your file format and try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Supported Sources:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>D&D Beyond character exports (JSON)</li>
            <li>Standard D&D 5e JSON character sheets</li>
            <li>PDF character sheets (fillable and text-based)</li>
            <li>Roll20 character exports (coming soon)</li>
          </ul>
          <p>
            The import system supports multiclass characters and will automatically 
            calculate derived stats like AC, saving throws, and passive scores.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
