import { useState, useCallback, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dice6 } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface AbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

interface AbilityScoreGeneratorProps {
  initialValues: AbilityScores
  onChange: (scores: AbilityScores) => void
  disabled?: boolean
}

// Phase 2: Use database queries instead of constants file
// const { POINT_BUY, SCORE_RANGE } = DND5E_CONSTANTS.ABILITY_SCORES
// const { DISPLAY_NAMES } = DND5E_CONSTANTS.ABILITY_SCORES

function rollAbilityScore(): number {
  // Roll 4d6, drop the lowest
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
  rolls.sort((a, b) => b - a) // Sort descending
  return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0) // Take the top 3
}

function rollAllAbilityScores(): AbilityScores {
  return {
    strength: rollAbilityScore(),
    dexterity: rollAbilityScore(),
    constitution: rollAbilityScore(),
    intelligence: rollAbilityScore(),
    wisdom: rollAbilityScore(),
    charisma: rollAbilityScore(),
  }
}

function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function AbilityScoreGenerator({ 
  initialValues, 
  onChange, 
  disabled = false 
}: AbilityScoreGeneratorProps) {
  // Safe defaults to avoid undefined from react-hook-form transient states
  const defaultTenScores: AbilityScores = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  }
  const basePointBuyScores: AbilityScores = {
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8,
  }

  const safeInitialValues = (initialValues as AbilityScores | undefined) ?? defaultTenScores

  const [rollResults, setRollResults] = useState<AbilityScores[]>([])
  const [pointBuyScores, setPointBuyScores] = useState<AbilityScores>(
    (initialValues as AbilityScores | undefined) ?? basePointBuyScores
  )

  // Phase 2: Database queries for ability scores and point buy costs
  const abilityScores = useQuery(api.gameConstants.getAbilityScores) || []
  const pointBuyCosts = useQuery(api.gameConstants.getPointBuyCosts) || []

  // Fallback to hardcoded ability scores if database is empty
  const fallbackAbilityScores = [
    { key: 'strength', abbreviation: 'STR', name: 'Strength', sortOrder: 1 },
    { key: 'dexterity', abbreviation: 'DEX', name: 'Dexterity', sortOrder: 2 },
    { key: 'constitution', abbreviation: 'CON', name: 'Constitution', sortOrder: 3 },
    { key: 'intelligence', abbreviation: 'INT', name: 'Intelligence', sortOrder: 4 },
    { key: 'wisdom', abbreviation: 'WIS', name: 'Wisdom', sortOrder: 5 },
    { key: 'charisma', abbreviation: 'CHA', name: 'Charisma', sortOrder: 6 }
  ]

  // Fallback to hardcoded point buy costs if database is empty
  const fallbackPointBuyCosts = [
    { score: 8, cost: 0 },
    { score: 9, cost: 1 },
    { score: 10, cost: 2 },
    { score: 11, cost: 3 },
    { score: 12, cost: 4 },
    { score: 13, cost: 5 },
    { score: 14, cost: 7 },
    { score: 15, cost: 9 }
  ]

  // Use database data if available, otherwise fall back to hardcoded ones
  type AbilityMeta = { key: string; abbreviation: string; name?: string; label?: string; sortOrder: number }
  type PointBuy = { score: number; cost: number }
  const effectiveAbilityScores: AbilityMeta[] = (abilityScores.length > 0 ? abilityScores : fallbackAbilityScores) as AbilityMeta[]
  const effectivePointBuyCosts: PointBuy[] = (pointBuyCosts.length > 0 ? pointBuyCosts : fallbackPointBuyCosts) as PointBuy[]

  // Phase 2: Add loading state for ability score data
  if (!abilityScores && abilityScores !== undefined) {
    return <div>Loading ability score data...</div>
  }

  // Safety check: ensure we have valid data
  if (!effectiveAbilityScores || effectiveAbilityScores.length === 0) {
    console.warn('AbilityScoreGenerator: No ability scores available, using fallback')
    return <div>Loading ability score data...</div>
  }

  if (!effectivePointBuyCosts || effectivePointBuyCosts.length === 0) {
    console.warn('AbilityScoreGenerator: No point buy costs available, using fallback')
    return <div>Loading ability score data...</div>
  }

  // Phase 2: Calculate values from database data
  const maxScore = Math.max(...effectivePointBuyCosts.map((c) => c.score))
  const minScore = Math.min(...effectivePointBuyCosts.map((c) => c.score))
  const pointBuyBudget = 27

  // Phase 2: Use database data for ability names
  const abilityNames = effectiveAbilityScores.sort((a, b) => a.sortOrder - b.sortOrder)

  const handleRollScores = useCallback(() => {
    const newRolls = Array.from({ length: 3 }, () => rollAllAbilityScores())
    setRollResults(newRolls)
  }, [])

  const handleSelectRollSet = useCallback((scores: AbilityScores) => {
    onChange(scores)
  }, [onChange])

  const handlePointBuyChange = useCallback((ability: keyof AbilityScores, value: number) => {
    const newScores = { ...pointBuyScores, [ability]: value }
    setPointBuyScores(newScores)
    onChange(newScores)
  }, [pointBuyScores, onChange])

  const handleManualChange = useCallback((ability: keyof AbilityScores, value: number) => {
    const newScores = { ...safeInitialValues, [ability]: value }
    onChange(newScores)
  }, [safeInitialValues, onChange])

  // Keep point-buy scores in sync when external initialValues change (e.g. after import/reset)
  useEffect(() => {
    const next = (initialValues as AbilityScores | undefined) ?? basePointBuyScores
    setPointBuyScores(next)
  }, [initialValues])

  // Calculate points used in point buy system relative to base 8
  const costAt = (score: number) => effectivePointBuyCosts.find((c) => c.score === score)?.cost ?? 0
  const pointsUsed = Object.values(pointBuyScores ?? basePointBuyScores).reduce((total, score) => {
    const delta = costAt(score) - costAt(8)
    return total + Math.max(0, delta)
  }, 0)
  const pointsRemaining = pointBuyBudget - pointsUsed

  const canIncrease = (ability: keyof AbilityScores): boolean => {
    const currentScore = pointBuyScores[ability]
    if (currentScore >= maxScore) return false
    
    const nextCostData = effectivePointBuyCosts.find((c: any) => c.score === currentScore + 1)
    const currentCostData = effectivePointBuyCosts.find((c: any) => c.score === currentScore)
    
    if (!nextCostData || !currentCostData) return false
    
    return pointsRemaining >= (nextCostData.cost - currentCostData.cost)
  }

  const canDecrease = (ability: keyof AbilityScores): boolean => {
    return pointBuyScores[ability] > minScore
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="roll">Roll (4d6 drop lowest)</TabsTrigger>
          <TabsTrigger value="pointbuy">Point Buy (27 points)</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>
                Enter ability scores manually (1-30)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {abilityNames.map(({ key, label, name, abbreviation }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`manual-${key}`}>
                      {(label ?? name ?? abbreviation) as string}
                    </Label>
                    <Input
                      id={`manual-${key}`}
                      type="number"
                      min={minScore}
                      max={30} // Keep max at 30 for D&D 5e rules
                      value={safeInitialValues[key as keyof AbilityScores]}
                      onChange={(e) => handleManualChange(key as keyof AbilityScores, parseInt(e.target.value) || 0)}
                      disabled={disabled}
                    />
                    <div className="text-xs text-muted-foreground text-center">
                      {calculateAbilityModifier(safeInitialValues[key as keyof AbilityScores]) >= 0 ? '+' : ''}{calculateAbilityModifier(safeInitialValues[key as keyof AbilityScores])}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dice6 className="h-5 w-5" />
                Roll for Stats
              </CardTitle>
              <CardDescription>
                Roll 4d6 and drop the lowest die for each ability score. Choose from 3 sets of rolls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={handleRollScores} 
                  disabled={disabled}
                  className="w-full"
                >
                  <Dice6 className="mr-2 h-4 w-4" />
                  Roll 3 Sets of Ability Scores
                </Button>

                {rollResults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Choose a set:</h4>
                    {rollResults.map((rollSet, index) => (
                      <Card key={index} className="cursor-pointer hover:bg-accent transition-colors">
                        <CardContent className="p-4" onClick={() => handleSelectRollSet(rollSet)}>
                          <div className="flex items-center justify-between">
                            <div className="grid grid-cols-6 gap-2 flex-1">
                              {abilityNames.map(({ key, abbreviation }) => (
                                <div key={key} className="text-center">
                                  <div className="text-xs text-muted-foreground">{abbreviation}</div>
                                  <div className="font-semibold">{rollSet[key as keyof AbilityScores]}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ({calculateAbilityModifier(rollSet[key as keyof AbilityScores]) >= 0 ? '+' : ''}{calculateAbilityModifier(rollSet[key as keyof AbilityScores])})
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="ml-4">
                              <Badge variant="secondary">
                                Total: {Object.values(rollSet).reduce((a, b) => a + b, 0)}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pointbuy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Point Buy System</CardTitle>
              <CardDescription>
                Distribute 27 points among your abilities. All abilities start at 8. Max score is 15.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Points Remaining:</span>
                  <Badge variant={pointsRemaining < 0 ? "destructive" : "default"}>
                    {pointsRemaining}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {abilityNames.map(({ key, label, name, abbreviation }) => (
                    <div key={key} className="space-y-2">
                      <Label>{(label ?? name ?? abbreviation) as string} ({abbreviation})</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePointBuyChange(key as keyof AbilityScores, pointBuyScores[key as keyof AbilityScores] - 1)}
                          disabled={!canDecrease(key as keyof AbilityScores)}
                        >
                          -
                        </Button>
                        <div className="flex-1 text-center">
                          <div className="font-semibold">{pointBuyScores[key as keyof AbilityScores]}</div>
                          <div className="text-xs text-muted-foreground">
                            ({calculateAbilityModifier(pointBuyScores[key as keyof AbilityScores]) >= 0 ? '+' : ''}{calculateAbilityModifier(pointBuyScores[key as keyof AbilityScores])})
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Cost: {effectivePointBuyCosts.find(c => c.score === pointBuyScores[key as keyof AbilityScores])?.cost || 0}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePointBuyChange(key as keyof AbilityScores, pointBuyScores[key as keyof AbilityScores] + 1)}
                          disabled={!canIncrease(key as keyof AbilityScores)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {pointsRemaining !== 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      {pointsRemaining > 0 
                        ? `You have ${pointsRemaining} unspent points.` 
                        : `You are ${Math.abs(pointsRemaining)} points over the limit.`
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}