import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Link } from '@tanstack/react-router'
import { 
  Sword, 
  Users, 
  Map, 
  BookOpen, 
  Shield, 
  Sparkles,
  Scroll,
  Dices,
  Zap,
  Target,
  Crown,
  Flame
} from 'lucide-react'
import campaignsData from '../data/sample/campaigns.json'
import charactersData from '../data/sample/characters.json'
import monstersData from '../data/sample/monsters.json'
import questsData from '../data/sample/quests.json'
import itemsData from '../data/sample/items.json'

export function HomePage() {
  // Get sample data
  const sampleCampaign = campaignsData.campaigns[0]
  const sampleCharacters = charactersData.playerCharacters.slice(0, 3)
  const sampleMonsters = monstersData.monsters.slice(0, 4)
  const sampleQuests = questsData.quests.slice(0, 3)
  const sampleItems = itemsData.items.slice(0, 3)

  return (
    <>
      <SignedOut>
        <div className="flex flex-col">
          {/* Demo Mode Indicator */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-b border-blue-200 dark:border-blue-800">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Demo Mode</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    The data you see below is for demonstration purposes only. Sign in to create your own campaigns and content!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
            <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
              <div className="text-center space-y-8">
                <div className="flex justify-center">
                  <Badge variant="secondary" className="px-4 py-2 text-sm">
                    <Sparkles className="w-4 h-4 mr-2 inline" />
                    The Ultimate D&D 5e Campaign Manager
                  </Badge>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                  Welcome to <span className="text-primary">Campaignion</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Create epic adventures, manage characters, track quests, and run legendary campaigns 
                  with the most comprehensive D&D 5e management tool.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <SignInButton mode="modal">
                    <Button size="lg" className="text-lg">
                      <Dices className="w-5 h-5 mr-2" />
                      Get Started Free
                    </Button>
                  </SignInButton>
                  <Button size="lg" variant="outline" className="text-lg" asChild>
                    <a href="#features">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Explore Features
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="py-12 bg-muted/30 border-b">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <div className="text-sm text-muted-foreground">Monsters</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">100+</div>
                  <div className="text-sm text-muted-foreground">Spells & Actions</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">∞</div>
                  <div className="text-sm text-muted-foreground">Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">Real-time</div>
                  <div className="text-sm text-muted-foreground">Collaboration</div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Powerful Features for Every DM</h2>
                <p className="text-muted-foreground text-lg">
                  Everything you need to run amazing D&D 5e campaigns
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Map className="w-10 h-10 text-primary mb-2" />
                    <CardTitle>Campaign Management</CardTitle>
                    <CardDescription>
                      Organize entire campaigns with world settings, locations, and storylines
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Users className="w-10 h-10 text-primary mb-2" />
                    <CardTitle>Character Sheets</CardTitle>
                    <CardDescription>
                      Complete D&D 5e character sheets with automatic calculations and stat tracking
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Sword className="w-10 h-10 text-primary mb-2" />
                    <CardTitle>Monster Database</CardTitle>
                    <CardDescription>
                      Extensive monster library with CR, legendary actions, and combat stats
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Scroll className="w-10 h-10 text-primary mb-2" />
                    <CardTitle>Quest Tracking</CardTitle>
                    <CardDescription>
                      Manage quests, tasks, and objectives with reward tracking and dependencies
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Target className="w-10 h-10 text-primary mb-2" />
                    <CardTitle>Battle Maps</CardTitle>
                    <CardDescription>
                      Interactive tactical maps with token management and terrain features
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Zap className="w-10 h-10 text-primary mb-2" />
                    <CardTitle>Live Sessions</CardTitle>
                    <CardDescription>
                      Real-time combat tracking, initiative management, and collaborative play
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>

          {/* Demo Content Section */}
          <div className="py-16 px-4 bg-muted/30">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">See It In Action</h2>
                <p className="text-muted-foreground text-lg">
                  Explore sample campaigns, characters, and content
                </p>
              </div>

              {/* Featured Campaign */}
              <Card className="mb-8 border-2 border-primary/20 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-6 h-6 text-primary" />
                        <Badge>Featured Campaign</Badge>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{sampleCampaign.name}</h3>
                      <p className="text-muted-foreground mb-4">
                        {sampleCampaign.description}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{sampleCampaign.worldSetting}</Badge>
                        <Badge variant="outline">Level 1-5</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sample Characters */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-primary" />
                  Party Members
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sampleCharacters.map((character, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-lg">{character.name}</CardTitle>
                          <Badge variant="outline">Lvl {character.level}</Badge>
                        </div>
                        <CardDescription>
                          <div className="space-y-1">
                            <div>{character.race} {character.class}</div>
                            <div className="flex gap-4 text-sm mt-2">
                              <span className="flex items-center gap-1">
                                <Shield className="w-4 h-4" /> AC {character.armorClass}
                              </span>
                              <span className="flex items-center gap-1">
                                ❤️ {character.hitPoints} HP
                              </span>
                            </div>
                          </div>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Sample Monsters */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Sword className="w-6 h-6 mr-2 text-primary" />
                  Fearsome Foes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sampleMonsters.map((monster, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                          {monster.name}
                          {monster.challengeRating && parseFloat(monster.challengeRating) >= 5 && (
                            <Flame className="w-4 h-4 text-destructive" />
                          )}
                        </CardTitle>
                        <CardDescription>
                          <div className="space-y-1 text-xs">
                            <div>{monster.size} {monster.type}</div>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="destructive" className="text-xs">
                                CR {monster.challengeRating}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                AC {monster.armorClass}
                              </Badge>
                            </div>
                          </div>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Sample Quests */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Scroll className="w-6 h-6 mr-2 text-primary" />
                  Epic Quests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sampleQuests.map((quest, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{quest.name}</CardTitle>
                        <CardDescription>
                          <p className="text-sm mb-3">{quest.description.slice(0, 100)}...</p>
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary">{quest.rewards.xp} XP</Badge>
                            <span className="text-xs text-muted-foreground">
                              💰 {quest.rewards.gold}g
                            </span>
                          </div>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Sample Items */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-primary" />
                  Legendary Loot
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sampleItems.map((item, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-md">{item.name}</CardTitle>
                          <Badge 
                            variant={
                              item.rarity === 'Legendary' ? 'default' : 
                              item.rarity === 'Rare' ? 'secondary' : 
                              'outline'
                            }
                            className="text-xs"
                          >
                            {item.rarity}
                          </Badge>
                        </div>
                        <CardDescription>
                          <p className="text-xs mb-2">{item.description.slice(0, 80)}...</p>
                          <div className="text-xs text-muted-foreground">
                            💰 {item.cost} gp
                          </div>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="py-16 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader className="space-y-6">
                  <div>
                    <CardTitle className="text-3xl mb-4">
                      Ready to Begin Your Adventure?
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Join thousands of Dungeon Masters and create unforgettable D&D experiences.
                      Sign in to start building your campaign today.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <SignInButton mode="modal">
                      <Button size="lg" className="text-lg">
                        <Dices className="w-5 h-5 mr-2" />
                        Start Your Campaign
                      </Button>
                    </SignInButton>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2 text-gradient">Welcome back, Adventurer!</h1>
            <p className="text-muted-foreground text-lg">
              Choose where to continue your journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/campaigns">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Map className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Campaigns</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Manage your D&D campaigns and adventures.
                  </p>
                  <Button variant="gradient" className="w-full">View Campaigns</Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/characters">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Characters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Create and manage player characters and NPCs.
                  </p>
                  <Button variant="gradient" className="w-full">View Characters</Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/monsters">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Sword className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Monsters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Browse and create monsters for your encounters.
                  </p>
                  <Button variant="gradient" className="w-full">View Monsters</Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/quests">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Scroll className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Quests</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Track your party's adventures and objectives.
                  </p>
                  <Button variant="gradient" className="w-full">View Quests</Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/items">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Items</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Manage weapons, armor, and magical items.
                  </p>
                  <Button variant="gradient" className="w-full">View Items</Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/maps">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Battle Maps</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Create and edit battle maps and world maps.
                  </p>
                  <Button variant="gradient" className="w-full">View Maps</Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/interactions">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Interactions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Manage live gameplay interactions and encounters.
                  </p>
                  <Button variant="gradient" className="w-full">View Interactions</Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/live-demo">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Dices className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Live Demo</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Try out the live interaction system.
                  </p>
                  <Button variant="gradient" className="w-full">Try Demo</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </SignedIn>
    </>
  )
}