import { ChatMessage, GameState, Participant } from '../types';
import { EventBroadcaster } from './EventBroadcaster';
export interface ChatServiceConfig {
    maxMessageLength?: number;
    maxHistorySize?: number;
    enableProfanityFilter?: boolean;
    rateLimitPerMinute?: number;
    allowPrivateMessages?: boolean;
}
export type ChatChannelType = 'party' | 'dm' | 'private' | 'system';
export declare class ChatService {
    private config;
    private eventBroadcaster;
    private rateLimitTrackers;
    private profanityWords;
    constructor(eventBroadcaster: EventBroadcaster, config?: ChatServiceConfig);
    sendMessage(interactionId: string, userId: string, content: string, type: ChatChannelType, recipients?: string[], entityId?: string): Promise<ChatMessage>;
    getChatHistory(gameState: GameState, userId: string, channelType?: ChatChannelType, limit?: number): ChatMessage[];
    addMessageToHistory(gameState: GameState, message: ChatMessage): void;
    sendSystemMessage(interactionId: string, content: string, recipients?: string[]): Promise<ChatMessage>;
    validateChatPermissions(userId: string, type: ChatChannelType, participants: Map<string, Participant>, recipients?: string[]): {
        allowed: boolean;
        reason?: string;
    };
    private generateMessageId;
    private filterMessage;
    private applyProfanityFilter;
    private checkRateLimit;
    private updateRateLimit;
    private broadcastMessage;
    private canUserSeeMessage;
    private initializeProfanityFilter;
    private startRateLimitCleanup;
    cleanup(): void;
}
//# sourceMappingURL=ChatService.d.ts.map