import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/test/integration/**/*.test.{ts,tsx}',
      'src/test/e2e/**/*.test.{ts,tsx}',
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
        singleFork: true, // Use single fork for WebSocket testing
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.{ts,tsx}',
        '!src/test/**',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.d.ts',
      ],
      exclude: [
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
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
      '@campaignion/shared-types': path.resolve(__dirname, './shared-types/src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.VITE_CONVEX_URL': JSON.stringify('https://test.convex.cloud'),
    'process.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify('test-key'),
  },
});