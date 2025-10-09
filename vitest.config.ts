import { defineConfig } from 'vitest/config';
import path from 'path';
import { TIMEOUTS } from './src/constants/timeouts';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@clients': path.resolve(__dirname, './src/clients'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
    testTimeout: TIMEOUTS.TEN_SECONDS,
    hookTimeout: TIMEOUTS.TEN_SECONDS,
    teardownTimeout: TIMEOUTS.TEN_SECONDS,
  },
});
