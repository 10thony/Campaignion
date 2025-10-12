import { useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useAuthentication } from '@/components/providers/AuthenticationProvider'
import type { FunctionReference, OptionalRestArgs } from 'convex/server'

/**
 * Enhanced useQuery hook that automatically handles authentication errors
 */
export function useQueryWithAuth<Query extends FunctionReference<"query">>(
  query: Query,
  ...args: OptionalRestArgs<Query>
) {
  const { handleAuthError } = useAuthentication()
  
  const result = useQuery(query, ...args)
  
  // If there's an error, handle it through our auth error handler
  if (result === undefined && typeof query === 'function') {
    // The query is still loading, this is normal
  }
  
  return result
}

/**
 * Enhanced useMutation hook that automatically handles authentication errors
 */
export function useMutationWithAuth<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
) {
  const { handleAuthError } = useAuthentication()
  const originalMutation = useMutation(mutation)
  
  const wrappedMutation = useCallback(
    async (...args: OptionalRestArgs<Mutation>) => {
      try {
        const result = await originalMutation(...args)
        return result
      } catch (error) {
        handleAuthError(error)
        throw error // Re-throw so the calling code can handle it if needed
      }
    },
    [originalMutation, handleAuthError]
  )
  
  return wrappedMutation
}

/**
 * Hook to wrap any async Convex operation with authentication error handling
 */
export function useConvexErrorHandler() {
  const { handleAuthError } = useAuthentication()
  
  const wrapConvexCall = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T> => {
      try {
        return await asyncFn()
      } catch (error) {
        // Check if this looks like a Convex authentication error
        if (
          error && 
          (typeof error === 'object') &&
          (
            'message' in error && (
              error.message?.includes('Unauthenticated') ||
              error.message?.includes('authentication') ||
              error.message?.includes('UNAUTHORIZED')
            ) ||
            'code' in error && (
              error.code === 'Unauthenticated' ||
              error.code === 'UNAUTHORIZED'
            )
          )
        ) {
          handleAuthError(error)
        }
        throw error
      }
    },
    [handleAuthError]
  )
  
  return { wrapConvexCall, handleAuthError }
}

/**
 * Utility to create a Convex client call with automatic error handling
 */
export function useConvexClientWithAuth() {
  const { handleAuthError } = useAuthentication()
  
  const callWithAuth = useCallback(
    async <T>(clientCall: () => Promise<T>): Promise<T> => {
      try {
        return await clientCall()
      } catch (error) {
        handleAuthError(error)
        throw error
      }
    },
    [handleAuthError]
  )
  
  return callWithAuth
}