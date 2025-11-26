# Test Mode System Documentation

## Overview

The Test Mode System provides comprehensive testing capabilities for the live interaction system. It is designed exclusively for admin users and offers automated testing tools, multi-user scenario simulation, performance testing utilities, and load simulation capabilities.

## Features

### 1. Test Scenario Management
- **Predefined Scenarios**: Includes default scenarios like "basic-combat" for common testing needs
- **Custom Scenarios**: Admins can create custom test scenarios with specific entities, objectives, and environmental conditions
- **Scenario Types**: Supports combat, social, puzzle, and mixed interaction types

### 2. Automated Testing Tools
- **Action Simulation**: Execute predefined sequences of player actions with configurable delays and probabilities
- **Multi-User Scenarios**: Simulate multiple participants including AI-controlled entities
- **State Validation**: Comprehensive validation of game state consistency across the system

### 3. Network Error Injection
- **Disconnect Simulation**: Simulate player disconnections with configurable duration
- **Timeout Simulation**: Inject timeout errors to test error handling
- **Packet Loss**: Simulate network packet loss with configurable intensity
- **High Latency**: Inject artificial latency to test performance under poor network conditions

### 4. Load Testing
- **Concurrent Users**: Test with multiple simultaneous users
- **Ramp-Up Configuration**: Gradual user increase to simulate realistic load patterns
- **Performance Metrics**: Collect response times, throughput, and error rates
- **Scalability Testing**: Validate system performance under various load conditions

### 5. State Consistency Validation
- **Participant Validation**: Ensure participant counts match between game state and session data
- **Initiative Order Validation**: Verify turn order consistency
- **Map State Validation**: Check entity positioning and map consistency
- **Turn Index Validation**: Ensure turn progression is within valid bounds

## API Endpoints

### Admin Authentication
All test mode endpoints require admin authentication. Admin users are determined by:
- Environment variable `ADMIN_USER_IDS` (comma-separated list)
- Development/test environments: users with "admin" or "test-admin" in their user ID

### Core Endpoints

#### `testMode.health`
Returns the health status of the test mode service.

#### `testMode.getScenarios`
Retrieves all available test scenarios.

#### `testMode.createTestInteraction`
Creates a new test interaction session.
```typescript
input: {
  scenarioId: string;
  options?: {
    participantCount?: number;
    aiParticipants?: number;
    duration?: number;
    customSettings?: Record<string, any>;
  };
}
```

#### `testMode.simulateActions`
Executes a sequence of simulated player actions.
```typescript
input: {
  sessionId: string;
  actions: SimulatedAction[];
}
```

#### `testMode.injectNetworkErrors`
Injects network errors for testing error handling.
```typescript
input: {
  sessionId: string;
  errorType: 'disconnect' | 'timeout' | 'packet_loss' | 'high_latency';
  options?: {
    targetEntityId?: string;
    duration?: number;
    intensity?: number;
  };
}
```

#### `testMode.validateStateConsistency`
Validates the consistency of game state across the system.
```typescript
input: {
  sessionId: string;
}
```

#### `testMode.runLoadTest`
Executes a load test with specified configuration.
```typescript
input: LoadTestConfig
```

#### `testMode.getTestResults`
Retrieves results for a specific test session.

#### `testMode.getLoadTestResults`
Retrieves results for a specific load test.

#### `testMode.addTestScenario`
Adds a new custom test scenario.

#### `testMode.cleanupTestSession`
Cleans up a test session and releases resources.

## Usage Examples

### Basic Test Session
```typescript
// Create a test interaction
const sessionId = await trpc.testMode.createTestInteraction.mutate({
  scenarioId: 'basic-combat',
  options: {
    participantCount: 4,
    aiParticipants: 2,
    duration: 15
  }
});

// Simulate some actions
await trpc.testMode.simulateActions.mutate({
  sessionId,
  actions: [
    {
      entityId: 'player1',
      action: { type: 'move', position: { x: 5, y: 5 } },
      delay: 1000,
      probability: 1.0
    }
  ]
});

// Validate state consistency
const report = await trpc.testMode.validateStateConsistency.mutate({
  sessionId
});

// Clean up
await trpc.testMode.cleanupTestSession.mutate({ sessionId });
```

### Load Testing
```typescript
const testId = await trpc.testMode.runLoadTest.mutate({
  concurrentUsers: 10,
  rampUpTime: 30,
  testDuration: 300,
  actionFrequency: 12,
  scenarios: ['basic-combat'],
  targetMetrics: {
    maxResponseTime: 1000,
    maxErrorRate: 0.05,
    minThroughput: 5
  }
});

// Get results
const results = await trpc.testMode.getLoadTestResults.query({ testId });
```

### Network Error Testing
```typescript
// Inject a disconnect error
await trpc.testMode.injectNetworkErrors.mutate({
  sessionId,
  errorType: 'disconnect',
  options: {
    targetEntityId: 'player1',
    duration: 5000
  }
});

// Inject packet loss
await trpc.testMode.injectNetworkErrors.mutate({
  sessionId,
  errorType: 'packet_loss',
  options: {
    intensity: 0.1,
    duration: 10000
  }
});
```

## Test Scenarios

### Default Scenarios

#### Basic Combat
- **ID**: `basic-combat`
- **Type**: Combat
- **Participants**: 4 (2 players, 2 monsters)
- **Duration**: 15 minutes
- **Objectives**: Defeat all monsters
- **Map**: 12x12 grid with obstacles

### Custom Scenario Creation
```typescript
const customScenario: TestScenario = {
  id: 'custom-puzzle',
  name: 'Custom Puzzle Scenario',
  description: 'A custom puzzle scenario',
  type: 'puzzle',
  participantCount: 3,
  duration: 45,
  entities: [
    {
      id: 'player1',
      name: 'Test Rogue',
      type: 'playerCharacter',
      level: 3,
      stats: { /* ... */ },
      equipment: [/* ... */],
      position: { x: 1, y: 1 }
    }
  ],
  initialState: {
    mapSize: { width: 15, height: 15 },
    terrain: [/* ... */],
    objectives: [/* ... */],
    environmentalEffects: [],
    turnTimeLimit: 120
  },
  expectedOutcomes: [/* ... */],
  metadata: {
    difficulty: 'medium',
    tags: ['puzzle', 'custom'],
    author: 'admin-user',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0
  }
};

await trpc.testMode.addTestScenario.mutate(customScenario);
```

## Performance Metrics

The test mode system collects comprehensive performance metrics:

- **Response Times**: Average, minimum, and maximum response times
- **Throughput**: Actions processed per second
- **Error Rates**: Percentage of failed operations
- **Memory Usage**: Heap usage and garbage collection metrics
- **Network Statistics**: Message counts, bytes transferred, connection counts

## Security

- **Admin-Only Access**: All test mode functionality requires admin authentication
- **Rate Limiting**: Admin operations have higher rate limits but are still protected
- **Input Validation**: All inputs are validated using Zod schemas
- **Resource Management**: Automatic cleanup prevents resource leaks

## Environment Configuration

### Required Environment Variables
- `CLERK_SECRET_KEY`: For authentication
- `ADMIN_USER_IDS`: Comma-separated list of admin user IDs

### Optional Environment Variables
- `ADMIN_RATE_LIMIT_WINDOW`: Rate limit window in milliseconds (default: 60000)
- `ADMIN_RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 1000)
- `NODE_ENV`: Environment mode (development/test allows additional admin users)

## Testing

The test mode system includes comprehensive test coverage:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load testing validation
- **Error Handling Tests**: Network error simulation testing

Run tests with:
```bash
bun test -- --run TestModeService.test.ts
bun test -- --run TestModeIntegration.test.ts
bun test -- --run adminAuth.test.ts
```

## Limitations

- Test mode is only available to admin users
- Maximum concurrent users in load tests: 100
- Maximum test duration: 1 hour
- Maximum scenario duration: 4 hours
- Test sessions are stored in memory and will be lost on server restart

## Future Enhancements

- Persistent test result storage
- Advanced AI behavior patterns
- Integration with CI/CD pipelines
- Real-time test monitoring dashboard
- Automated regression testing
- Performance benchmarking against historical data