import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Upload, FileText } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImportedCharacterData } from '@/lib/characterImport/types'

// Sample multiclass character data that would come from PDF parsing
const SAMPLE_MULTICLASS_CHARACTER: ImportedCharacterData = {
  name: "Darrow Blackbane",
  race: "Half-Orc",
  subrace: undefined,
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
      subclass: "Thief",
      features: ["Expertise", "Sneak Attack", "Thieves' Cant", "Cunning Action"]
    }
  ],
  background: "Folk Hero",
  alignment: "Chaotic Good",
  level: 5,
  experiencePoints: 6500,
  abilityScores: {
    strength: 16,
    dexterity: 14,
    constitution: 15,
    intelligence: 10,
    wisdom: 13,
    charisma: 8
  },
  hitPoints: 42,
  maxHitPoints: 42,
  currentHitPoints: 42,
  tempHitPoints: 0,
  armorClass: 15,
  baseArmorClass: 13,
  speed: "30 ft.",
  speeds: {
    walking: 30,
  },
  skills: ["Stealth", "Perception", "Survival", "Investigation"],
  savingThrows: ["Strength", "Dexterity"],
  proficiencies: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons"],
  weaponProficiencies: ["Simple weapons", "Martial weapons"],
  armorProficiencies: ["Light armor", "Medium armor", "Shields"],
  toolProficiencies: ["Thieves' tools"],
  languages: ["Common", "Orcish"],
  racialTraits: [
    {
      name: "Darkvision",
      description: "You can see in dim light within 60 feet as if it were bright light."
    },
    {
      name: "Menacing",
      description: "You gain proficiency in the Intimidation skill."
    },
    {
      name: "Relentless Endurance", 
      description: "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead."
    },
    {
      name: "Savage Attacks",
      description: "When you score a critical hit with a melee weapon attack, you can roll one of the weapon's damage dice one additional time."
    }
  ],
  features: [
    {
      name: "Favored Enemy",
      description: "You have studied, tracked, and learned to hunt a certain type of creature.",
      source: "class"
    },
    {
      name: "Natural Explorer",
      description: "You are particularly familiar with one type of natural environment.",
      source: "class"
    },
    {
      name: "Sneak Attack",
      description: "Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll.",
      source: "class"
    }
  ],
  passivePerception: 14,
  passiveInvestigation: 13,
  passiveInsight: 11,
  initiative: 2,
  importSource: 'pdf',
  originalData: {
    confidence: {
      name: 'high',
      race: 'high', 
      classes: 'high',
      background: 'medium',
      abilityScores: 'high',
      hitPoints: 'high',
      armorClass: 'high'
    },
    parseLog: [
      'Processing 2 pages',
      'Found character name: "Darrow Blackbane" (confidence: high)',
      'Found race: "Half-Orc" (confidence: high)',
      'Found multiclass: Ranger 3, Rogue 2 (confidence: high)',
      'Found background: "Folk Hero" (confidence: medium)',
      'Found 6/6 ability scores (confidence: high)',
      'Hit Points - Max: 42, Current: 42, Temp: 0 (confidence: high)',
      'Armor Class - Total: 15, Base: 13 (confidence: high)',
      'Speeds: walking: 30ft (confidence: high)',
      'Extraction complete. Confidence: 6 high, 1 medium, 0 low'
    ]
  }
}

export function MulticlassImportDemo() {
  const [showDemo, setShowDemo] = useState(false)
  const [importedCharacter, setImportedCharacter] = useState<ImportedCharacterData | null>(null)

  const handleDemoImport = () => {
    setImportedCharacter(SAMPLE_MULTICLASS_CHARACTER)
    setShowDemo(true)
  }

  const calculateAbilityModifier = (score: number) => Math.floor((score - 10) / 2)
  const formatModifier = (modifier: number) => modifier >= 0 ? `+${modifier}` : `${modifier}`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Multiclass Character Import Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This demo showcases the enhanced character import system that can parse multiclass D&D 5e character sheets 
            from PDFs and automatically populate the character creation form.
          </p>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The PDF parser uses geometry-aware text extraction to identify ability scores, class levels, 
              and other character data with high confidence. It supports various multiclass formats including 
              "Ranger 3 / Rogue 2" and "3rd Level Fighter / 2nd Level Wizard".
            </AlertDescription>
          </Alert>

          <Button onClick={handleDemoImport} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Demo Multiclass Import (Darrow Blackbane - Ranger/Rogue)
          </Button>
        </CardContent>
      </Card>

      {showDemo && importedCharacter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Imported Character Preview</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Import Successful
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{importedCharacter.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Race</div>
                  <div className="font-medium">{importedCharacter.race}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Background</div>
                  <div className="font-medium">{importedCharacter.background}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Alignment</div>
                  <div className="font-medium">{importedCharacter.alignment}</div>
                </div>
              </div>
            </div>

            {/* Multiclass Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Classes (Total Level: {importedCharacter.level})
              </h3>
              <div className="grid gap-3">
                {importedCharacter.classes.map((cls, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {cls.name} Level {cls.level}
                        {cls.subclass && ` (${cls.subclass})`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Hit Die: {cls.hitDie} • {cls.features?.length || 0} features
                      </div>
                    </div>
                    <Badge variant="secondary">Level {cls.level}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Ability Scores */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ability Scores</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {Object.entries(importedCharacter.abilityScores).map(([ability, score]) => (
                  <div key={ability} className="text-center p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground uppercase">
                      {ability.slice(0, 3)}
                    </div>
                    <div className="text-2xl font-bold">{score}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatModifier(calculateAbilityModifier(score))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Combat Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Combat Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Hit Points</div>
                  <div className="text-xl font-bold">{importedCharacter.hitPoints}</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Armor Class</div>
                  <div className="text-xl font-bold">{importedCharacter.armorClass}</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Speed</div>
                  <div className="text-xl font-bold">{importedCharacter.speed}</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Initiative</div>
                  <div className="text-xl font-bold">{formatModifier(importedCharacter.initiative || 0)}</div>
                </div>
              </div>
            </div>

            {/* Proficiencies */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Skills & Proficiencies</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {importedCharacter.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Saving Throws</div>
                  <div className="flex flex-wrap gap-2">
                    {importedCharacter.savingThrows.map((save, index) => (
                      <Badge key={index} variant="outline">{save}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Languages</div>
                  <div className="flex flex-wrap gap-2">
                    {importedCharacter.languages?.map((language, index) => (
                      <Badge key={index} variant="secondary">{language}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Import Confidence */}
            {importedCharacter.originalData?.confidence && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Import Confidence</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(importedCharacter.originalData.confidence).map(([field, level]) => (
                    <div key={field} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm capitalize">{field}</span>
                      <Badge 
                        variant="outline" 
                        className={
                          level === 'high' ? 'bg-green-100 text-green-800' :
                          level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                This character data has been successfully parsed and is ready to be imported into the character creation system.
                The multiclass structure, ability scores, and all character details have been automatically detected and validated.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
