import React, { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Clock, RefreshCw, LogOut, AlertTriangle } from 'lucide-react'

interface SessionExpirationModalProps {
  isOpen: boolean
  timeRemaining: number // in milliseconds
  onExtendSession: () => Promise<boolean>
  onSignOut: () => void
  onClose: () => void
  autoSignOutAfter?: number // auto sign out after this many seconds
}

export function SessionExpirationModal({
  isOpen,
  timeRemaining,
  onExtendSession,
  onSignOut,
  onClose,
  autoSignOutAfter = 60 // 1 minute default
}: SessionExpirationModalProps) {
  const [isExtending, setIsExtending] = useState(false)
  const [autoSignOutCountdown, setAutoSignOutCountdown] = useState(autoSignOutAfter)

  // Auto sign out countdown
  useEffect(() => {
    if (!isOpen) {
      setAutoSignOutCountdown(autoSignOutAfter)
      return
    }

    const interval = setInterval(() => {
      setAutoSignOutCountdown((prev) => {
        if (prev <= 1) {
          // Auto sign out
          onSignOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, autoSignOutAfter, onSignOut])

  const handleExtendSession = async () => {
    setIsExtending(true)
    try {
      const success = await onExtendSession()
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to extend session:', error)
    } finally {
      setIsExtending(false)
    }
  }

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return `${seconds}s`
  }

  const progressPercentage = Math.max(0, Math.min(100, (timeRemaining / (5 * 60 * 1000)) * 100))

  if (!isOpen) return null

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  Time remaining: {formatTime(timeRemaining)}
                </span>
              </div>
              
              <Progress value={progressPercentage} className="w-full h-2" />
              
              <p className="text-sm text-muted-foreground mt-2">
                Your session will expire soon due to inactivity. 
                Would you like to extend your session or sign out?
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium text-center">
                Auto sign out in: {autoSignOutCountdown}s
              </p>
              <p className="text-muted-foreground text-center text-xs mt-1">
                You will be automatically signed out if no action is taken
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              onClick={onSignOut}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button 
              onClick={handleExtendSession}
              disabled={isExtending}
              className="w-full sm:w-auto"
            >
              {isExtending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Extend Session
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}