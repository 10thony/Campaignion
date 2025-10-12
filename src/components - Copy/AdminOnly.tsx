import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const userRole = useQuery(api.users.getUserRole, 
    user?.id ? { clerkId: user.id } : "skip"
  );

  if (!user || userRole !== "admin") {
    return null;
  }

  return <>{children}</>;
}; 