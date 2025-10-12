import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

// Queries
export const getQuestTasks = query({
  args: { questId: v.id("quests") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("questTasks")
      .filter((q) => q.eq(q.field("questId"), args.questId))
      .collect();
  },
});

export const getQuestTaskById = query({
  args: { taskId: v.id("questTasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const getMyQuestTasks = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      
      return await ctx.db
        .query("questTasks")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
    } catch (error) {
      return [];
    }
  },
});

// Mutations
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
    status: v.optional(v.union(
      v.literal("NotStarted"),
      v.literal("InProgress"),
      v.literal("Completed"),
      v.literal("Failed")
    )),
    dependsOn: v.optional(v.array(v.id("questTasks"))),
    assignedTo: v.optional(v.array(v.id("characters"))),
    locationId: v.optional(v.id("locations")),
    targetNpcId: v.optional(v.id("characters")),
    requiredItemIds: v.optional(v.array(v.id("items"))),
    completionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get the parent quest to check permissions
    const quest = await ctx.db.get(args.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    // Check campaign permissions if quest is assigned to a campaign
    if (quest.campaignId) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
      const isAdmin = user.role === "admin";
      const isQuestOwner = quest.creatorId === user._id;

      if (!isDM && !isAdmin && !isQuestOwner) {
        throw new Error("Only DMs, admins, and quest creators can create quest tasks");
      }
    } else {
      // For non-campaign quests, only owner or admin can create tasks
      const isAdmin = user.role === "admin";
      const isQuestOwner = quest.creatorId === user._id;

      if (!isAdmin && !isQuestOwner) {
        throw new Error("Only admins and quest creators can create quest tasks");
      }
    }

    // Validate dependencies to prevent cycles
    if (args.dependsOn && args.dependsOn.length > 0) {
      for (const depId of args.dependsOn) {
        const depTask = await ctx.db.get(depId);
        if (!depTask) {
          throw new Error(`Dependency task ${depId} not found`);
        }
        if (depTask.questId !== args.questId) {
          throw new Error("Task dependencies must be within the same quest");
        }
      }
    }

    const taskId = await ctx.db.insert("questTasks", {
      questId: args.questId,
      title: args.title,
      description: args.description,
      type: args.type,
      status: args.status || "NotStarted",
      dependsOn: args.dependsOn,
      assignedTo: args.assignedTo,
      locationId: args.locationId,
      targetNpcId: args.targetNpcId,
      requiredItemIds: args.requiredItemIds,
      interactions: [],
      completionNotes: args.completionNotes,
      userId: user._id,
      createdAt: Date.now(),
    });

    // Update the parent quest's taskIds array
    const currentTaskIds = quest.taskIds || [];
    await ctx.db.patch(args.questId, {
      taskIds: [...currentTaskIds, taskId],
      updatedAt: Date.now(),
    });

    return taskId;
  },
});

export const updateQuestTask = mutation({
  args: {
    id: v.id("questTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("Fetch"),
      v.literal("Kill"),
      v.literal("Speak"),
      v.literal("Explore"),
      v.literal("Puzzle"),
      v.literal("Deliver"),
      v.literal("Escort"),
      v.literal("Custom")
    )),
    status: v.optional(v.union(
      v.literal("NotStarted"),
      v.literal("InProgress"),
      v.literal("Completed"),
      v.literal("Failed")
    )),
    dependsOn: v.optional(v.array(v.id("questTasks"))),
    assignedTo: v.optional(v.array(v.id("characters"))),
    locationId: v.optional(v.id("locations")),
    targetNpcId: v.optional(v.id("characters")),
    requiredItemIds: v.optional(v.array(v.id("items"))),
    completionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;

    // Get existing task
    const existingTask = await ctx.db.get(id);
    if (!existingTask) {
      throw new Error("Quest task not found");
    }

    // Get the parent quest to check permissions
    const quest = await ctx.db.get(existingTask.questId);
    if (!quest) {
      throw new Error("Parent quest not found");
    }

    // Check campaign permissions if quest is assigned to a campaign
    if (quest.campaignId) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
      const isAdmin = user.role === "admin";
      const isQuestOwner = quest.creatorId === user._id;
      const isTaskOwner = existingTask.userId === user._id;

      if (!isDM && !isAdmin && !isQuestOwner && !isTaskOwner) {
        throw new Error("Insufficient permissions to update this quest task");
      }
    } else {
      // For non-campaign quests, only owner or admin can update tasks
      const isAdmin = user.role === "admin";
      const isQuestOwner = quest.creatorId === user._id;
      const isTaskOwner = existingTask.userId === user._id;

      if (!isAdmin && !isQuestOwner && !isTaskOwner) {
        throw new Error("Insufficient permissions to update this quest task");
      }
    }

    // Validate dependencies to prevent cycles
    if (args.dependsOn && args.dependsOn.length > 0) {
      for (const depId of args.dependsOn) {
        if (depId === id) {
          throw new Error("Task cannot depend on itself");
        }
        
        const depTask = await ctx.db.get(depId);
        if (!depTask) {
          throw new Error(`Dependency task ${depId} not found`);
        }
        if (depTask.questId !== existingTask.questId) {
          throw new Error("Task dependencies must be within the same quest");
        }
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

export const deleteQuestTask = mutation({
  args: { id: v.id("questTasks") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get existing task
    const existingTask = await ctx.db.get(args.id);
    if (!existingTask) {
      throw new Error("Quest task not found");
    }

    // Get the parent quest to check permissions
    const quest = await ctx.db.get(existingTask.questId);
    if (!quest) {
      throw new Error("Parent quest not found");
    }

    // Check campaign permissions if quest is assigned to a campaign
    if (quest.campaignId) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
      const isAdmin = user.role === "admin";
      const isQuestOwner = quest.creatorId === user._id;
      const isTaskOwner = existingTask.userId === user._id;

      if (!isDM && !isAdmin && !isQuestOwner && !isTaskOwner) {
        throw new Error("Insufficient permissions to delete this quest task");
      }
    } else {
      // For non-campaign quests, only owner or admin can delete tasks
      const isAdmin = user.role === "admin";
      const isQuestOwner = quest.creatorId === user._id;
      const isTaskOwner = existingTask.userId === user._id;

      if (!isAdmin && !isQuestOwner && !isTaskOwner) {
        throw new Error("Insufficient permissions to delete this quest task");
      }
    }

    // Remove dependencies on this task from other tasks
    const dependentTasks = await ctx.db
      .query("questTasks")
      .filter((q) => q.eq(q.field("questId"), existingTask.questId))
      .collect();

    for (const task of dependentTasks) {
      if (task.dependsOn && task.dependsOn.includes(args.id)) {
        const newDependencies = task.dependsOn.filter(depId => depId !== args.id);
        await ctx.db.patch(task._id, {
          dependsOn: newDependencies,
          updatedAt: Date.now(),
        });
      }
    }

    // Remove task from parent quest's taskIds array
    const currentTaskIds = quest.taskIds || [];
    const filteredTaskIds = currentTaskIds.filter(taskId => taskId !== args.id);
    await ctx.db.patch(existingTask.questId, {
      taskIds: filteredTaskIds,
      updatedAt: Date.now(),
    });

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const completeQuestTask = mutation({
  args: {
    id: v.id("questTasks"),
    completionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get existing task
    const existingTask = await ctx.db.get(args.id);
    if (!existingTask) {
      throw new Error("Quest task not found");
    }

    // Get the parent quest to check permissions
    const quest = await ctx.db.get(existingTask.questId);
    if (!quest) {
      throw new Error("Parent quest not found");
    }

    // Check campaign permissions if quest is assigned to a campaign
    if (quest.campaignId) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
      const isAdmin = user.role === "admin";
      const isQuestOwner = quest.creatorId === user._id;
      const isTaskOwner = existingTask.userId === user._id;

      if (!isDM && !isAdmin && !isQuestOwner && !isTaskOwner) {
        throw new Error("Insufficient permissions to complete this quest task");
      }
    }

    // Check if all dependencies are completed
    if (existingTask.dependsOn && existingTask.dependsOn.length > 0) {
      for (const depId of existingTask.dependsOn) {
        const depTask = await ctx.db.get(depId);
        if (!depTask || depTask.status !== "Completed") {
          throw new Error("Cannot complete task: dependency tasks are not completed");
        }
      }
    }

    await ctx.db.patch(args.id, {
      status: "Completed",
      completionNotes: args.completionNotes,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const resetQuestTask = mutation({
  args: { id: v.id("questTasks") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get existing task
    const existingTask = await ctx.db.get(args.id);
    if (!existingTask) {
      throw new Error("Quest task not found");
    }

    // Get the parent quest to check permissions
    const quest = await ctx.db.get(existingTask.questId);
    if (!quest) {
      throw new Error("Parent quest not found");
    }

    // Check campaign permissions if quest is assigned to a campaign
    if (quest.campaignId) {
      const campaign = await ctx.db.get(quest.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
      const isAdmin = user.role === "admin";

      if (!isDM && !isAdmin) {
        throw new Error("Only DMs and admins can reset quest tasks");
      }
    }

    await ctx.db.patch(args.id, {
      status: "NotStarted",
      completionNotes: undefined,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});