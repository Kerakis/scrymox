import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import svelteEslintParser from 'svelte-eslint-parser';

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL('.', import.meta.url)),
  recommendedConfig: {
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  },
});

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
  },
  ...compat.extends('eslint:recommended'),
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteEslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
];
