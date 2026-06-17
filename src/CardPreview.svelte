<script>
	import { getFaces, isDoubleFaced, zoomImage } from './lib/images.js';
	/** @type {{ card?: import('./types').Card | null }} */
	let { card } = $props();

	const faces = $derived(card ? getFaces(card) : []);
	const dfc = $derived(card ? isDoubleFaced(card) : false);
	let flipped = $state(false);
	// Reset the flip whenever the previewed card changes.
	$effect(() => {
		void card?.id;
		flipped = false;
	});
	const src = $derived(zoomImage(faces[flipped && dfc ? 1 : 0]));
</script>

<div class="rounded-md bg-surface-2 p-3 text-text ring-1 ring-border">
	<h3 class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Preview</h3>
	{#if card}
		{#if src}
			<img {src} alt={card.name} class="mx-auto block max-h-[55vh] rounded-md object-contain" />
		{:else}
			<div
				class="flex aspect-5/7 w-full items-center justify-center rounded-md bg-surface text-sm text-muted"
			>
				No image
			</div>
		{/if}
		<div class="mt-2 flex items-center justify-between gap-2">
			<span class="truncate text-sm">{card.name}</span>
			{#if dfc}
				<button
					type="button"
					onclick={() => (flipped = !flipped)}
					class="shrink-0 rounded-md bg-accent/20 px-2 py-1 text-xs">Flip ⤺</button
				>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-muted">Hover a card to preview it here.</p>
	{/if}
</div>
