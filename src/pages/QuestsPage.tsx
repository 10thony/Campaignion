import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { QuestCard } from '@/components/QuestCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, BookOpen, CheckCircle, Clock, Play } from 'lucide-react'
import { api } from '../../convex/_generated/api'

type QuestStatus = "idle" | "in_progress" | "completed" | "NotStarted" | "InProgress" | "Failed"

export function QuestsPage() {
  const quests = useQuery(api.quests.getQuests)
  const myQuests = useQuery(api.quests.getMyQuests)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<QuestStatus | ''>('')
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my')

  const updateQuestStatus = useMutation(api.quests.updateQuestStatus)

  const handleUpdateQuestStatus = async (questId: string, status: QuestStatus) => {
    try {
      await updateQuestStatus({ questId: questId as any, status })
    } catch (error) {
      console.error('Failed to update quest status:', error)
    }
  }

  const filterQuests = (questList: any[]) => {
    return questList?.filter(quest => {
      const matchesSearch = quest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (quest.description && quest.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = !selectedStatus || quest.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }

  const filteredMyQuests = filterQuests(myQuests || [])
  const filteredAllQuests = filterQuests(quests || [])

  const handleViewQuest = (questId: string) => {
    console.log('View quest:', questId)
    // TODO: Navigate to quest detail page
  }

  const handleEditQuest = (questId: string) => {
    console.log('Edit quest:', questId)
    // TODO: Open edit modal or navigate to edit page
  }

  const statusOptions: Array<{ value: QuestStatus | '', label: string, icon: any }> = [
    { value: '', label: 'All Statuses', icon: BookOpen },
    { value: 'idle', label: 'Not Started', icon: Clock },
    { value: 'in_progress', label: 'In Progress', icon: Play },
    { value: 'completed', label: 'Completed', icon: CheckCircle },
  ]

  const getQuestStats = (questList: any[]) => {
    if (!questList) return { total: 0, completed: 0, inProgress: 0, notStarted: 0 }
    
    return {
      total: questList.length,
      completed: questList.filter(q => q.status === 'completed').length,
      inProgress: questList.filter(q => q.status === 'in_progress' || q.status === 'InProgress').length,
      notStarted: questList.filter(q => q.status === 'idle' || q.status === 'NotStarted').length,
    }
  }

  const renderQuestGrid = (questList: any[], canEdit = false) => {
    if (!questList) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )
    }

    if (questList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedStatus 
                ? 'No quests match your search criteria.' 
                : 'No quests found.'}
            </p>
            {!searchTerm && !selectedStatus && activeTab === 'my' && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Quest
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questList.map((quest) => (
          <QuestCard
            key={quest._id}
            quest={quest}
            taskCount={quest.taskIds?.length || 0}
            completedTaskCount={0} // TODO: Calculate from actual task data
            onView={handleViewQuest}
            onEdit={handleEditQuest}
            onUpdateStatus={handleUpdateQuestStatus}
            canEdit={canEdit}
          />
        ))}
      </div>
    )
  }

  const currentQuests = activeTab === 'my' ? filteredMyQuests : filteredAllQuests
  const stats = getQuestStats(activeTab === 'my' ? (myQuests || []) : (quests || []))

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quest Journal</h1>
          <p className="text-muted-foreground">
            Track and manage quests for your D&D campaigns
          </p>
        </div>
        
        <SignedIn>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Quest
          </Button>
        </SignedIn>
      </div>

      <SignedOut>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to manage quests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to create and manage quests for your campaigns.
            </p>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        {/* Tab Navigation and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'my' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('my')}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              My Quests
              {myQuests && (
                <Badge variant="secondary" className="ml-1">
                  {myQuests.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              All Quests
              {quests && (
                <Badge variant="secondary" className="ml-1">
                  {quests.length}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex flex-1 gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quests..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-1">
              {statusOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    variant={selectedStatus === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(option.value)}
                    className="gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quest Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Quests</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
              <div className="text-sm text-muted-foreground">Not Started</div>
            </CardContent>
          </Card>
        </div>

        {/* Quest Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {activeTab === 'my' ? 'My Quests' : 'All Quests'}
          </h2>
          {renderQuestGrid(currentQuests, activeTab === 'my')}
        </div>
      </SignedIn>
    </div>
  )
} 