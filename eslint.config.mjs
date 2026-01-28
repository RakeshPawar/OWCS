import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/node_modules',
    '**/coverage',
    '**/*.config.ts',
    '**/*.config.js',
    '**/node_modules',
    '**/dist',
    '**/coverage',
    '**/*.log',
    '**/*.min.js',
    '**/.git',
    '**/.husky',
    '**/package-lock.json',
    '**/vite.config.ts',
    'eslint.config.mjs',
    '**/*.test.ts',
    '**/examples/**',
  ]),
  {
    extends: compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'),

    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      'no-console': 'off',
      'prettier/prettier': 'error',
    },
  },
]);
