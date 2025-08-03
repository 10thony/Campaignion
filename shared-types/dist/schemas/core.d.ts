/**
 * Zod schemas for runtime validation
 * These schemas mirror the TypeScript types for validation
 */
import { z } from 'zod';
export declare const PositionSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
}, {
    x: number;
    y: number;
}>;
export declare const StatusEffectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    duration: z.ZodNumber;
    effects: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    duration: number;
    effects: Record<string, any>;
}, {
    id: string;
    name: string;
    duration: number;
    effects: Record<string, any>;
}>;
export declare const InventoryItemSchema: z.ZodObject<{
    id: z.ZodString;
    itemId: z.ZodString;
    quantity: z.ZodNumber;
    properties: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    id: string;
    quantity: number;
    properties: Record<string, any>;
}, {
    itemId: string;
    id: string;
    quantity: number;
    properties: Record<string, any>;
}>;
export declare const InventoryStateSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        itemId: z.ZodString;
        quantity: z.ZodNumber;
        properties: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        itemId: string;
        id: string;
        quantity: number;
        properties: Record<string, any>;
    }, {
        itemId: string;
        id: string;
        quantity: number;
        properties: Record<string, any>;
    }>, "many">;
    equippedItems: z.ZodRecord<z.ZodString, z.ZodString>;
    capacity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    items: {
        itemId: string;
        id: string;
        quantity: number;
        properties: Record<string, any>;
    }[];
    equippedItems: Record<string, string>;
    capacity: number;
}, {
    items: {
        itemId: string;
        id: string;
        quantity: number;
        properties: Record<string, any>;
    }[];
    equippedItems: Record<string, string>;
    capacity: number;
}>;
export declare const ActionRequirementSchema: z.ZodObject<{
    type: z.ZodString;
    value: z.ZodAny;
    met: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    type: string;
    met: boolean;
    value?: any;
}, {
    type: string;
    met: boolean;
    value?: any;
}>;
export declare const ActionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["move", "attack", "useItem", "cast", "interact"]>;
    available: z.ZodBoolean;
    requirements: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        value: z.ZodAny;
        met: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        type: string;
        met: boolean;
        value?: any;
    }, {
        type: string;
        met: boolean;
        value?: any;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "move" | "attack" | "useItem" | "cast" | "interact";
    id: string;
    name: string;
    available: boolean;
    requirements: {
        type: string;
        met: boolean;
        value?: any;
    }[];
}, {
    type: "move" | "attack" | "useItem" | "cast" | "interact";
    id: string;
    name: string;
    available: boolean;
    requirements: {
        type: string;
        met: boolean;
        value?: any;
    }[];
}>;
export declare const ParticipantStateSchema: z.ZodEffects<z.ZodObject<{
    entityId: z.ZodString;
    entityType: z.ZodEnum<["playerCharacter", "npc", "monster"]>;
    userId: z.ZodOptional<z.ZodString>;
    currentHP: z.ZodNumber;
    maxHP: z.ZodNumber;
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
    conditions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        duration: z.ZodNumber;
        effects: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        duration: number;
        effects: Record<string, any>;
    }, {
        id: string;
        name: string;
        duration: number;
        effects: Record<string, any>;
    }>, "many">;
    inventory: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            itemId: z.ZodString;
            quantity: z.ZodNumber;
            properties: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            itemId: string;
            id: string;
            quantity: number;
            properties: Record<string, any>;
        }, {
            itemId: string;
            id: string;
            quantity: number;
            properties: Record<string, any>;
        }>, "many">;
        equippedItems: z.ZodRecord<z.ZodString, z.ZodString>;
        capacity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        items: {
            itemId: string;
            id: string;
            quantity: number;
            properties: Record<string, any>;
        }[];
        equippedItems: Record<string, string>;
        capacity: number;
    }, {
        items: {
            itemId: string;
            id: string;
            quantity: number;
            properties: Record<string, any>;
        }[];
        equippedItems: Record<string, string>;
        capacity: number;
    }>;
    availableActions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["move", "attack", "useItem", "cast", "interact"]>;
        available: z.ZodBoolean;
        requirements: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            value: z.ZodAny;
            met: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            type: string;
            met: boolean;
            value?: any;
        }, {
            type: string;
            met: boolean;
            value?: any;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "move" | "attack" | "useItem" | "cast" | "interact";
        id: string;
        name: string;
        available: boolean;
        requirements: {
            type: string;
            met: boolean;
            value?: any;
        }[];
    }, {
        type: "move" | "attack" | "useItem" | "cast" | "interact";
        id: string;
        name: string;
        available: boolean;
        requirements: {
            type: string;
            met: boolean;
            value?: any;
        }[];
    }>, "many">;
    turnStatus: z.ZodEnum<["waiting", "active", "completed", "skipped"]>;
}, "strip", z.ZodTypeAny, {
    entityId: string;
    position: {
        x: number;
        y: number;
    };
    entityType: "playerCharacter" | "npc" | "monster";
    currentHP: number;
    maxHP: number;
    conditions: {
        id: string;
        name: string;
        duration: number;
        effects: Record<string, any>;
    }[];
    inventory: {
        items: {
            itemId: string;
            id: string;
            quantity: number;
            properties: Record<string, any>;
        }[];
        equippedItems: Record<string, string>;
        capacity: number;
    };
    availableActions: {
        type: "move" | "attack" | "useItem" | "cast" | "interact";
        id: string;
        name: string;
        available: boolean;
        requirements: {
            type: string;
            met: boolean;
            value?: any;
        }[];
    }[];
    turnStatus: "waiting" | "active" | "completed" | "skipped";
    userId?: string | undefined;
}, {
    entityId: string;
    position: {
        x: number;
        y: number;
    };
    entityType: "playerCharacter" | "npc" | "monster";
    currentHP: number;
    maxHP: number;
    conditions: {
        id: string;
        name: string;
        duration: number;
        effects: Record<string, any>;
    }[];
    inventory: {
        items: {
            itemId: string;
            id: string;
            quantity: number;
            properties: Record<string, any>;
        }[];
        equippedItems: Record<string, string>;
        capacity: number;
    };
    availableActions: {
        type: "move" | "attack" | "useItem" | "cast" | "interact";
        id: string;
        name: string;
        available: boolean;
        requirements: {
            type: string;
            met: boolean;
            value?: any;
        }[];
    }[];
    turnStatus: "waiting" | "active" | "completed" | "skipped";
    userId?: string | undefined;
}>, {
    entityId: string;
    position: {
        x: number;
        y: number;
    };
    entityType: "playerCharacter" | "npc" | "monster";
    currentHP: number;
    maxHP: number;
    conditions: {
        id: string;
        name: string;
        duration: number;
        effects: Record<string, any>;
    }[];
    inventory: {
        items: {
            itemId: string;
            id: string;
            quantity: number;
            properties: Record<string, any>;
        }[];
        equippedItems: Record<string, string>;
        capacity: number;
    };
    availableActions: {
        type: "move" | "attack" | "useItem" | "cast" | "interact";
        id: string;
        name: string;
        available: boolean;
        requirements: {
            type: string;
            met: boolean;
            value?: any;
        }[];
    }[];
    turnStatus: "waiting" | "active" | "completed" | "skipped";
    userId?: string | undefined;
}, {
    entityId: string;
    position: {
        x: number;
        y: number;
    };
    entityType: "playerCharacter" | "npc" | "monster";
    currentHP: number;
    maxHP: number;
    conditions: {
        id: string;
        name: string;
        duration: number;
        effects: Record<string, any>;
    }[];
    inventory: {
        items: {
            itemId: string;
            id: string;
            quantity: number;
            properties: Record<string, any>;
        }[];
        equippedItems: Record<string, string>;
        capacity: number;
    };
    availableActions: {
        type: "move" | "attack" | "useItem" | "cast" | "interact";
        id: string;
        name: string;
        available: boolean;
        requirements: {
            type: string;
            met: boolean;
            value?: any;
        }[];
    }[];
    turnStatus: "waiting" | "active" | "completed" | "skipped";
    userId?: string | undefined;
}>;
export declare const InitiativeEntrySchema: z.ZodObject<{
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
}>;
export declare const EntityPositionSchema: z.ZodObject<{
    entityId: z.ZodString;
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
    facing: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    entityId: string;
    position: {
        x: number;
        y: number;
    };
    facing?: number | undefined;
}, {
    entityId: string;
    position: {
        x: number;
        y: number;
    };
    facing?: number | undefined;
}>;
export declare const TerrainTileSchema: z.ZodObject<{
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
}>;
export declare const MapStateSchema: z.ZodObject<{
    width: z.ZodNumber;
    height: z.ZodNumber;
    entities: z.ZodRecord<z.ZodString, z.ZodObject<{
        entityId: z.ZodString;
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
        facing: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        facing?: number | undefined;
    }, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        facing?: number | undefined;
    }>>;
    obstacles: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>, "many">;
    terrain: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    width: number;
    height: number;
    entities: Record<string, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        facing?: number | undefined;
    }>;
    obstacles: {
        x: number;
        y: number;
    }[];
    terrain: {
        type: string;
        position: {
            x: number;
            y: number;
        };
        properties: Record<string, any>;
    }[];
}, {
    width: number;
    height: number;
    entities: Record<string, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        facing?: number | undefined;
    }>;
    obstacles: {
        x: number;
        y: number;
    }[];
    terrain: {
        type: string;
        position: {
            x: number;
            y: number;
        };
        properties: Record<string, any>;
    }[];
}>;
export declare const TurnActionSchema: z.ZodObject<{
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
}>;
export declare const TurnRecordSchema: z.ZodObject<{
    entityId: z.ZodString;
    turnNumber: z.ZodNumber;
    roundNumber: z.ZodNumber;
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
    startTime: z.ZodDate;
    endTime: z.ZodOptional<z.ZodDate>;
    status: z.ZodEnum<["completed", "skipped", "timeout"]>;
}, "strip", z.ZodTypeAny, {
    entityId: string;
    status: "completed" | "skipped" | "timeout";
    turnNumber: number;
    roundNumber: number;
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
    startTime: Date;
    endTime?: Date | undefined;
}, {
    entityId: string;
    status: "completed" | "skipped" | "timeout";
    turnNumber: number;
    roundNumber: number;
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
    startTime: Date;
    endTime?: Date | undefined;
}>;
export declare const ChatMessageSchema: z.ZodObject<{
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
export declare const GameStateSchema: z.ZodEffects<z.ZodObject<{
    interactionId: z.ZodString;
    status: z.ZodEnum<["waiting", "active", "paused", "completed"]>;
    initiativeOrder: z.ZodArray<z.ZodObject<{
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
    currentTurnIndex: z.ZodNumber;
    roundNumber: z.ZodNumber;
    participants: z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodObject<{
        entityId: z.ZodString;
        entityType: z.ZodEnum<["playerCharacter", "npc", "monster"]>;
        userId: z.ZodOptional<z.ZodString>;
        currentHP: z.ZodNumber;
        maxHP: z.ZodNumber;
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
        conditions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            duration: z.ZodNumber;
            effects: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }, {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }>, "many">;
        inventory: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                itemId: z.ZodString;
                quantity: z.ZodNumber;
                properties: z.ZodRecord<z.ZodString, z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }, {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }>, "many">;
            equippedItems: z.ZodRecord<z.ZodString, z.ZodString>;
            capacity: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        }, {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        }>;
        availableActions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["move", "attack", "useItem", "cast", "interact"]>;
            available: z.ZodBoolean;
            requirements: z.ZodArray<z.ZodObject<{
                type: z.ZodString;
                value: z.ZodAny;
                met: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                type: string;
                met: boolean;
                value?: any;
            }, {
                type: string;
                met: boolean;
                value?: any;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }, {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }>, "many">;
        turnStatus: z.ZodEnum<["waiting", "active", "completed", "skipped"]>;
    }, "strip", z.ZodTypeAny, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        entityType: "playerCharacter" | "npc" | "monster";
        currentHP: number;
        maxHP: number;
        conditions: {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }[];
        inventory: {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        };
        availableActions: {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }[];
        turnStatus: "waiting" | "active" | "completed" | "skipped";
        userId?: string | undefined;
    }, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        entityType: "playerCharacter" | "npc" | "monster";
        currentHP: number;
        maxHP: number;
        conditions: {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }[];
        inventory: {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        };
        availableActions: {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }[];
        turnStatus: "waiting" | "active" | "completed" | "skipped";
        userId?: string | undefined;
    }>, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        entityType: "playerCharacter" | "npc" | "monster";
        currentHP: number;
        maxHP: number;
        conditions: {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }[];
        inventory: {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        };
        availableActions: {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }[];
        turnStatus: "waiting" | "active" | "completed" | "skipped";
        userId?: string | undefined;
    }, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        entityType: "playerCharacter" | "npc" | "monster";
        currentHP: number;
        maxHP: number;
        conditions: {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }[];
        inventory: {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        };
        availableActions: {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }[];
        turnStatus: "waiting" | "active" | "completed" | "skipped";
        userId?: string | undefined;
    }>>;
    mapState: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        entities: z.ZodRecord<z.ZodString, z.ZodObject<{
            entityId: z.ZodString;
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
            facing: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>>;
        obstacles: z.ZodArray<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>, "many">;
        terrain: z.ZodArray<z.ZodObject<{
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
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        width: number;
        height: number;
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        obstacles: {
            x: number;
            y: number;
        }[];
        terrain: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[];
    }, {
        width: number;
        height: number;
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        obstacles: {
            x: number;
            y: number;
        }[];
        terrain: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[];
    }>;
    turnHistory: z.ZodArray<z.ZodObject<{
        entityId: z.ZodString;
        turnNumber: z.ZodNumber;
        roundNumber: z.ZodNumber;
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
        startTime: z.ZodDate;
        endTime: z.ZodOptional<z.ZodDate>;
        status: z.ZodEnum<["completed", "skipped", "timeout"]>;
    }, "strip", z.ZodTypeAny, {
        entityId: string;
        status: "completed" | "skipped" | "timeout";
        turnNumber: number;
        roundNumber: number;
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
        startTime: Date;
        endTime?: Date | undefined;
    }, {
        entityId: string;
        status: "completed" | "skipped" | "timeout";
        turnNumber: number;
        roundNumber: number;
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
        startTime: Date;
        endTime?: Date | undefined;
    }>, "many">;
    chatLog: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "waiting" | "active" | "completed" | "paused";
    roundNumber: number;
    timestamp: Date;
    interactionId: string;
    initiativeOrder: {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }[];
    currentTurnIndex: number;
    participants: Record<string, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        entityType: "playerCharacter" | "npc" | "monster";
        currentHP: number;
        maxHP: number;
        conditions: {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }[];
        inventory: {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        };
        availableActions: {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }[];
        turnStatus: "waiting" | "active" | "completed" | "skipped";
        userId?: string | undefined;
    }>;
    mapState: {
        width: number;
        height: number;
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        obstacles: {
            x: number;
            y: number;
        }[];
        terrain: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[];
    };
    turnHistory: {
        entityId: string;
        status: "completed" | "skipped" | "timeout";
        turnNumber: number;
        roundNumber: number;
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
        startTime: Date;
        endTime?: Date | undefined;
    }[];
    chatLog: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
}, {
    status: "waiting" | "active" | "completed" | "paused";
    roundNumber: number;
    timestamp: Date;
    interactionId: string;
    initiativeOrder: {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }[];
    currentTurnIndex: number;
    participants: Record<string, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        entityType: "playerCharacter" | "npc" | "monster";
        currentHP: number;
        maxHP: number;
        conditions: {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }[];
        inventory: {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        };
        availableActions: {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }[];
        turnStatus: "waiting" | "active" | "completed" | "skipped";
        userId?: string | undefined;
    }>;
    mapState: {
        width: number;
        height: number;
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        obstacles: {
            x: number;
            y: number;
        }[];
        terrain: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[];
    };
    turnHistory: {
        entityId: string;
        status: "completed" | "skipped" | "timeout";
        turnNumber: number;
        roundNumber: number;
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
        startTime: Date;
        endTime?: Date | undefined;
    }[];
    chatLog: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
}>, {
    status: "waiting" | "active" | "completed" | "paused";
    roundNumber: number;
    timestamp: Date;
    interactionId: string;
    initiativeOrder: {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }[];
    currentTurnIndex: number;
    participants: Record<string, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        entityType: "playerCharacter" | "npc" | "monster";
        currentHP: number;
        maxHP: number;
        conditions: {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }[];
        inventory: {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        };
        availableActions: {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }[];
        turnStatus: "waiting" | "active" | "completed" | "skipped";
        userId?: string | undefined;
    }>;
    mapState: {
        width: number;
        height: number;
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        obstacles: {
            x: number;
            y: number;
        }[];
        terrain: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[];
    };
    turnHistory: {
        entityId: string;
        status: "completed" | "skipped" | "timeout";
        turnNumber: number;
        roundNumber: number;
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
        startTime: Date;
        endTime?: Date | undefined;
    }[];
    chatLog: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
}, {
    status: "waiting" | "active" | "completed" | "paused";
    roundNumber: number;
    timestamp: Date;
    interactionId: string;
    initiativeOrder: {
        initiative: number;
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId?: string | undefined;
    }[];
    currentTurnIndex: number;
    participants: Record<string, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        entityType: "playerCharacter" | "npc" | "monster";
        currentHP: number;
        maxHP: number;
        conditions: {
            id: string;
            name: string;
            duration: number;
            effects: Record<string, any>;
        }[];
        inventory: {
            items: {
                itemId: string;
                id: string;
                quantity: number;
                properties: Record<string, any>;
            }[];
            equippedItems: Record<string, string>;
            capacity: number;
        };
        availableActions: {
            type: "move" | "attack" | "useItem" | "cast" | "interact";
            id: string;
            name: string;
            available: boolean;
            requirements: {
                type: string;
                met: boolean;
                value?: any;
            }[];
        }[];
        turnStatus: "waiting" | "active" | "completed" | "skipped";
        userId?: string | undefined;
    }>;
    mapState: {
        width: number;
        height: number;
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        obstacles: {
            x: number;
            y: number;
        }[];
        terrain: {
            type: string;
            position: {
                x: number;
                y: number;
            };
            properties: Record<string, any>;
        }[];
    };
    turnHistory: {
        entityId: string;
        status: "completed" | "skipped" | "timeout";
        turnNumber: number;
        roundNumber: number;
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
        startTime: Date;
        endTime?: Date | undefined;
    }[];
    chatLog: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
}>;
export declare const ParticipantSchema: z.ZodObject<{
    userId: z.ZodString;
    entityId: z.ZodString;
    entityType: z.ZodEnum<["playerCharacter", "npc", "monster"]>;
    connectionId: z.ZodString;
    isConnected: z.ZodBoolean;
    lastActivity: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    entityId: string;
    entityType: "playerCharacter" | "npc" | "monster";
    userId: string;
    connectionId: string;
    isConnected: boolean;
    lastActivity: Date;
}, {
    entityId: string;
    entityType: "playerCharacter" | "npc" | "monster";
    userId: string;
    connectionId: string;
    isConnected: boolean;
    lastActivity: Date;
}>;
export declare const InteractionRoomSchema: z.ZodObject<{
    id: z.ZodString;
    interactionId: z.ZodString;
    participants: z.ZodRecord<z.ZodString, z.ZodObject<{
        userId: z.ZodString;
        entityId: z.ZodString;
        entityType: z.ZodEnum<["playerCharacter", "npc", "monster"]>;
        connectionId: z.ZodString;
        isConnected: z.ZodBoolean;
        lastActivity: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId: string;
        connectionId: string;
        isConnected: boolean;
        lastActivity: Date;
    }, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId: string;
        connectionId: string;
        isConnected: boolean;
        lastActivity: Date;
    }>>;
    gameState: z.ZodEffects<z.ZodObject<{
        interactionId: z.ZodString;
        status: z.ZodEnum<["waiting", "active", "paused", "completed"]>;
        initiativeOrder: z.ZodArray<z.ZodObject<{
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
        currentTurnIndex: z.ZodNumber;
        roundNumber: z.ZodNumber;
        participants: z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodObject<{
            entityId: z.ZodString;
            entityType: z.ZodEnum<["playerCharacter", "npc", "monster"]>;
            userId: z.ZodOptional<z.ZodString>;
            currentHP: z.ZodNumber;
            maxHP: z.ZodNumber;
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
            conditions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                duration: z.ZodNumber;
                effects: z.ZodRecord<z.ZodString, z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }, {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }>, "many">;
            inventory: z.ZodObject<{
                items: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    itemId: z.ZodString;
                    quantity: z.ZodNumber;
                    properties: z.ZodRecord<z.ZodString, z.ZodAny>;
                }, "strip", z.ZodTypeAny, {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }, {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }>, "many">;
                equippedItems: z.ZodRecord<z.ZodString, z.ZodString>;
                capacity: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            }, {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            }>;
            availableActions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<["move", "attack", "useItem", "cast", "interact"]>;
                available: z.ZodBoolean;
                requirements: z.ZodArray<z.ZodObject<{
                    type: z.ZodString;
                    value: z.ZodAny;
                    met: z.ZodBoolean;
                }, "strip", z.ZodTypeAny, {
                    type: string;
                    met: boolean;
                    value?: any;
                }, {
                    type: string;
                    met: boolean;
                    value?: any;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }, {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }>, "many">;
            turnStatus: z.ZodEnum<["waiting", "active", "completed", "skipped"]>;
        }, "strip", z.ZodTypeAny, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }>, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }>>;
        mapState: z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
            entities: z.ZodRecord<z.ZodString, z.ZodObject<{
                entityId: z.ZodString;
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
                facing: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }>>;
            obstacles: z.ZodArray<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>, "many">;
            terrain: z.ZodArray<z.ZodObject<{
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
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            width: number;
            height: number;
            entities: Record<string, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }>;
            obstacles: {
                x: number;
                y: number;
            }[];
            terrain: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[];
        }, {
            width: number;
            height: number;
            entities: Record<string, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }>;
            obstacles: {
                x: number;
                y: number;
            }[];
            terrain: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[];
        }>;
        turnHistory: z.ZodArray<z.ZodObject<{
            entityId: z.ZodString;
            turnNumber: z.ZodNumber;
            roundNumber: z.ZodNumber;
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
            startTime: z.ZodDate;
            endTime: z.ZodOptional<z.ZodDate>;
            status: z.ZodEnum<["completed", "skipped", "timeout"]>;
        }, "strip", z.ZodTypeAny, {
            entityId: string;
            status: "completed" | "skipped" | "timeout";
            turnNumber: number;
            roundNumber: number;
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
            startTime: Date;
            endTime?: Date | undefined;
        }, {
            entityId: string;
            status: "completed" | "skipped" | "timeout";
            turnNumber: number;
            roundNumber: number;
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
            startTime: Date;
            endTime?: Date | undefined;
        }>, "many">;
        chatLog: z.ZodArray<z.ZodObject<{
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
        }>, "many">;
        timestamp: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        status: "waiting" | "active" | "completed" | "paused";
        roundNumber: number;
        timestamp: Date;
        interactionId: string;
        initiativeOrder: {
            initiative: number;
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            userId?: string | undefined;
        }[];
        currentTurnIndex: number;
        participants: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }>;
        mapState: {
            width: number;
            height: number;
            entities: Record<string, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }>;
            obstacles: {
                x: number;
                y: number;
            }[];
            terrain: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[];
        };
        turnHistory: {
            entityId: string;
            status: "completed" | "skipped" | "timeout";
            turnNumber: number;
            roundNumber: number;
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
            startTime: Date;
            endTime?: Date | undefined;
        }[];
        chatLog: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        }[];
    }, {
        status: "waiting" | "active" | "completed" | "paused";
        roundNumber: number;
        timestamp: Date;
        interactionId: string;
        initiativeOrder: {
            initiative: number;
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            userId?: string | undefined;
        }[];
        currentTurnIndex: number;
        participants: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }>;
        mapState: {
            width: number;
            height: number;
            entities: Record<string, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }>;
            obstacles: {
                x: number;
                y: number;
            }[];
            terrain: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[];
        };
        turnHistory: {
            entityId: string;
            status: "completed" | "skipped" | "timeout";
            turnNumber: number;
            roundNumber: number;
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
            startTime: Date;
            endTime?: Date | undefined;
        }[];
        chatLog: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        }[];
    }>, {
        status: "waiting" | "active" | "completed" | "paused";
        roundNumber: number;
        timestamp: Date;
        interactionId: string;
        initiativeOrder: {
            initiative: number;
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            userId?: string | undefined;
        }[];
        currentTurnIndex: number;
        participants: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }>;
        mapState: {
            width: number;
            height: number;
            entities: Record<string, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }>;
            obstacles: {
                x: number;
                y: number;
            }[];
            terrain: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[];
        };
        turnHistory: {
            entityId: string;
            status: "completed" | "skipped" | "timeout";
            turnNumber: number;
            roundNumber: number;
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
            startTime: Date;
            endTime?: Date | undefined;
        }[];
        chatLog: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        }[];
    }, {
        status: "waiting" | "active" | "completed" | "paused";
        roundNumber: number;
        timestamp: Date;
        interactionId: string;
        initiativeOrder: {
            initiative: number;
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            userId?: string | undefined;
        }[];
        currentTurnIndex: number;
        participants: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }>;
        mapState: {
            width: number;
            height: number;
            entities: Record<string, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }>;
            obstacles: {
                x: number;
                y: number;
            }[];
            terrain: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[];
        };
        turnHistory: {
            entityId: string;
            status: "completed" | "skipped" | "timeout";
            turnNumber: number;
            roundNumber: number;
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
            startTime: Date;
            endTime?: Date | undefined;
        }[];
        chatLog: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        }[];
    }>;
    lastActivity: z.ZodDate;
    status: z.ZodEnum<["active", "paused", "completed"]>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "completed" | "paused";
    id: string;
    interactionId: string;
    participants: Record<string, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId: string;
        connectionId: string;
        isConnected: boolean;
        lastActivity: Date;
    }>;
    lastActivity: Date;
    gameState: {
        status: "waiting" | "active" | "completed" | "paused";
        roundNumber: number;
        timestamp: Date;
        interactionId: string;
        initiativeOrder: {
            initiative: number;
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            userId?: string | undefined;
        }[];
        currentTurnIndex: number;
        participants: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }>;
        mapState: {
            width: number;
            height: number;
            entities: Record<string, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }>;
            obstacles: {
                x: number;
                y: number;
            }[];
            terrain: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[];
        };
        turnHistory: {
            entityId: string;
            status: "completed" | "skipped" | "timeout";
            turnNumber: number;
            roundNumber: number;
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
            startTime: Date;
            endTime?: Date | undefined;
        }[];
        chatLog: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        }[];
    };
}, {
    status: "active" | "completed" | "paused";
    id: string;
    interactionId: string;
    participants: Record<string, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        userId: string;
        connectionId: string;
        isConnected: boolean;
        lastActivity: Date;
    }>;
    lastActivity: Date;
    gameState: {
        status: "waiting" | "active" | "completed" | "paused";
        roundNumber: number;
        timestamp: Date;
        interactionId: string;
        initiativeOrder: {
            initiative: number;
            entityId: string;
            entityType: "playerCharacter" | "npc" | "monster";
            userId?: string | undefined;
        }[];
        currentTurnIndex: number;
        participants: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            entityType: "playerCharacter" | "npc" | "monster";
            currentHP: number;
            maxHP: number;
            conditions: {
                id: string;
                name: string;
                duration: number;
                effects: Record<string, any>;
            }[];
            inventory: {
                items: {
                    itemId: string;
                    id: string;
                    quantity: number;
                    properties: Record<string, any>;
                }[];
                equippedItems: Record<string, string>;
                capacity: number;
            };
            availableActions: {
                type: "move" | "attack" | "useItem" | "cast" | "interact";
                id: string;
                name: string;
                available: boolean;
                requirements: {
                    type: string;
                    met: boolean;
                    value?: any;
                }[];
            }[];
            turnStatus: "waiting" | "active" | "completed" | "skipped";
            userId?: string | undefined;
        }>;
        mapState: {
            width: number;
            height: number;
            entities: Record<string, {
                entityId: string;
                position: {
                    x: number;
                    y: number;
                };
                facing?: number | undefined;
            }>;
            obstacles: {
                x: number;
                y: number;
            }[];
            terrain: {
                type: string;
                position: {
                    x: number;
                    y: number;
                };
                properties: Record<string, any>;
            }[];
        };
        turnHistory: {
            entityId: string;
            status: "completed" | "skipped" | "timeout";
            turnNumber: number;
            roundNumber: number;
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
            startTime: Date;
            endTime?: Date | undefined;
        }[];
        chatLog: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        }[];
    };
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
export declare const StateDeltaSchema: z.ZodObject<{
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
//# sourceMappingURL=core.d.ts.map