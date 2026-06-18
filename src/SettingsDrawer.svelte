<script>
	import Drawer from './Drawer.svelte';
	import { PRICE_SOURCES } from './lib/prices.js';
	/**
	 * @type {{
	 *   show?: boolean;
	 *   defaultQueryOptions?: string;
	 *   source?: import('./lib/prices').PriceSource;
	 *   theme?: import('./lib/theme').Theme;
	 *   onthemechange?: (t: import('./lib/theme').Theme) => void;
	 * }}
	 */
	let {
		show = $bindable(false),
		defaultQueryOptions = $bindable(''),
		source = $bindable('tcgplayer'),
		theme = $bindable('system'),
		onthemechange
	} = $props();

	// Flash a "Saved" hint when the default query changes (it persists live).
	let savedFlash = $state(false);
	let firstRun = true;
	$effect(() => {
		void defaultQueryOptions;
		if (firstRun) {
			firstRun = false;
			return;
		}
		savedFlash = true;
		const t = setTimeout(() => (savedFlash = false), 1500);
		return () => clearTimeout(t);
	});
</script>

<Drawer bind:show title="Settings">
	<div class="mb-1 flex items-center gap-2">
		<label class="text-sm font-medium" for="default-query">Default query options</label>
		{#if savedFlash}<span class="text-xs font-medium text-green-500">Saved</span>{/if}
	</div>
	<p class="mb-2 text-sm text-muted">
		Appended to every search and saved automatically.
		<a
			href="https://scryfall.com/docs/syntax"
			target="_blank"
			rel="noopener noreferrer"
			class="underline">Syntax guide ↗</a
		>
	</p>
	<input
		id="default-query"
		type="text"
		bind:value={defaultQueryOptions}
		placeholder="e.g. not:digital"
		class="mb-5 w-full rounded-md bg-surface-2 px-3 py-2 text-text ring-1 ring-border"
	/>

	<label class="mb-1 block text-sm font-medium" for="price-source">Price source</label>
	<select
		id="price-source"
		bind:value={source}
		class="mb-5 w-full rounded-md bg-surface-2 px-3 py-2 text-text ring-1 ring-border"
	>
		{#each Object.entries(PRICE_SOURCES) as [k, v] (k)}<option value={k}
				>{v.label} ({v.currency})</option
			>{/each}
	</select>

	<label class="mb-1 block text-sm font-medium" for="theme-select">Theme</label>
	<select
		id="theme-select"
		value={theme}
		onchange={(e) =>
			onthemechange?.(/** @type {import('./lib/theme').Theme} */ (e.currentTarget.value))}
		class="w-full rounded-md bg-surface-2 px-3 py-2 text-text ring-1 ring-border"
	>
		<option value="system">System (match device)</option>
		<option value="light">Light</option>
		<option value="dark">Dark</option>
	</select>
</Drawer>
