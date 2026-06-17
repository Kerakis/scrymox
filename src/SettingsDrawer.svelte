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
</script>

<Drawer bind:show title="Settings">
	<label class="mb-1 block text-sm font-medium" for="default-query">Default query options</label>
	<p class="mb-2 text-sm text-muted">
		Appended to every search.
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
