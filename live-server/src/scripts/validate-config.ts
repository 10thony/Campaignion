#!/usr/bin/env tsx

/**
 * Configuration validation script
 * Run this script to validate your environment configuration before starting the server
 */

import { config, ConfigurationError } from '../config';
import { createConvexClient, checkConvexConnection } from '../config/convex';

async function validateConfiguration() {
  console.log('🔍 Validating Live Server Configuration...\n');

  try {
    // Configuration is already validated during import
    console.log('✅ Environment variables validation passed');
    
    // Display current configuration (without sensitive data)
    console.log('\n📋 Current Configuration:');
    console.log(`  Environment: ${config.NODE_ENV}`);
    console.log(`  Port: ${config.PORT}`);
    console.log(`  Frontend URL: ${config.FRONTEND_URL}`);
    console.log(`  Log Level: ${config.LOG_LEVEL}`);
    console.log(`  Max Rooms: ${config.MAX_ROOMS_PER_SERVER}`);
    console.log(`  Turn Time Limit: ${config.TURN_TIME_LIMIT}ms`);
    console.log(`  Room Inactivity Timeout: ${config.ROOM_INACTIVITY_TIMEOUT}ms`);
    console.log(`  WebSocket Heartbeat: ${config.WS_HEARTBEAT_INTERVAL}ms`);
    console.log(`  WebSocket Timeout: ${config.WS_CONNECTION_TIMEOUT}ms`);
    console.log(`  Rate Limit Window: ${config.RATE_LIMIT_WINDOW}ms`);
    console.log(`  Rate Limit Max Requests: ${config.RATE_LIMIT_MAX_REQUESTS}`);
    console.log(`  Message Batch Size: ${config.MESSAGE_BATCH_SIZE}`);
    console.log(`  Message Batch Timeout: ${config.MESSAGE_BATCH_TIMEOUT}ms`);
    console.log(`  Helmet Enabled: ${config.ENABLE_HELMET}`);
    console.log(`  Health Check Timeout: ${config.HEALTH_CHECK_TIMEOUT}ms`);
    
    // Test Convex connection
    console.log('\n🔗 Testing Convex Connection...');
    try {
      createConvexClient();
      const isHealthy = await checkConvexConnection();
      
      if (isHealthy) {
        console.log('✅ Convex connection successful');
      } else {
        console.log('⚠️  Convex connection test failed (but client created successfully)');
        console.log('   This might be due to network issues or Convex service availability');
      }
    } catch (error) {
      console.log('❌ Convex connection failed:');
      console.log(`   ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }

    // Validate Clerk configuration (basic check)
    console.log('\n🔐 Validating Clerk Configuration...');
    if (config.CLERK_SECRET_KEY && config.CLERK_PUBLISHABLE_KEY) {
      console.log('✅ Clerk keys are configured');
      
      // Basic format validation
      if (config.CLERK_SECRET_KEY.startsWith('sk_')) {
        console.log('✅ Clerk secret key format looks correct');
      } else {
        console.log('⚠️  Clerk secret key format might be incorrect (should start with sk_)');
      }
      
      if (config.CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
        console.log('✅ Clerk publishable key format looks correct');
      } else {
        console.log('⚠️  Clerk publishable key format might be incorrect (should start with pk_)');
      }
    } else {
      console.log('❌ Clerk keys are missing');
      process.exit(1);
    }

    console.log('\n🎉 Configuration validation completed successfully!');
    console.log('\n💡 Tips:');
    console.log('  - Make sure your Convex deployment is active');
    console.log('  - Verify your Clerk application is properly configured');
    console.log('  - Check that your frontend URL matches your actual frontend');
    console.log('  - Consider adjusting timeouts based on your network conditions');
    
    process.exit(0);
    
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.log('❌ Configuration validation failed:');
      console.log(error.message);
    } else {
      console.log('❌ Unexpected error during validation:');
      console.log(error instanceof Error ? error.message : String(error));
    }
    
    console.log('\n💡 Next steps:');
    console.log('  1. Check your .env file exists and has all required variables');
    console.log('  2. Compare your .env with .env.example');
    console.log('  3. Ensure all URLs are valid and accessible');
    console.log('  4. Verify your Clerk and Convex credentials');
    
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateConfiguration().catch((error) => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
}

export { validateConfiguration };