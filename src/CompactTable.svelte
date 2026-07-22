<script>
	import CardRow from './CardRow.svelte';
	/**
	 * @type {{
	 *   cards: import('./types').Card[];
	 *   source: import('./lib/prices').PriceSource;
	 *   selectedIds: Set<string>;
	 *   onupdate?: (card: import('./types').Card) => void;
	 *   onremove?: (id: string) => void;
	 *   onselect?: (event: MouseEvent, id: string) => void;
	 *   onhover?: (card: import('./types').Card) => void;
	 * }}
	 */
	let { cards, source, selectedIds, onupdate, onremove, onselect, onhover } = $props();
	const headers = [
		'',
		'Qty',
		'Name',
		'Set · CN',
		'Finish',
		'Condition',
		'Language',
		'Alter',
		'Proxy',
		'Purchase Price',
		''
	];
</script>

<div class="border-border overflow-auto rounded-md border">
	<table class="text-text w-full text-left text-sm">
		<thead class="bg-accent/15">
			<tr
				>{#each headers as h, i (i)}<th class="px-2 py-1 font-semibold">{h}</th>{/each}</tr
			>
		</thead>
		<tbody>
			{#each cards as card (card.id)}
				<CardRow
					{card}
					{source}
					selected={selectedIds.has(card.id)}
					{onupdate}
					{onremove}
					{onselect}
					{onhover}
				/>
			{/each}
		</tbody>
	</table>
</div>
