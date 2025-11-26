import { useState } from 'react'
import { useMutation } from 'convex/react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, Database, Trash2, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { SampleDataService } from '@/lib/sampleDataService'
import { api } from '../../convex/_generated/api'
import { useUserData } from '@/lib/clerkService'

interface SampleDataPanelProps {
  entityType: 'campaigns' | 'characters' | 'monsters' | 'items' | 'quests' | 'actions' | 'maps'
  onDataLoaded?: () => void
}

// Hardcoded Clerk ID for sample data
const HARDCODED_CLERK_ID = 'user_2z9b8vd97dQR6ddsQwYI9y7yi72'

export function SampleDataPanel({ entityType, onDataLoaded }: SampleDataPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isSignedIn, isLoading: authLoading, clerkUser } = useUserData()

  // Sample data mutations
  const loadSampleCampaigns = useMutation(api.sampleData.loadSampleCampaigns)
  const loadSampleCharacters = useMutation(api.sampleData.loadSampleCharacters)
  const loadSampleMonsters = useMutation(api.sampleData.loadSampleMonsters)
  const loadSampleItems = useMutation(api.sampleData.loadSampleItems)
  const loadSampleQuests = useMutation(api.sampleData.loadSampleQuests)
  const loadSampleActions = useMutation(api.sampleData.loadSampleActions)
  const loadSampleMaps = useMutation(api.sampleData.loadSampleMaps)
  
  // Specific delete mutations
  const deleteAllCampaigns = useMutation(api.sampleData.deleteAllSampleCampaigns)
  const deleteAllCharacters = useMutation(api.sampleData.deleteAllSampleCharacters)
  const deleteAllMonsters = useMutation(api.sampleData.deleteAllSampleMonsters)
  const deleteAllItems = useMutation(api.sampleData.deleteAllSampleItems)
  const deleteAllQuests = useMutation(api.sampleData.deleteAllSampleQuests)
  const deleteAllActions = useMutation(api.sampleData.deleteAllSampleActions)
  const deleteAllMaps = useMutation(api.sampleData.deleteAllSampleMaps)

  const sampleDataInfo = SampleDataService.getSampleDataInfo()
  const entityInfo = sampleDataInfo[entityType]

  const handleLoadSampleData = async () => {
    if (!clerkUser) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Get the appropriate mutation function
      let mutateFn
      switch (entityType) {
        case 'campaigns':
          mutateFn = loadSampleCampaigns
          break
        case 'characters':
          mutateFn = loadSampleCharacters
          break
        case 'monsters':
          mutateFn = loadSampleMonsters
          break
        case 'items':
          mutateFn = loadSampleItems
          break
        case 'quests':
          mutateFn = loadSampleQuests
          break
        case 'actions':
          mutateFn = loadSampleActions
          break
        case 'maps':
          mutateFn = loadSampleMaps
          break
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }

      // Load sample data with hardcoded clerkId
      const result = await SampleDataService.loadSampleData(entityType, mutateFn, HARDCODED_CLERK_ID)
      setSuccess(`Sample ${entityType} loaded successfully! (${entityInfo.count} items)`)
      onDataLoaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAllData = async () => {
    if (!clerkUser) {
      setError('User not authenticated')
      return
    }

    if (!confirm(`Are you sure you want to delete all ${entityType}? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Get the appropriate delete function based on entity type
      let deleteFn
      switch (entityType) {
        case 'campaigns':
          deleteFn = deleteAllCampaigns
          break
        case 'characters':
          deleteFn = deleteAllCharacters
          break
        case 'monsters':
          deleteFn = deleteAllMonsters
          break
        case 'items':
          deleteFn = deleteAllItems
          break
        case 'quests':
          deleteFn = deleteAllQuests
          break
        case 'actions':
          deleteFn = deleteAllActions
          break
        case 'maps':
          deleteFn = deleteAllMaps
          break
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }

      // Use hardcoded Clerk ID for deletion
      const result = await deleteFn({ clerkId: HARDCODED_CLERK_ID })
      setSuccess(`All ${entityType} deleted successfully! (${result.deleted} items)`)
      onDataLoaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sample Data Management
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed(!isCollapsed)
            }}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>{entityInfo.description}</span>
            <Badge variant="outline">v{entityInfo.version}</Badge>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleLoadSampleData}
              disabled={isLoading || !isSignedIn || authLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Load {entityInfo.count} Sample {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteAllData}
              disabled={isLoading || !isSignedIn || authLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete All {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  )
} 