import React from 'react'
import { useMutation } from 'convex/react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { api } from '../../convex/_generated/api'
import { useAuthenticatedUser } from '../hooks/useAuthenticationGuard'

export function AdminSetup() {
  const { databaseUser } = useAuthenticatedUser()
  const ensureAdminRole = useMutation(api.users.ensureAdminRole)

  const handleMakeAdmin = async () => {
    try {
      await ensureAdminRole()
      window.location.reload() // Refresh to get updated role
    } catch (error) {
      console.error('Failed to make admin:', error)
    }
  }

  if (!databaseUser) {
    return null
  }

  if (databaseUser.role === 'admin') {
    return null
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">Admin Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-yellow-700 mb-4">
          You are currently a regular user. As the app creator, you may want to upgrade to admin role for full access.
        </p>
        <Button onClick={handleMakeAdmin} variant="outline">
          Make Me Admin
        </Button>
      </CardContent>
    </Card>
  )
} 