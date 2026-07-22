<script>
	import FlipIcon from './FlipIcon.svelte';
	import { getFaces, isDoubleFaced, inlineImage } from './lib/images.js';
	/** @type {{ card?: import('./types').Card | null; flipped?: boolean; onflip?: () => void }} */
	let { card, flipped = false, onflip } = $props();

	const faces = $derived(card ? getFaces(card) : []);
	const dfc = $derived(card ? isDoubleFaced(card) : false);
	const src = $derived(inlineImage(faces[flipped && dfc ? 1 : 0]));
</script>

<div class="bg-surface-2 text-text ring-border rounded-md p-3 ring-1">
	<h3 class="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">Preview</h3>
	{#if card}
		<div class="relative mx-auto w-fit">
			{#if src}
				<!-- border_crop is square; rounded-2xl re-rounds the corners cleanly. -->
				<img {src} alt={card.name} class="block max-h-[55vh] rounded-2xl" />
			{:else}
				<div
					class="bg-surface text-muted flex aspect-5/7 w-48 items-center justify-center rounded-2xl text-sm"
				>
					No image
				</div>
			{/if}
			{#if dfc}
				<button
					type="button"
					onclick={onflip}
					aria-label="Flip card"
					title="Flip card"
					class="absolute top-2 right-2 rounded-full bg-black/55 p-1.5 text-white hover:bg-black/75"
				>
					<FlipIcon class="h-4 w-4" />
				</button>
			{/if}
		</div>
	{:else}
		<p class="text-muted text-sm">Hover a card to preview it here.</p>
	{/if}
</div>
