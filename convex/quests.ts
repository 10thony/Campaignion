import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

export const getQuests = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    try {
      // Ensure user is authenticated
      await getCurrentUser(ctx);
      
      if (args.campaignId) {
        return await ctx.db
          .query("quests")
          .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
          .collect();
      }
      return await ctx.db.query("quests").collect();
    } catch (error) {
      // Return empty array if not authenticated
      return [];
    }
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
    try {
      // Ensure user is authenticated
      await getCurrentUser(ctx);
      
      return await ctx.db
        .query("quests")
        .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
        .collect();
    } catch (error) {
      // Return empty array if not authenticated
      return [];
    }
  },
});

export const getMyQuests = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      
      return await ctx.db
        .query("quests")
        .filter((q) => q.eq(q.field("creatorId"), user._id))
        .collect();
    } catch (error) {
      // Return empty array if not authenticated
      return [];
    }
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
    // Enhanced quest properties
    questType: v.optional(v.union(
      v.literal("Main"),
      v.literal("Side"),
      v.literal("Personal"),
      v.literal("Guild"),
      v.literal("Faction")
    )),
    difficulty: v.optional(v.union(
      v.literal("Easy"),
      v.literal("Medium"),
      v.literal("Hard"),
      v.literal("Deadly")
    )),
    estimatedSessions: v.optional(v.number()),
    timelineEventId: v.optional(v.id("timelineEvents")),
    involvedCharacterIds: v.optional(v.array(v.id("characters"))),
    requiredLevel: v.optional(v.number()),
    dmNotes: v.optional(v.string()),
    playerNotes: v.optional(v.array(v.string())),
    isRepeatable: v.optional(v.boolean()),
    prerequisiteQuestIds: v.optional(v.array(v.id("quests"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // If quest is assigned to a campaign, check permissions
    if (args.campaignId) {
      const campaign = await ctx.db.get(args.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
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
    const user = await getCurrentUser(ctx);

    const quest = await ctx.db.get(args.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    // Check permissions - quest creator, campaign DM, or admin
    let canCreate = quest.creatorId === user._id || user.role === "admin";

    if (quest.campaignId && !canCreate) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (campaign && campaign.dmId === user.clerkId) {
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
    const user = await getCurrentUser(ctx);

    const quest = await ctx.db.get(args.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    // Check permissions
    let canUpdate = quest.creatorId === user._id || user.role === "admin";

    if (quest.campaignId && !canUpdate) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (campaign && campaign.dmId === user.clerkId) {
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
    const user = await getCurrentUser(ctx);

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const quest = await ctx.db.get(task.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    // Check permissions
    let canUpdate = quest.creatorId === user._id || user.role === "admin";

    if (quest.campaignId && !canUpdate) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (campaign && campaign.dmId === user.clerkId) {
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

export const updateQuest = mutation({
  args: {
    id: v.id("quests"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    campaignId: v.optional(v.id("campaigns")),
    status: v.optional(v.union(
      v.literal("idle"),
      v.literal("in_progress"), 
      v.literal("completed"),
      v.literal("NotStarted"),
      v.literal("InProgress"),
      v.literal("Failed")
    )),
    locationId: v.optional(v.id("locations")),
    completionXP: v.optional(v.number()),
    rewards: v.optional(v.object({
      xp: v.optional(v.number()),
      gold: v.optional(v.number()),
      itemIds: v.optional(v.array(v.id("items"))),
    })),
    // Enhanced quest properties
    questType: v.optional(v.union(
      v.literal("Main"),
      v.literal("Side"),
      v.literal("Personal"),
      v.literal("Guild"),
      v.literal("Faction")
    )),
    difficulty: v.optional(v.union(
      v.literal("Easy"),
      v.literal("Medium"),
      v.literal("Hard"),
      v.literal("Deadly")
    )),
    estimatedSessions: v.optional(v.number()),
    timelineEventId: v.optional(v.id("timelineEvents")),
    involvedCharacterIds: v.optional(v.array(v.id("characters"))),
    requiredLevel: v.optional(v.number()),
    dmNotes: v.optional(v.string()),
    playerNotes: v.optional(v.array(v.string())),
    isRepeatable: v.optional(v.boolean()),
    prerequisiteQuestIds: v.optional(v.array(v.id("quests"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;

    // Get existing quest
    const existingQuest = await ctx.db.get(id);
    if (!existingQuest) {
      throw new Error("Quest not found");
    }

    // Check campaign permissions if quest is assigned to a campaign
    if (existingQuest.campaignId || args.campaignId) {
      const campaignId = args.campaignId || existingQuest.campaignId;
      if (campaignId) {
        const campaign = await ctx.db.get(campaignId);
        if (!campaign) {
          throw new Error("Campaign not found");
        }

        const isDM = campaign.dmId === user.clerkId;
        const isAdmin = user.role === "admin";
        const isOwner = existingQuest.creatorId === user._id;

        if (!isDM && !isAdmin && !isOwner) {
          throw new Error("Insufficient permissions to update this quest");
        }
      }
    } else {
      // For non-campaign quests, only owner or admin can edit
      const isAdmin = user.role === "admin";
      const isOwner = existingQuest.creatorId === user._id;

      if (!isAdmin && !isOwner) {
        throw new Error("Insufficient permissions to update this quest");
      }
    }

    // Filter out undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdateData,
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const deleteQuest = mutation({
  args: { questId: v.id("quests") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const quest = await ctx.db.get(args.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    // Check permissions
    let canDelete = quest.creatorId === user._id || user.role === "admin";

    if (quest.campaignId && !canDelete) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (campaign && campaign.dmId === user.clerkId) {
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