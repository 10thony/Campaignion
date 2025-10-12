import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser as getCurrentUserFromClerk, upsertUser as upsertUserFromClerk } from "./clerkService";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
      role: "user" as const,
    });

    return userId;
  },
});

export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      return await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
      });
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        ...args,
        createdAt: Date.now(),
        role: "user" as const,
      });
    }
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await getCurrentUserFromClerk(ctx);
    } catch (error) {
      // Log the error for debugging
      console.error('getCurrentUser error:', error);
      
      // Return null if user is not authenticated or not found
      // This allows the frontend to handle the error gracefully
      return null;
    }
  },
});

// Function to check if current user should be admin and upgrade if needed
export const ensureAdminRole = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUserFromClerk(ctx);
      
      // Check if this is the first user (app creator) and make them admin
      const allUsers = await ctx.db.query("users").collect();
      
      if (allUsers.length === 1 && user.role === "user") {
        // This is the first user, make them admin
        await ctx.db.patch(user._id, {
          role: "admin" as const,
        });
        
        return await ctx.db.get(user._id);
      }
      
      return user;
    } catch (error) {
      console.error('ensureAdminRole error:', error);
      return null;
    }
  },
});



