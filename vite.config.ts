import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'packages/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/**/*.ts'],
      exclude: ['packages/**/*.test.ts', 'packages/**/*.spec.ts', 'packages/cli/**', 'node_modules/**', 'dist/**'],
    },
  },
  resolve: {
    alias: {
      '@owcs/schemas': path.resolve(__dirname, './packages/schemas/src'),
      '@owcs/api': path.resolve(__dirname, './packages/api/src'),
      '@owcs/cli': path.resolve(__dirname, './packages/cli/src'),
    },
  },
});
