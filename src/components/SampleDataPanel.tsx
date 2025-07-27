import { useState } from 'react'
import { useMutation } from 'convex/react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, Database, Trash2, Info } from 'lucide-react'
import { SampleDataService } from '@/lib/sampleDataService'
import { api } from '../../convex/_generated/api'
import { useUserData } from '@/lib/clerkService'

interface SampleDataPanelProps {
  entityType: 'campaigns' | 'characters' | 'monsters' | 'items' | 'quests' | 'actions'
  onDataLoaded?: () => void
}

export function SampleDataPanel({ entityType, onDataLoaded }: SampleDataPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { isSignedIn, isLoading: authLoading, clerkUser } = useUserData()

  // Sample data mutations
  const loadSampleCampaigns = useMutation(api.sampleData.loadSampleCampaigns)
  const loadSampleCharacters = useMutation(api.sampleData.loadSampleCharacters)
  const loadSampleMonsters = useMutation(api.sampleData.loadSampleMonsters)
  const loadSampleItems = useMutation(api.sampleData.loadSampleItems)
  const loadSampleQuests = useMutation(api.sampleData.loadSampleQuests)
  const loadSampleActions = useMutation(api.sampleData.loadSampleActions)
  const deleteAllData = useMutation(api.sampleData.deleteAllSampleData)

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
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }

      // Load sample data with clerkId
      const result = await SampleDataService.loadSampleData(entityType, mutateFn, clerkUser.id)
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
      await deleteAllData({ clerkId: clerkUser.id })
      setSuccess(`All ${entityType} deleted successfully!`)
      onDataLoaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Data Management
          <Badge variant="secondary">Available to all users</Badge>
        </CardTitle>
      </CardHeader>
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
    </Card>
  )
} 