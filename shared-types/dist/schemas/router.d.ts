/**
 * Zod schemas for tRPC router input/output validation
 * These schemas provide runtime validation for API calls
 */
import { z } from 'zod';
export declare const JoinRoomInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
    entityId: z.ZodString;
    entityType: z.ZodEnum<["playerCharacter", "npc", "monster"]>;
}, "strip", z.ZodTypeAny, {
    entityId: string;
    entityType: "playerCharacter" | "npc" | "monster";
    interactionId: string;
}, {
    entityId: string;
    entityType: "playerCharacter" | "npc" | "monster";
    interactionId: string;
}>;
export declare const LeaveRoomInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    interactionId: string;
}, {
    interactionId: string;
}>;
export declare const PauseInteractionInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
    reason: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    interactionId: string;
    reason: string;
}, {
    interactionId: string;
    reason?: string | undefined;
}>;
export declare const ResumeInteractionInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    interactionId: string;
}, {
    interactionId: string;
}>;
export declare const SkipTurnInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
    reason: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    interactionId: string;
    reason: string;
}, {
    interactionId: string;
    reason?: string | undefined;
}>;
export declare const BacktrackTurnInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
    turnNumber: z.ZodNumber;
    reason: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    turnNumber: number;
    interactionId: string;
    reason: string;
}, {
    turnNumber: number;
    interactionId: string;
    reason?: string | undefined;
}>;
export declare const RoomUpdatesInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    interactionId: string;
}, {
    interactionId: string;
}>;
export declare const GetRoomStateInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    interactionId: string;
}, {
    interactionId: string;
}>;
export declare const SendChatMessageInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
    content: z.ZodString;
    type: z.ZodEnum<["party", "dm", "private"]>;
    recipients: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    entityId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "party" | "dm" | "private";
    content: string;
    interactionId: string;
    entityId?: string | undefined;
    recipients?: string[] | undefined;
}, {
    type: "party" | "dm" | "private";
    content: string;
    interactionId: string;
    entityId?: string | undefined;
    recipients?: string[] | undefined;
}>;
export declare const GetChatHistoryInputSchema: z.ZodObject<{
    interactionId: z.ZodString;
    channelType: z.ZodOptional<z.ZodEnum<["party", "dm", "private", "system"]>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    interactionId: string;
    limit: number;
    channelType?: "party" | "dm" | "private" | "system" | undefined;
}, {
    interactionId: string;
    limit?: number | undefined;
    channelType?: "party" | "dm" | "private" | "system" | undefined;
}>;
export declare const HealthOutputSchema: z.ZodObject<{
    status: z.ZodString;
    timestamp: z.ZodString;
    service: z.ZodString;
    stats: z.ZodObject<{
        activeRooms: z.ZodNumber;
        totalParticipants: z.ZodNumber;
        uptime: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        activeRooms: number;
        totalParticipants: number;
        uptime: number;
    }, {
        activeRooms: number;
        totalParticipants: number;
        uptime: number;
    }>;
}, "strip", z.ZodTypeAny, {
    status: string;
    timestamp: string;
    service: string;
    stats: {
        activeRooms: number;
        totalParticipants: number;
        uptime: number;
    };
}, {
    status: string;
    timestamp: string;
    service: string;
    stats: {
        activeRooms: number;
        totalParticipants: number;
        uptime: number;
    };
}>;
export declare const JoinRoomOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    roomId: z.ZodString;
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
    participantCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
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
    success: boolean;
    participantCount: number;
    roomId: string;
}, {
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
    success: boolean;
    participantCount: number;
    roomId: string;
}>;
export declare const LeaveRoomOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
}, {
    message: string;
    success: boolean;
}>;
export declare const PauseInteractionOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    reason: string;
    success: boolean;
}, {
    message: string;
    reason: string;
    success: boolean;
}>;
export declare const ResumeInteractionOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
}, {
    message: string;
    success: boolean;
}>;
export declare const TakeTurnOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    result: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
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
    success: boolean;
    result: {
        valid: boolean;
        errors: string[];
        warnings?: string[] | undefined;
    };
}, {
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
    success: boolean;
    result: {
        valid: boolean;
        errors: string[];
        warnings?: string[] | undefined;
    };
}>;
export declare const SkipTurnOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
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
}, "strip", z.ZodTypeAny, {
    message: string;
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
    success: boolean;
}, {
    message: string;
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
    success: boolean;
}>;
export declare const BacktrackTurnOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    turnNumber: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    turnNumber: number;
    reason: string;
    success: boolean;
}, {
    message: string;
    turnNumber: number;
    reason: string;
    success: boolean;
}>;
export declare const GetRoomStateOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
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
    roomId: z.ZodString;
    participantCount: z.ZodNumber;
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
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
    success: boolean;
    participantCount: number;
    roomId: string;
}, {
    status: string;
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
    success: boolean;
    participantCount: number;
    roomId: string;
}>;
export declare const SendChatMessageOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
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
    message: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    success: boolean;
}, {
    message: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    };
    success: boolean;
}>;
export declare const GetChatHistoryOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    messages: z.ZodArray<z.ZodObject<{
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
    totalCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    messages: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
    totalCount: number;
}, {
    success: boolean;
    messages: {
        type: "party" | "dm" | "private" | "system";
        id: string;
        userId: string;
        content: string;
        timestamp: number;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }[];
    totalCount: number;
}>;
export declare const TestModeInputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
export declare const TestModeOutputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
export declare const RouterInputSchemas: {
    readonly 'interaction.health': z.ZodVoid;
    readonly 'interaction.joinRoom': z.ZodObject<{
        interactionId: z.ZodString;
        entityId: z.ZodString;
        entityType: z.ZodEnum<["playerCharacter", "npc", "monster"]>;
    }, "strip", z.ZodTypeAny, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        interactionId: string;
    }, {
        entityId: string;
        entityType: "playerCharacter" | "npc" | "monster";
        interactionId: string;
    }>;
    readonly 'interaction.leaveRoom': z.ZodObject<{
        interactionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        interactionId: string;
    }, {
        interactionId: string;
    }>;
    readonly 'interaction.pauseInteraction': z.ZodObject<{
        interactionId: z.ZodString;
        reason: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        interactionId: string;
        reason: string;
    }, {
        interactionId: string;
        reason?: string | undefined;
    }>;
    readonly 'interaction.resumeInteraction': z.ZodObject<{
        interactionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        interactionId: string;
    }, {
        interactionId: string;
    }>;
    readonly 'interaction.takeTurn': z.ZodObject<{
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
    readonly 'interaction.skipTurn': z.ZodObject<{
        interactionId: z.ZodString;
        reason: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        interactionId: string;
        reason: string;
    }, {
        interactionId: string;
        reason?: string | undefined;
    }>;
    readonly 'interaction.backtrackTurn': z.ZodObject<{
        interactionId: z.ZodString;
        turnNumber: z.ZodNumber;
        reason: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        turnNumber: number;
        interactionId: string;
        reason: string;
    }, {
        turnNumber: number;
        interactionId: string;
        reason?: string | undefined;
    }>;
    readonly 'interaction.roomUpdates': z.ZodObject<{
        interactionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        interactionId: string;
    }, {
        interactionId: string;
    }>;
    readonly 'interaction.getRoomState': z.ZodObject<{
        interactionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        interactionId: string;
    }, {
        interactionId: string;
    }>;
    readonly 'interaction.sendChatMessage': z.ZodObject<{
        interactionId: z.ZodString;
        content: z.ZodString;
        type: z.ZodEnum<["party", "dm", "private"]>;
        recipients: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        entityId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "party" | "dm" | "private";
        content: string;
        interactionId: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }, {
        type: "party" | "dm" | "private";
        content: string;
        interactionId: string;
        entityId?: string | undefined;
        recipients?: string[] | undefined;
    }>;
    readonly 'interaction.getChatHistory': z.ZodObject<{
        interactionId: z.ZodString;
        channelType: z.ZodOptional<z.ZodEnum<["party", "dm", "private", "system"]>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        interactionId: string;
        limit: number;
        channelType?: "party" | "dm" | "private" | "system" | undefined;
    }, {
        interactionId: string;
        limit?: number | undefined;
        channelType?: "party" | "dm" | "private" | "system" | undefined;
    }>;
    readonly 'testMode.createTestInteraction': z.ZodRecord<z.ZodString, z.ZodAny>;
    readonly 'testMode.simulateActions': z.ZodRecord<z.ZodString, z.ZodAny>;
    readonly 'testMode.getTestStats': z.ZodVoid;
};
export declare const RouterOutputSchemas: {
    readonly 'interaction.health': z.ZodObject<{
        status: z.ZodString;
        timestamp: z.ZodString;
        service: z.ZodString;
        stats: z.ZodObject<{
            activeRooms: z.ZodNumber;
            totalParticipants: z.ZodNumber;
            uptime: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            activeRooms: number;
            totalParticipants: number;
            uptime: number;
        }, {
            activeRooms: number;
            totalParticipants: number;
            uptime: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        status: string;
        timestamp: string;
        service: string;
        stats: {
            activeRooms: number;
            totalParticipants: number;
            uptime: number;
        };
    }, {
        status: string;
        timestamp: string;
        service: string;
        stats: {
            activeRooms: number;
            totalParticipants: number;
            uptime: number;
        };
    }>;
    readonly 'interaction.joinRoom': z.ZodObject<{
        success: z.ZodBoolean;
        roomId: z.ZodString;
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
        participantCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
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
        success: boolean;
        participantCount: number;
        roomId: string;
    }, {
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
        success: boolean;
        participantCount: number;
        roomId: string;
    }>;
    readonly 'interaction.leaveRoom': z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        success: boolean;
    }, {
        message: string;
        success: boolean;
    }>;
    readonly 'interaction.pauseInteraction': z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        reason: string;
        success: boolean;
    }, {
        message: string;
        reason: string;
        success: boolean;
    }>;
    readonly 'interaction.resumeInteraction': z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        success: boolean;
    }, {
        message: string;
        success: boolean;
    }>;
    readonly 'interaction.takeTurn': z.ZodObject<{
        success: z.ZodBoolean;
        result: z.ZodObject<{
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
    }, "strip", z.ZodTypeAny, {
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
        success: boolean;
        result: {
            valid: boolean;
            errors: string[];
            warnings?: string[] | undefined;
        };
    }, {
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
        success: boolean;
        result: {
            valid: boolean;
            errors: string[];
            warnings?: string[] | undefined;
        };
    }>;
    readonly 'interaction.skipTurn': z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
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
    }, "strip", z.ZodTypeAny, {
        message: string;
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
        success: boolean;
    }, {
        message: string;
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
        success: boolean;
    }>;
    readonly 'interaction.backtrackTurn': z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
        turnNumber: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        turnNumber: number;
        reason: string;
        success: boolean;
    }, {
        message: string;
        turnNumber: number;
        reason: string;
        success: boolean;
    }>;
    readonly 'interaction.roomUpdates': z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
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
    readonly 'interaction.getRoomState': z.ZodObject<{
        success: z.ZodBoolean;
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
        roomId: z.ZodString;
        participantCount: z.ZodNumber;
        status: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: string;
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
        success: boolean;
        participantCount: number;
        roomId: string;
    }, {
        status: string;
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
        success: boolean;
        participantCount: number;
        roomId: string;
    }>;
    readonly 'interaction.sendChatMessage': z.ZodObject<{
        success: z.ZodBoolean;
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
        message: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        };
        success: boolean;
    }, {
        message: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        };
        success: boolean;
    }>;
    readonly 'interaction.getChatHistory': z.ZodObject<{
        success: z.ZodBoolean;
        messages: z.ZodArray<z.ZodObject<{
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
        totalCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        messages: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        }[];
        totalCount: number;
    }, {
        success: boolean;
        messages: {
            type: "party" | "dm" | "private" | "system";
            id: string;
            userId: string;
            content: string;
            timestamp: number;
            entityId?: string | undefined;
            recipients?: string[] | undefined;
        }[];
        totalCount: number;
    }>;
    readonly 'testMode.createTestInteraction': z.ZodRecord<z.ZodString, z.ZodAny>;
    readonly 'testMode.simulateActions': z.ZodRecord<z.ZodString, z.ZodAny>;
    readonly 'testMode.getTestStats': z.ZodRecord<z.ZodString, z.ZodAny>;
};
export declare function validateRouterInput<K extends keyof typeof RouterInputSchemas>(procedure: K, input: unknown): z.infer<typeof RouterInputSchemas[K]>;
export declare function validateRouterOutput<K extends keyof typeof RouterOutputSchemas>(procedure: K, output: unknown): z.infer<typeof RouterOutputSchemas[K]>;
//# sourceMappingURL=router.d.ts.map