import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { getStoredTheme, resolveTheme, applyTheme } from './lib/theme.js';

// Apply the persisted/OS theme before the app renders to avoid a flash.
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(resolveTheme(getStoredTheme(), prefersDark));

const target = document.getElementById('app');
if (!target) {
	throw new Error('Target element #app not found');
}

const app = mount(App, {
	target
});

export default app;
