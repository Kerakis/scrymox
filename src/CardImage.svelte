<script>
	import Modal from './Modal.svelte';
	/** @type {{ card: import('./types').Card }} */
	let { card } = $props();

	const faces = $derived(Array.isArray(card.image_uris) ? card.image_uris : [card.image_uris]);
	const isDfc = $derived(faces.length > 1 && !!faces[1]);
	let flipped = $state(false);
	let lightbox = $state(false);
	let hovering = $state(false);

	const canHover =
		typeof window !== 'undefined' &&
		window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	const face = () => faces[flipped && isDfc ? 1 : 0];
	const inlineSrc = () => face()?.border_crop ?? face()?.normal ?? '';
	const zoomSrc = () => face()?.large ?? face()?.png ?? face()?.normal ?? inlineSrc();

	const onClick = () => {
		if (!canHover) lightbox = true;
	};
</script>

<div class="relative">
	<button
		type="button"
		class="block w-full"
		onclick={onClick}
		onmouseenter={() => (hovering = canHover)}
		onmouseleave={() => (hovering = false)}
		aria-label={`${card.name} image${canHover ? '' : ' — tap to enlarge'}`}
	>
		<img
			src={inlineSrc()}
			alt={card.name}
			loading="lazy"
			class="block aspect-5/7 w-full rounded-md object-cover"
		/>
	</button>

	{#if isDfc}
		<button
			type="button"
			onclick={() => (flipped = !flipped)}
			aria-label="Flip card"
			title="Flip card"
			class="absolute right-1 bottom-1 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white hover:bg-black/75"
		>
			⤺
		</button>
	{/if}

	{#if hovering && canHover}
		<img
			src={zoomSrc()}
			alt=""
			aria-hidden="true"
			class="pointer-events-none fixed top-4 right-4 z-50 hidden max-h-[80vh] rounded-lg shadow-2xl lg:block"
		/>
	{/if}
</div>

<Modal bind:show={lightbox} onclose={() => (lightbox = false)} panelClass="bg-transparent p-2">
	<img src={zoomSrc()} alt={card.name} class="max-h-[85vh] max-w-full rounded-md object-contain" />
	{#if isDfc}
		<button
			type="button"
			onclick={() => (flipped = !flipped)}
			class="mt-2 w-full rounded-md bg-accent px-4 py-2 text-sm text-accent-contrast"
		>
			Flip
		</button>
	{/if}
</Modal>
