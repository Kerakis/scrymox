<script>
	import CardTile from './CardTile.svelte';
	/**
	 * @type {{
	 *   cards: import('./types').Card[];
	 *   source: import('./lib/prices').PriceSource;
	 *   selectedIds: Set<string>;
	 *   onupdate?: (card: import('./types').Card) => void;
	 *   onremove?: (id: string) => void;
	 *   onselect?: (event: MouseEvent, id: string) => void;
	 * }}
	 */
	let { cards, source, selectedIds, onupdate, onremove, onselect } = $props();
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
	{#each cards as card (card.id)}
		<CardTile
			{card}
			{source}
			selected={selectedIds.has(card.id)}
			{onupdate}
			{onremove}
			{onselect}
		/>
	{/each}
</div>
