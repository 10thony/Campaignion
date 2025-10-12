import React, { useState } from "react"
import { useQuery } from "convex/react"
import { TimelineEventCard } from "./TimelineEventCard"
import { TimelineEventModal } from "./modals/TimelineEventModal"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { 
  Calendar,
  Plus,
  Search,
  Clock,
  Play,
  CheckCircle,
  Filter,
  Sword,
  UserPlus,
  Eye,
  Zap,
  Crown,
  BookOpen,
  Target
} from "lucide-react"

import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { useAuthenticationGuard } from "../hooks/useAuthenticationGuard"

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All Types", icon: Calendar },
  { value: "Battle", label: "Battle", icon: Sword },
  { value: "Alliance", label: "Alliance", icon: UserPlus },
  { value: "Discovery", label: "Discovery", icon: Eye },
  { value: "Disaster", label: "Disaster", icon: Zap },
  { value: "Political", label: "Political", icon: Crown },
  { value: "Cultural", label: "Cultural", icon: BookOpen },
  { value: "Custom", label: "Custom", icon: Target },
] as const

const STATUS_OPTIONS = [
  { value: "", label: "All Status", icon: Calendar },
  { value: "idle", label: "Planned", icon: Clock },
  { value: "in_progress", label: "Happening", icon: Play },
  { value: "completed", label: "Historical", icon: CheckCircle },
] as const

interface TimelineEvent {
  _id: Id<"timelineEvents">
  title: string
  description: string
  date: number
  campaignId: Id<"campaigns">
  type: "Battle" | "Alliance" | "Discovery" | "Disaster" | "Political" | "Cultural" | "Custom"
  status: "idle" | "in_progress" | "completed"
  relatedLocationIds?: Id<"locations">[]
  relatedNpcIds?: Id<"characters">[]
  relatedFactionIds?: Id<"factions">[]
  relatedQuestIds?: Id<"quests">[]
  primaryQuestId?: Id<"quests">
  isPublic?: boolean
  createdAt?: number
}

interface TimelineEventListProps {
  campaignId?: Id<"campaigns">
  title?: string
  description?: string
  showCreateButton?: boolean
  showFilters?: boolean
  maxItems?: number
  onEventView?: (eventId: string) => void
  onEventEdit?: (eventId: string) => void
  onEventCreate?: () => void
  canEdit?: boolean
}

export function TimelineEventList({
  campaignId,
  title = "Timeline Events",
  description = "Campaign timeline and historical events",
  showCreateButton = true,
  showFilters = true,
  maxItems,
  onEventView,
  onEventEdit,
  onEventCreate,
  canEdit = false
}: TimelineEventListProps) {
  const { user } = useAuthenticationGuard()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)

  // Fetch timeline events
  const timelineEvents = useQuery(
    campaignId 
      ? api.timeline.getTimelineEventsByCampaign 
      : api.timeline.getTimelineEvents,
    campaignId ? { campaignId } : {}
  )

  const handleViewEvent = (eventId: string) => {
    const event = timelineEvents?.find(e => e._id === eventId)
    if (event) {
      setSelectedEvent(event)
      setModalMode("view")
      setModalOpen(true)
      onEventView?.(eventId)
    }
  }

  const handleEditEvent = (eventId: string) => {
    const event = timelineEvents?.find(e => e._id === eventId)
    if (event) {
      setSelectedEvent(event)
      setModalMode("edit")
      setModalOpen(true)
      onEventEdit?.(eventId)
    }
  }

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setModalMode("create")
    setModalOpen(true)
    onEventCreate?.()
  }

  const handleModalSuccess = () => {
    // Modal will close itself, queries will auto-refresh
  }

  // Filter events
  const filteredEvents = timelineEvents?.filter(event => {
    const matchesSearch = searchTerm === "" || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === "" || event.type === selectedType
    const matchesStatus = selectedStatus === "" || event.status === selectedStatus
    
    return matchesSearch && matchesType && matchesStatus
  }) || []

  // Sort by date (most recent first for completed, chronological for planned/happening)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    // Group by status first
    const statusOrder = { 'in_progress': 0, 'idle': 1, 'completed': 2 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    
    // Within status groups, sort by date
    if (a.status === 'completed') {
      return b.date - a.date // Most recent completed first
    } else {
      return a.date - b.date // Chronological for planned/happening
    }
  })

  // Apply max items limit if specified
  const displayEvents = maxItems ? sortedEvents.slice(0, maxItems) : sortedEvents

  const getEventStats = () => {
    if (!timelineEvents) return { total: 0, planned: 0, happening: 0, historical: 0 }
    
    return {
      total: timelineEvents.length,
      planned: timelineEvents.filter(e => e.status === 'idle').length,
      happening: timelineEvents.filter(e => e.status === 'in_progress').length,
      historical: timelineEvents.filter(e => e.status === 'completed').length,
    }
  }

  const stats = getEventStats()

  const renderEventGrid = () => {
    if (!timelineEvents) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )
    }

    if (displayEvents.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Timeline Events</p>
            <p className="text-muted-foreground mb-4 text-center">
              {searchTerm || selectedType || selectedStatus 
                ? 'No events match your search criteria.' 
                : 'No timeline events have been created yet.'}
            </p>
            {!searchTerm && !selectedType && !selectedStatus && showCreateButton && canEdit && (
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayEvents.map((event) => (
          <TimelineEventCard
            key={event._id}
            timelineEvent={event}
            onView={handleViewEvent}
            onEdit={handleEditEvent}
            canEdit={canEdit}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        
        {showCreateButton && canEdit && (
          <Button onClick={handleCreateEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.happening}</div>
            <div className="text-sm text-muted-foreground">Happening Now</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.planned}</div>
            <div className="text-sm text-muted-foreground">Planned</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.historical}</div>
            <div className="text-sm text-muted-foreground">Historical</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Event status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Events Grid */}
      {renderEventGrid()}

      {/* Show More Link */}
      {maxItems && sortedEvents.length > maxItems && (
        <div className="text-center">
          <Button variant="outline">
            View All {sortedEvents.length} Events
          </Button>
        </div>
      )}

      {/* Modal */}
      <TimelineEventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        timelineEvent={selectedEvent}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}