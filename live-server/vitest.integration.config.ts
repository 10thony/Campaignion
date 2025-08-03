import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'live-server-integration',
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/test/integration/**/*.test.ts',
      'src/test/*Integration*.test.ts',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
    ],
    globals: true,
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    teardownTimeout: 10000,
    pool: 'forks', // Use separate processes for isolation
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for server testing
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.ts',
        '!src/test/**',
        '!src/**/*.test.ts',
        '!src/**/*.d.ts',
      ],
      exclude: [
        'src/test/**',
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/index.ts', // Exclude main entry point
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/integration-results.json',
      html: './test-results/integration-results.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@campaignion/shared-types': path.resolve(__dirname, '../shared-types/src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.CONVEX_URL': JSON.stringify('https://test.convex.cloud'),
    'process.env.CLERK_SECRET_KEY': JSON.stringify('test-key'),
    'process.env.PORT': JSON.stringify('3001'),
  },
});