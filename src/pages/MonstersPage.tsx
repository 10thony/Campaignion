import { useState } from 'react'
import { useQuery } from 'convex/react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { MonsterCard } from '@/components/MonsterCard'
import { MonsterModal } from '@/components/modals/MonsterModal'
import { SampleDataPanel } from '@/components/SampleDataPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search } from 'lucide-react'
import { api } from '../../convex/_generated/api'

export function MonstersPage() {
  const monsters = useQuery(api.monsters.getMonsters)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCR, setSelectedCR] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [selectedMonster, setSelectedMonster] = useState<any>(null)

  const filteredMonsters = monsters?.filter(monster => {
    const matchesSearch = monster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         monster.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCR = !selectedCR || monster.challengeRating === selectedCR
    return matchesSearch && matchesCR
  })

  const challengeRatings = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 
                           '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30']

  const handleViewMonster = (monsterId: string) => {
    const monster = monsters?.find(m => m._id === monsterId)
    if (monster) {
      setSelectedMonster(monster)
      setModalMode("view")
      setModalOpen(true)
    }
  }

  const handleEditMonster = (monsterId: string) => {
    const monster = monsters?.find(m => m._id === monsterId)
    if (monster) {
      setSelectedMonster(monster)
      setModalMode("edit")
      setModalOpen(true)
    }
  }

  const handleCreateMonster = () => {
    setSelectedMonster(null)
    setModalMode("create")
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Modal will close itself, this is called after successful creation/edit
    // The queries will automatically refetch due to Convex reactivity
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Monster Manual</h1>
          <p className="text-muted-foreground">
            Browse and manage monsters for your D&D campaigns
          </p>
        </div>
        
        <SignedIn>
          <Button onClick={handleCreateMonster}>
            <Plus className="h-4 w-4 mr-2" />
            Create Monster
          </Button>
        </SignedIn>
      </div>

      <SignedOut>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to manage monsters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to create and manage monsters for your campaigns.
            </p>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        {/* Sample Data Panel */}
        <SampleDataPanel 
          entityType="monsters" 
          onDataLoaded={() => {
            // Refresh the page data
            window.location.reload()
          }} 
        />

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search monsters by name or type..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCR === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCR('')}
            >
              All CR
            </Button>
            {challengeRatings.slice(0, 10).map((cr) => (
              <Button
                key={cr}
                variant={selectedCR === cr ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCR(cr)}
              >
                CR {cr}
              </Button>
            ))}
          </div>
        </div>

        {/* Monsters Grid */}
        {monsters === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredMonsters?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCR 
                  ? 'No monsters match your search criteria.' 
                  : 'No monsters available. Create your first monster!'}
              </p>
              {(!searchTerm && !selectedCR) && (
                <Button onClick={handleCreateMonster}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Monster
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMonsters?.map((monster) => (
              <MonsterCard
                key={monster._id}
                monster={monster}
                onView={handleViewMonster}
                onEdit={handleEditMonster}
                canEdit={true} // TODO: Check actual permissions
              />
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {filteredMonsters && filteredMonsters.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{filteredMonsters.length}</div>
                <div className="text-sm text-muted-foreground">Total Monsters</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  {Math.min(...filteredMonsters.map(m => parseFloat(m.challengeRating.replace('/', '.'))))}
                </div>
                <div className="text-sm text-muted-foreground">Lowest CR</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  {Math.max(...filteredMonsters.map(m => parseFloat(m.challengeRating.replace('/', '.'))))}
                </div>
                <div className="text-sm text-muted-foreground">Highest CR</div>
              </CardContent>
            </Card>
            
                         <Card>
               <CardContent className="p-4 text-center">
                 <div className="text-2xl font-bold">
                   {filteredMonsters.filter(m => m.legendaryActions || m.lairActions).length}
                 </div>
                 <div className="text-sm text-muted-foreground">Boss Monsters</div>
               </CardContent>
             </Card>
          </div>
        )}
      </SignedIn>

      <MonsterModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        monster={selectedMonster}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
} 