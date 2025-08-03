/**
 * Zod schemas for game events
 */
import { z } from 'zod';
export declare const ParticipantJoinedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"PARTICIPANT_JOINED">;
    userId: z.ZodString;
    entityId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PARTICIPANT_JOINED";
    entityId: string;
    userId: string;
    timestamp: number;
    interactionId: string;
}, {
    type: "PARTICIPANT_JOINED";
    entityId: string;
    userId: string;
    timestamp: number;
    interactionId: string;
}>;
export declare const ParticipantLeftEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"PARTICIPANT_LEFT">;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PARTICIPANT_LEFT";
    userId: string;
    timestamp: number;
    interactionId: string;
}, {
    type: "PARTICIPANT_LEFT";
    userId: string;
    timestamp: number;
    interactionId: string;
}>;
export declare const TurnStartedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_STARTED">;
    entityId: z.ZodString;
    timeLimit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "TURN_STARTED";
    entityId: string;
    timestamp: number;
    interactionId: string;
    timeLimit: number;
}, {
    type: "TURN_STARTED";
    entityId: string;
    timestamp: number;
    interactionId: string;
    timeLimit: number;
}>;
export declare const TurnCompletedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_COMPLETED">;
    entityId: z.ZodString;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["move", "attack", "useItem", "cast", "interact", "end"]>;
        entityId: z.ZodString;
        target: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
        itemId: z.ZodOptional<z.ZodString>;
        spellId: z.ZodOptional<z.ZodString>;
        actionId: z.ZodOptional<z.ZodString>;
        parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
        entityId: string;
        target?: string | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        itemId?: string | undefined;
        spellId?: string | undefined;
        actionId?: string | undefined;
        parameters?: Record<string, any> | undefined;
    }, {
        type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
        entityId: string;
        target?: string | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        itemId?: string | undefined;
        spellId?: string | undefined;
        actionId?: string | undefined;
        parameters?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "TURN_COMPLETED";
    entityId: string;
    actions: {
        type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
        entityId: string;
        target?: string | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        itemId?: string | undefined;
        spellId?: string | undefined;
        actionId?: string | undefined;
        parameters?: Record<string, any> | undefined;
    }[];
    timestamp: number;
    interactionId: string;
}, {
    type: "TURN_COMPLETED";
    entityId: string;
    actions: {
        type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
        entityId: string;
        target?: string | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        itemId?: string | undefined;
        spellId?: string | undefined;
        actionId?: string | undefined;
        parameters?: Record<string, any> | undefined;
    }[];
    timestamp: number;
    interactionId: string;
}>;
export declare const TurnSkippedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_SKIPPED">;
    entityId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "TURN_SKIPPED";
    entityId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}, {
    type: "TURN_SKIPPED";
    entityId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}>;
export declare const TurnBacktrackedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_BACKTRACKED">;
    targetTurn: z.ZodNumber;
    targetRound: z.ZodNumber;
    removedTurns: z.ZodNumber;
    dmUserId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "TURN_BACKTRACKED";
    timestamp: number;
    interactionId: string;
    targetTurn: number;
    targetRound: number;
    removedTurns: number;
    dmUserId: string;
}, {
    type: "TURN_BACKTRACKED";
    timestamp: number;
    interactionId: string;
    targetTurn: number;
    targetRound: number;
    removedTurns: number;
    dmUserId: string;
}>;
export declare const StateDeltaEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"STATE_DELTA">;
    changes: z.ZodObject<{
        type: z.ZodEnum<["participant", "turn", "map", "initiative", "chat"]>;
        changes: z.ZodRecord<z.ZodString, z.ZodAny>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "participant" | "turn" | "map" | "initiative" | "chat";
        timestamp: number;
        changes: Record<string, any>;
    }, {
        type: "participant" | "turn" | "map" | "initiative" | "chat";
        timestamp: number;
        changes: Record<string, any>;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "STATE_DELTA";
    timestamp: number;
    interactionId: string;
    changes: {
        type: "participant" | "turn" | "map" | "initiative" | "chat";
        timestamp: number;
        changes: Record<string, any>;
    };
}, {
    type: "STATE_DELTA";
    timestamp: number;
    interactionId: string;
    changes: {
        type: "participant" | "turn" | "map" | "initiative" | "chat";
        timestamp: number;
        changes: Record<string, any>;
    };
}>;
export declare const ChatMessageEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"CHAT_MESSAGE">;
    message: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        entityId: z.ZodOptional<z.ZodString>;
        content: z.ZodString;
        type: z.ZodEnum<["party", "dm", "private", "system"]>;
        recipients: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }, {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "CHAT_MESSAGE";
    message: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    timestamp: number;
    interactionId: string;
}, {
    type: "CHAT_MESSAGE";
    message: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    timestamp: number;
    interactionId: string;
}>;
export declare const InitiativeUpdatedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"INITIATIVE_UPDATED">;
    order: z.ZodArray<z.ZodObject<{
        entityId: z.ZodString;
        entityType: z.ZodEnum<["playerCharacter", "npc", "monster"]>;
        initiative: z.ZodNumber;
        userId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }, {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "INITIATIVE_UPDATED";
    timestamp: number;
    interactionId: string;
    order: {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }[];
}, {
    type: "INITIATIVE_UPDATED";
    timestamp: number;
    interactionId: string;
    order: {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }[];
}>;
export declare const InteractionPausedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"INTERACTION_PAUSED">;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "INTERACTION_PAUSED";
    timestamp: number;
    interactionId: string;
    reason: string;
}, {
    type: "INTERACTION_PAUSED";
    timestamp: number;
    interactionId: string;
    reason: string;
}>;
export declare const InteractionResumedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"INTERACTION_RESUMED">;
}, "strip", z.ZodTypeAny, {
    type: "INTERACTION_RESUMED";
    timestamp: number;
    interactionId: string;
}, {
    type: "INTERACTION_RESUMED";
    timestamp: number;
    interactionId: string;
}>;
export declare const PlayerDisconnectedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"PLAYER_DISCONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PLAYER_DISCONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}, {
    type: "PLAYER_DISCONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}>;
export declare const PlayerReconnectedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"PLAYER_RECONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    connectionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PLAYER_RECONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    connectionId: string;
}, {
    type: "PLAYER_RECONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    connectionId: string;
}>;
export declare const DmDisconnectedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"DM_DISCONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "DM_DISCONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}, {
    type: "DM_DISCONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}>;
export declare const DmReconnectedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"DM_RECONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    connectionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "DM_RECONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    connectionId: string;
}, {
    type: "DM_RECONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    connectionId: string;
}>;
export declare const ErrorEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"ERROR">;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    };
    type: "ERROR";
    timestamp: number;
    interactionId: string;
}, {
    error: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    };
    type: "ERROR";
    timestamp: number;
    interactionId: string;
}>;
export declare const GameEventSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"PARTICIPANT_JOINED">;
    userId: z.ZodString;
    entityId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PARTICIPANT_JOINED";
    entityId: string;
    userId: string;
    timestamp: number;
    interactionId: string;
}, {
    type: "PARTICIPANT_JOINED";
    entityId: string;
    userId: string;
    timestamp: number;
    interactionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"PARTICIPANT_LEFT">;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PARTICIPANT_LEFT";
    userId: string;
    timestamp: number;
    interactionId: string;
}, {
    type: "PARTICIPANT_LEFT";
    userId: string;
    timestamp: number;
    interactionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_STARTED">;
    entityId: z.ZodString;
    timeLimit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "TURN_STARTED";
    entityId: string;
    timestamp: number;
    interactionId: string;
    timeLimit: number;
}, {
    type: "TURN_STARTED";
    entityId: string;
    timestamp: number;
    interactionId: string;
    timeLimit: number;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_COMPLETED">;
    entityId: z.ZodString;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["move", "attack", "useItem", "cast", "interact", "end"]>;
        entityId: z.ZodString;
        target: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
        itemId: z.ZodOptional<z.ZodString>;
        spellId: z.ZodOptional<z.ZodString>;
        actionId: z.ZodOptional<z.ZodString>;
        parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
        entityId: string;
        target?: string | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        itemId?: string | undefined;
        spellId?: string | undefined;
        actionId?: string | undefined;
        parameters?: Record<string, any> | undefined;
    }, {
        type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
        entityId: string;
        target?: string | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        itemId?: string | undefined;
        spellId?: string | undefined;
        actionId?: string | undefined;
        parameters?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "TURN_COMPLETED";
    entityId: string;
    actions: {
        type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
        entityId: string;
        target?: string | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        itemId?: string | undefined;
        spellId?: string | undefined;
        actionId?: string | undefined;
        parameters?: Record<string, any> | undefined;
    }[];
    timestamp: number;
    interactionId: string;
}, {
    type: "TURN_COMPLETED";
    entityId: string;
    actions: {
        type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
        entityId: string;
        target?: string | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        itemId?: string | undefined;
        spellId?: string | undefined;
        actionId?: string | undefined;
        parameters?: Record<string, any> | undefined;
    }[];
    timestamp: number;
    interactionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_SKIPPED">;
    entityId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "TURN_SKIPPED";
    entityId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}, {
    type: "TURN_SKIPPED";
    entityId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_BACKTRACKED">;
    targetTurn: z.ZodNumber;
    targetRound: z.ZodNumber;
    removedTurns: z.ZodNumber;
    dmUserId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "TURN_BACKTRACKED";
    timestamp: number;
    interactionId: string;
    targetTurn: number;
    targetRound: number;
    removedTurns: number;
    dmUserId: string;
}, {
    type: "TURN_BACKTRACKED";
    timestamp: number;
    interactionId: string;
    targetTurn: number;
    targetRound: number;
    removedTurns: number;
    dmUserId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"STATE_DELTA">;
    changes: z.ZodObject<{
        type: z.ZodEnum<["participant", "turn", "map", "initiative", "chat"]>;
        changes: z.ZodRecord<z.ZodString, z.ZodAny>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "participant" | "turn" | "map" | "initiative" | "chat";
        timestamp: number;
        changes: Record<string, any>;
    }, {
        type: "participant" | "turn" | "map" | "initiative" | "chat";
        timestamp: number;
        changes: Record<string, any>;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "STATE_DELTA";
    timestamp: number;
    interactionId: string;
    changes: {
        type: "participant" | "turn" | "map" | "initiative" | "chat";
        timestamp: number;
        changes: Record<string, any>;
    };
}, {
    type: "STATE_DELTA";
    timestamp: number;
    interactionId: string;
    changes: {
        type: "participant" | "turn" | "map" | "initiative" | "chat";
        timestamp: number;
        changes: Record<string, any>;
    };
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"CHAT_MESSAGE">;
    message: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        entityId: z.ZodOptional<z.ZodString>;
        content: z.ZodString;
        type: z.ZodEnum<["party", "dm", "private", "system"]>;
        recipients: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }, {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "CHAT_MESSAGE";
    message: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    timestamp: number;
    interactionId: string;
}, {
    type: "CHAT_MESSAGE";
    message: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    timestamp: number;
    interactionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"INITIATIVE_UPDATED">;
    order: z.ZodArray<z.ZodObject<{
        entityId: z.ZodString;
        entityType: z.ZodEnum<["playerCharacter", "npc", "monster"]>;
        initiative: z.ZodNumber;
        userId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }, {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "INITIATIVE_UPDATED";
    timestamp: number;
    interactionId: string;
    order: {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }[];
}, {
    type: "INITIATIVE_UPDATED";
    timestamp: number;
    interactionId: string;
    order: {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }[];
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"INTERACTION_PAUSED">;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "INTERACTION_PAUSED";
    timestamp: number;
    interactionId: string;
    reason: string;
}, {
    type: "INTERACTION_PAUSED";
    timestamp: number;
    interactionId: string;
    reason: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"INTERACTION_RESUMED">;
}, "strip", z.ZodTypeAny, {
    type: "INTERACTION_RESUMED";
    timestamp: number;
    interactionId: string;
}, {
    type: "INTERACTION_RESUMED";
    timestamp: number;
    interactionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"PLAYER_DISCONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PLAYER_DISCONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}, {
    type: "PLAYER_DISCONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"PLAYER_RECONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    connectionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PLAYER_RECONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    connectionId: string;
}, {
    type: "PLAYER_RECONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    connectionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"DM_DISCONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "DM_DISCONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}, {
    type: "DM_DISCONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    reason: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"DM_RECONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    connectionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "DM_RECONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    connectionId: string;
}, {
    type: "DM_RECONNECTED";
    userId: string;
    timestamp: number;
    interactionId: string;
    connectionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"ERROR">;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    };
    type: "ERROR";
    timestamp: number;
    interactionId: string;
}, {
    error: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    };
    type: "ERROR";
    timestamp: number;
    interactionId: string;
}>]>;
export declare const EventSubscriptionOptionsSchema: z.ZodObject<{
    interactionId: z.ZodString;
    onEvent: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    onError: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    onConnect: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    onDisconnect: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    interactionId: string;
    onEvent?: ((...args: unknown[]) => unknown) | undefined;
    onError?: ((...args: unknown[]) => unknown) | undefined;
    onConnect?: ((...args: unknown[]) => unknown) | undefined;
    onDisconnect?: ((...args: unknown[]) => unknown) | undefined;
}, {
    interactionId: string;
    onEvent?: ((...args: unknown[]) => unknown) | undefined;
    onError?: ((...args: unknown[]) => unknown) | undefined;
    onConnect?: ((...args: unknown[]) => unknown) | undefined;
    onDisconnect?: ((...args: unknown[]) => unknown) | undefined;
}>;
//# sourceMappingURL=events.d.ts.map