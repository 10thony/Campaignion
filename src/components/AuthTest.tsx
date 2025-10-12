import React from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function AuthTest() {
  const { user, isSignedIn } = useUser()
  const databaseUser = useQuery(api.users.getCurrentUser)
  const upsertUser = useMutation(api.users.upsertUser)
  const ensureAdminRole = useMutation(api.users.ensureAdminRole)

  const handleSyncUser = async () => {
    if (user) {
      try {
        await upsertUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          imageUrl: user.imageUrl || undefined,
        })
        console.log('User synced successfully')
      } catch (error) {
        console.error('Failed to sync user:', error)
      }
    }
  }

  const handleMakeAdmin = async () => {
    try {
      await ensureAdminRole()
      console.log('Admin role ensured')
    } catch (error) {
      console.error('Failed to ensure admin role:', error)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">Clerk User:</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify({ isSignedIn, userId: user?.id, email: user?.emailAddresses[0]?.emailAddress }, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-medium">Database User:</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(databaseUser, null, 2)}
          </pre>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleSyncUser} variant="outline">
            Sync User
          </Button>
          <Button onClick={handleMakeAdmin} variant="outline">
            Make Admin
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 