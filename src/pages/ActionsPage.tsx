import { useState } from 'react'
import { useQuery } from 'convex/react'
import { useAuth } from '@clerk/clerk-react'
import { useAuthentication } from '@/components/providers/AuthenticationProvider'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Sword, 
  Zap, 
  Shield, 
  BookOpen,
  Sparkles,
  Loader2,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { ActionModal } from '@/components/modals/ActionModal'
import { SampleDataPanel } from '@/components/SampleDataPanel'
import { ActionCard } from '@/components/ActionCard'

type ActionCost = "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special"
type ActionType = "MELEE_ATTACK" | "RANGED_ATTACK" | "SPELL" | "COMMONLY_AVAILABLE_UTILITY" | "CLASS_FEATURE" | "BONUS_ACTION" | "REACTION" | "OTHER"
type ActionCategory = "general" | "class_specific" | "race_specific" | "feat_specific"

// D&D 5e Classes
const DND_CLASSES = [
  'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
] as const

interface Action {
  _id: string
  name: string
  description: string
  actionCost: ActionCost
  type: ActionType
  requiresConcentration: boolean
  sourceBook: string
  category: ActionCategory
  attackBonusAbilityScore?: string
  isProficient?: boolean
  damageRolls?: Array<{
    dice: { count: number; type: string }
    modifier: number
    damageType: string
  }>
  spellLevel?: number
  castingTime?: string
  range?: string
  components?: {
    verbal: boolean
    somatic: boolean
    material?: string
  }
  duration?: string
  savingThrow?: {
    ability: string
    onSave: string
  }
  spellEffectDescription?: string
  requiredClass?: string
  targetClass?: string
  requiredLevel?: number
  requiredSubclass?: string
  usesPer?: "Short Rest" | "Long Rest" | "Day" | "Special"
  maxUses?: number | string
  isBaseAction?: boolean
  tags?: string[]
  prerequisites?: string[]
  createdAt?: number
}

export function ActionsPage() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const { isAuthenticated, isLoading: isAuthProviderLoading } = useAuthentication()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedActionCost, setSelectedActionCost] = useState<ActionCost | 'all'>('all')
  const [selectedActionType, setSelectedActionType] = useState<ActionType | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | 'all'>('all')
  const [selectedClass, setSelectedClass] = useState<string | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)

  // Data queries
  const actions = useQuery(
    api.actions.getAllActions,
    isAuthenticated ? {} : "skip"
  )

  // Show loading state while authentication is being determined
  if (!isAuthLoaded || isAuthProviderLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show authentication required message if not authenticated
  if (!isSignedIn || !isAuthenticated) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to access the actions management system.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreateAction = () => {
    setSelectedAction(null)
    setModalMode("create")
    setModalOpen(true)
  }

  const handleEditAction = (action: Action) => {
    setSelectedAction(action)
    setModalMode("edit")
    setModalOpen(true)
  }

  const handleViewAction = (action: Action) => {
    setSelectedAction(action)
    setModalMode("view")
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    setModalOpen(false)
    setSelectedAction(null)
  }

  // Filter actions based on search and filters
  const filteredActions = actions?.filter((action) => {
    const matchesSearch = action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.sourceBook.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesActionCost = selectedActionCost === 'all' || action.actionCost === selectedActionCost
    const matchesActionType = selectedActionType === 'all' || action.type === selectedActionType
    const matchesCategory = selectedCategory === 'all' || action.category === selectedCategory
    
    // Class filtering - only applies when category is "class_specific"
    const matchesClass = selectedClass === 'all' || 
                        (selectedCategory === 'class_specific' && action.targetClass === selectedClass) ||
                        (selectedCategory !== 'class_specific')

    return matchesSearch && matchesActionCost && matchesActionType && matchesCategory && matchesClass
  }) || []


  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Actions</h1>
          <p className="text-muted-foreground">
            Manage spells, abilities, and combat actions for your campaigns
          </p>
        </div>
        <Button onClick={handleCreateAction} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Action
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'my')} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Actions</TabsTrigger>
          <TabsTrigger value="my">My Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Sample Data Panel */}
          <SampleDataPanel entityType="actions" onDataLoaded={() => {}} />

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search actions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Action Cost</label>
                  <Select value={selectedActionCost} onValueChange={(value) => setSelectedActionCost(value as ActionCost | 'all')}>
                    <SelectTrigger>
                      <SelectValue placeholder="All costs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All costs</SelectItem>
                      <SelectItem value="Action">Action</SelectItem>
                      <SelectItem value="Bonus Action">Bonus Action</SelectItem>
                      <SelectItem value="Reaction">Reaction</SelectItem>
                      <SelectItem value="No Action">No Action</SelectItem>
                      <SelectItem value="Special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Action Type</label>
                  <Select value={selectedActionType} onValueChange={(value) => setSelectedActionType(value as ActionType | 'all')}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="MELEE_ATTACK">Melee Attack</SelectItem>
                      <SelectItem value="RANGED_ATTACK">Ranged Attack</SelectItem>
                      <SelectItem value="SPELL">Spell</SelectItem>
                      <SelectItem value="COMMONLY_AVAILABLE_UTILITY">Utility</SelectItem>
                      <SelectItem value="CLASS_FEATURE">Class Feature</SelectItem>
                      <SelectItem value="BONUS_ACTION">Bonus Action</SelectItem>
                      <SelectItem value="REACTION">Reaction</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={(value) => {
                    setSelectedCategory(value as ActionCategory | 'all')
                    // Reset class filter when changing category
                    if (value !== 'class_specific') {
                      setSelectedClass('all')
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="class_specific">Class Specific</SelectItem>
                      <SelectItem value="race_specific">Race Specific</SelectItem>
                      <SelectItem value="feat_specific">Feat Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Class-specific filter - only show when category is "class_specific" */}
              {selectedCategory === 'class_specific' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Class</label>
                      <Select value={selectedClass} onValueChange={(value) => setSelectedClass(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All classes</SelectItem>
                          {DND_CLASSES.map((className) => (
                            <SelectItem key={className} value={className}>
                              {className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions List */}
          <div className="grid gap-4">
            {filteredActions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sword className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No actions found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || selectedActionCost !== 'all' || selectedActionType !== 'all' || selectedCategory !== 'all' || selectedClass !== 'all'
                      ? "Try adjusting your filters or search terms."
                      : "Create your first action to get started."}
                  </p>
                  <Button onClick={handleCreateAction} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Action
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredActions.map((action) => (
                <ActionCard
                  key={action._id}
                  action={action}
                  onView={handleViewAction}
                  onEdit={handleEditAction}
                  showActions={true}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Actions</CardTitle>
              <CardDescription>
                Actions you've created or have access to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Sword className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    Personal action management features are in development.
                  </p>
                  <Button onClick={handleCreateAction} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Action
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Modal */}
      <ActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        action={selectedAction || undefined}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
