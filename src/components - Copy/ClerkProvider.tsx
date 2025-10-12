import { ClerkProvider as BaseClerkProvider, useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  useEffect(() => {
    if (isSignedIn && user) {
      createOrUpdateUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [isSignedIn, user, createOrUpdateUser]);

  return (
    <BaseClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {children}
    </BaseClerkProvider>
  );
} 