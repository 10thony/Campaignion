import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, CheckCircle, AlertCircle, Edit3, Save, X } from 'lucide-react'
import { ImportedCharacterData, ParsedCharacterData } from '@/lib/characterImport'
import { formatModifier } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CharacterImportPreviewProps {
  characterData: ParsedCharacterData
  className?: string
  onCharacterDataChange?: (updatedData: ParsedCharacterData) => void
  showConfidenceFlags?: boolean
}

interface ConfidenceData {
  [key: string]: 'high' | 'medium' | 'low'
}

// Removed unused interface

export function CharacterImportPreview({ 
  characterData, 
  className, 
  onCharacterDataChange,
  showConfidenceFlags = false 
}: CharacterImportPreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<ParsedCharacterData>(characterData)
  
  const calculateAbilityModifier = (score: number) => Math.floor((score - 10) / 2)
  
  const totalLevel = editedData.classes.reduce((sum, cls) => sum + cls.level, 0)
  const proficiencyBonus = Math.ceil(totalLevel / 4) + 1
  
  // Extract confidence and parse log data
  const confidence: ConfidenceData = (editedData.originalData?.confidence as ConfidenceData) || {}
  const parseLog: string[] = (editedData.originalData?.parseLog as string[]) || []
  
  // Helper function to get confidence badge
  const getConfidenceBadge = (field: string) => {
    if (!showConfidenceFlags || !confidence[field]) return null
    
    const level = confidence[field]
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-red-100 text-red-800 border-red-200'
    }
    
    const icons = {
      high: CheckCircle,
      medium: AlertCircle,
      low: AlertTriangle
    }
    
    const Icon = icons[level]
    
    return (
      <Badge variant="outline" className={cn('ml-2 text-xs', colors[level])}>
        <Icon className="w-3 h-3 mr-1" />
        {level}
      </Badge>
    )
  }
  
  // Helper function to handle field editing
  const handleFieldEdit = (fieldName: string, value: any) => {
    const updatedData = { ...editedData }
    setFieldValue(updatedData, fieldName, value)
    setEditedData(updatedData)
    
    if (onCharacterDataChange) {
      onCharacterDataChange(updatedData)
    }
  }
  
  // Helper function to set nested field values
  const setFieldValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
  }
  
  // Editable field component
  const EditableField = ({ 
    label, 
    value, 
    fieldName, 
    type = 'text',
    multiline = false 
  }: {
    label: string
    value: any
    fieldName: string
    type?: string
    multiline?: boolean
  }) => {
    const isEditing = editingField === fieldName
    
    if (isEditing) {
      return (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center">
            {label}
            {getConfidenceBadge(fieldName)}
          </Label>
          <div className="flex items-center gap-2">
            {multiline ? (
              <Textarea
                value={value || ''}
                onChange={(e) => handleFieldEdit(fieldName, e.target.value)}
                className="flex-1"
                rows={3}
              />
            ) : (
              <Input
                type={type}
                value={value || ''}
                onChange={(e) => {
                  const newValue = type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                  handleFieldEdit(fieldName, newValue)
                }}
                className="flex-1"
              />
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingField(null)}
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditedData(characterData) // Reset to original
                setEditingField(null)
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="group">
        <div className="text-sm text-muted-foreground flex items-center">
          {label}
          {getConfidenceBadge(fieldName)}
          {onCharacterDataChange && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditingField(fieldName)}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
        </div>
        <div className="font-medium">{value || 'Not specified'}</div>
      </div>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Character Preview
          {showConfidenceFlags && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Confidence:</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {Object.values(confidence).filter(c => c === 'high').length} High
              </Badge>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                {Object.values(confidence).filter(c => c === 'medium').length} Medium
              </Badge>
              <Badge variant="outline" className="bg-red-100 text-red-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {Object.values(confidence).filter(c => c === 'low').length} Low
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <EditableField 
                  label="Name" 
                  value={editedData.name} 
                  fieldName="name" 
                />
                <EditableField 
                  label="Race" 
                  value={`${editedData.race}${editedData.subrace ? ` (${editedData.subrace})` : ''}`} 
                  fieldName="race" 
                />
                <EditableField 
                  label="Background" 
                  value={editedData.background} 
                  fieldName="background" 
                />
                <EditableField 
                  label="Alignment" 
                  value={editedData.alignment} 
                  fieldName="alignment" 
                />
                <div>
                  <div className="text-sm text-muted-foreground">Total Level</div>
                  <div className="font-medium">{totalLevel}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Experience Points</div>
                  <div className="font-medium">{characterData.experiencePoints?.toLocaleString() || 'Not specified'}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Classes */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Classes</h3>
              <div className="space-y-2">
                {characterData.classes.map((cls, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {cls.name} {cls.level}
                        {cls.subclass && ` (${cls.subclass})`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Hit Die: {cls.hitDie}
                      </div>
                    </div>
                    <Badge variant="secondary">Level {cls.level}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Ability Scores */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ability Scores</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(characterData.abilityScores).map(([ability, score]) => (
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

            <Separator />

            {/* Combat Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Combat Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Hit Points</div>
                  <div className="text-xl font-bold">{characterData.hitPoints}</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Armor Class</div>
                  <div className="text-xl font-bold">{characterData.armorClass}</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Proficiency</div>
                  <div className="text-xl font-bold">{formatModifier(proficiencyBonus)}</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Speed</div>
                  <div className="text-xl font-bold">{characterData.speed || '30 ft.'}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Passive Scores */}
            {(characterData.passivePerception || characterData.passiveInvestigation || characterData.passiveInsight) && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Passive Scores</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {characterData.passivePerception && (
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Perception</div>
                        <div className="text-xl font-bold">{characterData.passivePerception}</div>
                      </div>
                    )}
                    {characterData.passiveInvestigation && (
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Investigation</div>
                        <div className="text-xl font-bold">{characterData.passiveInvestigation}</div>
                      </div>
                    )}
                    {characterData.passiveInsight && (
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Insight</div>
                        <div className="text-xl font-bold">{characterData.passiveInsight}</div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Skills */}
            {characterData.skills.length > 0 && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {characterData.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Saving Throws */}
            {characterData.savingThrows.length > 0 && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Saving Throw Proficiencies</h3>
                  <div className="flex flex-wrap gap-2">
                    {characterData.savingThrows.map((save, index) => (
                      <Badge key={index} variant="outline">
                        {save}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Languages */}
            {characterData.languages && characterData.languages.length > 0 && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {characterData.languages.map((language, index) => (
                      <Badge key={index} variant="secondary">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Spellcasting */}
            {characterData.spellcastingAbility && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Spellcasting</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Ability</div>
                      <div className="text-lg font-bold">{characterData.spellcastingAbility}</div>
                    </div>
                    {characterData.spellSaveDC && (
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Save DC</div>
                        <div className="text-lg font-bold">{characterData.spellSaveDC}</div>
                      </div>
                    )}
                    {characterData.spellAttackBonus && (
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Attack Bonus</div>
                        <div className="text-lg font-bold">{formatModifier(characterData.spellAttackBonus)}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Spell Slots */}
                  {characterData.spellSlots && characterData.spellSlots.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Spell Slots</h4>
                      <div className="flex flex-wrap gap-2">
                        {characterData.spellSlots.map((slot, index) => (
                          <div key={index} className="text-center p-2 border rounded text-sm">
                            <div>Level {slot.level}</div>
                            <div>{slot.used}/{slot.total}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Known Spells */}
                  {characterData.spellsKnown && characterData.spellsKnown.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Spells Known</h4>
                      <div className="flex flex-wrap gap-2">
                        {characterData.spellsKnown.slice(0, 10).map((spell, index) => (
                          <Badge key={index} variant="outline">
                            {spell}
                          </Badge>
                        ))}
                        {characterData.spellsKnown.length > 10 && (
                          <Badge variant="secondary">
                            +{characterData.spellsKnown.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cantrips */}
                  {characterData.cantripsKnown && characterData.cantripsKnown.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Cantrips Known</h4>
                      <div className="flex flex-wrap gap-2">
                        {characterData.cantripsKnown.map((cantrip, index) => (
                          <Badge key={index} variant="outline">
                            {cantrip}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Equipment and Inventory */}
            {(characterData.equipment || characterData.inventory) && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Equipment & Inventory</h3>
                
                {/* Equipped Items */}
                {characterData.equipment && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Equipped Items</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {characterData.equipment.headgear && (
                        <div className="p-2 border rounded text-sm">
                          <div className="font-medium">Headgear</div>
                          <div className="text-muted-foreground">{characterData.equipment.headgear}</div>
                        </div>
                      )}
                      {characterData.equipment.chestwear && (
                        <div className="p-2 border rounded text-sm">
                          <div className="font-medium">Chest</div>
                          <div className="text-muted-foreground">{characterData.equipment.chestwear}</div>
                        </div>
                      )}
                      {characterData.equipment.mainHand && (
                        <div className="p-2 border rounded text-sm">
                          <div className="font-medium">Main Hand</div>
                          <div className="text-muted-foreground">{characterData.equipment.mainHand}</div>
                        </div>
                      )}
                      {characterData.equipment.offHand && (
                        <div className="p-2 border rounded text-sm">
                          <div className="font-medium">Off Hand</div>
                          <div className="text-muted-foreground">{characterData.equipment.offHand}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Inventory Items */}
                {characterData.inventory && characterData.inventory.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Inventory Items</h4>
                    <div className="space-y-2">
                      {characterData.inventory.slice(0, 10).map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded text-sm">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.description && (
                              <span className="text-muted-foreground ml-2">- {item.description}</span>
                            )}
                          </div>
                          <Badge variant="outline">×{item.quantity}</Badge>
                        </div>
                      ))}
                      {characterData.inventory.length > 10 && (
                        <div className="text-center p-2 border border-dashed rounded text-muted-foreground">
                          +{characterData.inventory.length - 10} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Separator />
              </div>
            )}

            {/* Enhanced Parsed Equipment Data */}
            {(characterData as any).parsedEquipment && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Parsed Equipment Details</h3>
                
                {/* Weapons */}
                {(characterData as any).parsedEquipment.weapons?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Weapons</h4>
                    <div className="space-y-2">
                      {(characterData as any).parsedEquipment.weapons.map((weapon: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{weapon.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {weapon.damage && `${weapon.damage} ${weapon.damageType}`}
                                {weapon.range && ` • ${weapon.range}`}
                                {weapon.attackBonus && ` • +${weapon.attackBonus} to hit`}
                              </div>
                              {weapon.notes && (
                                <div className="text-xs text-muted-foreground mt-1">{weapon.notes}</div>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <div>{weapon.weight} lb</div>
                              <div className="text-muted-foreground">{weapon.value} gp</div>
                              {weapon.equipped && (
                                <Badge variant="secondary" className="mt-1">Equipped</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Armor */}
                {(characterData as any).parsedEquipment.armor?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Armor</h4>
                    <div className="space-y-2">
                      {(characterData as any).parsedEquipment.armor.map((armor: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{armor.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {armor.armorClass && `AC ${armor.armorClass}`}
                                {armor.armorType && ` • ${armor.armorType}`}
                                {armor.stealthDisadvantage && (
                                  <span className="text-red-600"> • Stealth Disadvantage</span>
                                )}
                              </div>
                              {armor.notes && (
                                <div className="text-xs text-muted-foreground mt-1">{armor.notes}</div>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <div>{armor.weight} lb</div>
                              <div className="text-muted-foreground">{armor.value} gp</div>
                              {armor.equipped && (
                                <Badge variant="secondary" className="mt-1">Equipped</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Currency */}
                {characterData.parsedEquipment?.currency && Object.values(characterData.parsedEquipment.currency).some((v: number) => v > 0) && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Currency</h4>
                    <div className="flex gap-4 text-sm">
                      {Object.entries(characterData.parsedEquipment.currency).map(([type, amount]) => (
                        (amount as number) > 0 && (
                          <div key={type} className="flex items-center gap-1">
                            <span className="font-medium">{amount as number}</span>
                            <span className="text-muted-foreground uppercase">{type}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Equipment Categories */}
                {['gear', 'tools', 'ammunition', 'potions', 'books', 'valuables'].map(category => {
                  const items = characterData.parsedEquipment?.[category as keyof typeof characterData.parsedEquipment]
                  if (!items || !Array.isArray(items) || items.length === 0) return null
                  
                  return (
                    <div key={category} className="mb-4">
                      <h4 className="font-medium mb-2 capitalize">{category}</h4>
                      <div className="space-y-2">
                        {items.slice(0, 5).map((item, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded text-sm">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.description && (
                                <span className="text-muted-foreground ml-2">- {item.description}</span>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <div>{item.weight} lb</div>
                              <div className="text-muted-foreground">{item.value} gp</div>
                            </div>
                          </div>
                        ))}
                        {items.length > 5 && (
                          <div className="text-center p-2 border border-dashed rounded text-muted-foreground">
                            +{items.length - 5} more {category}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                <Separator />
              </div>
            )}

            {/* Enhanced Parsed Actions Data */}
            {characterData.parsedActions && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Parsed Actions & Combat</h3>
                
                {/* Weapon Attacks */}
                {characterData.parsedActions?.weaponAttacks?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Weapon Attacks</h4>
                    <div className="space-y-2">
                      {characterData.parsedActions?.weaponAttacks?.map((attack, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{attack.name}</div>
                              <div className="text-sm text-muted-foreground">
                                +{attack.attackBonus} to hit • {attack.damage} {attack.damageType}
                                {attack.range && ` • ${attack.range}`}
                              </div>
                              {attack.properties && Object.keys(attack.properties).length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {Object.entries(attack.properties).map(([prop, value]) => (
                                    value && (
                                      <Badge key={prop} variant="outline" className="text-xs capitalize">
                                        {prop}
                                      </Badge>
                                    )
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spell Attacks */}
                {characterData.parsedActions?.spellAttacks?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Spell Attacks</h4>
                    <div className="space-y-2">
                      {characterData.parsedActions?.spellAttacks?.map((spell, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{spell.name}</div>
                              <div className="text-sm text-muted-foreground">
                                +{spell.attackBonus} to hit • {spell.damage} {spell.damageType}
                                {spell.range && ` • ${spell.range}`}
                                {spell.saveDC && ` • DC ${spell.saveDC}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feature Actions */}
                {characterData.parsedActions?.featureActions?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Feature Actions</h4>
                    <div className="space-y-2">
                      {characterData.parsedActions?.featureActions?.map((feature, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{feature.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {feature.description}
                                {feature.damage && ` • ${feature.damage} ${feature.damageType}`}
                                {feature.range && ` • ${feature.range}`}
                                {feature.saveDC && ` • DC ${feature.saveDC}`}
                              </div>
                              {feature.uses && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Uses: {feature.uses.current}/{feature.uses.max} 
                                  {feature.uses.resetOn && ` (resets on ${feature.uses.resetOn})`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Action Types */}
                {['bonusActions', 'reactions', 'legendaryActions', 'lairActions'].map(actionType => {
                  const actions = characterData.parsedActions?.[actionType as keyof typeof characterData.parsedActions]
                  if (!actions || !Array.isArray(actions) || actions.length === 0) return null
                  
                  return (
                    <div key={actionType} className="mb-4">
                      <h4 className="font-medium mb-2 capitalize">{actionType.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <div className="space-y-2">
                        {actions.slice(0, 3).map((action: any, index: number) => (
                          <div key={index} className="p-2 border rounded text-sm">
                            <div className="font-medium">{action.name || action}</div>
                            {action.description && (
                              <div className="text-muted-foreground mt-1">{action.description}</div>
                            )}
                          </div>
                        ))}
                        {actions.length > 3 && (
                          <div className="text-center p-2 border border-dashed rounded text-muted-foreground">
                            +{actions.length - 3} more {actionType.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                <Separator />
              </div>
            )}

            {/* Actions and Combat */}
            {characterData.actions && characterData.actions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Actions & Combat</h3>
                <div className="space-y-2">
                  {characterData.actions.slice(0, 8).map((action, index) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">{action}</div>
                    </div>
                  ))}
                  {characterData.actions.length > 8 && (
                    <div className="text-center p-2 border border-dashed rounded text-muted-foreground">
                      +{characterData.actions.length - 8} more actions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features and Traits */}
            {((characterData.features && characterData.features.length > 0) || 
              (characterData.racialTraits && characterData.racialTraits.length > 0) ||
              (characterData.feats && characterData.feats.length > 0)) && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Features & Traits</h3>
                <div className="space-y-3">
                  {characterData.racialTraits?.map((trait, index) => (
                    <div key={`racial-${index}`} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{trait.name} <Badge variant="secondary" className="ml-2">Racial</Badge></div>
                      <div className="text-sm text-muted-foreground mt-1">{trait.description}</div>
                    </div>
                  ))}
                  {characterData.features?.slice(0, 5).map((feature, index) => (
                    <div key={`feature-${index}`} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">
                        {feature.name} 
                        <Badge variant="secondary" className="ml-2 capitalize">{feature.source}</Badge>
                        {feature.uses && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({feature.uses.current}/{feature.uses.max} uses)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{feature.description}</div>
                    </div>
                  ))}
                  {characterData.feats?.map((feat, index) => (
                    <div key={`feat-${index}`} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{feat.name} <Badge variant="secondary" className="ml-2">Feat</Badge></div>
                      <div className="text-sm text-muted-foreground mt-1">{feat.description}</div>
                    </div>
                  ))}
                  {characterData.features && characterData.features.length > 5 && (
                    <div className="text-center p-3 border border-dashed rounded-lg text-muted-foreground">
                      +{characterData.features.length - 5} more features
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parse Log */}
            {showConfidenceFlags && parseLog.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Parsing Details</h3>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-1 text-sm font-mono">
                        {parseLog.map((log, index) => (
                          <div key={index} className="text-muted-foreground">
                            {log}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </>
            )}

            {/* Import Source */}
            {editedData.importSource && (
              <>
                <Separator />
                <div className="text-center text-sm text-muted-foreground">
                  Imported from: <Badge variant="outline" className="ml-1 capitalize">{editedData.importSource}</Badge>
                  {editedData.originalData?.importedAt && (
                    <span className="ml-2">
                      on {new Date(editedData.originalData.importedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
