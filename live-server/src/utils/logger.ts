interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

type LogLevelKey = keyof LogLevel;

class Logger {
  private currentLevel: number;

  constructor() {
    const envLevel = (process.env['LOG_LEVEL'] || 'INFO').toUpperCase() as LogLevelKey;
    this.currentLevel = LOG_LEVELS[envLevel] ?? LOG_LEVELS.INFO;
  }

  private shouldLog(level: LogLevelKey): boolean {
    return LOG_LEVELS[level] <= this.currentLevel;
  }

  private formatMessage(level: LogLevelKey, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  private log(level: LogLevelKey, message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

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

  error(message: string, meta?: Record<string, any>): void {
    this.log('ERROR', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('WARN', message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('INFO', message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('DEBUG', message, meta);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevelKey, message: string, meta?: Record<string, any>) => {
      const combinedMeta = { ...context, ...meta };
      originalLog(level, message, combinedMeta);
    };
    
    return childLogger;
  }
}

export const logger = new Logger();

/**
 * Performance timing utility
 */
export function createTimer(label: string) {
  const start = Date.now();
  
  return {
    end: (meta?: Record<string, any>) => {
      const duration = Date.now() - start;
      logger.debug(`Timer: ${label}`, { duration: `${duration}ms`, ...meta });
      return duration;
    },
  };
}