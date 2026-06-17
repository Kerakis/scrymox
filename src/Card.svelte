<script>
	import { onDestroy } from 'svelte';
	import device from 'svelte-device-info';
	import ImageModal from './ImageModal.svelte';
	import Modal from './Modal.svelte';
	import { getDisplayFinish, getFinishPrice } from './lib/finishes.js';

	/**
	 * @type {{
	 *   card: import('./types').Card;
	 *   displayMode?: 'bulkEdit' | 'CSV';
	 *   onupdate?: (card: import('./types').Card) => void;
	 *   onremove?: (id: string) => void;
	 * }}
	 */
	let { card, displayMode = 'bulkEdit', onupdate, onremove } = $props();
	/** @type {HTMLImageElement | undefined} */
	let cardImageFront = $state();
	/** @type {HTMLImageElement | undefined} */
	let cardImageBack = $state();
	let cardImageFrontSrc = $state('');
	let cardImageBackSrc = $state('');
	let finishModal = $state(false);
	let showImageModal = $state(false);
	/** @type {(string | undefined)[]} */
	let selectedImages = $state([]);

	/**
	 * Applies a finish to a card copy, updating the marker and (unless the price
	 * was set manually) the displayed price.
	 * @param {import('./types').Card} target
	 * @param {string} finish
	 */
	const applyFinish = (target, finish) => {
		target.selectedFinish = finish;
		target.displayFinish = getDisplayFinish(finish);
		if (!target.priceManuallySet) {
			target.displayedPrice = getFinishPrice(target.prices, finish);
		}
	};

	const handleMouseOver = () => {
		if (device.isMobile) return;
		if (Array.isArray(card.image_uris)) {
			cardImageFrontSrc = card.image_uris[0]?.border_crop ?? '';
			cardImageBackSrc = card.image_uris[1]?.border_crop ?? '';
		} else {
			cardImageFrontSrc = card.image_uris?.border_crop ?? '';
		}
		// Only the hovered card tracks the pointer, so we never have more than one
		// active mousemove listener regardless of how many cards are rendered.
		window.addEventListener('mousemove', moveImage);
		cardImageFront?.classList.remove('hidden');
		cardImageBack?.classList.remove('hidden');
	};

	const handleMouseOut = () => {
		if (device.isMobile) return;
		window.removeEventListener('mousemove', moveImage);
		cardImageFront?.classList.add('hidden');
		cardImageBack?.classList.add('hidden');
	};

	const handleCardClick = (/** @type {MouseEvent} */ event) => {
		if (device.isMobile) {
			if (Array.isArray(card.image_uris)) {
				selectedImages = card.image_uris.map((face) => face?.border_crop);
			} else {
				selectedImages = [card.image_uris?.border_crop];
			}
			showImageModal = true;
			return;
		}

		let updatedCard = { ...card };

		if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
			if (card.finishes.includes('foil') && card.finishes.includes('etched')) {
				finishModal = true;
				return; // Wait for the user to choose foil vs etched.
			} else if (card.finishes.includes('foil')) {
				applyFinish(updatedCard, 'foil');
			} else if (card.finishes.includes('etched')) {
				applyFinish(updatedCard, 'etched');
			}
		} else if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
			if (card.finishes.includes('nonfoil')) {
				applyFinish(updatedCard, '');
			}
		} else if (event.shiftKey) {
			if (updatedCard.count > 1) updatedCard.count -= 1;
		} else {
			if (updatedCard.count < 99) updatedCard.count += 1;
		}

		onupdate?.(updatedCard);
	};

	const moveImage = (/** @type {MouseEvent} */ event) => {
		if (cardImageFront) {
			cardImageFront.style.top = `${event.clientY + 5}px`;
			cardImageFront.style.left = `${event.clientX + 5}px`;
		}
		if (cardImageBack) {
			cardImageBack.style.top = `${event.clientY + 5}px`;
			cardImageBack.style.left = `${event.clientX + 250}px`;
		}
	};

	const handleFinishSelection = (/** @type {string} */ finish) => {
		let updatedCard = { ...card };
		applyFinish(updatedCard, finish);
		finishModal = false;
		onupdate?.(updatedCard);
	};

	onDestroy(() => {
		window.removeEventListener('mousemove', moveImage);
	});
</script>

<div class="relative">
	<div class="flex items-center gap-1">
		{#if displayMode === 'bulkEdit'}
			<button
				type="button"
				onclick={handleCardClick}
				onmouseover={handleMouseOver}
				onmouseout={handleMouseOut}
				onfocus={handleMouseOver}
				onblur={handleMouseOut}
				class="flex-1 text-left"
			>
				{card.count}
				{card.name} ({card.set}) {card.collector_number}
				{card.displayFinish}
			</button>
		{:else if displayMode === 'CSV'}
			<button
				type="button"
				onclick={handleCardClick}
				onmouseover={handleMouseOver}
				onmouseout={handleMouseOut}
				onfocus={handleMouseOver}
				onblur={handleMouseOut}
				class="min-w-0 flex-1 truncate text-left text-gray-200"
			>
				{card.name}
			</button>
		{/if}
		{#if onremove}
			<button
				type="button"
				onclick={() => onremove?.(card.id)}
				aria-label={`Remove ${card.name}`}
				class="shrink-0 rounded-sm px-1 text-gray-400 hover:text-red-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
			>
				✕
			</button>
		{/if}
	</div>

	<Modal bind:show={finishModal} title={card.name} onclose={() => (finishModal = false)}>
		<button
			onclick={() => handleFinishSelection('foil')}
			class="mt-4 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
		>
			Foil
		</button>
		<button
			onclick={() => handleFinishSelection('etched')}
			class="mt-4 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
		>
			Etched
		</button>
	</Modal>

	{#if Array.isArray(card.image_uris)}
		{#if card.image_uris[0]?.border_crop}
			<img
				bind:this={cardImageFront}
				src={cardImageFrontSrc}
				alt={`${card.name} front`}
				class="fixed z-50 hidden max-w-62.5 rounded-sm"
			/>
		{/if}
		{#if card.image_uris[1]?.border_crop}
			<img
				bind:this={cardImageBack}
				src={cardImageBackSrc}
				alt={`${card.name} back`}
				class="fixed z-50 hidden max-w-62.5 rounded-sm"
			/>
		{/if}
	{:else if card.image_uris?.border_crop}
		<img
			bind:this={cardImageFront}
			src={cardImageFrontSrc}
			alt={card.name}
			class="fixed z-50 hidden max-w-62.5 rounded-sm"
		/>
	{/if}
</div>

<ImageModal bind:show={showImageModal} {selectedImages} onclose={() => (showImageModal = false)} />
