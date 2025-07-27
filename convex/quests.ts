import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getQuests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("quests").collect();
  },
});

export const getQuestById = query({
  args: { questId: v.id("quests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questId);
  },
});

export const getQuestsByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quests")
      .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
      .collect();
  },
});

export const getMyQuests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("quests")
      .filter((q) => q.eq(q.field("creatorId"), user._id))
      .collect();
  },
});

export const getQuestTasks = query({
  args: { questId: v.id("quests") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("questTasks")
      .filter((q) => q.eq(q.field("questId"), args.questId))
      .collect();
  },
});

export const createQuest = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    campaignId: v.optional(v.id("campaigns")),
    status: v.union(
      v.literal("idle"),
      v.literal("in_progress"), 
      v.literal("completed"),
      v.literal("NotStarted"),
      v.literal("InProgress"),
      v.literal("Failed")
    ),
    locationId: v.optional(v.id("locations")),
    completionXP: v.optional(v.number()),
    rewards: v.optional(v.object({
      xp: v.optional(v.number()),
      gold: v.optional(v.number()),
      itemIds: v.optional(v.array(v.id("items"))),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // If quest is assigned to a campaign, check permissions
    if (args.campaignId) {
      const campaign = await ctx.db.get(args.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === identity.subject;
      const isAdmin = user.role === "admin";

      if (!isDM && !isAdmin) {
        throw new Error("Only DMs and admins can create campaign quests");
      }
    }

    const questId = await ctx.db.insert("quests", {
      ...args,
      taskIds: [], // Empty tasks initially
      creatorId: user._id,
      createdAt: Date.now(),
    });

    return questId;
  },
});

export const createQuestTask = mutation({
  args: {
    questId: v.id("quests"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("Fetch"),
      v.literal("Kill"),
      v.literal("Speak"),
      v.literal("Explore"),
      v.literal("Puzzle"),
      v.literal("Deliver"),
      v.literal("Escort"),
      v.literal("Custom")
    ),
    status: v.union(
      v.literal("NotStarted"),
      v.literal("InProgress"),
      v.literal("Completed"),
      v.literal("Failed")
    ),
    dependsOn: v.optional(v.array(v.id("questTasks"))),
    assignedTo: v.optional(v.array(v.id("playerCharacters"))),
    locationId: v.optional(v.id("locations")),
    targetNpcId: v.optional(v.id("npcs")),
    requiredItemIds: v.optional(v.array(v.id("items"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const quest = await ctx.db.get(args.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    // Check permissions - quest creator, campaign DM, or admin
    let canCreate = quest.creatorId === user._id || user.role === "admin";

    if (quest.campaignId && !canCreate) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (campaign && campaign.dmId === identity.subject) {
        canCreate = true;
      }
    }

    if (!canCreate) {
      throw new Error("You don't have permission to create tasks for this quest");
    }

    // Validate dependencies exist and are valid
    if (args.dependsOn) {
      for (const depId of args.dependsOn) {
        const depTask = await ctx.db.get(depId);
        if (!depTask || depTask.questId !== args.questId) {
          throw new Error("Invalid task dependency");
        }
      }
    }

    const taskId = await ctx.db.insert("questTasks", {
      ...args,
      status: args.status || "NotStarted",
      userId: user._id,
      createdAt: Date.now(),
    });

    // Update quest with new task
    const currentTaskIds = quest.taskIds || [];
    await ctx.db.patch(args.questId, {
      taskIds: [...currentTaskIds, taskId],
      updatedAt: Date.now(),
    });

    return taskId;
  },
});

export const updateQuestStatus = mutation({
  args: {
    questId: v.id("quests"),
    status: v.union(
      v.literal("idle"),
      v.literal("in_progress"), 
      v.literal("completed"),
      v.literal("NotStarted"),
      v.literal("InProgress"),
      v.literal("Failed")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const quest = await ctx.db.get(args.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check permissions
    let canUpdate = quest.creatorId === user._id || user.role === "admin";

    if (quest.campaignId && !canUpdate) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (campaign && campaign.dmId === identity.subject) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      throw new Error("You don't have permission to update this quest");
    }

    await ctx.db.patch(args.questId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    // If quest is completed, award XP if specified
    if (args.status === "completed" && quest.rewards?.xp) {
      // TODO: Award XP to assigned characters
      // This would require additional logic to find assigned characters
    }
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("questTasks"),
    status: v.union(
      v.literal("NotStarted"),
      v.literal("InProgress"),
      v.literal("Completed"),
      v.literal("Failed")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const quest = await ctx.db.get(task.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check permissions
    let canUpdate = quest.creatorId === user._id || user.role === "admin";

    if (quest.campaignId && !canUpdate) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (campaign && campaign.dmId === identity.subject) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      throw new Error("You don't have permission to update this task");
    }

    // Check dependencies are completed before allowing task to be completed
    if (args.status === "Completed" && task.dependsOn) {
      for (const depId of task.dependsOn) {
        const depTask = await ctx.db.get(depId);
        if (!depTask || depTask.status !== "Completed") {
          throw new Error("Cannot complete task: dependencies not finished");
        }
      }
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    // Check if all tasks are completed to auto-complete quest
    if (args.status === "Completed") {
      const allTasks = await ctx.db
        .query("questTasks")
        .filter((q) => q.eq(q.field("questId"), task.questId))
        .collect();

      const allCompleted = allTasks.every(t => t.status === "Completed");
      if (allCompleted && quest.status !== "completed") {
        await ctx.db.patch(task.questId, {
          status: "completed" as const,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const deleteQuest = mutation({
  args: { questId: v.id("quests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const quest = await ctx.db.get(args.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check permissions
    let canDelete = quest.creatorId === user._id || user.role === "admin";

    if (quest.campaignId && !canDelete) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (campaign && campaign.dmId === identity.subject) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      throw new Error("You don't have permission to delete this quest");
    }

    // Delete all associated tasks first
    const tasks = await ctx.db
      .query("questTasks")
      .filter((q) => q.eq(q.field("questId"), args.questId))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete the quest
    await ctx.db.delete(args.questId);
  },
}); 