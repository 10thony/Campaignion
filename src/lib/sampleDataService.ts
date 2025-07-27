import campaignsData from '@/data/sample/campaigns.json'
import charactersData from '@/data/sample/characters.json'
import monstersData from '@/data/sample/monsters.json'
import itemsData from '@/data/sample/items.json'
import questsData from '@/data/sample/quests.json'
import actionsData from '@/data/sample/actions.json'

export interface SampleDataInfo {
  version: string
  description: string
  count: number
  lastLoaded?: number
}

export class SampleDataService {
  static async loadSampleCampaigns(mutateFn: any, clerkId: string) {
    const campaigns = campaignsData.campaigns.map(campaign => ({
      name: campaign.name,
      description: campaign.description,
      worldSetting: campaign.worldSetting,
      isPublic: campaign.isPublic,
    }))
    
    return await mutateFn({ campaigns, clerkId })
  }

  static async loadSampleCharacters(mutateFn: any, clerkId: string) {
    const playerCharacters = charactersData.playerCharacters.map(character => ({
      name: character.name,
      race: character.race,
      class: character.class,
      level: character.level,
      hitPoints: character.hitPoints,
      armorClass: character.armorClass,
      characterType: character.characterType,
      abilityModifiers: character.abilityModifiers,
      experiencePoints: character.experiencePoints,
      proficiencyBonus: character.proficiencyBonus,
    }))
    
    const npcs = charactersData.npcs.map(npc => ({
      name: npc.name,
      race: npc.race,
      class: npc.class,
      level: npc.level,
      hitPoints: npc.hitPoints,
      armorClass: npc.armorClass,
      characterType: npc.characterType,
      abilityModifiers: npc.abilityModifiers,
    }))
    
    return await mutateFn({ playerCharacters, npcs, clerkId })
  }

  static async loadSampleMonsters(mutateFn: any, clerkId: string) {
    const monsters = monstersData.monsters.map(monster => ({
      name: monster.name,
      size: monster.size,
      type: monster.type,
      challengeRating: monster.challengeRating,
      hitPoints: monster.hitPoints,
      armorClass: monster.armorClass,
      speed: monster.speed,
      abilityModifiers: monster.abilityModifiers,
    }))
    
    return await mutateFn({ monsters, clerkId })
  }

  static async loadSampleItems(mutateFn: any, clerkId: string) {
    const items = itemsData.items.map(item => ({
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      description: item.description,
      weight: item.weight,
      cost: item.cost,
      damageRolls: item.damageRolls,
      effects: item.effects,
      attunement: item.attunement,
      abilityModifiers: item.abilityModifiers,
      armorClass: item.armorClass,
    }))
    
    return await mutateFn({ items, clerkId })
  }

  static async loadSampleQuests(mutateFn: any, clerkId: string) {
    const quests = questsData.quests.map(quest => ({
      name: quest.name,
      description: quest.description,
      status: quest.status,
      completionXP: quest.completionXP,
      rewards: quest.rewards,
    }))
    
    return await mutateFn({ quests, clerkId })
  }

  static async loadSampleActions(mutateFn: any, clerkId: string) {
    const allActions = [
      ...actionsData.generalActions.map(action => ({
        name: action.name,
        description: action.description,
        actionCost: action.actionCost,
        type: action.type,
        requiresConcentration: action.requiresConcentration,
        sourceBook: action.sourceBook,
        attackBonusAbilityScore: action.attackBonusAbilityScore || undefined,
        isProficient: action.isProficient || undefined,
        damageRolls: action.damageRolls || undefined,
        className: action.className || undefined,
        usesPer: action.usesPer || undefined,
        maxUses: action.maxUses || undefined,
      })),
      ...Object.entries(actionsData.classActions).flatMap(([className, actions]) =>
        actions.map(action => ({
          name: action.name,
          description: action.description,
          actionCost: action.actionCost,
          type: action.type,
          requiresConcentration: action.requiresConcentration,
          sourceBook: action.sourceBook,
          attackBonusAbilityScore: action.attackBonusAbilityScore || undefined,
          isProficient: action.isProficient || undefined,
          damageRolls: action.damageRolls || undefined,
          className: className,
          usesPer: action.usesPer || undefined,
          maxUses: action.maxUses || undefined,
        }))
      ),
      ...actionsData.monsterActions.map(action => ({
        name: action.name,
        description: action.description,
        actionCost: action.actionCost,
        type: action.type,
        requiresConcentration: action.requiresConcentration,
        sourceBook: action.sourceBook,
        attackBonusAbilityScore: action.attackBonusAbilityScore || undefined,
        isProficient: action.isProficient || undefined,
        damageRolls: action.damageRolls || undefined,
        className: action.className || undefined,
        usesPer: action.usesPer || undefined,
        maxUses: action.maxUses || undefined,
      }))
    ]
    
    return await mutateFn({ actions: allActions, clerkId })
  }

  static async deleteAllSampleData(mutateFn: any, clerkId: string) {
    return await mutateFn({ clerkId })
  }

  static async loadSampleData(entityType: string, mutateFn: any, clerkId: string) {
    switch (entityType) {
      case 'campaigns':
        return await this.loadSampleCampaigns(mutateFn, clerkId)
      case 'characters':
        return await this.loadSampleCharacters(mutateFn, clerkId)
      case 'monsters':
        return await this.loadSampleMonsters(mutateFn, clerkId)
      case 'items':
        return await this.loadSampleItems(mutateFn, clerkId)
      case 'quests':
        return await this.loadSampleQuests(mutateFn, clerkId)
      case 'actions':
        return await this.loadSampleActions(mutateFn, clerkId)
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
  }

  static getSampleDataInfo(): Record<string, SampleDataInfo> {
    const classActionsCount = Object.values(actionsData.classActions).reduce(
      (sum, actions) => sum + actions.length, 
      0
    )
    
    return {
      campaigns: {
        version: campaignsData.version,
        description: campaignsData.description,
        count: campaignsData.campaigns.length
      },
      characters: {
        version: charactersData.version,
        description: charactersData.description,
        count: charactersData.playerCharacters.length + charactersData.npcs.length
      },
      monsters: {
        version: monstersData.version,
        description: monstersData.description,
        count: monstersData.monsters.length
      },
      items: {
        version: itemsData.version,
        description: itemsData.description,
        count: itemsData.items.length
      },
      quests: {
        version: questsData.version,
        description: questsData.description,
        count: questsData.quests.length
      },
      actions: {
        version: actionsData.version,
        description: actionsData.description,
        count: actionsData.generalActions.length + 
               classActionsCount +
               actionsData.monsterActions.length
      }
    }
  }
}

// Note: Sample data mutations are disabled until backend functions are properly implemented
// The frontend components are ready and will work once the Convex functions are fixed 