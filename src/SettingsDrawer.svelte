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
	const cycle = () => {
		const order = /** @type {import('./lib/theme').Theme[]} */ (['system', 'light', 'dark']);
		theme = order[(order.indexOf(theme) + 1) % 3];
		onthemechange?.(theme);
	};
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

	<span class="mb-1 block text-sm font-medium">Theme</span>
	<button
		type="button"
		onclick={cycle}
		class="rounded-md bg-accent px-4 py-2 text-sm text-accent-contrast"
		>Theme: {theme} (click to change)</button
	>
</Drawer>
