import { ConvexHttpClient } from 'convex/browser';
import { getConvexConfig } from './index';
import { logger } from '../utils/logger';

let convexClient: ConvexHttpClient | null = null;

export function createConvexClient(): ConvexHttpClient {
  if (convexClient) {
    return convexClient;
  }

  const convexConfig = getConvexConfig();
  
  try {
    convexClient = new ConvexHttpClient(convexConfig.url);
    
    logger.info('Convex client initialized successfully', {
      url: convexConfig.url,
      hasDeployKey: !!convexConfig.deployKey,
    });
    
    return convexClient;
  } catch (error) {
    logger.error('Failed to initialize Convex client', {
      error: error instanceof Error ? error.message : String(error),
      url: convexConfig.url,
    });
    throw new Error(`Failed to initialize Convex client: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    return createConvexClient();
  }
  return convexClient;
}

// Health check function for Convex connection
export async function checkConvexConnection(): Promise<boolean> {
  try {
    const client = getConvexClient();
    
    // Try to perform a simple query to test the connection
    // This assumes there's a basic query available - we'll use a system query
    await client.query('_system/listTables' as any);
    
    logger.debug('Convex connection health check passed');
    return true;
  } catch (error) {
    logger.error('Convex connection health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// Graceful shutdown
export function closeConvexClient(): void {
  if (convexClient) {
    try {
      // ConvexHttpClient doesn't have an explicit close method
      // but we can clear our reference
      convexClient = null;
      logger.info('Convex client connection closed');
    } catch (error) {
      logger.error('Error closing Convex client', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Export the client getter for use throughout the application
export { convexClient };