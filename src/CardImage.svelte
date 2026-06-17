<script>
	import Modal from './Modal.svelte';
	import { getFaces, isDoubleFaced, inlineImage, zoomImage } from './lib/images.js';
	/**
	 * @type {{
	 *   card: import('./types').Card;
	 *   onselect?: (event: MouseEvent) => void;
	 *   onhover?: () => void;
	 * }}
	 */
	let { card, onselect, onhover } = $props();

	const faces = $derived(getFaces(card));
	const dfc = $derived(isDoubleFaced(card));
	let flipped = $state(false);
	let lightbox = $state(false);

	const face = $derived(faces[flipped && dfc ? 1 : 0]);
	const inlineSrc = $derived(inlineImage(face));
	const zoomSrc = $derived(zoomImage(face));
</script>

<div class="relative">
	<!-- Clicking the card image selects it (Shift/Ctrl-⌘ modifiers apply). -->
	<button
		type="button"
		class="block w-full"
		onclick={(e) => onselect?.(e)}
		onmouseenter={() => onhover?.()}
		onfocus={() => onhover?.()}
		aria-label={`Select ${card.name}`}
	>
		{#if inlineSrc}
			<img
				src={inlineSrc}
				alt={card.name}
				loading="lazy"
				class="block aspect-5/7 w-full rounded-md object-cover"
			/>
		{:else}
			<span
				class="flex aspect-5/7 w-full items-center justify-center rounded-md bg-surface-2 px-2 text-center text-xs text-muted"
				>{card.name}</span
			>
		{/if}
	</button>

	<div class="pointer-events-none absolute right-1 bottom-1 flex gap-1">
		{#if dfc}
			<button
				type="button"
				class="pointer-events-auto rounded-full bg-black/55 px-2 py-0.5 text-xs text-white hover:bg-black/75"
				onclick={() => (flipped = !flipped)}
				aria-label="Flip card"
				title="Flip card">⤺</button
			>
		{/if}
		<button
			type="button"
			class="pointer-events-auto rounded-full bg-black/55 px-2 py-0.5 text-xs text-white hover:bg-black/75"
			onclick={() => (lightbox = true)}
			aria-label={`Zoom ${card.name}`}
			title="Zoom">⤢</button
		>
	</div>
</div>

<Modal bind:show={lightbox} onclose={() => (lightbox = false)} panelClass="bg-transparent p-2">
	<img src={zoomSrc} alt={card.name} class="max-h-[85vh] max-w-full rounded-md object-contain" />
	{#if dfc}
		<button
			type="button"
			onclick={() => (flipped = !flipped)}
			class="mt-2 w-full rounded-md bg-accent px-4 py-2 text-sm text-accent-contrast"
		>
			Flip
		</button>
	{/if}
</Modal>
