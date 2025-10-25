import { useState } from 'react'
import { useQueryWithAuth } from '@/hooks/useConvexWithAuth'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { CharacterCard } from '@/components/CharacterCard'
import { CharacterModal } from '@/components/modals/CharacterModal'
import { SampleDataPanel } from '@/components/SampleDataPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Users, User } from 'lucide-react'
import { api } from '../../convex/_generated/api'

export function CharactersPage() {
  const playerCharacters = useQueryWithAuth(api.characters.getPlayerCharacters)
  const npcs = useQueryWithAuth(api.characters.getNPCs)
  const myCharacters = useQueryWithAuth(api.characters.getMyCharacters)
  const allCharacters = useQueryWithAuth(api.characters.getAllCharacters)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'pcs' | 'npcs'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null)
  const [characterType, setCharacterType] = useState<"player" | "npc">("player")

  const filterCharacters = (characters: any[]) => {
    return characters?.filter(character => 
      character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.race.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.class.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredMyCharacters = filterCharacters(myCharacters || [])
  const filteredPCs = filterCharacters(playerCharacters || [])
  const filteredNPCs = filterCharacters(npcs || [])
  const filteredAllCharacters = filterCharacters(allCharacters || [])

  const handleViewCharacter = (characterId: string) => {
    const character = [...(allCharacters || [])].find(c => c._id === characterId)
    if (character) {
      setSelectedCharacter(character)
      setCharacterType(character.characterType || "player")
      setModalMode("view")
      setModalOpen(true)
    }
  }

  const handleEditCharacter = (characterId: string) => {
    const character = myCharacters?.find(c => c._id === characterId)
    if (character) {
      setSelectedCharacter(character)
      setCharacterType(character.characterType || "player")
      setModalMode("edit")
      setModalOpen(true)
    }
  }

  const handleCreateCharacter = () => {
    setSelectedCharacter(null)
    setCharacterType("player")
    setModalMode("create")
    setModalOpen(true)
  }

  const handleCreateNPC = () => {
    setSelectedCharacter(null)
    setCharacterType("npc")
    setModalMode("create")
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Modal will close itself, this is called after successful creation/edit
    // The queries will automatically refetch due to Convex reactivity
  }

  const handleCloneSuccess = () => {
    // Refresh the data after cloning
    // The queries will automatically refetch due to Convex reactivity
  }

  const renderCharacterGrid = (characters: any[], canEdit = false) => {
    if (!characters) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )
    }

    if (characters.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'No characters match your search criteria.' 
                : 'No characters found.'}
            </p>
            {!searchTerm && (activeTab === 'my' || activeTab === 'all') && (
              <Button onClick={handleCreateCharacter}>
                <Plus className="h-4 w-4 mr-2" />
                Create Character
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {characters.map((character) => (
          <CharacterCard
            key={character._id}
            character={character}
            onView={handleViewCharacter}
            onEdit={handleEditCharacter}
            onClone={handleCloneSuccess}
            canEdit={canEdit}
            canClone={true}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="text-muted-foreground">
            Manage player characters and NPCs for your campaigns
          </p>
        </div>
        
        <SignedIn>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCreateNPC}>
              <Plus className="h-4 w-4 mr-2" />
              Create NPC
            </Button>
            <Button onClick={handleCreateCharacter}>
              <Plus className="h-4 w-4 mr-2" />
              Create Character
            </Button>
          </div>
        </SignedIn>
      </div>

      <SignedOut>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to manage characters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to create and manage characters for your D&D campaigns.
            </p>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        {/* Sample Data Panel */}
        <SampleDataPanel 
          entityType="characters" 
          onDataLoaded={() => {
            // Data will automatically refresh via Convex queries
          }} 
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              All Characters
              {allCharacters && (
                <Badge variant="secondary" className="ml-1">
                  {allCharacters.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'my' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('my')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              My Characters
              {myCharacters && (
                <Badge variant="secondary" className="ml-1">
                  {myCharacters.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'pcs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('pcs')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              All PCs
              {playerCharacters && (
                <Badge variant="secondary" className="ml-1">
                  {playerCharacters.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'npcs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('npcs')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              NPCs
              {npcs && (
                <Badge variant="secondary" className="ml-1">
                  {npcs.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search characters..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Character Content */}
        <div className="space-y-6">
          {activeTab === 'all' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">All Characters</h2>
              {renderCharacterGrid(filteredAllCharacters, false)}
            </div>
          )}

          {activeTab === 'my' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">My Characters</h2>
              {renderCharacterGrid(filteredMyCharacters, true)}
            </div>
          )}

          {activeTab === 'pcs' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">All Player Characters</h2>
              {renderCharacterGrid(filteredPCs, false)}
            </div>
          )}

          {activeTab === 'npcs' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Non-Player Characters</h2>
              {renderCharacterGrid(filteredNPCs, false)}
            </div>
          )}
        </div>
      </SignedIn>

      <CharacterModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        character={selectedCharacter}
        characterType={characterType}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
} 