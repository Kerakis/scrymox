<script>
	import CardImage from './CardImage.svelte';
	import Tooltip from './Tooltip.svelte';
	import { getPrice, formatPrice, currencyAffix } from './lib/prices.js';
	import { getDisplayFinish } from './lib/finishes.js';
	import { CONDITIONS, LANGUAGES, FINISH_LABELS } from './lib/constants.js';

	/**
	 * @type {{
	 *   card: import('./types').Card;
	 *   source: import('./lib/prices').PriceSource;
	 *   selected?: boolean;
	 *   onupdate?: (card: import('./types').Card) => void;
	 *   onremove?: (id: string) => void;
	 *   onselect?: (event: MouseEvent, id: string) => void;
	 *   onhover?: (card: import('./types').Card) => void;
	 *   onflip?: (card: import('./types').Card, flipped: boolean) => void;
	 * }}
	 */
	let { card, source, selected = false, onupdate, onremove, onselect, onhover, onflip } = $props();

	const finishOptions = $derived(
		['', 'foil', 'etched'].filter((f) =>
			f === '' ? card.finishes.includes('nonfoil') : card.finishes.includes(f)
		)
	);
	const autoPrice = $derived(getPrice(card.prices, source, card.selectedFinish));
	const shownPrice = $derived(formatPrice(card.priceManuallySet ? card.price : autoPrice, source));
	const affix = $derived(currencyAffix(source));

	const patch = (/** @type {Partial<import('./types').Card>} */ p) => onupdate?.({ ...card, ...p });
	const setFinish = (/** @type {string} */ f) =>
		patch({ selectedFinish: f, displayFinish: getDisplayFinish(f) });
	const setQty = (/** @type {number} */ n) => patch({ count: Math.min(99, Math.max(1, n)) });
	const setPrice = (/** @type {string} */ v) => {
		if (v.trim() === '') return patch({ price: undefined, priceManuallySet: false });
		const n = parseFloat(v);
		if (Number.isNaN(n) || n < 0) return; // ignore invalid input
		patch({ price: n, priceManuallySet: true });
	};
</script>

<div
	class="flex flex-row gap-2 rounded-lg border border-border bg-surface p-2 sm:flex-col sm:p-0 {selected
		? 'ring-2 ring-accent'
		: ''}"
>
	<!-- select / remove strip: above image on tile, inline on phone row -->
	<div
		class="order-2 flex shrink-0 flex-col items-center justify-between sm:order-0 sm:flex-row sm:px-2 sm:py-1"
	>
		<button
			type="button"
			role="checkbox"
			aria-checked={selected}
			aria-label={`Select ${card.name}`}
			onclick={(e) => onselect?.(e, card.id)}
			class="h-4 w-4 rounded border-2 border-accent {selected ? 'bg-accent' : 'bg-transparent'}"
		></button>
		<Tooltip text="Remove">
			<button
				type="button"
				aria-label={`Remove ${card.name}`}
				onclick={() => onremove?.(card.id)}
				class="px-1 text-muted hover:text-red-400">✕</button
			>
		</Tooltip>
	</div>

	<div class="order-1 w-28 shrink-0 sm:order-0 sm:w-full sm:px-2">
		<CardImage
			{card}
			onselect={(e) => onselect?.(e, card.id)}
			onhover={() => onhover?.(card)}
			onflip={(f) => onflip?.(card, f)}
		/>
	</div>

	<!-- footer controls: qty+price · finish · condition|language · alter|proxy -->
	<div class="order-3 flex flex-1 flex-col gap-1.5 sm:order-0 sm:p-2">
		<div class="flex items-center justify-between gap-2">
			<span class="inline-flex overflow-hidden rounded-md border border-accent text-sm">
				<button
					type="button"
					aria-label="Decrease quantity"
					onclick={() => setQty(card.count - 1)}
					class="bg-accent/20 px-2">–</button
				>
				<input
					type="number"
					min="1"
					max="99"
					value={card.count}
					onchange={(e) => setQty(parseInt(e.currentTarget.value))}
					aria-label="Quantity"
					class="w-10 bg-transparent text-center text-text"
				/>
				<button
					type="button"
					aria-label="Increase quantity"
					onclick={() => setQty(card.count + 1)}
					class="bg-accent/20 px-2">+</button
				>
			</span>
			<span class="text-sm font-semibold {shownPrice == null ? 'text-muted' : ''}">
				{shownPrice ?? '—'}
			</span>
		</div>

		<select
			value={card.selectedFinish}
			onchange={(e) => setFinish(e.currentTarget.value)}
			disabled={finishOptions.length <= 1}
			aria-label="Finish"
			class="w-full rounded-md bg-accent/20 px-2 py-1 text-center text-sm text-text disabled:opacity-70"
		>
			{#each finishOptions as f (f)}<option value={f}>{FINISH_LABELS[f]}</option>{/each}
		</select>

		<div class="grid grid-cols-2 gap-1.5">
			<select
				value={card.condition}
				onchange={(e) => patch({ condition: e.currentTarget.value })}
				aria-label="Condition"
				class="rounded-md bg-accent/20 px-2 py-1 text-sm text-text"
			>
				{#each Object.entries(CONDITIONS) as [k, v] (k)}<option value={k}>{v}</option>{/each}
			</select>
			<select
				value={card.language}
				onchange={(e) => patch({ language: e.currentTarget.value })}
				aria-label="Language"
				class="rounded-md bg-accent/20 px-2 py-1 text-sm text-text"
			>
				{#each Object.entries(LANGUAGES) as [k, v] (k)}<option value={k}>{v}</option>{/each}
			</select>
		</div>

		<div class="grid grid-cols-2 gap-1.5">
			<button
				type="button"
				aria-pressed={card.alter}
				onclick={() => patch({ alter: !card.alter })}
				class="rounded-md border border-accent px-2 py-1 text-sm {card.alter
					? 'bg-accent text-accent-contrast'
					: 'text-muted'}">Alter</button
			>
			<button
				type="button"
				aria-pressed={card.proxy}
				onclick={() => patch({ proxy: !card.proxy })}
				class="rounded-md border border-accent px-2 py-1 text-sm {card.proxy
					? 'bg-accent text-accent-contrast'
					: 'text-muted'}">Proxy</button
			>
		</div>

		<div
			class="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-sm text-text ring-1 ring-border"
		>
			{#if affix.symbol}<span class="text-muted">{affix.symbol}</span>{/if}
			<input
				type="number"
				inputmode="decimal"
				step="0.01"
				min="0"
				value={card.priceManuallySet ? (card.price ?? '') : ''}
				placeholder={autoPrice ?? 'price'}
				onchange={(e) => setPrice(e.currentTarget.value)}
				aria-label="Purchase price override"
				class="w-full bg-transparent text-text outline-none"
			/>
			{#if affix.suffix}<span class="text-xs text-muted">{affix.suffix}</span>{/if}
		</div>
	</div>
</div>
