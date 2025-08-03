import { useQuery } from 'convex/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InventoryPanel } from '@/components/InventoryPanel'
import { Heart, Shield, Zap, User, Dice6 } from 'lucide-react'
import { formatModifier } from '@/lib/utils'
import { api } from '../../convex/_generated/api'

interface CharacterSheetPageProps {
  characterId: string
}

export function CharacterSheetPage({ characterId }: CharacterSheetPageProps) {
  const character = useQuery(api.characters.getCharacterById, { 
    characterId: characterId as any 
  })

  if (!character) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading character...</h1>
        </div>
      </div>
    )
  }

  const isPC = character.characterType === "PlayerCharacter"
  
  // Mock inventory data - in real app this would come from character.inventory
  const mockInventoryItems = [
    {
      item: {
        _id: "item1",
        name: "Longsword +1",
        type: "Weapon",
        rarity: "Uncommon" as const,
        description: "A masterwork longsword with a keen edge.",
        weight: 3,
        cost: 500,
        damageRolls: [{
          dice: { count: 1, type: "D8" },
          modifier: 1,
          damageType: "SLASHING"
        }]
      },
      quantity: 1
    },
    {
      item: {
        _id: "item2", 
        name: "Leather Armor",
        type: "Armor",
        rarity: "Common" as const,
        description: "Sturdy leather armor.",
        weight: 10,
        cost: 10,
        armorClass: 11,
        typeOfArmor: "Light" as const
      },
      quantity: 1
    },
    {
      item: {
        _id: "item3",
        name: "Healing Potion",
        type: "Potion", 
        rarity: "Common" as const,
        description: "Restores 2d4+2 hit points when consumed.",
        effects: "Heal 2d4+2 HP",
        weight: 0.5,
        cost: 50
      },
      quantity: 3
    }
  ]

  // Calculate carrying capacity based on Strength (Str score × 15)
  const carryingCapacity = character.abilityScores.strength * 15

  return (
    <div className="container mx-auto py-6">
      {/* Character Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{character.name}</h1>
            <p className="text-lg text-muted-foreground">
              Level {character.level} {character.race} {character.class}
            </p>
          </div>
          <Badge variant={isPC ? "level" : "secondary"} className="text-lg px-4 py-2">
            {isPC ? "Player Character" : "NPC"}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{character.hitPoints}</div>
              <div className="text-sm text-muted-foreground">Hit Points</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{character.armorClass}</div>
              <div className="text-sm text-muted-foreground">Armor Class</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{character.speed || "30 ft."}</div>
              <div className="text-sm text-muted-foreground">Speed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <User className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {formatModifier(character.proficiencyBonus || 2)}
              </div>
              <div className="text-sm text-muted-foreground">Proficiency</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ability Scores */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dice6 className="h-5 w-5" />
                Ability Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(character.abilityScores).map(([ability, score]) => {
                const modifier = character.abilityModifiers?.[ability as keyof typeof character.abilityModifiers] || 
                                Math.floor((score - 10) / 2)
                return (
                  <div key={ability} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{ability}</div>
                      <div className="text-2xl font-bold">{score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Modifier</div>
                      <div className="text-xl font-bold">
                        {formatModifier(modifier)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Inventory */}
        <div className="lg:col-span-2">
          <InventoryPanel
            items={mockInventoryItems}
            capacity={carryingCapacity}
            canEdit={true}
            title={`${character.name}'s Inventory`}
            onQuantityChange={(itemId, quantity) => {
              console.log(`Update item ${itemId} to quantity ${quantity}`)
              // TODO: Implement inventory updates
            }}
            onRemoveItem={(itemId) => {
              console.log(`Remove item ${itemId}`)
              // TODO: Implement item removal
            }}
            onAddItem={() => {
              console.log('Add new item to inventory')
              // TODO: Open item selection modal
            }}
          />
        </div>
      </div>

      {/* Skills & Proficiencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {character.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="justify-center">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saving Throws</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {character.savingThrows.map((save) => (
                <Badge key={save} variant="outline" className="justify-center">
                  {save}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 