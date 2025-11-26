# Live Server Configuration System

This directory contains the configuration system for the Live Interaction Server. The configuration system provides centralized environment variable management, validation, and helper functions.

## Files

- `index.ts` - Main configuration module with environment validation and helper functions
- `convex.ts` - Convex client configuration and connection management
- `README.md` - This documentation file

## Environment Variables

### Required Variables

These variables must be set for the server to start:

- `CLERK_SECRET_KEY` - Clerk authentication secret key (starts with `sk_`)
- `CLERK_PUBLISHABLE_KEY` - Clerk publishable key (starts with `pk_`)
- `CONVEX_URL` - Convex deployment URL (must be a valid URL)

### Optional Variables

These variables have default values if not specified:

#### Server Configuration
- `NODE_ENV` - Environment mode (`development`, `production`, `test`) - Default: `development`
- `PORT` - Server port number (1-65535) - Default: `3001`
- `FRONTEND_URL` - Frontend application URL - Default: `http://localhost:5173`

#### WebSocket Configuration
- `WS_HEARTBEAT_INTERVAL` - WebSocket heartbeat interval in ms - Default: `30000`
- `WS_CONNECTION_TIMEOUT` - WebSocket connection timeout in ms - Default: `60000`

#### Room Management
- `ROOM_INACTIVITY_TIMEOUT` - Room cleanup timeout in ms - Default: `1800000` (30 minutes)
- `MAX_ROOMS_PER_SERVER` - Maximum concurrent rooms - Default: `100`
- `TURN_TIME_LIMIT` - Turn time limit in ms - Default: `90000` (90 seconds)

#### Rate Limiting
- `RATE_LIMIT_WINDOW` - Rate limit window in ms - Default: `60000` (1 minute)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window - Default: `100`

#### Performance
- `MESSAGE_BATCH_SIZE` - Message batch size - Default: `10`
- `MESSAGE_BATCH_TIMEOUT` - Message batch timeout in ms - Default: `100`

#### Security
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins - Default: Uses `FRONTEND_URL`
- `ENABLE_HELMET` - Enable Helmet security middleware (`true`/`false`) - Default: `true`

#### Logging
- `LOG_LEVEL` - Logging level (`DEBUG`, `INFO`, `WARN`, `ERROR`) - Default: `INFO`

#### Health Check
- `HEALTH_CHECK_TIMEOUT` - Health check timeout in ms - Default: `5000`

#### Optional Convex
- `CONVEX_DEPLOY_KEY` - Convex deployment key (optional)

## Usage

### Basic Configuration

```typescript
import { config } from './config';

console.log(`Server running on port ${config.PORT}`);
console.log(`Environment: ${config.NODE_ENV}`);
```

### Environment Helpers

```typescript
import { isDevelopment, isProduction, isTest } from './config';

if (isDevelopment()) {
  console.log('Development mode enabled');
}

if (isProduction()) {
  console.log('Production optimizations enabled');
}
```

### Configuration Helpers

```typescript
import { 
  getCorsOrigins, 
  getConvexConfig, 
  getClerkConfig,
  getWebSocketConfig,
  getRoomConfig,
  getRateLimitConfig,
  getMessageBatchConfig
} from './config';

// CORS configuration
const corsOrigins = getCorsOrigins();
app.use(cors({ origin: corsOrigins }));

// Convex client setup
const convexConfig = getConvexConfig();
const client = new ConvexHttpClient(convexConfig.url);

// Clerk authentication
const clerkConfig = getClerkConfig();
const clerkClient = createClerkClient(clerkConfig);
```

### Convex Client

```typescript
import { createConvexClient, getConvexClient, checkConvexConnection } from './config/convex';

// Create or get existing client
const client = getConvexClient();

// Health check
const isHealthy = await checkConvexConnection();
if (!isHealthy) {
  console.error('Convex connection failed');
}
```

## Configuration Validation

The configuration system automatically validates all environment variables on startup:

1. **Type Validation** - Ensures numeric values are valid numbers, URLs are valid, etc.
2. **Required Variables** - Fails startup if required variables are missing
3. **Enum Validation** - Validates enum values like `NODE_ENV` and `LOG_LEVEL`
4. **Range Validation** - Ensures numeric values are within valid ranges

### Validation Script

Run the configuration validation script to check your environment:

```bash
bun run validate-config
```

This script will:
- Validate all environment variables
- Test Convex connection
- Validate Clerk key formats
- Display current configuration
- Provide troubleshooting tips

## Error Handling

### Configuration Errors

If configuration validation fails, the server will:

1. **Development/Production** - Log detailed error messages and exit with code 1
2. **Test Environment** - Use fallback test configuration to prevent test failures

### Missing Variables

Error messages clearly indicate:
- Which variables are missing
- Which variables have invalid values
- Expected formats and ranges
- Reference to `.env.example` for guidance

### Example Error Output

```
❌ Configuration Error:
Environment configuration validation failed:

Missing required environment variables:
  - CLERK_SECRET_KEY
  - CONVEX_URL

Invalid environment variables:
  - PORT: Expected number between 1-65535, received "invalid"
  - LOG_LEVEL: Expected one of DEBUG,INFO,WARN,ERROR, received "INVALID"

Please check your .env file and ensure all required variables are set correctly.
Refer to .env.example for the expected format.
```

## Environment Files

### .env.example

Contains all available configuration options with example values:

```bash
# Copy to .env and update with your values
cp .env.example .env
```

### .env

Your actual environment configuration (not committed to git):

```bash
# Required
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CONVEX_URL=https://your-deployment.convex.cloud

# Optional (uses defaults if not specified)
NODE_ENV=development
PORT=3001
LOG_LEVEL=INFO
```

## Testing

The configuration system includes comprehensive tests:

```bash
# Test configuration validation
bun test -- src/test/config.test.ts

# Test Convex client configuration
bun test -- src/test/convex-config.test.ts
```

## Best Practices

1. **Always use the config object** - Don't access `process.env` directly
2. **Use helper functions** - They provide type safety and validation
3. **Validate configuration early** - Run `validate-config` before deployment
4. **Use environment-specific values** - Different configs for dev/staging/prod
5. **Keep secrets secure** - Never commit `.env` files to version control

## Troubleshooting

### Common Issues

1. **"Configuration Error" on startup**
   - Check that all required variables are set in `.env`
   - Verify variable formats (URLs, numbers, enums)
   - Run `bun run validate-config` for detailed diagnostics

2. **"Convex connection failed"**
   - Verify `CONVEX_URL` is correct and accessible
   - Check that your Convex deployment is active
   - Ensure network connectivity to Convex

3. **"Invalid Clerk key format"**
   - Secret keys should start with `sk_`
   - Publishable keys should start with `pk_`
   - Verify keys are from the correct Clerk application

4. **Port already in use**
   - Change `PORT` in `.env` to an available port
   - Check for other services using the same port

### Getting Help

1. Run the validation script: `bun run validate-config`
2. Check the error messages for specific guidance
3. Compare your `.env` with `.env.example`
4. Verify all external services (Convex, Clerk) are properly configured