/**
 * Live Chat System for Convex
 * Handles real-time multi-channel chat for D&D sessions
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./clerkService";

// Helper function to generate chat message IDs
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to check if user can send to specified recipients
function canSendToRecipients(senderId: string, recipients: string[], roomParticipants: any[], dmUserId: string): boolean {
  // DM can send to anyone
  if (senderId === dmUserId) {
    return true;
  }

  // Regular users can only send to themselves and DM
  const allowedRecipients = [senderId, dmUserId];
  return recipients.every(recipient => allowedRecipients.includes(recipient));
}

// Helper function to validate message content
function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }

  if (content.length > 1000) {
    return { valid: false, error: "Message too long (max 1000 characters)" };
  }

  // Basic profanity filter (simplified - would use more sophisticated filtering in production)
  const profanityWords = ["badword1", "badword2"]; // Placeholder
  const containsProfanity = profanityWords.some(word => 
    content.toLowerCase().includes(word.toLowerCase())
  );

  if (containsProfanity) {
    return { valid: false, error: "Message contains inappropriate content" };
  }

  return { valid: true };
}

/**
 * Send a chat message
 */
export const sendChatMessage = mutation({
  args: {
    interactionId: v.id("interactions"),
    content: v.string(),
    type: v.union(
      v.literal("party"),
      v.literal("dm"),
      v.literal("private"),
      v.literal("system"),
      v.literal("dice"),
      v.literal("action")
    ),
    recipients: v.optional(v.array(v.string())),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.object({
      diceRoll: v.optional(v.object({
        dice: v.string(),
        result: v.number(),
        breakdown: v.string()
      })),
      actionType: v.optional(v.string()),
      targetEntityId: v.optional(v.string()),
      damage: v.optional(v.object({
        amount: v.number(),
        type: v.string()
      }))
    }))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Validate message content
    const validation = validateMessageContent(args.content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Check if user is participant
    const isParticipant = liveRoom.participants.some(p => p.userId === user._id);
    const isDM = liveRoom.dmUserId === user._id;

    if (!isParticipant && !isDM) {
      throw new Error("Not a participant in this room");
    }

    // Validate recipients for private messages
    if (args.type === "private" && args.recipients) {
      if (!canSendToRecipients(user._id, args.recipients, liveRoom.participants, liveRoom.dmUserId)) {
        throw new Error("Cannot send private message to specified recipients");
      }
    }

    // Determine visibility
    let isVisible = true;
    if (args.type === "dm" && !isDM) {
      // Non-DM users can't send DM messages
      throw new Error("Only DM can send DM messages");
    }

    const now = Date.now();
    const messageId = generateMessageId();

    // Create chat message
    const chatMessageId = await ctx.db.insert("liveChatMessages", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      userId: user._id,
      entityId: args.entityId,
      content: args.content,
      type: args.type,
      recipients: args.recipients,
      timestamp: now,
      metadata: args.metadata,
      isVisible
    });

    // Update room's last activity
    await ctx.db.patch(liveRoom._id, {
      lastActivity: now
    });

    // Add to game state chat log for quick access
    const updatedChatLog = [
      ...liveRoom.gameState.chatLog.slice(-49), // Keep last 49 messages
      {
        id: messageId,
        timestamp: now,
        userId: user._id,
        content: args.content,
        type: args.type
      }
    ];

    const updatedGameState = {
      ...liveRoom.gameState,
      chatLog: updatedChatLog
    };

    await ctx.db.patch(liveRoom._id, {
      gameState: updatedGameState
    });

    // Log chat event
    if (args.type !== "system") {
      await ctx.db.insert("liveGameEvents", {
        interactionId: args.interactionId,
        roomId: liveRoom.roomId,
        eventType: "CHAT_MESSAGE",
        eventData: {
          messageId,
          userId: user._id,
          type: args.type,
          hasMetadata: !!args.metadata,
          recipientCount: args.recipients?.length || 0
        },
        timestamp: now,
        userId: user._id,
        entityId: args.entityId,
        isSystemEvent: false,
        severity: "info"
      });
    }

    // Get user info for response
    const participant = liveRoom.participants.find(p => p.userId === user._id);
    
    return {
      success: true,
      message: {
        id: chatMessageId,
        messageId,
        content: args.content,
        type: args.type,
        timestamp: now,
        userId: user._id,
        entityId: args.entityId,
        metadata: args.metadata,
        senderName: participant?.characterData?.name || "Unknown"
      }
    };
  },
});

/**
 * Get chat history
 */
export const getChatHistory = query({
  args: {
    interactionId: v.id("interactions"),
    channelType: v.optional(v.union(
      v.literal("party"),
      v.literal("dm"),
      v.literal("private"),
      v.literal("system"),
      v.literal("dice"),
      v.literal("action")
    )),
    limit: v.optional(v.number()),
    before: v.optional(v.number()) // timestamp for pagination
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Check if user is participant
    const isParticipant = liveRoom.participants.some(p => p.userId === user._id);
    const isDM = liveRoom.dmUserId === user._id;

    if (!isParticipant && !isDM) {
      throw new Error("Not a participant in this room");
    }

    // Build query
    let query = ctx.db
      .query("liveChatMessages")
      .withIndex("by_room", q => q.eq("roomId", liveRoom.roomId));

    // Filter by channel type if specified
    if (args.channelType) {
      query = query.filter(q => q.eq(q.field("type"), args.channelType));
    }

    // Filter by timestamp if pagination is needed
    if (args.before) {
      query = query.filter(q => q.lt(q.field("timestamp"), args.before));
    }

    // Get messages (ordered by timestamp desc for pagination)
    const messages = await query
      .order("desc")
      .take(args.limit || 50);

    // Filter messages based on user permissions
    const filteredMessages = messages.filter(message => {
      // System messages are visible to all
      if (message.type === "system") {
        return true;
      }

      // DM messages are only visible to DM
      if (message.type === "dm") {
        return isDM;
      }

      // Private messages are only visible to sender, recipients, and DM
      if (message.type === "private") {
        if (isDM || message.userId === user._id) {
          return true;
        }
        return message.recipients?.includes(user._id) || false;
      }

      // Party messages are visible to all participants
      if (message.type === "party") {
        return message.isVisible;
      }

      // Dice and action messages are visible to all
      return message.isVisible;
    });

    // Reverse to get chronological order
    filteredMessages.reverse();

    // Enrich messages with sender information
    const enrichedMessages = await Promise.all(
      filteredMessages.map(async (message) => {
        const sender = liveRoom.participants.find(p => p.userId === message.userId);
        return {
          ...message,
          senderName: sender?.characterData?.name || "Unknown",
          senderEntityType: sender?.entityType || "unknown"
        };
      })
    );

    return {
      success: true,
      messages: enrichedMessages,
      totalCount: filteredMessages.length,
      hasMore: filteredMessages.length === (args.limit || 50)
    };
  },
});

/**
 * Subscribe to chat updates (real-time)
 */
export const subscribeChatUpdates = query({
  args: {
    interactionId: v.id("interactions"),
    since: v.optional(v.number()) // timestamp to get messages since
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      return null;
    }

    // Check if user is participant
    const isParticipant = liveRoom.participants.some(p => p.userId === user._id);
    const isDM = liveRoom.dmUserId === user._id;

    if (!isParticipant && !isDM) {
      return null;
    }

    // Get recent messages
    let query = ctx.db
      .query("liveChatMessages")
      .withIndex("by_room", q => q.eq("roomId", liveRoom.roomId));

    if (args.since) {
      query = query.filter(q => q.gt(q.field("timestamp"), args.since));
    }

    const recentMessages = await query
      .order("desc")
      .take(20);

    // Filter and enrich messages
    const filteredMessages = recentMessages
      .filter(message => {
        if (message.type === "system") return true;
        if (message.type === "dm") return isDM;
        if (message.type === "private") {
          return isDM || message.userId === user._id || message.recipients?.includes(user._id);
        }
        return message.isVisible;
      })
      .reverse();

    const enrichedMessages = await Promise.all(
      filteredMessages.map(async (message) => {
        const sender = liveRoom.participants.find(p => p.userId === message.userId);
        return {
          ...message,
          senderName: sender?.characterData?.name || "Unknown",
          senderEntityType: sender?.entityType || "unknown"
        };
      })
    );

    return {
      roomId: liveRoom.roomId,
      messages: enrichedMessages,
      participantCount: liveRoom.participants.filter(p => p.isConnected).length,
      lastActivity: liveRoom.lastActivity
    };
  },
});

/**
 * Send a dice roll message
 */
export const sendDiceRoll = mutation({
  args: {
    interactionId: v.id("interactions"),
    diceNotation: v.string(), // e.g., "1d20+5"
    rollType: v.optional(v.string()), // e.g., "Attack Roll", "Damage", "Saving Throw"
    isPrivate: v.optional(v.boolean()) // Only visible to DM and player
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Validate dice notation
    const dicePattern = /^\d+d\d+(?:[+-]\d+)?$/i;
    if (!dicePattern.test(args.diceNotation)) {
      throw new Error("Invalid dice notation");
    }

    // Roll the dice
    const rollResult = rollDice(args.diceNotation);
    
    const rollMessage = args.rollType 
      ? `${args.rollType}: ${args.diceNotation}`
      : `Rolling ${args.diceNotation}`;

    const resultMessage = `${rollMessage}\nResult: ${rollResult.breakdown}`;

    // Send as dice message
    return await ctx.runMutation("liveChatSystem:sendChatMessage", {
      interactionId: args.interactionId,
      content: resultMessage,
      type: args.isPrivate ? "private" : "dice",
      recipients: args.isPrivate ? [user._id] : undefined,
      metadata: {
        diceRoll: {
          dice: args.diceNotation,
          result: rollResult.result,
          breakdown: rollResult.breakdown
        }
      }
    });
  },
});

/**
 * Send system message (DM only)
 */
export const sendSystemMessage = mutation({
  args: {
    interactionId: v.id("interactions"),
    content: v.string(),
    severity: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("error")))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Only DM can send system messages
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only DM can send system messages");
    }

    return await ctx.runMutation("liveChatSystem:sendChatMessage", {
      interactionId: args.interactionId,
      content: args.content,
      type: "system"
    });
  },
});

/**
 * Edit a chat message (sender only, within 5 minutes)
 */
export const editChatMessage = mutation({
  args: {
    messageId: v.id("liveChatMessages"),
    newContent: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only sender can edit
    if (message.userId !== user._id) {
      throw new Error("Can only edit your own messages");
    }

    // Can only edit within 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    if (message.timestamp < fiveMinutesAgo) {
      throw new Error("Can only edit messages within 5 minutes");
    }

    // Validate new content
    const validation = validateMessageContent(args.newContent);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    await ctx.db.patch(args.messageId, {
      content: args.newContent,
      editedAt: Date.now()
    });

    return {
      success: true,
      message: "Message edited successfully"
    };
  },
});

// Helper function for dice rolling (reused from turn manager)
function rollDice(diceString: string): { result: number; breakdown: string } {
  const match = diceString.match(/(\d+)d(\d+)(?:([+-])(\d+))?/i);
  if (!match) {
    throw new Error(`Invalid dice notation: ${diceString}`);
  }

  const [, numDice, sides, operator, modifier] = match;
  const rolls = [];
  let total = 0;

  for (let i = 0; i < parseInt(numDice); i++) {
    const roll = Math.floor(Math.random() * parseInt(sides)) + 1;
    rolls.push(roll);
    total += roll;
  }

  if (modifier) {
    const mod = parseInt(modifier);
    if (operator === '+') {
      total += mod;
      return {
        result: total,
        breakdown: `[${rolls.join(', ')}] + ${mod} = ${total}`
      };
    } else if (operator === '-') {
      total -= mod;
      return {
        result: total,
        breakdown: `[${rolls.join(', ')}] - ${mod} = ${total}`
      };
    }
  }

  return {
    result: total,
    breakdown: `[${rolls.join(', ')}] = ${total}`
  };
}