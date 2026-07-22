<script>
	import { getPrice, currencyAffix } from './lib/prices.js';
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
	 * }}
	 */
	let { card, source, selected = false, onupdate, onremove, onselect, onhover } = $props();
	const finishOptions = $derived(
		['', 'foil', 'etched'].filter((f) =>
			f === '' ? card.finishes.includes('nonfoil') : card.finishes.includes(f)
		)
	);
	const autoPrice = $derived(getPrice(card.prices, source, card.selectedFinish));
	const affix = $derived(currencyAffix(source));
	const patch = (/** @type {Partial<import('./types').Card>} */ p) => onupdate?.({ ...card, ...p });
	const setPrice = (/** @type {string} */ v) => {
		if (v.trim() === '') return patch({ price: undefined, priceManuallySet: false });
		const n = parseFloat(v);
		if (Number.isNaN(n) || n < 0) return; // ignore invalid input
		patch({ price: n, priceManuallySet: true });
	};
</script>

<tr
	class="border-border border-b {selected ? 'bg-accent/10' : ''}"
	onmouseenter={() => onhover?.(card)}
>
	<td class="px-2 py-1">
		<button
			type="button"
			role="checkbox"
			aria-checked={selected}
			aria-label={`Select ${card.name}`}
			onclick={(e) => onselect?.(e, card.id)}
			class="border-accent h-4 w-4 rounded border-2 {selected ? 'bg-accent' : ''}"
		></button>
	</td>
	<td class="px-2 py-1">
		<input
			type="number"
			min="1"
			max="99"
			value={card.count}
			onchange={(e) => patch({ count: Math.min(99, Math.max(1, parseInt(e.currentTarget.value))) })}
			aria-label="Quantity"
			class="bg-surface-2 text-text ring-border w-14 rounded-md px-1 ring-1"
		/>
	</td>
	<td class="max-w-[16rem] truncate px-2 py-1">{card.name}</td>
	<td class="text-muted px-2 py-1 whitespace-nowrap"
		>{card.set.toUpperCase()} · CN {card.collector_number}</td
	>
	<td class="px-2 py-1">
		<select
			value={card.selectedFinish}
			onchange={(e) =>
				patch({
					selectedFinish: e.currentTarget.value,
					displayFinish: getDisplayFinish(e.currentTarget.value)
				})}
			disabled={finishOptions.length <= 1}
			aria-label="Finish"
			class="bg-accent/20 text-text w-full rounded-md px-1 disabled:opacity-70"
		>
			{#each finishOptions as f (f)}<option value={f}>{FINISH_LABELS[f]}</option>{/each}
		</select>
	</td>
	<td class="px-2 py-1">
		<select
			value={card.condition}
			onchange={(e) => patch({ condition: e.currentTarget.value })}
			aria-label="Condition"
			class="bg-accent/20 text-text w-full rounded-md px-1"
		>
			{#each Object.entries(CONDITIONS) as [k, v] (k)}<option value={k}>{v}</option>{/each}
		</select>
	</td>
	<td class="px-2 py-1">
		<select
			value={card.language}
			onchange={(e) => patch({ language: e.currentTarget.value })}
			aria-label="Language"
			class="bg-accent/20 text-text w-full rounded-md px-1"
		>
			{#each Object.entries(LANGUAGES) as [k, v] (k)}<option value={k}>{v}</option>{/each}
		</select>
	</td>
	<td class="px-2 py-1 text-center"
		><input
			type="checkbox"
			checked={card.alter}
			onchange={() => patch({ alter: !card.alter })}
			aria-label="Alter"
		/></td
	>
	<td class="px-2 py-1 text-center"
		><input
			type="checkbox"
			checked={card.proxy}
			onchange={() => patch({ proxy: !card.proxy })}
			aria-label="Proxy"
		/></td
	>
	<td class="px-2 py-1">
		<div
			class="bg-surface-2 text-text ring-border flex w-24 items-center gap-1 rounded-md px-1 ring-1"
		>
			{#if affix.symbol}<span class="text-muted text-xs">{affix.symbol}</span>{/if}
			<input
				type="number"
				inputmode="decimal"
				step="0.01"
				min="0"
				value={card.priceManuallySet ? (card.price ?? '') : ''}
				placeholder={autoPrice ?? '—'}
				onchange={(e) => setPrice(e.currentTarget.value)}
				aria-label="Purchase price override"
				class="w-full bg-transparent outline-none"
			/>
			{#if affix.suffix}<span class="text-muted text-xs">{affix.suffix}</span>{/if}
		</div>
	</td>
	<td class="px-2 py-1"
		><button
			type="button"
			aria-label={`Remove ${card.name}`}
			onclick={() => onremove?.(card.id)}
			class="text-muted px-1 hover:text-red-400">✕</button
		></td
	>
</tr>
