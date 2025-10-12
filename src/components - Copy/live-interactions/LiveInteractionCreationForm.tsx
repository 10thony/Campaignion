import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  ArrowLeft, 
  Users,
  MapPin,
  Target,
  Package,
  Gift,
  Sword,
  Crown
} from 'lucide-react';

interface LiveInteractionCreationFormProps {
  campaignId: Id<"campaigns">;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LiveInteractionCreationForm: React.FC<LiveInteractionCreationFormProps> = ({
  campaignId,
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    relatedLocationId: null as Id<"locations"> | null,
    relatedQuestId: null as Id<"quests"> | null,
  });

  // Participant selection
  const [selectedPlayerCharacters, setSelectedPlayerCharacters] = useState<Id<"playerCharacters">[]>([]);
  const [selectedNPCs, setSelectedNPCs] = useState<Id<"npcs">[]>([]);
  const [selectedMonsters, setSelectedMonsters] = useState<Id<"monsters">[]>([]);

  // Reward configuration
  const [rewardItems, setRewardItems] = useState<Id<"items">[]>([]);
  const [xpAwards, setXpAwards] = useState<Array<{
    playerCharacterId: Id<"playerCharacters">;
    xp: number;
  }>>([]);

  // Queries
  const campaign = useQuery(api.campaigns.getCampaignById, { 
    id: campaignId, 
    clerkId: user?.id || '' 
  });
  const playerCharacters = useQuery(api.characters.getAllCharacters);
  const npcs = useQuery(api.npcs.getAllNpcs);
  const monsters = useQuery(api.monsters.getAllMonsters);
  const locations = useQuery(api.locations.list);
  const quests = useQuery(api.quests.getAllQuests);
  const items = useQuery(api.items.getItems);

  // Mutations
  const createInteraction = useMutation(api.interactions.createInteraction);

  // Filter participants to campaign-specific ones
  const campaignPlayerCharacters = playerCharacters?.filter(char => 
    campaign?.participantPlayerCharacterIds?.includes(char._id)
  ) || [];
  
  const campaignNPCs = npcs?.filter(npc => 
    campaign?.npcIds?.includes(npc._id)
  ) || [];
  
  const campaignMonsters = monsters?.filter(monster => 
    campaign?.monsterIds?.includes(monster._id)
  ) || [];

  const campaignLocations = locations?.filter(location => 
    campaign?.locationIds?.includes(location._id)
  ) || [];

  const campaignQuests = quests?.filter(quest => 
    campaign?.questIds?.includes(quest._id)
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      alert('You must be logged in to create an interaction.');
      return;
    }

    if (!formData.name.trim()) {
      alert('Please enter an interaction name.');
      return;
    }

    if (selectedPlayerCharacters.length === 0 && selectedNPCs.length === 0 && selectedMonsters.length === 0) {
      alert('Please select at least one participant.');
      return;
    }

    try {
      const interactionId = await createInteraction({
        name: formData.name,
        description: formData.description || undefined,
        clerkId: user.id,
        campaignId: campaignId,
        relatedQuestId: formData.relatedQuestId || undefined,
        playerCharacterIds: selectedPlayerCharacters,
        npcIds: selectedNPCs,
        monsterIds: selectedMonsters,
      });

      console.log('Live interaction created:', interactionId);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/campaigns/${campaignId}/live-interaction`);
      }
    } catch (error) {
      console.error('Error creating live interaction:', error);
      alert('Failed to create live interaction. Please try again.');
    }
  };

  const handlePlayerCharacterToggle = (characterId: Id<"playerCharacters">) => {
    setSelectedPlayerCharacters(prev => 
      prev.includes(characterId) 
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  const handleNPCToggle = (npcId: Id<"npcs">) => {
    setSelectedNPCs(prev => 
      prev.includes(npcId) 
        ? prev.filter(id => id !== npcId)
        : [...prev, npcId]
    );
  };

  const handleMonsterToggle = (monsterId: Id<"monsters">) => {
    setSelectedMonsters(prev => 
      prev.includes(monsterId) 
        ? prev.filter(id => id !== monsterId)
        : [...prev, monsterId]
    );
  };

  const handleRewardItemToggle = (itemId: Id<"items">) => {
    setRewardItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleXpAwardChange = (characterId: Id<"playerCharacters">, xp: number) => {
    setXpAwards(prev => {
      const existing = prev.find(award => award.playerCharacterId === characterId);
      if (existing) {
        return prev.map(award => 
          award.playerCharacterId === characterId 
            ? { ...award, xp } 
            : award
        );
      } else {
        return [...prev, { playerCharacterId: characterId, xp }];
      }
    });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(`/campaigns/${campaignId}`);
    }
  };

  if (!campaign || !playerCharacters || !npcs || !monsters || !locations || !quests || !items) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaign
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Live Interaction</h1>
            <p className="text-muted-foreground">
              Set up a new turn-based interaction for your campaign
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </TabsTrigger>
            <TabsTrigger value="context" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Context
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Rewards
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core details about the live interaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Interaction Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter interaction name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the interaction..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Player Characters
                </CardTitle>
                <CardDescription>
                  Select player characters participating in this interaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {campaignPlayerCharacters.map((character) => (
                    <div key={character._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`character-${character._id}`}
                        checked={selectedPlayerCharacters.includes(character._id)}
                        onCheckedChange={() => handlePlayerCharacterToggle(character._id)}
                      />
                      <Label 
                        htmlFor={`character-${character._id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {character.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          Level {character.level}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                {campaignPlayerCharacters.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No player characters available for this campaign</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  NPCs
                </CardTitle>
                <CardDescription>
                  Select NPCs involved in this interaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {campaignNPCs.map((npc) => (
                    <div key={npc._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`npc-${npc._id}`}
                        checked={selectedNPCs.includes(npc._id)}
                        onCheckedChange={() => handleNPCToggle(npc._id)}
                      />
                      <Label 
                        htmlFor={`npc-${npc._id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {npc.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          Level {npc.level}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                {campaignNPCs.length === 0 && (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No NPCs available for this campaign</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sword className="h-5 w-5" />
                  Monsters
                </CardTitle>
                <CardDescription>
                  Select monsters involved in this interaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {campaignMonsters.map((monster) => (
                    <div key={monster._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`monster-${monster._id}`}
                        checked={selectedMonsters.includes(monster._id)}
                        onCheckedChange={() => handleMonsterToggle(monster._id)}
                      />
                      <Label 
                        htmlFor={`monster-${monster._id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {monster.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          CR {monster.challengeRating}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                {campaignMonsters.length === 0 && (
                  <div className="text-center py-8">
                    <Sword className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No monsters available for this campaign</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Context Tab */}
          <TabsContent value="context" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Quest Context
                </CardTitle>
                <CardDescription>
                  Associate this interaction with a location or quest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="relatedLocationId">Related Location</Label>
                  <Select 
                    value={formData.relatedLocationId || "none"} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      relatedLocationId: value === "none" ? null : value as Id<"locations"> 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No location</SelectItem>
                      {campaignLocations.map((location) => (
                        <SelectItem key={location._id} value={location._id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relatedQuestId">Related Quest</Label>
                  <Select 
                    value={formData.relatedQuestId || "none"} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      relatedQuestId: value === "none" ? null : value as Id<"quests"> 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a quest (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No quest</SelectItem>
                      {campaignQuests.map((quest) => (
                        <SelectItem key={quest._id} value={quest._id}>
                          {quest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Reward Items
                </CardTitle>
                <CardDescription>
                  Select items that will be rewarded upon completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((item) => (
                    <div key={item._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`reward-item-${item._id}`}
                        checked={rewardItems.includes(item._id)}
                        onCheckedChange={() => handleRewardItemToggle(item._id)}
                      />
                      <Label 
                        htmlFor={`reward-item-${item._id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {item.name}
                        {item.rarity && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {item.rarity}
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Experience Points
                </CardTitle>
                <CardDescription>
                  Award experience points to participating characters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignPlayerCharacters.map((character) => (
                    <div key={character._id} className="flex items-center space-x-4">
                      <Label className="min-w-[120px]">{character.name}</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        className="w-24"
                        value={xpAwards.find(a => a.playerCharacterId === character._id)?.xp || ''}
                        onChange={(e) => handleXpAwardChange(character._id, parseInt(e.target.value) || 0)}
                      />
                      <span className="text-sm text-muted-foreground">XP</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
          >
            Create Live Interaction
          </Button>
        </div>
      </form>
    </div>
  );
}; 