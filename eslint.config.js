import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

const compat = new FlatCompat({
	baseDirectory: fileURLToPath(new URL('.', import.meta.url)),
	recommendedConfig: {
		parserOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module'
		},
		rules: {}
	}
});

export default [
	{
		ignores: ['node_modules/**', 'dist/**', 'build/**']
	},
	...compat.extends('eslint:recommended'),
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	}
];
