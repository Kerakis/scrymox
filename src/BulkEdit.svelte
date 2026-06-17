<script>
	import Card from './Card.svelte';
	import { buildBulkText } from './lib/export.js';

	/**
	 * @type {{
	 *   cards?: import('./types').Card[];
	 *   onupdate?: (card: import('./types').Card) => void;
	 *   onremove?: (id: string) => void;
	 * }}
	 */
	let { cards = [], onupdate, onremove } = $props();
	let isCopyButtonDisabled = $state(false);
	let copyButtonText = $state('Copy');
	let downloadButtonText = $state('Download');
	let hasDownloaded = $state(false);
	let downloadUrl = $state('');

	// Keep a fresh object URL for the current card list, revoking the previous
	// one so blob URLs don't leak on every edit.
	$effect(() => {
		const blob = new Blob([buildBulkText(cards)], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		downloadUrl = url;
		return () => URL.revokeObjectURL(url);
	});

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(buildBulkText(cards));
		copyButtonText = 'Copied!';
		isCopyButtonDisabled = true;
		setTimeout(() => {
			copyButtonText = 'Copy';
			isCopyButtonDisabled = false;
		}, 5000);
	};

	const handleDownload = () => {
		// After the file is downloaded, the button briefly becomes a shortcut to
		// Moxfield so the user can go import it.
		if (hasDownloaded) {
			window.open('https://www.moxfield.com/', '_blank', 'noopener,noreferrer');
			return;
		}
		const a = document.createElement('a');
		a.href = downloadUrl;
		a.download = 'cards.txt';
		a.click();

		hasDownloaded = true;
		downloadButtonText = 'Import into Moxfield';
		setTimeout(() => {
			hasDownloaded = false;
			downloadButtonText = 'Download';
		}, 5000);
	};

	const handleCardUpdate = (/** @type {import('./types').Card} */ updatedCard) => {
		onupdate?.(updatedCard);
	};
</script>

<div class="cards mt-4 h-64 overflow-auto rounded-md border border-gray-500 text-gray-200">
	{#each cards as card (card.id)}
		<Card {card} onupdate={handleCardUpdate} {onremove} />
	{/each}
</div>
{#if cards.length > 0}
	<button
		onclick={copyToClipboard}
		disabled={isCopyButtonDisabled}
		class="mt-4 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
	>
		{copyButtonText}
	</button>
	<button
		onclick={handleDownload}
		class="mt-4 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
	>
		{downloadButtonText}
	</button>
{/if}
