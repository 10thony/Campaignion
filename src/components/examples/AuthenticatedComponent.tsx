import React from 'react'
import { useQueryWithAuth, useMutationWithAuth } from '@/hooks/useConvexWithAuth'
import { useAuthentication } from '@/components/providers/AuthenticationProvider'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react'

/**
 * Example component demonstrating proper authentication handling
 * This shows best practices for using the authentication system
 */
export function AuthenticatedComponent() {
  const { isAuthenticated, isLoading, refreshSession, showSessionWarning } = useAuthentication()
  
  // Use enhanced hooks that automatically handle auth errors
  const characters = useQueryWithAuth(api.characters.getMyCharacters)
  const createCharacter = useMutationWithAuth(api.characters.createPlayerCharacter)
  
  const handleCreateExample = async () => {
    try {
      await createCharacter({
        name: "Test Character",
        race: "Human",
        class: "Fighter",
        background: "Soldier",
        level: 1,
        abilityScores: {
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8
        },
        hitPoints: 10,
        armorClass: 16,
        skills: ["Athletics", "Intimidation"],
        savingThrows: ["Strength", "Constitution"],
        proficiencies: ["All armor", "Shields", "Simple weapons", "Martial weapons"]
      })
    } catch (error) {
      // Auth errors are automatically handled by the enhanced mutation hook
      // Only handle business logic errors here
      console.error('Failed to create character:', error)
    }
  }

  const handleRefreshSession = async () => {
    const success = await refreshSession()
    if (success) {
      console.log('Session refreshed successfully')
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading authentication...</span>
        </CardContent>
      </Card>
    )
  }

  // Show unauthenticated state
  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground">Please sign in to access this content.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Authenticated Component Example</CardTitle>
          {showSessionWarning && (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Session Expiring Soon
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Authentication Status</h4>
          <div className="flex gap-2">
            <Badge variant="default">Authenticated</Badge>
            {showSessionWarning && (
              <Badge variant="outline" className="border-amber-500">
                Expiring Soon
              </Badge>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">My Characters</h4>
          {characters === undefined ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading characters...
            </div>
          ) : (
            <p className="text-muted-foreground">
              You have {characters.length} character(s)
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCreateExample} size="sm">
            Create Test Character
          </Button>
          
          <Button onClick={handleRefreshSession} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Session
          </Button>
        </div>

        <div className="bg-muted p-3 rounded-lg text-sm">
          <h5 className="font-medium mb-1">How this component works:</h5>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>• Uses <code>useQueryWithAuth</code> for automatic auth error handling</li>
            <li>• Uses <code>useMutationWithAuth</code> for safe mutations</li>
            <li>• Uses <code>useAuthentication</code> for auth state and utilities</li>
            <li>• Shows session warning when expiration is near</li>
            <li>• Handles loading and unauthenticated states</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}