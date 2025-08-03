"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createTimer = createTimer;
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};
class Logger {
    currentLevel;
    constructor() {
        const envLevel = (process.env['LOG_LEVEL'] || 'INFO').toUpperCase();
        this.currentLevel = LOG_LEVELS[envLevel] ?? LOG_LEVELS.INFO;
    }
    shouldLog(level) {
        return LOG_LEVELS[level] <= this.currentLevel;
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level}: ${message}${metaStr}`;
    }
    log(level, message, meta) {
        if (!this.shouldLog(level))
            return;
        const formattedMessage = this.formatMessage(level, message, meta);
        switch (level) {
            case 'ERROR':
                console.error(formattedMessage);
                break;
            case 'WARN':
                console.warn(formattedMessage);
                break;
            case 'INFO':
                console.info(formattedMessage);
                break;
            case 'DEBUG':
                console.debug(formattedMessage);
                break;
        }
    }
    error(message, meta) {
        this.log('ERROR', message, meta);
    }
    warn(message, meta) {
        this.log('WARN', message, meta);
    }
    info(message, meta) {
        this.log('INFO', message, meta);
    }
    debug(message, meta) {
        this.log('DEBUG', message, meta);
    }
    child(context) {
        const childLogger = new Logger();
        const originalLog = childLogger.log.bind(childLogger);
        childLogger.log = (level, message, meta) => {
            const combinedMeta = { ...context, ...meta };
            originalLog(level, message, combinedMeta);
        };
        return childLogger;
    }
}
exports.logger = new Logger();
function createTimer(label) {
    const start = Date.now();
    return {
        end: (meta) => {
            const duration = Date.now() - start;
            exports.logger.debug(`Timer: ${label}`, { duration: `${duration}ms`, ...meta });
            return duration;
        },
    };
}
//# sourceMappingURL=logger.js.map