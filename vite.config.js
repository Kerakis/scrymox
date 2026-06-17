/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	base: '/',
	test: {
		// lib/ modules are pure logic; node environment is sufficient.
		environment: 'node',
		include: ['src/**/*.test.js']
	}
});
