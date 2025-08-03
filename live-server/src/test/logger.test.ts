import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createTimer } from '../utils/logger';

describe('Logger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log error messages', () => {
    logger.error('Test error message');
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining('ERROR: Test error message')
    );
  });

  it('should log warning messages', () => {
    logger.warn('Test warning message');
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringContaining('WARN: Test warning message')
    );
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(consoleSpy.info).toHaveBeenCalledWith(
      expect.stringContaining('INFO: Test info message')
    );
  });

  it('should include metadata in log messages', () => {
    const metadata = { userId: 'test-123', action: 'test-action' };
    logger.info('Test message with metadata', metadata);
    
    expect(consoleSpy.info).toHaveBeenCalledWith(
      expect.stringContaining(JSON.stringify(metadata))
    );
  });

  it('should create child logger with context', () => {
    const childLogger = logger.child({ service: 'test-service' });
    childLogger.info('Child logger message');
    
    expect(consoleSpy.info).toHaveBeenCalledWith(
      expect.stringContaining('"service":"test-service"')
    );
  });
});

describe('Timer', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should measure execution time', async () => {
    // Set LOG_LEVEL to DEBUG for this test
    const originalLogLevel = process.env['LOG_LEVEL'];
    process.env['LOG_LEVEL'] = 'DEBUG';
    
    const timer = createTimer('test-operation');
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const duration = timer.end();
    
    expect(duration).toBeGreaterThan(0);
    
    // Restore original log level
    process.env['LOG_LEVEL'] = originalLogLevel;
  });
});