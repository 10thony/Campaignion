import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import { CampaignValidationState, CampaignCreationRequirements } from "../../schemas/campaign";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription } from "../ui/alert";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import QuestCreationModal from "../modals/QuestCreationModal";
import { 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft, 
  Plus, 
  X, 
  Edit, 
  Eye, 
  Calendar,
  Users,
  MapPin,
  Sword,
  BookOpen,
  Target,
  Crown
} from "lucide-react";

const CampaignCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  
  // Get or create user in Convex
  const convexUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  // Basic campaign info
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    worldSetting: "",
    isPublic: false,
  });

  // Timeline events
  const [timelineEvents, setTimelineEvents] = useState<Array<{
    title: string;
    description: string;
    date: number;
    type: "Custom" | "Battle" | "Alliance" | "Discovery" | "Disaster" | "Political" | "Cultural";
  }>>([]);
  const [isAddingTimelineEvent, setIsAddingTimelineEvent] = useState(false);
  const [newTimelineEvent, setNewTimelineEvent] = useState({
    title: "",
    description: "",
    date: new Date().getTime(),
    type: "Custom" as "Custom" | "Battle" | "Alliance" | "Discovery" | "Disaster" | "Political" | "Cultural",
  });

  // Player characters
  const [selectedPlayerCharacters, setSelectedPlayerCharacters] = useState<string[]>([]);
  const playerCharacters = useQuery(api.characters.getAllCharacters);

  // NPCs
  const [selectedNPCs, setSelectedNPCs] = useState<string[]>([]);
  const npcs = useQuery(api.npcs.getAllNpcs);

  // Quests
  const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const quests = useQuery(api.quests.getAllQuests);

  // Locations
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const locations = useQuery(api.locations.list);

  // Boss monsters
  const [selectedBossMonsters, setSelectedBossMonsters] = useState<string[]>([]);
  const monsters = useQuery(api.monsters.getAllMonsters);

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCampaign = useMutation(api.campaigns.createCampaign);
  const createTimelineEvent = useMutation(api.timelineEvents.createTimelineEvent);
  const addTimelineEventToCampaign = useMutation(api.campaigns.addTimelineEventToCampaign);

  // Force refresh locations when component mounts or when returning from location creation
  useEffect(() => {
    const returnFromLocationCreation = searchParams.get('refresh') === 'true';
    if (returnFromLocationCreation) {
      // Clear the refresh parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('refresh');
      window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
      
      // Force a re-render by updating the component state
      // This will cause the locations query to re-run
      setSelectedLocations(prev => [...prev]);
    }
  }, [searchParams]);

  const requirements: CampaignCreationRequirements = {
    timelineEventsRequired: 3,
    playerCharactersRequired: 1,
    npcsRequired: 1,
    questsRequired: 1,
    locationsRequired: 1,
    bossMonstersRequired: 1,
    interactionsRequired: 1
  };

  // Calculate validation state
  const getValidationState = (): CampaignValidationState => {
    const bossMonsterCount = monsters ? 
      monsters.filter(monster => {
        const cr = parseFloat(monster.challengeRating);
        return selectedBossMonsters.includes(monster._id) && !isNaN(cr) && cr >= 10;
      }).length : 0;

    return {
      hasName: !!formData.name.trim(),
      hasTimelineEvents: timelineEvents.length >= requirements.timelineEventsRequired,
      hasPlayerCharacters: selectedPlayerCharacters.length >= requirements.playerCharactersRequired,
      hasNPCs: selectedNPCs.length >= requirements.npcsRequired,
      hasInteractions: true, // Add the missing property
      hasQuests: selectedQuests.length >= requirements.questsRequired,
      hasLocations: selectedLocations.length >= requirements.locationsRequired,
      hasBossMonsters: bossMonsterCount >= requirements.bossMonstersRequired,
    };
  };

  const validationState = getValidationState();
  const isFormComplete = Object.values(validationState).every(Boolean);

  // Calculate completion percentage
  const completedRequirements = Object.values(validationState).filter(Boolean).length;
  const totalRequirements = Object.keys(validationState).length;
  const completionPercentage = (completedRequirements / totalRequirements) * 100;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTimelineEventChange = (field: string, value: any) => {
    setNewTimelineEvent(prev => ({ ...prev, [field]: value }));
  };

  const addTimelineEvent = () => {
    if (!newTimelineEvent.title.trim() || !newTimelineEvent.description.trim()) {
      setErrors(["Timeline event title and description are required"]);
      return;
    }

    if (timelineEvents.length >= requirements.timelineEventsRequired) {
      setErrors([`Maximum of ${requirements.timelineEventsRequired} timeline events allowed`]);
      return;
    }

    setTimelineEvents(prev => [...prev, { ...newTimelineEvent }]);
    setNewTimelineEvent({
      title: "",
      description: "",
      date: new Date().getTime(),
      type: "Custom",
    });
    setIsAddingTimelineEvent(false);
    setErrors([]);
  };

  const removeTimelineEvent = (index: number) => {
    setTimelineEvents(prev => prev.filter((_, i) => i !== index));
  };

  const editTimelineEvent = (index: number) => {
    const event = timelineEvents[index];
    setNewTimelineEvent({ ...event });
    setTimelineEvents(prev => prev.filter((_, i) => i !== index));
    setIsAddingTimelineEvent(true);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.name.trim()) {
      newErrors.push("Campaign name is required");
    }
    
    if (timelineEvents.length < requirements.timelineEventsRequired) {
      newErrors.push(`At least ${requirements.timelineEventsRequired} timeline events are required`);
    }
    
    if (selectedPlayerCharacters.length < requirements.playerCharactersRequired) {
      newErrors.push(`At least ${requirements.playerCharactersRequired} player character is required`);
    }
    
    if (selectedNPCs.length < requirements.npcsRequired) {
      newErrors.push(`At least ${requirements.npcsRequired} NPC is required`);
    }
    
    if (selectedQuests.length < requirements.questsRequired) {
      newErrors.push(`At least ${requirements.questsRequired} quest is required`);
    }
    
    if (selectedLocations.length < requirements.locationsRequired) {
      newErrors.push(`At least ${requirements.locationsRequired} location is required`);
    }
    
    const bossMonsterCount = monsters ? 
      monsters.filter(monster => {
        const cr = parseFloat(monster.challengeRating);
        return selectedBossMonsters.includes(monster._id) && !isNaN(cr) && cr >= 10;
      }).length : 0;
    
    if (bossMonsterCount < requirements.bossMonstersRequired) {
      newErrors.push(`At least ${requirements.bossMonstersRequired} boss monster (CR 10+) is required`);
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure user exists in Convex
      if (!convexUser && user) {
        await createOrUpdateUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
        });
      }

      // Create campaign
      const campaignId = await createCampaign({
        name: formData.name,
        description: formData.description,
        worldSetting: formData.worldSetting,
        isPublic: formData.isPublic,
        participantPlayerCharacterIds: selectedPlayerCharacters as Id<"playerCharacters">[],
        npcIds: selectedNPCs as Id<"npcs">[],
        questIds: selectedQuests as Id<"quests">[],
        locationIds: selectedLocations as Id<"locations">[],
        monsterIds: selectedBossMonsters as Id<"monsters">[],
        creatorId: convexUser!._id,
        dmId: user!.id,
      });

      // Create timeline events and add them to campaign
      for (const event of timelineEvents) {
        const timelineEventId = await createTimelineEvent({
          title: event.title,
          description: event.description,
          date: event.date,
          type: event.type,
          clerkId: user!.id,
        });

        await addTimelineEventToCampaign({
          campaignId,
          timelineEventId,
        });
      }

      // Navigate to campaign detail page
      navigate(`/campaigns/${campaignId}`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      setErrors(["Failed to create campaign. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/campaigns");
  };

  const navigateToCreateCharacter = () => {
    navigate("/characters/new?returnTo=campaign-form");
  };

  const navigateToCreateNPC = () => {
    navigate("/npcs/new?returnTo=campaign-form");
  };

  const navigateToCreateQuest = () => {
    navigate("/quests/new?returnTo=campaign-form");
  };

  const navigateToCreateLocation = () => {
    navigate("/locations/new?returnTo=campaign-form");
  };

  const navigateToCreateMonster = () => {
    navigate("/monsters/new?returnTo=campaign-form");
  };

  const handleQuestCreated = (questId: Id<"quests">) => {
    // Add the newly created quest to the selected quests
    setSelectedQuests(prev => [...prev, questId]);
    setIsQuestModalOpen(false);
  };

  const navigateToEditCharacter = (characterId: string) => {
    navigate(`/characters/${characterId}/edit?returnTo=campaign-form`);
  };

  const navigateToEditNPC = (npcId: string) => {
    navigate(`/npcs/${npcId}/edit?returnTo=campaign-form`);
  };

  const navigateToEditQuest = (questId: string) => {
    navigate(`/quests/${questId}/edit?returnTo=campaign-form`);
  };

  const navigateToEditLocation = (locationId: string) => {
    navigate(`/locations/${locationId}/edit?returnTo=campaign-form`);
  };

  const navigateToEditMonster = (monsterId: string) => {
    navigate(`/monsters/${monsterId}/edit?returnTo=campaign-form`);
  };

  const navigateToViewCharacter = (characterId: string) => {
    navigate(`/characters/${characterId}?returnTo=campaign-form`);
  };

  const navigateToViewNPC = (npcId: string) => {
    navigate(`/npcs/${npcId}?returnTo=campaign-form`);
  };

  const navigateToViewQuest = (questId: string) => {
    navigate(`/quests/${questId}?returnTo=campaign-form`);
  };

  const navigateToViewLocation = (locationId: string) => {
    navigate(`/locations/${locationId}?returnTo=campaign-form`);
  };

  const navigateToViewMonster = (monsterId: string) => {
    navigate(`/monsters/${monsterId}?returnTo=campaign-form`);
  };

  const toggleSelection = (id: string, selectedIds: string[], setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const renderSelectionCard = (
    item: any,
    isSelected: boolean,
    onToggle: () => void,
    onView: () => void,
    onEdit: () => void,
    titleKey: string = 'name',
    subtitleKey?: string,
    badgeText?: string
  ) => (
    <Card 
      key={item._id} 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox 
                checked={isSelected} 
                onChange={onToggle}
                onClick={(e) => e.stopPropagation()}
              />
              <h4 className="font-semibold">{item[titleKey]}</h4>
              {badgeText && (
                <Badge variant="secondary" className="text-xs">
                  {badgeText}
                </Badge>
              )}
            </div>
            {subtitleKey && item[subtitleKey] && (
              <p className="text-sm text-muted-foreground mb-2">
                {item[subtitleKey]}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Campaign</h1>
            <p className="text-muted-foreground">
              Build your campaign by adding essential elements
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Campaign Completion</span>
              <span>{completedRequirements}/{totalRequirements} requirements met</span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
            <p className="text-xs text-muted-foreground">
              {isFormComplete ? "Ready to create campaign!" : "Complete all requirements to create your campaign"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Please fix the following errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Quests
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="monsters" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              Boss Monsters
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
                <CardDescription>
                  Basic details about your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter campaign name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter campaign description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worldSetting">World Setting</Label>
                  <Input
                    id="worldSetting"
                    value={formData.worldSetting}
                    onChange={(e) => handleInputChange("worldSetting", e.target.value)}
                    placeholder="e.g., Forgotten Realms, Homebrew"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
                  />
                  <Label htmlFor="isPublic">Make campaign public</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Events Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline Events ({timelineEvents.length}/{requirements.timelineEventsRequired})
                </CardTitle>
                <CardDescription>
                  Create at least {requirements.timelineEventsRequired} timeline events for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {timelineEvents.map((event, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{event.title}</h4>
                            <Badge variant="outline">{event.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{event.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editTimelineEvent(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimelineEvent(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {!isAddingTimelineEvent && timelineEvents.length < requirements.timelineEventsRequired && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingTimelineEvent(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Timeline Event
                  </Button>
                )}

                {isAddingTimelineEvent && (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="eventTitle">Event Title *</Label>
                          <Input
                            id="eventTitle"
                            value={newTimelineEvent.title}
                            onChange={(e) => handleTimelineEventChange("title", e.target.value)}
                            placeholder="Enter event title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventType">Event Type</Label>
                          <Select value={newTimelineEvent.type} onValueChange={(value) => handleTimelineEventChange("type", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Custom">Custom</SelectItem>
                              <SelectItem value="Battle">Battle</SelectItem>
                              <SelectItem value="Alliance">Alliance</SelectItem>
                              <SelectItem value="Discovery">Discovery</SelectItem>
                              <SelectItem value="Disaster">Disaster</SelectItem>
                              <SelectItem value="Political">Political</SelectItem>
                              <SelectItem value="Cultural">Cultural</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="eventDate">Date</Label>
                        <Input
                          id="eventDate"
                          type="date"
                          value={new Date(newTimelineEvent.date).toISOString().split('T')[0]}
                          onChange={(e) => handleTimelineEventChange("date", new Date(e.target.value).getTime())}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="eventDescription">Description *</Label>
                        <Textarea
                          id="eventDescription"
                          value={newTimelineEvent.description}
                          onChange={(e) => handleTimelineEventChange("description", e.target.value)}
                          placeholder="Enter event description"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" onClick={addTimelineEvent}>
                          Add Event
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingTimelineEvent(false);
                            setNewTimelineEvent({
                              title: "",
                              description: "",
                              date: new Date().getTime(),
                              type: "Custom",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Player Characters Tab */}
          <TabsContent value="characters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Player Characters ({selectedPlayerCharacters.length}/{requirements.playerCharactersRequired})
                </CardTitle>
                <CardDescription>
                  Select at least {requirements.playerCharactersRequired} player character for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={navigateToCreateCharacter}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Character
                </Button>

                {playerCharacters && playerCharacters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playerCharacters.map((character) =>
                      renderSelectionCard(
                        character,
                        selectedPlayerCharacters.includes(character._id),
                        () => toggleSelection(character._id, selectedPlayerCharacters, setSelectedPlayerCharacters),
                        () => navigateToViewCharacter(character._id),
                        () => navigateToEditCharacter(character._id),
                        'name',
                        `Level ${character.level} ${character.race} ${character.class}`,
                        `Level ${character.level}`
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No characters found. Create some characters first!</p>
                    <Button onClick={navigateToCreateCharacter}>
                      Create Character
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  NPCs ({selectedNPCs.length}/{requirements.npcsRequired})
                </CardTitle>
                <CardDescription>
                  Select at least {requirements.npcsRequired} NPC for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={navigateToCreateNPC}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New NPC
                </Button>

                {npcs && npcs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {npcs.map((npc) =>
                      renderSelectionCard(
                        npc,
                        selectedNPCs.includes(npc._id),
                        () => toggleSelection(npc._id, selectedNPCs, setSelectedNPCs),
                        () => navigateToViewNPC(npc._id),
                        () => navigateToEditNPC(npc._id),
                        'name',
                        `Level ${npc.level} ${npc.race} ${npc.class}`,
                        `Level ${npc.level}`
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No NPCs found. Create some NPCs first!</p>
                    <Button onClick={navigateToCreateNPC}>
                      Create NPC
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quests Tab */}
          <TabsContent value="quests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Quests ({selectedQuests.length}/{requirements.questsRequired})
                </CardTitle>
                <CardDescription>
                  Select at least {requirements.questsRequired} quest for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsQuestModalOpen(true)}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Quest
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={navigateToCreateQuest}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quest (Full Page)
                  </Button>
                </div>

                {quests && quests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quests.map((quest) =>
                      renderSelectionCard(
                        quest,
                        selectedQuests.includes(quest._id),
                        () => toggleSelection(quest._id, selectedQuests, setSelectedQuests),
                        () => navigateToViewQuest(quest._id),
                        () => navigateToEditQuest(quest._id),
                        'title',
                        quest.description?.substring(0, 50) + '...',
                        quest.status
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No quests found. Create some quests first!</p>
                    <Button onClick={navigateToCreateQuest}>
                      Create Quest
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Locations ({selectedLocations.length}/{requirements.locationsRequired})
                </CardTitle>
                <CardDescription>
                  Select at least {requirements.locationsRequired} location for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={navigateToCreateLocation}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Location
                </Button>

                {locations && locations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map((location) =>
                      renderSelectionCard(
                        location,
                        selectedLocations.includes(location._id),
                        () => toggleSelection(location._id, selectedLocations, setSelectedLocations),
                        () => navigateToViewLocation(location._id),
                        () => navigateToEditLocation(location._id),
                        'name',
                        `${location.type} • ${location.description?.substring(0, 30)}...`,
                        location.type
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No locations found. Create some locations first!</p>
                    <Button onClick={navigateToCreateLocation}>
                      Create Location
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Boss Monsters Tab */}
          <TabsContent value="monsters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sword className="h-5 w-5" />
                  Boss Monsters ({monsters ? monsters.filter(m => {
                    const cr = parseFloat(m.challengeRating);
                    return selectedBossMonsters.includes(m._id) && !isNaN(cr) && cr >= 10;
                  }).length : 0}/{requirements.bossMonstersRequired})
                </CardTitle>
                <CardDescription>
                  Select at least {requirements.bossMonstersRequired} boss monster (CR 10 or higher) for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={navigateToCreateMonster}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Monster
                </Button>

                {monsters && monsters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {monsters
                      .filter(monster => {
                        const cr = parseFloat(monster.challengeRating);
                        return !isNaN(cr) && cr >= 10;
                      })
                      .map((monster) =>
                        renderSelectionCard(
                          monster,
                          selectedBossMonsters.includes(monster._id),
                          () => toggleSelection(monster._id, selectedBossMonsters, setSelectedBossMonsters),
                          () => navigateToViewMonster(monster._id),
                          () => navigateToEditMonster(monster._id),
                          'name',
                          `${monster.type}`,
                          `CR ${monster.challengeRating}`
                        )
                      )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No boss monsters found. Create some high-level monsters first!</p>
                    <Button onClick={navigateToCreateMonster}>
                      Create Monster
                    </Button>
                  </div>
                )}
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
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || !isFormComplete}
          >
            {isSubmitting ? "Creating..." : isFormComplete ? "Create Campaign" : "Complete Requirements"}
          </Button>
        </div>
      </form>

      {/* Requirements Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Requirements</CardTitle>
          <CardDescription>
            All requirements must be met to create your campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              validationState.hasName ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {validationState.hasName ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={validationState.hasName ? 'text-green-800' : 'text-red-800'}>
                Campaign name
              </span>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              validationState.hasTimelineEvents ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {validationState.hasTimelineEvents ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={validationState.hasTimelineEvents ? 'text-green-800' : 'text-red-800'}>
                Timeline events ({timelineEvents.length}/{requirements.timelineEventsRequired})
              </span>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              validationState.hasPlayerCharacters ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {validationState.hasPlayerCharacters ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={validationState.hasPlayerCharacters ? 'text-green-800' : 'text-red-800'}>
                Player characters ({selectedPlayerCharacters.length}/{requirements.playerCharactersRequired})
              </span>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              validationState.hasNPCs ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {validationState.hasNPCs ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={validationState.hasNPCs ? 'text-green-800' : 'text-red-800'}>
                NPCs ({selectedNPCs.length}/{requirements.npcsRequired})
              </span>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              validationState.hasQuests ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {validationState.hasQuests ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={validationState.hasQuests ? 'text-green-800' : 'text-red-800'}>
                Quests ({selectedQuests.length}/{requirements.questsRequired})
              </span>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              validationState.hasLocations ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {validationState.hasLocations ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={validationState.hasLocations ? 'text-green-800' : 'text-red-800'}>
                Locations ({selectedLocations.length}/{requirements.locationsRequired})
              </span>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              validationState.hasBossMonsters ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {validationState.hasBossMonsters ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={validationState.hasBossMonsters ? 'text-green-800' : 'text-red-800'}>
                Boss monsters ({monsters ? monsters.filter(m => {
                  const cr = parseFloat(m.challengeRating);
                  return selectedBossMonsters.includes(m._id) && !isNaN(cr) && cr >= 10;
                }).length : 0}/{requirements.bossMonstersRequired})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quest Creation Modal */}
      <QuestCreationModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        onQuestCreated={handleQuestCreated}
        returnTo="campaign-form"
      />
    </div>
  );
};

export default CampaignCreationForm; 