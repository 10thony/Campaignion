import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import { verifyToken } from '@clerk/backend';
import { logger } from '../utils/logger';

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  orgId?: string | undefined;
}

export interface TRPCContext {
  user: AuthenticatedUser | null;
  req?: Request;
  connectionId?: string;
}

/**
 * Creates context for HTTP requests
 */
export async function createHTTPContext({ req }: CreateExpressContextOptions): Promise<TRPCContext> {
  const authHeader = req.headers.authorization;
  let user: AuthenticatedUser | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const secretKey = process.env['CLERK_SECRET_KEY'];
      if (!secretKey) {
        logger.error('CLERK_SECRET_KEY environment variable is not set');
        throw new Error('Authentication configuration error');
      }

      const payload = await verifyToken(token, {
        secretKey,
        issuer: (iss) => iss.startsWith('https://clerk.'),
      });

      if (payload.sub) {
        user = {
          userId: payload.sub,
          sessionId: payload.sid || '',
          orgId: payload.org_id || undefined,
        };

        logger.debug('User authenticated via HTTP', {
          userId: user.userId,
          sessionId: user.sessionId,
          orgId: user.orgId,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    } catch (error) {
      logger.warn('Failed to verify Clerk token via HTTP', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenPrefix: token.substring(0, 10) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  } else if (authHeader) {
    logger.warn('Invalid authorization header format', {
      headerPrefix: authHeader.substring(0, 10) + '...',
      ip: req.ip
    });
  }

  return {
    user,
    req: req as unknown as Request,
  };
}

/**
 * Creates context for WebSocket connections
 */
export async function createWSContext({ req }: CreateWSSContextFnOptions): Promise<TRPCContext> {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  let user: AuthenticatedUser | null = null;
  const connectionId = generateConnectionId();

  if (token) {
    try {
      const secretKey = process.env['CLERK_SECRET_KEY'];
      if (!secretKey) {
        logger.error('CLERK_SECRET_KEY environment variable is not set');
        throw new Error('Authentication configuration error');
      }

      const payload = await verifyToken(token, {
        secretKey,
        issuer: (iss) => iss.startsWith('https://clerk.'),
      });

      if (payload.sub) {
        user = {
          userId: payload.sub,
          sessionId: payload.sid || '',
          orgId: payload.org_id || undefined,
        };

        logger.debug('User authenticated via WebSocket', {
          userId: user.userId,
          sessionId: user.sessionId,
          orgId: user.orgId,
          connectionId,
          ip: req.socket.remoteAddress
        });
      }
    } catch (error) {
      logger.warn('Failed to verify Clerk token via WebSocket', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenPrefix: token.substring(0, 10) + '...',
        connectionId,
        ip: req.socket.remoteAddress
      });
    }
  } else {
    logger.debug('WebSocket connection without token', {
      connectionId,
      ip: req.socket.remoteAddress
    });
  }

  return {
    user,
    connectionId,
  };
}

/**
 * Universal context creator that handles both HTTP and WebSocket
 */
export async function createContext(opts: CreateExpressContextOptions | CreateWSSContextFnOptions): Promise<TRPCContext> {
  // Check if this is a WebSocket context by looking for the 'info' property
  if ('info' in opts) {
    return createWSContext(opts as CreateWSSContextFnOptions);
  } else {
    return createHTTPContext(opts as CreateExpressContextOptions);
  }
}

function generateConnectionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export type Context = inferAsyncReturnType<typeof createContext>;