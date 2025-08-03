import { z } from 'zod';
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
export declare const ParticipantDeltaSchema: z.ZodObject<{
    type: z.ZodLiteral<"participant">;
    changes: z.ZodObject<{
        entityId: z.ZodString;
        updates: z.ZodObject<{
            currentHP: z.ZodOptional<z.ZodNumber>;
            maxHP: z.ZodOptional<z.ZodNumber>;
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
            conditions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            inventory: z.ZodOptional<z.ZodAny>;
            availableActions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            turnStatus: z.ZodOptional<z.ZodEnum<["waiting", "active", "completed", "skipped"]>>;
        }, "strip", z.ZodTypeAny, {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        }, {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        entityId: string;
        updates: {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        };
    }, {
        entityId: string;
        updates: {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        };
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "participant";
    changes: {
        entityId: string;
        updates: {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        };
    };
}, {
    timestamp: number;
    type: "participant";
    changes: {
        entityId: string;
        updates: {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        };
    };
}>;
export declare const TurnDeltaSchema: z.ZodObject<{
    type: z.ZodLiteral<"turn">;
    changes: z.ZodObject<{
        currentTurnIndex: z.ZodOptional<z.ZodNumber>;
        roundNumber: z.ZodOptional<z.ZodNumber>;
        turnStatus: z.ZodOptional<z.ZodEnum<["waiting", "active", "completed", "skipped"]>>;
        activeEntityId: z.ZodOptional<z.ZodString>;
        timeRemaining: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        currentTurnIndex?: number | undefined;
        roundNumber?: number | undefined;
        turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        activeEntityId?: string | undefined;
        timeRemaining?: number | undefined;
    }, {
        currentTurnIndex?: number | undefined;
        roundNumber?: number | undefined;
        turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        activeEntityId?: string | undefined;
        timeRemaining?: number | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "turn";
    changes: {
        currentTurnIndex?: number | undefined;
        roundNumber?: number | undefined;
        turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        activeEntityId?: string | undefined;
        timeRemaining?: number | undefined;
    };
}, {
    timestamp: number;
    type: "turn";
    changes: {
        currentTurnIndex?: number | undefined;
        roundNumber?: number | undefined;
        turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        activeEntityId?: string | undefined;
        timeRemaining?: number | undefined;
    };
}>;
export declare const MapDeltaSchema: z.ZodObject<{
    type: z.ZodLiteral<"map">;
    changes: z.ZodObject<{
        entityPositions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>>;
        newObstacles: z.ZodOptional<z.ZodArray<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>, "many">>;
        removedObstacles: z.ZodOptional<z.ZodArray<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>, "many">>;
        terrainChanges: z.ZodOptional<z.ZodArray<z.ZodObject<{
            position: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>;
            type: z.ZodString;
            properties: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }, {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        entityPositions?: Record<string, {
            x: number;
            y: number;
        }> | undefined;
        newObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        removedObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        terrainChanges?: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[] | undefined;
    }, {
        entityPositions?: Record<string, {
            x: number;
            y: number;
        }> | undefined;
        newObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        removedObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        terrainChanges?: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[] | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "map";
    changes: {
        entityPositions?: Record<string, {
            x: number;
            y: number;
        }> | undefined;
        newObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        removedObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        terrainChanges?: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[] | undefined;
    };
}, {
    timestamp: number;
    type: "map";
    changes: {
        entityPositions?: Record<string, {
            x: number;
            y: number;
        }> | undefined;
        newObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        removedObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        terrainChanges?: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[] | undefined;
    };
}>;
export declare const InitiativeDeltaSchema: z.ZodObject<{
    type: z.ZodLiteral<"initiative">;
    changes: z.ZodObject<{
        order: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }>, "many">>;
        currentTurnIndex: z.ZodOptional<z.ZodNumber>;
        addedEntries: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }>, "many">>;
        removedEntries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        currentTurnIndex?: number | undefined;
        order?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        addedEntries?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        removedEntries?: string[] | undefined;
    }, {
        currentTurnIndex?: number | undefined;
        order?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        addedEntries?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        removedEntries?: string[] | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "initiative";
    changes: {
        currentTurnIndex?: number | undefined;
        order?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        addedEntries?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        removedEntries?: string[] | undefined;
    };
}, {
    timestamp: number;
    type: "initiative";
    changes: {
        currentTurnIndex?: number | undefined;
        order?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        addedEntries?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        removedEntries?: string[] | undefined;
    };
}>;
export declare const ChatDeltaSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat">;
    changes: z.ZodObject<{
        newMessage: z.ZodOptional<z.ZodObject<{
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
        }>>;
        deletedMessageId: z.ZodOptional<z.ZodString>;
        editedMessage: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            content: string;
            id: string;
        }, {
            content: string;
            id: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        newMessage?: {
            userId: string;
            timestamp: number;
            type: "party" | "dm" | "private" | "system";
            content: string;
            id: string;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        } | undefined;
        deletedMessageId?: string | undefined;
        editedMessage?: {
            content: string;
            id: string;
        } | undefined;
    }, {
        newMessage?: {
            userId: string;
            timestamp: number;
            type: "party" | "dm" | "private" | "system";
            content: string;
            id: string;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        } | undefined;
        deletedMessageId?: string | undefined;
        editedMessage?: {
            content: string;
            id: string;
        } | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "chat";
    changes: {
        newMessage?: {
            userId: string;
            timestamp: number;
            type: "party" | "dm" | "private" | "system";
            content: string;
            id: string;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        } | undefined;
        deletedMessageId?: string | undefined;
        editedMessage?: {
            content: string;
            id: string;
        } | undefined;
    };
}, {
    timestamp: number;
    type: "chat";
    changes: {
        newMessage?: {
            userId: string;
            timestamp: number;
            type: "party" | "dm" | "private" | "system";
            content: string;
            id: string;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        } | undefined;
        deletedMessageId?: string | undefined;
        editedMessage?: {
            content: string;
            id: string;
        } | undefined;
    };
}>;
export declare const TypedStateDeltaSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"participant">;
    changes: z.ZodObject<{
        entityId: z.ZodString;
        updates: z.ZodObject<{
            currentHP: z.ZodOptional<z.ZodNumber>;
            maxHP: z.ZodOptional<z.ZodNumber>;
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
            conditions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            inventory: z.ZodOptional<z.ZodAny>;
            availableActions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            turnStatus: z.ZodOptional<z.ZodEnum<["waiting", "active", "completed", "skipped"]>>;
        }, "strip", z.ZodTypeAny, {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        }, {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        entityId: string;
        updates: {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        };
    }, {
        entityId: string;
        updates: {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        };
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "participant";
    changes: {
        entityId: string;
        updates: {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        };
    };
}, {
    timestamp: number;
    type: "participant";
    changes: {
        entityId: string;
        updates: {
            position?: {
                x: number;
                y: number;
            } | undefined;
            currentHP?: number | undefined;
            maxHP?: number | undefined;
            conditions?: any[] | undefined;
            inventory?: any;
            availableActions?: any[] | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        };
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"turn">;
    changes: z.ZodObject<{
        currentTurnIndex: z.ZodOptional<z.ZodNumber>;
        roundNumber: z.ZodOptional<z.ZodNumber>;
        turnStatus: z.ZodOptional<z.ZodEnum<["waiting", "active", "completed", "skipped"]>>;
        activeEntityId: z.ZodOptional<z.ZodString>;
        timeRemaining: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        currentTurnIndex?: number | undefined;
        roundNumber?: number | undefined;
        turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        activeEntityId?: string | undefined;
        timeRemaining?: number | undefined;
    }, {
        currentTurnIndex?: number | undefined;
        roundNumber?: number | undefined;
        turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        activeEntityId?: string | undefined;
        timeRemaining?: number | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "turn";
    changes: {
        currentTurnIndex?: number | undefined;
        roundNumber?: number | undefined;
        turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        activeEntityId?: string | undefined;
        timeRemaining?: number | undefined;
    };
}, {
    timestamp: number;
    type: "turn";
    changes: {
        currentTurnIndex?: number | undefined;
        roundNumber?: number | undefined;
        turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
        activeEntityId?: string | undefined;
        timeRemaining?: number | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"map">;
    changes: z.ZodObject<{
        entityPositions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>>;
        newObstacles: z.ZodOptional<z.ZodArray<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>, "many">>;
        removedObstacles: z.ZodOptional<z.ZodArray<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>, "many">>;
        terrainChanges: z.ZodOptional<z.ZodArray<z.ZodObject<{
            position: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>;
            type: z.ZodString;
            properties: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }, {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        entityPositions?: Record<string, {
            x: number;
            y: number;
        }> | undefined;
        newObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        removedObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        terrainChanges?: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[] | undefined;
    }, {
        entityPositions?: Record<string, {
            x: number;
            y: number;
        }> | undefined;
        newObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        removedObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        terrainChanges?: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[] | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "map";
    changes: {
        entityPositions?: Record<string, {
            x: number;
            y: number;
        }> | undefined;
        newObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        removedObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        terrainChanges?: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[] | undefined;
    };
}, {
    timestamp: number;
    type: "map";
    changes: {
        entityPositions?: Record<string, {
            x: number;
            y: number;
        }> | undefined;
        newObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        removedObstacles?: {
            x: number;
            y: number;
        }[] | undefined;
        terrainChanges?: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[] | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"initiative">;
    changes: z.ZodObject<{
        order: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }>, "many">>;
        currentTurnIndex: z.ZodOptional<z.ZodNumber>;
        addedEntries: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        }>, "many">>;
        removedEntries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        currentTurnIndex?: number | undefined;
        order?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        addedEntries?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        removedEntries?: string[] | undefined;
    }, {
        currentTurnIndex?: number | undefined;
        order?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        addedEntries?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        removedEntries?: string[] | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "initiative";
    changes: {
        currentTurnIndex?: number | undefined;
        order?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        addedEntries?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        removedEntries?: string[] | undefined;
    };
}, {
    timestamp: number;
    type: "initiative";
    changes: {
        currentTurnIndex?: number | undefined;
        order?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        addedEntries?: {
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            initiative: number;
            userId?: string | undefined;
        }[] | undefined;
        removedEntries?: string[] | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"chat">;
    changes: z.ZodObject<{
        newMessage: z.ZodOptional<z.ZodObject<{
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
        }>>;
        deletedMessageId: z.ZodOptional<z.ZodString>;
        editedMessage: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            content: string;
            id: string;
        }, {
            content: string;
            id: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        newMessage?: {
            userId: string;
            timestamp: number;
            type: "party" | "dm" | "private" | "system";
            content: string;
            id: string;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        } | undefined;
        deletedMessageId?: string | undefined;
        editedMessage?: {
            content: string;
            id: string;
        } | undefined;
    }, {
        newMessage?: {
            userId: string;
            timestamp: number;
            type: "party" | "dm" | "private" | "system";
            content: string;
            id: string;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        } | undefined;
        deletedMessageId?: string | undefined;
        editedMessage?: {
            content: string;
            id: string;
        } | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: "chat";
    changes: {
        newMessage?: {
            userId: string;
            timestamp: number;
            type: "party" | "dm" | "private" | "system";
            content: string;
            id: string;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        } | undefined;
        deletedMessageId?: string | undefined;
        editedMessage?: {
            content: string;
            id: string;
        } | undefined;
    };
}, {
    timestamp: number;
    type: "chat";
    changes: {
        newMessage?: {
            userId: string;
            timestamp: number;
            type: "party" | "dm" | "private" | "system";
            content: string;
            id: string;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        } | undefined;
        deletedMessageId?: string | undefined;
        editedMessage?: {
            content: string;
            id: string;
        } | undefined;
    };
}>]>;
export declare const BatchDeltaSchema: z.ZodObject<{
    deltas: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"participant">;
        changes: z.ZodObject<{
            entityId: z.ZodString;
            updates: z.ZodObject<{
                currentHP: z.ZodOptional<z.ZodNumber>;
                maxHP: z.ZodOptional<z.ZodNumber>;
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
                conditions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                inventory: z.ZodOptional<z.ZodAny>;
                availableActions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                turnStatus: z.ZodOptional<z.ZodEnum<["waiting", "active", "completed", "skipped"]>>;
            }, "strip", z.ZodTypeAny, {
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                currentHP?: number | undefined;
                maxHP?: number | undefined;
                conditions?: any[] | undefined;
                inventory?: any;
                availableActions?: any[] | undefined;
                turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            }, {
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                currentHP?: number | undefined;
                maxHP?: number | undefined;
                conditions?: any[] | undefined;
                inventory?: any;
                availableActions?: any[] | undefined;
                turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            entityId: string;
            updates: {
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                currentHP?: number | undefined;
                maxHP?: number | undefined;
                conditions?: any[] | undefined;
                inventory?: any;
                availableActions?: any[] | undefined;
                turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            };
        }, {
            entityId: string;
            updates: {
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                currentHP?: number | undefined;
                maxHP?: number | undefined;
                conditions?: any[] | undefined;
                inventory?: any;
                availableActions?: any[] | undefined;
                turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            };
        }>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        type: "participant";
        changes: {
            entityId: string;
            updates: {
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                currentHP?: number | undefined;
                maxHP?: number | undefined;
                conditions?: any[] | undefined;
                inventory?: any;
                availableActions?: any[] | undefined;
                turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            };
        };
    }, {
        timestamp: number;
        type: "participant";
        changes: {
            entityId: string;
            updates: {
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                currentHP?: number | undefined;
                maxHP?: number | undefined;
                conditions?: any[] | undefined;
                inventory?: any;
                availableActions?: any[] | undefined;
                turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            };
        };
    }>, z.ZodObject<{
        type: z.ZodLiteral<"turn">;
        changes: z.ZodObject<{
            currentTurnIndex: z.ZodOptional<z.ZodNumber>;
            roundNumber: z.ZodOptional<z.ZodNumber>;
            turnStatus: z.ZodOptional<z.ZodEnum<["waiting", "active", "completed", "skipped"]>>;
            activeEntityId: z.ZodOptional<z.ZodString>;
            timeRemaining: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            currentTurnIndex?: number | undefined;
            roundNumber?: number | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            activeEntityId?: string | undefined;
            timeRemaining?: number | undefined;
        }, {
            currentTurnIndex?: number | undefined;
            roundNumber?: number | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            activeEntityId?: string | undefined;
            timeRemaining?: number | undefined;
        }>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        type: "turn";
        changes: {
            currentTurnIndex?: number | undefined;
            roundNumber?: number | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            activeEntityId?: string | undefined;
            timeRemaining?: number | undefined;
        };
    }, {
        timestamp: number;
        type: "turn";
        changes: {
            currentTurnIndex?: number | undefined;
            roundNumber?: number | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            activeEntityId?: string | undefined;
            timeRemaining?: number | undefined;
        };
    }>, z.ZodObject<{
        type: z.ZodLiteral<"map">;
        changes: z.ZodObject<{
            entityPositions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>>>;
            newObstacles: z.ZodOptional<z.ZodArray<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>, "many">>;
            removedObstacles: z.ZodOptional<z.ZodArray<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>, "many">>;
            terrainChanges: z.ZodOptional<z.ZodArray<z.ZodObject<{
                position: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    x: number;
                    y: number;
                }, {
                    x: number;
                    y: number;
                }>;
                type: z.ZodString;
                properties: z.ZodRecord<z.ZodString, z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }, {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            entityPositions?: Record<string, {
                x: number;
                y: number;
            }> | undefined;
            newObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            removedObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            terrainChanges?: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[] | undefined;
        }, {
            entityPositions?: Record<string, {
                x: number;
                y: number;
            }> | undefined;
            newObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            removedObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            terrainChanges?: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[] | undefined;
        }>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        type: "map";
        changes: {
            entityPositions?: Record<string, {
                x: number;
                y: number;
            }> | undefined;
            newObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            removedObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            terrainChanges?: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[] | undefined;
        };
    }, {
        timestamp: number;
        type: "map";
        changes: {
            entityPositions?: Record<string, {
                x: number;
                y: number;
            }> | undefined;
            newObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            removedObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            terrainChanges?: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[] | undefined;
        };
    }>, z.ZodObject<{
        type: z.ZodLiteral<"initiative">;
        changes: z.ZodObject<{
            order: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            currentTurnIndex: z.ZodOptional<z.ZodNumber>;
            addedEntries: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            removedEntries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            currentTurnIndex?: number | undefined;
            order?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            addedEntries?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            removedEntries?: string[] | undefined;
        }, {
            currentTurnIndex?: number | undefined;
            order?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            addedEntries?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            removedEntries?: string[] | undefined;
        }>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        type: "initiative";
        changes: {
            currentTurnIndex?: number | undefined;
            order?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            addedEntries?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            removedEntries?: string[] | undefined;
        };
    }, {
        timestamp: number;
        type: "initiative";
        changes: {
            currentTurnIndex?: number | undefined;
            order?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            addedEntries?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            removedEntries?: string[] | undefined;
        };
    }>, z.ZodObject<{
        type: z.ZodLiteral<"chat">;
        changes: z.ZodObject<{
            newMessage: z.ZodOptional<z.ZodObject<{
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
            }>>;
            deletedMessageId: z.ZodOptional<z.ZodString>;
            editedMessage: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                content: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                content: string;
                id: string;
            }, {
                content: string;
                id: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            newMessage?: {
                userId: string;
                timestamp: number;
                type: "party" | "dm" | "private" | "system";
                content: string;
                id: string;
                entityId?: string | undefined;
                recipients?: string[] | undefined;
            } | undefined;
            deletedMessageId?: string | undefined;
            editedMessage?: {
                content: string;
                id: string;
            } | undefined;
        }, {
            newMessage?: {
                userId: string;
                timestamp: number;
                type: "party" | "dm" | "private" | "system";
                content: string;
                id: string;
                entityId?: string | undefined;
                recipients?: string[] | undefined;
            } | undefined;
            deletedMessageId?: string | undefined;
            editedMessage?: {
                content: string;
                id: string;
            } | undefined;
        }>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        type: "chat";
        changes: {
            newMessage?: {
                userId: string;
                timestamp: number;
                type: "party" | "dm" | "private" | "system";
                content: string;
                id: string;
                entityId?: string | undefined;
                recipients?: string[] | undefined;
            } | undefined;
            deletedMessageId?: string | undefined;
            editedMessage?: {
                content: string;
                id: string;
            } | undefined;
        };
    }, {
        timestamp: number;
        type: "chat";
        changes: {
            newMessage?: {
                userId: string;
                timestamp: number;
                type: "party" | "dm" | "private" | "system";
                content: string;
                id: string;
                entityId?: string | undefined;
                recipients?: string[] | undefined;
            } | undefined;
            deletedMessageId?: string | undefined;
            editedMessage?: {
                content: string;
                id: string;
            } | undefined;
        };
    }>]>, "many">;
    timestamp: z.ZodNumber;
    batchId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    deltas: ({
        timestamp: number;
        type: "participant";
        changes: {
            entityId: string;
            updates: {
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                currentHP?: number | undefined;
                maxHP?: number | undefined;
                conditions?: any[] | undefined;
                inventory?: any;
                availableActions?: any[] | undefined;
                turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            };
        };
    } | {
        timestamp: number;
        type: "turn";
        changes: {
            currentTurnIndex?: number | undefined;
            roundNumber?: number | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            activeEntityId?: string | undefined;
            timeRemaining?: number | undefined;
        };
    } | {
        timestamp: number;
        type: "map";
        changes: {
            entityPositions?: Record<string, {
                x: number;
                y: number;
            }> | undefined;
            newObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            removedObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            terrainChanges?: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[] | undefined;
        };
    } | {
        timestamp: number;
        type: "initiative";
        changes: {
            currentTurnIndex?: number | undefined;
            order?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            addedEntries?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            removedEntries?: string[] | undefined;
        };
    } | {
        timestamp: number;
        type: "chat";
        changes: {
            newMessage?: {
                userId: string;
                timestamp: number;
                type: "party" | "dm" | "private" | "system";
                content: string;
                id: string;
                entityId?: string | undefined;
                recipients?: string[] | undefined;
            } | undefined;
            deletedMessageId?: string | undefined;
            editedMessage?: {
                content: string;
                id: string;
            } | undefined;
        };
    })[];
    batchId: string;
}, {
    timestamp: number;
    deltas: ({
        timestamp: number;
        type: "participant";
        changes: {
            entityId: string;
            updates: {
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                currentHP?: number | undefined;
                maxHP?: number | undefined;
                conditions?: any[] | undefined;
                inventory?: any;
                availableActions?: any[] | undefined;
                turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            };
        };
    } | {
        timestamp: number;
        type: "turn";
        changes: {
            currentTurnIndex?: number | undefined;
            roundNumber?: number | undefined;
            turnStatus?: "active" | "completed" | "waiting" | "skipped" | undefined;
            activeEntityId?: string | undefined;
            timeRemaining?: number | undefined;
        };
    } | {
        timestamp: number;
        type: "map";
        changes: {
            entityPositions?: Record<string, {
                x: number;
                y: number;
            }> | undefined;
            newObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            removedObstacles?: {
                x: number;
                y: number;
            }[] | undefined;
            terrainChanges?: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[] | undefined;
        };
    } | {
        timestamp: number;
        type: "initiative";
        changes: {
            currentTurnIndex?: number | undefined;
            order?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            addedEntries?: {
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
                initiative: number;
                userId?: string | undefined;
            }[] | undefined;
            removedEntries?: string[] | undefined;
        };
    } | {
        timestamp: number;
        type: "chat";
        changes: {
            newMessage?: {
                userId: string;
                timestamp: number;
                type: "party" | "dm" | "private" | "system";
                content: string;
                id: string;
                entityId?: string | undefined;
                recipients?: string[] | undefined;
            } | undefined;
            deletedMessageId?: string | undefined;
            editedMessage?: {
                content: string;
                id: string;
            } | undefined;
        };
    })[];
    batchId: string;
}>;
export type StateDelta = z.infer<typeof StateDeltaSchema>;
export type ParticipantDelta = z.infer<typeof ParticipantDeltaSchema>;
export type TurnDelta = z.infer<typeof TurnDeltaSchema>;
export type MapDelta = z.infer<typeof MapDeltaSchema>;
export type InitiativeDelta = z.infer<typeof InitiativeDeltaSchema>;
export type ChatDelta = z.infer<typeof ChatDeltaSchema>;
export type TypedStateDelta = z.infer<typeof TypedStateDeltaSchema>;
export type BatchDelta = z.infer<typeof BatchDeltaSchema>;
//# sourceMappingURL=stateDelta.d.ts.map