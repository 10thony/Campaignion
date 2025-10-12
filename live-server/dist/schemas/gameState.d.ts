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
    duration: number;
    id: string;
    name: string;
    effects: Record<string, any>;
}, {
    duration: number;
    id: string;
    name: string;
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
        duration: number;
        id: string;
        name: string;
        effects: Record<string, any>;
    }, {
        duration: number;
        id: string;
        name: string;
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
    entityType: "playerCharacter" | "npc" | "monster";
    position: {
        x: number;
        y: number;
    };
    currentHP: number;
    maxHP: number;
    conditions: {
        duration: number;
        id: string;
        name: string;
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
    turnStatus: "active" | "completed" | "waiting" | "skipped";
    userId?: string | undefined;
}, {
    entityId: string;
    entityType: "playerCharacter" | "npc" | "monster";
    position: {
        x: number;
        y: number;
    };
    currentHP: number;
    maxHP: number;
    conditions: {
        duration: number;
        id: string;
        name: string;
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
    turnStatus: "active" | "completed" | "waiting" | "skipped";
    userId?: string | undefined;
}>, {
    entityId: string;
    entityType: "playerCharacter" | "npc" | "monster";
    position: {
        x: number;
        y: number;
    };
    currentHP: number;
    maxHP: number;
    conditions: {
        duration: number;
        id: string;
        name: string;
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
    turnStatus: "active" | "completed" | "waiting" | "skipped";
    userId?: string | undefined;
}, {
    entityId: string;
    entityType: "playerCharacter" | "npc" | "monster";
    position: {
        x: number;
        y: number;
    };
    currentHP: number;
    maxHP: number;
    conditions: {
        duration: number;
        id: string;
        name: string;
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
    turnStatus: "active" | "completed" | "waiting" | "skipped";
    userId?: string | undefined;
}>;
export declare const InitiativeEntrySchema: z.ZodObject<{
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
    entities: Record<string, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        facing?: number | undefined;
    }>;
    width: number;
    height: number;
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
    entities: Record<string, {
        entityId: string;
        position: {
            x: number;
            y: number;
        };
        facing?: number | undefined;
    }>;
    width: number;
    height: number;
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
    startTime: z.ZodDate;
    endTime: z.ZodOptional<z.ZodDate>;
    status: z.ZodEnum<["completed", "skipped", "timeout"]>;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "timeout" | "skipped";
    entityId: string;
    turnNumber: number;
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
    roundNumber: number;
    startTime: Date;
    endTime?: Date | undefined;
}, {
    status: "completed" | "timeout" | "skipped";
    entityId: string;
    turnNumber: number;
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
    roundNumber: number;
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
export declare const GameStateSchema: z.ZodEffects<z.ZodObject<{
    interactionId: z.ZodString;
    status: z.ZodEnum<["waiting", "active", "paused", "completed"]>;
    initiativeOrder: z.ZodArray<z.ZodObject<{
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
            duration: number;
            id: string;
            name: string;
            effects: Record<string, any>;
        }, {
            duration: number;
            id: string;
            name: string;
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
        entityType: "playerCharacter" | "npc" | "monster";
        position: {
            x: number;
            y: number;
        };
        currentHP: number;
        maxHP: number;
        conditions: {
            duration: number;
            id: string;
            name: string;
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
        turnStatus: "active" | "completed" | "waiting" | "skipped";
        userId?: string | undefined;
    }, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        position: {
            x: number;
            y: number;
        };
        currentHP: number;
        maxHP: number;
        conditions: {
            duration: number;
            id: string;
            name: string;
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
        turnStatus: "active" | "completed" | "waiting" | "skipped";
        userId?: string | undefined;
    }>, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        position: {
            x: number;
            y: number;
        };
        currentHP: number;
        maxHP: number;
        conditions: {
            duration: number;
            id: string;
            name: string;
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
        turnStatus: "active" | "completed" | "waiting" | "skipped";
        userId?: string | undefined;
    }, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        position: {
            x: number;
            y: number;
        };
        currentHP: number;
        maxHP: number;
        conditions: {
            duration: number;
            id: string;
            name: string;
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
        turnStatus: "active" | "completed" | "waiting" | "skipped";
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
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        width: number;
        height: number;
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
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        width: number;
        height: number;
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
        startTime: z.ZodDate;
        endTime: z.ZodOptional<z.ZodDate>;
        status: z.ZodEnum<["completed", "skipped", "timeout"]>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "timeout" | "skipped";
        entityId: string;
        turnNumber: number;
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
        roundNumber: number;
        startTime: Date;
        endTime?: Date | undefined;
    }, {
        status: "completed" | "timeout" | "skipped";
        entityId: string;
        turnNumber: number;
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
        roundNumber: number;
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
    }>, "many">;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    status: "active" | "paused" | "completed" | "waiting";
    interactionId: string;
    initiativeOrder: {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }[];
    currentTurnIndex: number;
    roundNumber: number;
    participants: Record<string, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        position: {
            x: number;
            y: number;
        };
        currentHP: number;
        maxHP: number;
        conditions: {
            duration: number;
            id: string;
            name: string;
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
        turnStatus: "active" | "completed" | "waiting" | "skipped";
        userId?: string | undefined;
    }>;
    mapState: {
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        width: number;
        height: number;
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
        status: "completed" | "timeout" | "skipped";
        entityId: string;
        turnNumber: number;
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
        roundNumber: number;
        startTime: Date;
        endTime?: Date | undefined;
    }[];
    chatLog: {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
}, {
    timestamp: Date;
    status: "active" | "paused" | "completed" | "waiting";
    interactionId: string;
    initiativeOrder: {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }[];
    currentTurnIndex: number;
    roundNumber: number;
    participants: Record<string, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        position: {
            x: number;
            y: number;
        };
        currentHP: number;
        maxHP: number;
        conditions: {
            duration: number;
            id: string;
            name: string;
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
        turnStatus: "active" | "completed" | "waiting" | "skipped";
        userId?: string | undefined;
    }>;
    mapState: {
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        width: number;
        height: number;
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
        status: "completed" | "timeout" | "skipped";
        entityId: string;
        turnNumber: number;
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
        roundNumber: number;
        startTime: Date;
        endTime?: Date | undefined;
    }[];
    chatLog: {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
}>, {
    timestamp: Date;
    status: "active" | "paused" | "completed" | "waiting";
    interactionId: string;
    initiativeOrder: {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }[];
    currentTurnIndex: number;
    roundNumber: number;
    participants: Record<string, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        position: {
            x: number;
            y: number;
        };
        currentHP: number;
        maxHP: number;
        conditions: {
            duration: number;
            id: string;
            name: string;
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
        turnStatus: "active" | "completed" | "waiting" | "skipped";
        userId?: string | undefined;
    }>;
    mapState: {
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        width: number;
        height: number;
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
        status: "completed" | "timeout" | "skipped";
        entityId: string;
        turnNumber: number;
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
        roundNumber: number;
        startTime: Date;
        endTime?: Date | undefined;
    }[];
    chatLog: {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
}, {
    timestamp: Date;
    status: "active" | "paused" | "completed" | "waiting";
    interactionId: string;
    initiativeOrder: {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        initiative: number;
        userId?: string | undefined;
    }[];
    currentTurnIndex: number;
    roundNumber: number;
    participants: Record<string, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        position: {
            x: number;
            y: number;
        };
        currentHP: number;
        maxHP: number;
        conditions: {
            duration: number;
            id: string;
            name: string;
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
        turnStatus: "active" | "completed" | "waiting" | "skipped";
        userId?: string | undefined;
    }>;
    mapState: {
        entities: Record<string, {
            entityId: string;
            position: {
                x: number;
                y: number;
            };
            facing?: number | undefined;
        }>;
        width: number;
        height: number;
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
        status: "completed" | "timeout" | "skipped";
        entityId: string;
        turnNumber: number;
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
        roundNumber: number;
        startTime: Date;
        endTime?: Date | undefined;
    }[];
    chatLog: {
        userId: string;
        timestamp: number;
        type: "party" | "dm" | "private" | "system";
        content: string;
        id: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
}>;
export type Position = z.infer<typeof PositionSchema>;
export type StatusEffect = z.infer<typeof StatusEffectSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryState = z.infer<typeof InventoryStateSchema>;
export type ActionRequirement = z.infer<typeof ActionRequirementSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type ParticipantState = z.infer<typeof ParticipantStateSchema>;
export type InitiativeEntry = z.infer<typeof InitiativeEntrySchema>;
export type EntityPosition = z.infer<typeof EntityPositionSchema>;
export type TerrainTile = z.infer<typeof TerrainTileSchema>;
export type MapState = z.infer<typeof MapStateSchema>;
export type TurnAction = z.infer<typeof TurnActionSchema>;
export type TurnRecord = z.infer<typeof TurnRecordSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
//# sourceMappingURL=gameState.d.ts.map