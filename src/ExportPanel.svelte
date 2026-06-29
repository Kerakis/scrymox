<script>
	import { buildBulkText, buildCsv } from './lib/export.js';
	/** @type {{ cards: import('./types').Card[]; source: import('./lib/prices').PriceSource }} */
	let { cards, source } = $props();

	let tab = $state(/** @type {'bulk' | 'csv'} */ ('bulk'));
	let copied = $state(false);
	let dimmed = $state(false);

	// Displayed text lags behind `tab` so the content swap happens while opacity is 0.
	let visibleText = $derived(tab === 'bulk' ? buildBulkText(cards) : buildCsv(cards, source));

	// Keep in sync when cards/source change (no animation needed).
	let switchTimer = 0;
	const switchTab = (/** @type {'bulk' | 'csv'} */ next) => {
		if (next === tab) return;
		clearTimeout(switchTimer);
		dimmed = true;
		switchTimer = setTimeout(() => {
			tab = next;
			visibleText = next === 'bulk' ? buildBulkText(cards) : buildCsv(cards, source);
			dimmed = false;
		}, 150);
	};

	const filename = $derived(tab === 'bulk' ? 'cards.txt' : 'cards.csv');
	const mime = $derived(tab === 'bulk' ? 'text/plain' : 'text/csv');

	const copy = async () => {
		await navigator.clipboard.writeText(visibleText);
		copied = true;
		setTimeout(() => (copied = false), 2500);
	};
	const download = () => {
		const blob = new Blob([visibleText], { type: `${mime};charset=utf-8` });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};
</script>

<div class="flex h-full flex-col rounded-md bg-surface-2 p-3 text-text ring-1 ring-border">
	<div class="mb-2 flex items-center gap-2">
		<button
			type="button"
			onclick={() => switchTab('bulk')}
			class="rounded-md px-3 py-1 text-sm {tab === 'bulk'
				? 'bg-accent text-accent-contrast'
				: 'bg-accent/20'}">Bulk Edit</button
		>
		<button
			type="button"
			onclick={() => switchTab('csv')}
			class="rounded-md px-3 py-1 text-sm {tab === 'csv'
				? 'bg-accent text-accent-contrast'
				: 'bg-accent/20'}">CSV</button
		>
	</div>
	<textarea
		readonly
		value={visibleText}
		aria-label="Export preview"
		class="max-h-[50vh] min-h-40 flex-1 resize-y rounded bg-surface p-2 font-mono text-xs text-text ring-1 ring-border transition-opacity duration-50 {dimmed
			? 'opacity-0'
			: 'opacity-100'}"></textarea>
	<div class="mt-2 flex gap-2">
		<button
			type="button"
			onclick={copy}
			class="flex-1 rounded-md bg-accent px-3 py-2 text-sm text-accent-contrast hover:bg-accent-strong"
			>{copied ? 'Copied!' : 'Copy'}</button
		>
		<button
			type="button"
			onclick={download}
			title={`Download ${filename}`}
			class="flex-1 rounded-md bg-accent/20 px-3 py-2 text-sm">Download</button
		>
	</div>
</div>
