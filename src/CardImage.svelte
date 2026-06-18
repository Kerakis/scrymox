<script>
	import FlipIcon from './FlipIcon.svelte';
	import { getFaces, isDoubleFaced, inlineImage } from './lib/images.js';
	/**
	 * @type {{
	 *   card: import('./types').Card;
	 *   onselect?: (event: MouseEvent) => void;
	 *   onhover?: () => void;
	 *   onflip?: (flipped: boolean) => void;
	 * }}
	 */
	let { card, onselect, onhover, onflip } = $props();

	const faces = $derived(getFaces(card));
	const dfc = $derived(isDoubleFaced(card));
	let flipped = $state(false);

	const face = $derived(faces[flipped && dfc ? 1 : 0]);
	const inlineSrc = $derived(inlineImage(face));

	const flip = () => {
		flipped = !flipped;
		onflip?.(flipped);
	};
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

	{#if dfc}
		<button
			type="button"
			class="absolute right-1 bottom-1 rounded-full bg-black/55 p-1 text-white hover:bg-black/75"
			onclick={flip}
			aria-label="Flip card"
			title="Flip card"
		>
			<FlipIcon class="h-3.5 w-3.5" />
		</button>
	{/if}
</div>
