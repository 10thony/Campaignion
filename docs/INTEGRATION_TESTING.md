# Client-Server Integration Testing

This document describes the comprehensive integration testing suite for the Live Interaction System, covering the complete workflow from the interactions list to live gameplay.

## Overview

The integration testing suite validates:

1. **Full Workflow**: Complete user journey from interactions list to live modal
2. **Real-Time Subscriptions**: WebSocket connections and event broadcasting
3. **Authentication Flow**: Token-based authentication between client and server
4. **Error Handling**: Connection failures, timeouts, and recovery mechanisms
5. **Performance**: Load testing and concurrent user scenarios

## Test Structure

### Client-Side Integration Tests
- **Location**: `src/test/integration/client-server-integration.test.tsx`
- **Purpose**: Tests React components integration with tRPC client
- **Coverage**: 
  - InteractionsPage component
  - LiveInteractionModal component
  - useLiveInteraction hook
  - Real-time subscriptions
  - Authentication flow

### Server-Side Integration Tests
- **Location**: `live-server/src/test/integration/client-server-integration.test.ts`
- **Purpose**: Tests live server endpoints and WebSocket handling
- **Coverage**:
  - tRPC HTTP endpoints
  - WebSocket subscriptions
  - Authentication middleware
  - Error handling and recovery
  - Performance under load

### End-to-End Workflow Tests
- **Location**: `src/test/e2e/complete-workflow.test.tsx`
- **Purpose**: Tests complete user workflows
- **Coverage**:
  - Player workflow: Join → Play → Chat → Actions
  - DM workflow: Start → Manage → Pause/Resume
  - Error scenarios and recovery
  - Performance with large game states

## Running Integration Tests

### Prerequisites

1. **Environment Variables**: Set up required environment variables:
   ```bash
   CONVEX_URL=https://your-convex-deployment.convex.cloud
   CLERK_SECRET_KEY=your-clerk-secret-key
   VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   ```

2. **Dependencies**: Install all dependencies:
   ```bash
   bun install
   cd live-server && bun install
   ```

### Running Tests

#### Complete Integration Test Suite
```bash
bun run integration-tests
```

This command:
1. Starts the live server
2. Runs all integration tests in sequence
3. Generates comprehensive reports
4. Cleans up resources

#### Individual Test Suites

**Client Integration Tests**:
```bash
bun run test:integration
```

**Server Integration Tests**:
```bash
cd live-server
bun run test:integration
```

**End-to-End Tests**:
```bash
bun run test:e2e
```

#### Watch Mode
```bash
bun run test:integration:watch
```

### Test Configuration

#### Client Tests (`vitest.integration.config.ts`)
- **Environment**: jsdom (browser simulation)
- **Timeout**: 30 seconds per test
- **Coverage**: 70% threshold for branches, functions, lines, statements
- **Reporters**: verbose, json, html

#### Server Tests (`live-server/vitest.integration.config.ts`)
- **Environment**: node
- **Timeout**: 30 seconds per test
- **Pool**: forks (isolated processes)
- **Coverage**: 70% threshold for all metrics

## Test Scenarios

### 1. Full Workflow Tests

#### Player Workflow
```typescript
it('should complete full player workflow from interactions list to combat', async () => {
  // 1. Load interactions page
  // 2. DM starts interaction
  // 3. Player joins interaction
  // 4. Verify connection and game state
  // 5. Take combat action
  // 6. Verify action result
});
```

#### DM Workflow
```typescript
it('should complete full DM workflow from starting to managing interaction', async () => {
  // 1. Start interaction as DM
  // 2. Join as DM to manage
  // 3. Use DM controls
  // 4. Pause/resume interaction
});
```

### 2. Real-Time Subscription Tests

#### WebSocket Connection
```typescript
it('should establish WebSocket connection for real-time updates', async () => {
  // 1. Initialize connection
  // 2. Verify connection status
  // 3. Test subscription setup
  // 4. Validate event handling
});
```

#### Event Broadcasting
```typescript
it('should handle real-time game events', async () => {
  // 1. Set up multiple clients
  // 2. Trigger game events
  // 3. Verify all clients receive updates
  // 4. Test event ordering and consistency
});
```

### 3. Authentication Tests

#### Token Validation
```typescript
it('should include auth token in tRPC requests', async () => {
  // 1. Mock Clerk authentication
  // 2. Make tRPC request
  // 3. Verify token inclusion
  // 4. Test token refresh
});
```

#### Permission Validation
```typescript
it('should validate user permissions for DM actions', async () => {
  // 1. Test as regular player
  // 2. Attempt DM-only actions
  // 3. Verify access denied
  // 4. Test as DM user
});
```

### 4. Error Handling Tests

#### Connection Failures
```typescript
it('should handle connection failures with automatic reconnection', async () => {
  // 1. Establish connection
  // 2. Simulate server failure
  // 3. Verify error handling
  // 4. Test automatic reconnection
});
```

#### Server Errors
```typescript
it('should handle server errors during gameplay', async () => {
  // 1. Mock server error responses
  // 2. Attempt game actions
  // 3. Verify graceful error handling
  // 4. Test error recovery
});
```

### 5. Performance Tests

#### Concurrent Connections
```typescript
it('should handle multiple concurrent connections', async () => {
  // 1. Create 50+ WebSocket connections
  // 2. Verify all connections establish
  // 3. Test message broadcasting
  // 4. Monitor performance metrics
});
```

#### High-Frequency Updates
```typescript
it('should handle high-frequency message broadcasting', async () => {
  // 1. Send 100+ rapid messages
  // 2. Verify all messages processed
  // 3. Test system stability
  // 4. Monitor memory usage
});
```

## Mock Infrastructure

### WebSocket Mocking
```typescript
class MockWebSocket {
  // Simulates WebSocket behavior
  // Handles connection lifecycle
  // Supports message simulation
  // Enables error injection
}
```

### tRPC Response Mocking
```typescript
const mockTRPCResponses = {
  health: { status: 'ok', ... },
  joinRoom: { success: true, gameState: ... },
  takeTurn: { success: true, result: ... },
  // ... other endpoints
};
```

### Authentication Mocking
```typescript
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    userId: 'test_user_123',
    getToken: vi.fn().mockResolvedValue('mock-token'),
  }),
}));
```

## Test Reports

### Automated Report Generation

The integration test runner generates comprehensive reports:

1. **JSON Report**: `integration-test-report.json`
   - Machine-readable test results
   - Performance metrics
   - Error details

2. **HTML Report**: `integration-test-report.html`
   - Visual test results dashboard
   - Coverage information
   - Interactive error exploration

3. **Console Output**: Real-time test progress
   - Pass/fail status
   - Execution times
   - Error summaries

### Report Contents

- **Summary Statistics**: Total, passed, failed tests
- **Performance Metrics**: Execution times, memory usage
- **Coverage Reports**: Code coverage by file and function
- **Error Analysis**: Detailed error messages and stack traces
- **Trend Analysis**: Performance over time (when run repeatedly)

## Continuous Integration

### GitHub Actions Integration

```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run integration-tests
      - uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: |
            integration-test-report.html
            integration-test-report.json
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "bun run test:integration"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failures**
   - Check live server is running on port 3001
   - Verify firewall settings
   - Check for port conflicts

2. **Authentication Errors**
   - Verify Clerk environment variables
   - Check token expiration
   - Validate user permissions

3. **Test Timeouts**
   - Increase test timeout in config
   - Check for infinite loops
   - Verify mock responses

4. **Memory Leaks**
   - Ensure proper cleanup in afterEach
   - Close WebSocket connections
   - Clear timers and intervals

### Debug Mode

Enable debug logging:
```bash
DEBUG=integration-tests bun run integration-tests
```

### Verbose Output

Run with verbose reporting:
```bash
bun run test:integration -- --reporter=verbose
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Mock Management
- Reset mocks between tests
- Use realistic mock data
- Avoid over-mocking

### Async Testing
- Use proper async/await patterns
- Handle promise rejections
- Set appropriate timeouts

### Resource Cleanup
- Close connections in afterEach
- Clear timers and intervals
- Reset global state

### Performance Considerations
- Use single fork for WebSocket tests
- Limit concurrent test execution
- Monitor memory usage

## Contributing

When adding new integration tests:

1. **Follow Naming Conventions**: Use descriptive test names
2. **Add Documentation**: Document test purpose and coverage
3. **Update Reports**: Ensure new tests appear in reports
4. **Test Locally**: Run full suite before submitting
5. **Update This Document**: Keep documentation current

## Future Enhancements

- **Visual Regression Testing**: Screenshot comparison
- **Load Testing**: Automated performance benchmarks
- **Cross-Browser Testing**: Multiple browser environments
- **Mobile Testing**: Touch and responsive behavior
- **Accessibility Testing**: Screen reader compatibility