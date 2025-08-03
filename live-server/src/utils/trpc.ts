import { initTRPC } from '@trpc/server';
import { Context } from '../middleware/context';
import { logger } from '../utils/logger';

/**
 * Initialize tRPC with context type
 */
const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape, error }) => {
    logger.error('tRPC Error', {
      code: error.code,
      message: error.message,
      cause: error.cause,
      stack: error.stack,
    });

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.code === 'BAD_REQUEST' && error.cause ? error.cause : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;