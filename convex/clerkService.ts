import { v } from "convex/values";

/**
 * Get the current user from Clerk authentication context
 * This function should be used in all Convex functions that need user data
 */
export async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // Get user from database using Clerk ID
  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
    .first();

  if (!user) {
    throw new Error("User not found in database");
  }

  return user;
}

/**
 * Get the current user's Clerk ID from authentication context
 */
export async function getCurrentUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(ctx: any): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return user.role === "admin";
}

/**
 * Require admin role for the current user
 * Throws an error if the user is not an admin
 */
export async function requireAdmin(ctx: any) {
  const isAdmin = await isCurrentUserAdmin(ctx);
  if (!isAdmin) {
    throw new Error("Admin access required");
  }
}

/**
 * Get user by Clerk ID (for internal use)
 */
export async function getUserByClerkId(ctx: any, clerkId: string) {
  return await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("clerkId"), clerkId))
    .first();
}

/**
 * Create or update user in database from Clerk data
 * This should be called when a user signs up or their data changes
 */
export async function upsertUser(ctx: any, clerkUser: {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}) {
  const existingUser = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("clerkId"), clerkUser.clerkId))
    .first();

  if (existingUser) {
    // Update existing user
    return await ctx.db.patch(existingUser._id, {
      email: clerkUser.email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    });
  } else {
    // Create new user
    return await ctx.db.insert("users", {
      ...clerkUser,
      createdAt: Date.now(),
      role: "user" as const,
    });
  }
} 