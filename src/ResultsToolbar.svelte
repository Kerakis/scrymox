<script>
	import Tooltip from './Tooltip.svelte';
	import { PRICE_SOURCES } from './lib/prices.js';
	/**
	 * @type {{
	 *   totalCards: number; selectedCount: number;
	 *   source?: import('./lib/prices').PriceSource; view?: 'gallery' | 'compact';
	 *   onrefresh?: () => void;
	 * }}
	 */
	let {
		totalCards,
		selectedCount,
		source = $bindable('tcgplayer'),
		view = $bindable('gallery'),
		onrefresh
	} = $props();
</script>

<div class="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 text-sm text-text">
	<span class="rounded-full bg-accent/20 px-3 py-1"
		>{totalCards} cards{selectedCount ? ` · ${selectedCount} selected` : ''}</span
	>

	<label class="flex items-center gap-1">
		<span class="text-muted">Prices:</span>
		<select bind:value={source} aria-label="Price source" class="rounded bg-accent/20 px-2 py-1">
			{#each Object.entries(PRICE_SOURCES) as [k, v] (k)}<option value={k}
					>{v.label} ({v.currency})</option
				>{/each}
		</select>
	</label>

	<Tooltip text="Refresh from Scryfall (also refreshes prices, max once/day)">
		<button
			type="button"
			onclick={onrefresh}
			aria-label="Refresh results"
			class="rounded bg-accent/20 px-2 py-1">⟳</button
		>
	</Tooltip>

	<div
		class="ml-auto inline-flex overflow-hidden rounded-md ring-1 ring-accent"
		role="group"
		aria-label="View"
	>
		<button
			type="button"
			aria-pressed={view === 'gallery'}
			onclick={() => (view = 'gallery')}
			class="px-3 py-1 {view === 'gallery' ? 'bg-accent text-accent-contrast' : 'text-muted'}"
			>▦ Gallery</button
		>
		<button
			type="button"
			aria-pressed={view === 'compact'}
			onclick={() => (view = 'compact')}
			class="px-3 py-1 {view === 'compact' ? 'bg-accent text-accent-contrast' : 'text-muted'}"
			>☰ Compact</button
		>
	</div>
</div>
