import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

export const UserSync: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      if (!isSignedIn || !user) {
        console.log("UserSync: Not signed in or no user");
        return;
      }

      // Prevent multiple simultaneous syncs
      if (isSyncing) {
        console.log("UserSync: Already syncing, skipping");
        return;
      }

      // Check if we need to sync (avoid unnecessary calls)
      const now = Date.now();
      if (lastSyncTime && now - lastSyncTime < 5000) {
        console.log("UserSync: Debouncing sync request");
        return; // Debounce to 5 seconds
      }

      setIsSyncing(true);
      
      try {
        const userEmail = user.emailAddresses[0]?.emailAddress || "no-email";
        console.log("🔄 UserSync: Syncing user to Convex:", userEmail);
        
        const result = await createOrUpdateUser({
          clerkId: user.id,
          email: userEmail,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          imageUrl: user.imageUrl || undefined,
        });
        
        setLastSyncTime(now);
        console.log("✅ UserSync: User synced successfully", {
          clerkId: user.id,
          email: userEmail,
          result
        });
      } catch (error) {
        console.error("❌ UserSync: Failed to sync user:", error);
        // Don't update lastSyncTime on error so we can retry
      } finally {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [isSignedIn, user, createOrUpdateUser, isSyncing, lastSyncTime]);

  // This component doesn't render anything
  return null;
}; 