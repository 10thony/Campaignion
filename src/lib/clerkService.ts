import { useUser, useAuth } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEffect } from 'react';

export interface ClerkUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  isSignedIn: boolean;
}

export interface DatabaseUser {
  _id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: 'admin' | 'user';
  createdAt: number;
}

/**
 * Hook to get the current Clerk user data
 */
export function useClerkUser(): ClerkUser | null {
  const { user, isSignedIn } = useUser();
  
  if (!user || !isSignedIn) {
    return null;
  }

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    imageUrl: user.imageUrl || undefined,
    isSignedIn: true,
  };
}

/**
 * Hook to get the current user from the database (includes role and other app-specific data)
 */
export function useDatabaseUser(): DatabaseUser | null {
  return useQuery(api.users.getCurrentUser);
}

/**
 * Hook to get both Clerk and database user data
 */
export function useUserData(): {
  clerkUser: ClerkUser | null;
  databaseUser: DatabaseUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
} {
  const clerkUser = useClerkUser();
  const databaseUser = useDatabaseUser();
  const { isSignedIn, isLoaded } = useAuth();

  return {
    clerkUser,
    databaseUser,
    isLoading: !isLoaded || databaseUser === undefined,
    isSignedIn: isSignedIn || false,
  };
}

/**
 * Hook to check if the current user is an admin
 */
export function useIsAdmin(): boolean {
  const { databaseUser } = useUserData();
  return databaseUser?.role === 'admin';
}

/**
 * Utility function to get user display name
 */
export function getUserDisplayName(user: ClerkUser | DatabaseUser | null): string {
  if (!user) return 'Unknown User';
  
  if ('firstName' in user && user.firstName) {
    return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
  }
  
  return user.email || 'Unknown User';
}

/**
 * Utility function to check if user has required permissions
 */
export function hasPermission(
  user: DatabaseUser | null,
  requiredRole: 'admin' | 'user' = 'user'
): boolean {
  if (!user) return false;
  
  if (requiredRole === 'admin') {
    return user.role === 'admin';
  }
  
  return true; // All authenticated users have 'user' permissions
} 

/**
 * Hook to sync Clerk user with database
 */
export function useSyncUser() {
  const { user, isSignedIn } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  
  useEffect(() => {
    if (isSignedIn && user) {
      upsertUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [isSignedIn, user, upsertUser]);
} 