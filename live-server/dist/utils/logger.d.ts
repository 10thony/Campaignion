declare class Logger {
    private currentLevel;
    constructor();
    private shouldLog;
    private formatMessage;
    private log;
    error(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
    child(context: Record<string, any>): Logger;
}
export declare const logger: Logger;
export declare function createTimer(label: string): {
    end: (meta?: Record<string, any>) => number;
};
export {};
//# sourceMappingURL=logger.d.ts.map