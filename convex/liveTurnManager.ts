/**
 * Live Turn Manager for Convex
 * Handles D&D 5e turn-based combat and action resolution
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./clerkService";

// D&D 5e dice rolling utilities
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function rollDice(diceString: string): { result: number; breakdown: string } {
  // Parse dice notation like "1d20+5" or "2d6"
  const match = diceString.match(/(\d+)d(\d+)(?:([+-])(\d+))?/i);
  if (!match) {
    throw new Error(`Invalid dice notation: ${diceString}`);
  }

  const [, numDice, sides, operator, modifier] = match;
  const rolls = [];
  let total = 0;

  for (let i = 0; i < parseInt(numDice); i++) {
    const roll = rollDie(parseInt(sides));
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

/**
 * Roll initiative for all participants in a room
 */
export const rollInitiative = mutation({
  args: {
    interactionId: v.id("interactions"),
    participants: v.array(v.object({
      entityId: v.string(),
      entityType: v.union(v.literal("playerCharacter"), v.literal("npc"), v.literal("monster")),
      dexterityModifier: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Verify user is DM
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only the DM can roll initiative");
    }

    // Roll initiative for each participant
    const initiativeOrder = args.participants.map(participant => {
      const roll = rollDie(20);
      return {
        entityId: participant.entityId,
        entityType: participant.entityType,
        initiativeRoll: roll + participant.dexterityModifier,
        dexterityModifier: participant.dexterityModifier,
        rawRoll: roll
      };
    }).sort((a, b) => {
      // Sort by initiative (descending), then by dex modifier (descending)
      if (b.initiativeRoll !== a.initiativeRoll) {
        return b.initiativeRoll - a.initiativeRoll;
      }
      return b.dexterityModifier - a.dexterityModifier;
    });

    // Update game state
    const updatedGameState = {
      ...liveRoom.gameState,
      status: "active" as const,
      initiativeOrder: initiativeOrder.map(({ rawRoll, ...rest }) => rest),
      currentTurnIndex: 0,
      roundNumber: 1
    };

    const now = Date.now();

    await ctx.db.patch(liveRoom._id, {
      gameState: updatedGameState,
      status: "active",
      lastActivity: now
    });

    // Log initiative rolled event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "INITIATIVE_ROLLED",
      eventData: {
        initiativeOrder: initiativeOrder,
        dmUserId: user._id
      },
      timestamp: now,
      userId: user._id,
      isSystemEvent: true,
      severity: "info"
    });

    // Log combat started event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "COMBAT_STARTED",
      eventData: {
        roundNumber: 1,
        firstEntityId: initiativeOrder[0]?.entityId
      },
      timestamp: now,
      userId: user._id,
      isSystemEvent: true,
      severity: "info"
    });

    return {
      success: true,
      initiativeOrder,
      currentTurn: initiativeOrder[0] || null,
      roundNumber: 1
    };
  },
});

/**
 * Start a participant's turn
 */
export const startTurn = mutation({
  args: {
    interactionId: v.id("interactions"),
    entityId: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    const currentTurn = liveRoom.gameState.initiativeOrder[liveRoom.gameState.currentTurnIndex];
    if (!currentTurn || currentTurn.entityId !== args.entityId) {
      throw new Error("It's not this entity's turn");
    }

    const now = Date.now();
    const turnTimeout = liveRoom.settings?.turnTimeLimit ? now + (liveRoom.settings.turnTimeLimit * 1000) : undefined;

    await ctx.db.patch(liveRoom._id, {
      currentTurnTimeout: turnTimeout,
      lastActivity: now
    });

    // Log turn started event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "TURN_STARTED",
      eventData: {
        entityId: args.entityId,
        turnIndex: liveRoom.gameState.currentTurnIndex,
        roundNumber: liveRoom.gameState.roundNumber,
        timeout: turnTimeout
      },
      timestamp: now,
      entityId: args.entityId,
      isSystemEvent: true,
      severity: "info"
    });

    return {
      success: true,
      entityId: args.entityId,
      turnTimeout: turnTimeout,
      roundNumber: liveRoom.gameState.roundNumber
    };
  },
});

/**
 * Submit a turn action
 */
export const submitTurnAction = mutation({
  args: {
    interactionId: v.id("interactions"),
    actionType: v.union(
      v.literal("move"),
      v.literal("attack"),
      v.literal("useItem"),
      v.literal("cast"),
      v.literal("interact"),
      v.literal("end")
    ),
    actionData: v.object({
      target: v.optional(v.string()),
      position: v.optional(v.object({
        x: v.number(),
        y: v.number()
      })),
      itemId: v.optional(v.string()),
      spellId: v.optional(v.string()),
      parameters: v.optional(v.any())
    })
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    const currentTurn = liveRoom.gameState.initiativeOrder[liveRoom.gameState.currentTurnIndex];
    if (!currentTurn) {
      throw new Error("No active turn");
    }

    // Verify it's the current user's turn (or DM controlling NPCs/monsters)
    const isUsersTurn = liveRoom.participants.some(p => 
      p.userId === user._id && p.entityId === currentTurn.entityId
    );
    const isDMControllingNPC = user._id === liveRoom.dmUserId && 
      (currentTurn.entityType === "npc" || currentTurn.entityType === "monster");

    if (!isUsersTurn && !isDMControllingNPC) {
      throw new Error("Not your turn");
    }

    const now = Date.now();
    let actionResult = null;
    const diceRolls = [];

    // Process different action types
    switch (args.actionType) {
      case "attack":
        actionResult = await processAttackAction(ctx, args, liveRoom, currentTurn, diceRolls);
        break;
      case "move":
        actionResult = await processMoveAction(ctx, args, liveRoom, currentTurn);
        break;
      case "useItem":
        actionResult = await processItemAction(ctx, args, liveRoom, currentTurn);
        break;
      case "cast":
        actionResult = await processSpellAction(ctx, args, liveRoom, currentTurn, diceRolls);
        break;
      case "interact":
        actionResult = await processInteractAction(ctx, args, liveRoom, currentTurn);
        break;
      case "end":
        actionResult = { success: true, message: "Turn ended" };
        break;
      default:
        throw new Error("Invalid action type");
    }

    // Record the action
    await ctx.db.insert("liveTurnActions", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      turnNumber: liveRoom.gameState.roundNumber,
      entityId: currentTurn.entityId,
      entityType: currentTurn.entityType,
      actionType: args.actionType,
      actionData: args.actionData,
      result: actionResult,
      diceRolls,
      timestamp: now,
      processingTime: Date.now() - now
    });

    // Log action performed event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "ACTION_PERFORMED",
      eventData: {
        entityId: currentTurn.entityId,
        actionType: args.actionType,
        result: actionResult,
        target: args.actionData.target
      },
      timestamp: now,
      userId: user._id,
      entityId: currentTurn.entityId,
      isSystemEvent: false,
      severity: "info"
    });

    // Auto-advance turn if action was "end" or combat action is complete
    if (args.actionType === "end" || (actionResult && actionResult.success)) {
      await advanceTurn(ctx, args.interactionId, liveRoom);
    }

    return {
      success: true,
      result: actionResult,
      diceRolls,
      nextTurn: await getNextTurnInfo(liveRoom)
    };
  },
});

// Helper function to process attack actions
async function processAttackAction(ctx: any, args: any, liveRoom: any, attacker: any, diceRolls: any[]) {
  if (!args.actionData.target) {
    throw new Error("Attack requires a target");
  }

  // Get attacker stats
  const attackerState = await ctx.db
    .query("liveParticipantStates")
    .withIndex("by_entity", q => q.eq("entityId", attacker.entityId))
    .first();

  if (!attackerState) {
    throw new Error("Attacker state not found");
  }

  // Get target stats
  const targetState = await ctx.db
    .query("liveParticipantStates")
    .withIndex("by_entity", q => q.eq("entityId", args.actionData.target))
    .first();

  if (!targetState) {
    throw new Error("Target not found");
  }

  // Roll attack
  const attackRoll = rollDice("1d20+5"); // Simplified - would need to calculate actual attack bonus
  diceRolls.push({
    type: "attack",
    dice: "1d20+5",
    result: attackRoll.result,
    breakdown: attackRoll.breakdown
  });

  const hit = attackRoll.result >= targetState.armorClass;

  let damage = 0;
  let effects = [];

  if (hit) {
    // Roll damage
    const damageRoll = rollDice("1d8+3"); // Simplified - would need to calculate actual damage
    damage = damageRoll.result;
    
    diceRolls.push({
      type: "damage",
      dice: "1d8+3",
      result: damage,
      breakdown: damageRoll.breakdown
    });

    // Apply damage
    const newHP = Math.max(0, targetState.currentHP - damage);
    await ctx.db.patch(targetState._id, {
      currentHP: newHP,
      updatedAt: Date.now()
    });

    if (newHP <= 0) {
      effects.push("Target reduced to 0 HP");
    }

    // Log damage dealt event
    await ctx.db.insert("liveGameEvents", {
      interactionId: liveRoom.interactionId,
      roomId: liveRoom.roomId,
      eventType: "DAMAGE_DEALT",
      eventData: {
        attackerId: attacker.entityId,
        targetId: args.actionData.target,
        damage: damage,
        newHP: newHP
      },
      timestamp: Date.now(),
      entityId: attacker.entityId,
      isSystemEvent: false,
      severity: "info"
    });
  }

  return {
    success: hit,
    damage: hit ? damage : 0,
    effects,
    message: hit ? `Hit for ${damage} damage!` : "Attack missed!"
  };
}

// Helper function to process move actions
async function processMoveAction(ctx: any, args: any, liveRoom: any, mover: any) {
  if (!args.actionData.position) {
    throw new Error("Move requires a position");
  }

  // Get current position
  const participantState = await ctx.db
    .query("liveParticipantStates")
    .withIndex("by_entity", q => q.eq("entityId", mover.entityId))
    .first();

  if (!participantState) {
    throw new Error("Participant state not found");
  }

  // Update position (simplified - would need movement validation)
  await ctx.db.patch(participantState._id, {
    position: args.actionData.position,
    updatedAt: Date.now()
  });

  // Update map state
  const updatedGameState = {
    ...liveRoom.gameState,
    mapState: {
      ...liveRoom.gameState.mapState,
      entities: {
        ...liveRoom.gameState.mapState.entities,
        [mover.entityId]: args.actionData.position
      }
    }
  };

  await ctx.db.patch(liveRoom._id, {
    gameState: updatedGameState,
    lastActivity: Date.now()
  });

  return {
    success: true,
    message: `Moved to position (${args.actionData.position.x}, ${args.actionData.position.y})`
  };
}

// Helper function to process item usage
async function processItemAction(ctx: any, args: any, liveRoom: any, user: any) {
  // Simplified item usage - would need item lookup and effect application
  return {
    success: true,
    message: "Item used successfully"
  };
}

// Helper function to process spell casting
async function processSpellAction(ctx: any, args: any, liveRoom: any, caster: any, diceRolls: any[]) {
  // Simplified spell casting - would need spell lookup, slot consumption, and effect application
  if (args.actionData.spellId === "healingWord") {
    const healingRoll = rollDice("1d4+2");
    diceRolls.push({
      type: "healing",
      dice: "1d4+2",
      result: healingRoll.result,
      breakdown: healingRoll.breakdown
    });

    return {
      success: true,
      healing: healingRoll.result,
      message: `Healed for ${healingRoll.result} HP`
    };
  }

  return {
    success: true,
    message: "Spell cast successfully"
  };
}

// Helper function to process interaction
async function processInteractAction(ctx: any, args: any, liveRoom: any, user: any) {
  return {
    success: true,
    message: "Interaction completed"
  };
}

// Helper function to advance to the next turn
async function advanceTurn(ctx: any, interactionId: any, liveRoom: any) {
  const nextTurnIndex = (liveRoom.gameState.currentTurnIndex + 1) % liveRoom.gameState.initiativeOrder.length;
  const isNewRound = nextTurnIndex === 0;
  const newRoundNumber = isNewRound ? liveRoom.gameState.roundNumber + 1 : liveRoom.gameState.roundNumber;

  const updatedGameState = {
    ...liveRoom.gameState,
    currentTurnIndex: nextTurnIndex,
    roundNumber: newRoundNumber
  };

  await ctx.db.patch(liveRoom._id, {
    gameState: updatedGameState,
    currentTurnTimeout: undefined,
    lastActivity: Date.now()
  });

  // Log turn ended event
  await ctx.db.insert("liveGameEvents", {
    interactionId: interactionId,
    roomId: liveRoom.roomId,
    eventType: "TURN_ENDED",
    eventData: {
      entityId: liveRoom.gameState.initiativeOrder[liveRoom.gameState.currentTurnIndex]?.entityId,
      nextEntityId: liveRoom.gameState.initiativeOrder[nextTurnIndex]?.entityId,
      newRound: isNewRound,
      roundNumber: newRoundNumber
    },
    timestamp: Date.now(),
    isSystemEvent: true,
    severity: "info"
  });

  if (isNewRound) {
    // Log new round event
    await ctx.db.insert("liveGameEvents", {
      interactionId: interactionId,
      roomId: liveRoom.roomId,
      eventType: "ROUND_STARTED",
      eventData: {
        roundNumber: newRoundNumber
      },
      timestamp: Date.now(),
      isSystemEvent: true,
      severity: "info"
    });
  }
}

// Helper function to get next turn information
async function getNextTurnInfo(liveRoom: any) {
  const currentTurn = liveRoom.gameState.initiativeOrder[liveRoom.gameState.currentTurnIndex];
  return currentTurn ? {
    entityId: currentTurn.entityId,
    entityType: currentTurn.entityType,
    roundNumber: liveRoom.gameState.roundNumber
  } : null;
}

/**
 * Skip current turn
 */
export const skipTurn = mutation({
  args: {
    interactionId: v.id("interactions"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Only DM can skip turns
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only the DM can skip turns");
    }

    await advanceTurn(ctx, args.interactionId, liveRoom);

    return {
      success: true,
      message: "Turn skipped",
      reason: args.reason || "DM skipped turn",
      nextTurn: await getNextTurnInfo(liveRoom)
    };
  },
});

/**
 * End combat
 */
export const endCombat = mutation({
  args: {
    interactionId: v.id("interactions")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Only DM can end combat
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only the DM can end combat");
    }

    const updatedGameState = {
      ...liveRoom.gameState,
      status: "waiting" as const,
      initiativeOrder: [],
      currentTurnIndex: 0
    };

    await ctx.db.patch(liveRoom._id, {
      gameState: updatedGameState,
      currentTurnTimeout: undefined,
      lastActivity: Date.now()
    });

    // Log combat ended event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "COMBAT_ENDED",
      eventData: {
        dmUserId: user._id,
        finalRound: liveRoom.gameState.roundNumber
      },
      timestamp: Date.now(),
      userId: user._id,
      isSystemEvent: true,
      severity: "info"
    });

    return {
      success: true,
      message: "Combat ended"
    };
  },
});