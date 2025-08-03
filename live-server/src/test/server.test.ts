import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { appRouter } from '../routers';
import { createContext } from '../middleware/context';

describe('tRPC Server Foundation', () => {
  let server: ReturnType<typeof createServer>;
  let wss: WebSocketServer;

  beforeAll(() => {
    server = createServer();
    wss = new WebSocketServer({ server });
  });

  afterAll(() => {
    wss.close();
    server.close();
  });

  it('should create app router successfully', () => {
    expect(appRouter).toBeDefined();
    expect(typeof appRouter).toBe('object');
  });

  it('should have interaction router', () => {
    expect(appRouter.interaction).toBeDefined();
  });

  it('should create context without authentication', async () => {
    const mockReq = {
      headers: {},
    } as any;
    const mockRes = {} as any;

    const context = await createContext({ req: mockReq, res: mockRes });
    
    expect(context).toBeDefined();
    expect(context.user).toBeNull();
  });

  it('should handle health check', async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: undefined,
    });

    const result = await caller.interaction.health();
    
    expect(result).toBeDefined();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('live-interaction-system');
    expect(result.timestamp).toBeDefined();
  });
});