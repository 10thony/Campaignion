import { router } from '../utils/trpc';
import { interactionRouter } from './interaction';
import { testModeRouter } from './testMode';

/**
 * Main application router that combines all sub-routers
 */
export const appRouter = router({
  interaction: interactionRouter,
  testMode: testModeRouter,
});

export type AppRouter = typeof appRouter;