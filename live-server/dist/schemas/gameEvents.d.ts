import { z } from 'zod';
export declare const GameErrorSchema: z.ZodObject<{
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
export declare const ValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    errors: z.ZodArray<z.ZodString, "many">;
    warnings: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    errors: string[];
    warnings?: string[] | undefined;
}, {
    valid: boolean;
    errors: string[];
    warnings?: string[] | undefined;
}>;
export declare const StateDeltaSchema: z.ZodObject<{
    type: z.ZodEnum<["participant", "turn", "map", "initiative", "chat"]>;
    changes: z.ZodRecord<z.ZodString, z.ZodAny>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "map" | "initiative" | "participant" | "turn" | "chat";
    changes: Record<string, any>;
}, {
    timestamp: number;
    type: "map" | "initiative" | "participant" | "turn" | "chat";
    changes: Record<string, any>;
}>;
export declare const ParticipantJoinedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"PARTICIPANT_JOINED">;
    userId: z.ZodString;
    entityId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    timestamp: number;
    type: "PARTICIPANT_JOINED";
    interactionId: string;
    entityId: string;
}, {
    userId: string;
    timestamp: number;
    type: "PARTICIPANT_JOINED";
    interactionId: string;
    entityId: string;
}>;
export declare const ParticipantLeftEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"PARTICIPANT_LEFT">;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    timestamp: number;
    type: "PARTICIPANT_LEFT";
    interactionId: string;
}, {
    userId: string;
    timestamp: number;
    type: "PARTICIPANT_LEFT";
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
    timestamp: number;
    type: "TURN_STARTED";
    interactionId: string;
    entityId: string;
    timeLimit: number;
}, {
    timestamp: number;
    type: "TURN_STARTED";
    interactionId: string;
    entityId: string;
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
        parameters?: Record<string, any> | undefined;
        actionId?: string | undefined;
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
        parameters?: Record<string, any> | undefined;
        actionId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "TURN_COMPLETED";
    interactionId: string;
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
        parameters?: Record<string, any> | undefined;
        actionId?: string | undefined;
    }[];
}, {
    timestamp: number;
    type: "TURN_COMPLETED";
    interactionId: string;
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
        parameters?: Record<string, any> | undefined;
        actionId?: string | undefined;
    }[];
}>;
export declare const TurnSkippedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_SKIPPED">;
    entityId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "TURN_SKIPPED";
    interactionId: string;
    entityId: string;
    reason: string;
}, {
    timestamp: number;
    type: "TURN_SKIPPED";
    interactionId: string;
    entityId: string;
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
    timestamp: number;
    type: "TURN_BACKTRACKED";
    interactionId: string;
    targetTurn: number;
    targetRound: number;
    removedTurns: number;
    dmUserId: string;
}, {
    timestamp: number;
    type: "TURN_BACKTRACKED";
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
        timestamp: number;
        type: "map" | "initiative" | "participant" | "turn" | "chat";
        changes: Record<string, any>;
    }, {
        timestamp: number;
        type: "map" | "initiative" | "participant" | "turn" | "chat";
        changes: Record<string, any>;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "STATE_DELTA";
    interactionId: string;
    changes: {
        timestamp: number;
        type: "map" | "initiative" | "participant" | "turn" | "chat";
        changes: Record<string, any>;
    };
}, {
    timestamp: number;
    type: "STATE_DELTA";
    interactionId: string;
    changes: {
        timestamp: number;
        type: "map" | "initiative" | "participant" | "turn" | "chat";
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
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }, {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    timestamp: number;
    type: "CHAT_MESSAGE";
    interactionId: string;
}, {
    message: {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    timestamp: number;
    type: "CHAT_MESSAGE";
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
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "INITIATIVE_UPDATED";
    interactionId: string;
    order: {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }[];
}, {
    timestamp: number;
    type: "INITIATIVE_UPDATED";
    interactionId: string;
    order: {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
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
    timestamp: number;
    type: "INTERACTION_PAUSED";
    interactionId: string;
    reason: string;
}, {
    timestamp: number;
    type: "INTERACTION_PAUSED";
    interactionId: string;
    reason: string;
}>;
export declare const InteractionResumedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"INTERACTION_RESUMED">;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "INTERACTION_RESUMED";
    interactionId: string;
}, {
    timestamp: number;
    type: "INTERACTION_RESUMED";
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
    userId: string;
    timestamp: number;
    type: "PLAYER_DISCONNECTED";
    interactionId: string;
    reason: string;
}, {
    userId: string;
    timestamp: number;
    type: "PLAYER_DISCONNECTED";
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
    userId: string;
    connectionId: string;
    timestamp: number;
    type: "PLAYER_RECONNECTED";
    interactionId: string;
}, {
    userId: string;
    connectionId: string;
    timestamp: number;
    type: "PLAYER_RECONNECTED";
    interactionId: string;
}>;
export declare const DmDisconnectedEventSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"DM_DISCONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    timestamp: number;
    type: "DM_DISCONNECTED";
    interactionId: string;
    reason: string;
}, {
    userId: string;
    timestamp: number;
    type: "DM_DISCONNECTED";
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
    userId: string;
    connectionId: string;
    timestamp: number;
    type: "DM_RECONNECTED";
    interactionId: string;
}, {
    userId: string;
    connectionId: string;
    timestamp: number;
    type: "DM_RECONNECTED";
    interactionId: string;
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
    timestamp: number;
    type: "ERROR";
    interactionId: string;
}, {
    error: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    };
    timestamp: number;
    type: "ERROR";
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
    userId: string;
    timestamp: number;
    type: "PARTICIPANT_JOINED";
    interactionId: string;
    entityId: string;
}, {
    userId: string;
    timestamp: number;
    type: "PARTICIPANT_JOINED";
    interactionId: string;
    entityId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"PARTICIPANT_LEFT">;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    timestamp: number;
    type: "PARTICIPANT_LEFT";
    interactionId: string;
}, {
    userId: string;
    timestamp: number;
    type: "PARTICIPANT_LEFT";
    interactionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_STARTED">;
    entityId: z.ZodString;
    timeLimit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "TURN_STARTED";
    interactionId: string;
    entityId: string;
    timeLimit: number;
}, {
    timestamp: number;
    type: "TURN_STARTED";
    interactionId: string;
    entityId: string;
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
        parameters?: Record<string, any> | undefined;
        actionId?: string | undefined;
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
        parameters?: Record<string, any> | undefined;
        actionId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "TURN_COMPLETED";
    interactionId: string;
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
        parameters?: Record<string, any> | undefined;
        actionId?: string | undefined;
    }[];
}, {
    timestamp: number;
    type: "TURN_COMPLETED";
    interactionId: string;
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
        parameters?: Record<string, any> | undefined;
        actionId?: string | undefined;
    }[];
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"TURN_SKIPPED">;
    entityId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "TURN_SKIPPED";
    interactionId: string;
    entityId: string;
    reason: string;
}, {
    timestamp: number;
    type: "TURN_SKIPPED";
    interactionId: string;
    entityId: string;
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
    timestamp: number;
    type: "TURN_BACKTRACKED";
    interactionId: string;
    targetTurn: number;
    targetRound: number;
    removedTurns: number;
    dmUserId: string;
}, {
    timestamp: number;
    type: "TURN_BACKTRACKED";
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
        timestamp: number;
        type: "map" | "initiative" | "participant" | "turn" | "chat";
        changes: Record<string, any>;
    }, {
        timestamp: number;
        type: "map" | "initiative" | "participant" | "turn" | "chat";
        changes: Record<string, any>;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "STATE_DELTA";
    interactionId: string;
    changes: {
        timestamp: number;
        type: "map" | "initiative" | "participant" | "turn" | "chat";
        changes: Record<string, any>;
    };
}, {
    timestamp: number;
    type: "STATE_DELTA";
    interactionId: string;
    changes: {
        timestamp: number;
        type: "map" | "initiative" | "participant" | "turn" | "chat";
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
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }, {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    timestamp: number;
    type: "CHAT_MESSAGE";
    interactionId: string;
}, {
    message: {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    timestamp: number;
    type: "CHAT_MESSAGE";
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
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "INITIATIVE_UPDATED";
    interactionId: string;
    order: {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }[];
}, {
    timestamp: number;
    type: "INITIATIVE_UPDATED";
    interactionId: string;
    order: {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }[];
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"INTERACTION_PAUSED">;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "INTERACTION_PAUSED";
    interactionId: string;
    reason: string;
}, {
    timestamp: number;
    type: "INTERACTION_PAUSED";
    interactionId: string;
    reason: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
    interactionId: z.ZodString;
} & {
    type: z.ZodLiteral<"INTERACTION_RESUMED">;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "INTERACTION_RESUMED";
    interactionId: string;
}, {
    timestamp: number;
    type: "INTERACTION_RESUMED";
    interactionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"PLAYER_DISCONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    timestamp: number;
    type: "PLAYER_DISCONNECTED";
    interactionId: string;
    reason: string;
}, {
    userId: string;
    timestamp: number;
    type: "PLAYER_DISCONNECTED";
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
    userId: string;
    connectionId: string;
    timestamp: number;
    type: "PLAYER_RECONNECTED";
    interactionId: string;
}, {
    userId: string;
    connectionId: string;
    timestamp: number;
    type: "PLAYER_RECONNECTED";
    interactionId: string;
}>, z.ZodObject<{
    timestamp: z.ZodNumber;
} & {
    type: z.ZodLiteral<"DM_DISCONNECTED">;
    userId: z.ZodString;
    interactionId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    timestamp: number;
    type: "DM_DISCONNECTED";
    interactionId: string;
    reason: string;
}, {
    userId: string;
    timestamp: number;
    type: "DM_DISCONNECTED";
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
    userId: string;
    connectionId: string;
    timestamp: number;
    type: "DM_RECONNECTED";
    interactionId: string;
}, {
    userId: string;
    connectionId: string;
    timestamp: number;
    type: "DM_RECONNECTED";
    interactionId: string;
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
    timestamp: number;
    type: "ERROR";
    interactionId: string;
}, {
    error: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    };
    timestamp: number;
    type: "ERROR";
    interactionId: string;
}>]>;
export type GameError = z.infer<typeof GameErrorSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type StateDelta = z.infer<typeof StateDeltaSchema>;
export type GameEvent = z.infer<typeof GameEventSchema>;
export type ParticipantJoinedEvent = z.infer<typeof ParticipantJoinedEventSchema>;
export type TurnStartedEvent = z.infer<typeof TurnStartedEventSchema>;
export type StateDeltaEvent = z.infer<typeof StateDeltaEventSchema>;
//# sourceMappingURL=gameEvents.d.ts.map