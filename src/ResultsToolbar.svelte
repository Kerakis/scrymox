<script>
	import Tooltip from './Tooltip.svelte';
	import { PRICE_SOURCES } from './lib/prices.js';
	/**
	 * @type {{
	 *   totalCards: number; selectedCount: number;
	 *   source?: import('./lib/prices').PriceSource; view?: 'gallery' | 'compact';
	 *   defaultQuery?: string;
	 * }}
	 */
	let {
		totalCards,
		selectedCount,
		source = $bindable('tcgplayer'),
		view = $bindable('gallery'),
		defaultQuery = ''
	} = $props();
</script>

<div class="border-border text-text flex flex-wrap items-center gap-3 border-b px-3 py-2 text-sm">
	<span class="flex items-center gap-1.5">
		<span class="bg-accent/20 rounded-md px-3 py-1"
			>{totalCards} cards{selectedCount ? ` · ${selectedCount} selected` : ''}</span
		>
		{#if defaultQuery.trim()}
			<Tooltip text={`Your default query "${defaultQuery.trim()}" was added to this search.`}>
				<button
					type="button"
					aria-label="Default query applied"
					class="text-muted hover:text-text flex"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="h-4 w-4"
					>
						<circle cx="12" cy="12" r="10" />
						<path stroke-linecap="round" d="M12 16v-4M12 8h.01" />
					</svg>
				</button>
			</Tooltip>
		{/if}
	</span>

	<label class="flex items-center gap-1">
		<span class="text-muted">Prices:</span>
		<select bind:value={source} aria-label="Price source" class="bg-accent/20 rounded-md px-2 py-1">
			{#each Object.entries(PRICE_SOURCES) as [k, v] (k)}<option value={k}
					>{v.label} ({v.currency})</option
				>{/each}
		</select>
	</label>

	<div
		class="ring-accent ml-auto inline-flex overflow-hidden rounded-md ring-1"
		role="group"
		aria-label="View"
	>
		<button
			type="button"
			aria-pressed={view === 'gallery'}
			onclick={() => (view = 'gallery')}
			class="px-3 py-1 {view === 'gallery' ? 'bg-accent text-accent-contrast' : 'text-muted'}"
			>Gallery</button
		>
		<button
			type="button"
			aria-pressed={view === 'compact'}
			onclick={() => (view = 'compact')}
			class="px-3 py-1 {view === 'compact' ? 'bg-accent text-accent-contrast' : 'text-muted'}"
			>Compact</button
		>
	</div>
</div>
