<script>
	import { getPrice, formatPrice } from './lib/prices.js';
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
	const patch = (/** @type {Partial<import('./types').Card>} */ p) => onupdate?.({ ...card, ...p });
</script>

<tr
	class="border-b border-border {selected ? 'bg-accent/10' : ''}"
	onmouseenter={() => onhover?.(card)}
>
	<td class="px-2 py-1">
		<button
			type="button"
			role="checkbox"
			aria-checked={selected}
			aria-label={`Select ${card.name}`}
			onclick={(e) => onselect?.(e, card.id)}
			class="h-4 w-4 rounded border-2 border-accent {selected ? 'bg-accent' : ''}"
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
			class="w-14 rounded bg-surface-2 px-1 text-text ring-1 ring-border"
		/>
	</td>
	<td class="max-w-[16rem] truncate px-2 py-1">{card.name}</td>
	<td class="px-2 py-1 whitespace-nowrap text-muted"
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
			aria-label="Finish"
			class="rounded bg-accent/20 px-1 text-text"
		>
			{#each finishOptions as f (f)}<option value={f}>{FINISH_LABELS[f]}</option>{/each}
		</select>
	</td>
	<td class="px-2 py-1">
		<select
			value={card.condition}
			onchange={(e) => patch({ condition: e.currentTarget.value })}
			aria-label="Condition"
			class="rounded bg-accent/20 px-1 text-text"
		>
			{#each Object.entries(CONDITIONS) as [k, v] (k)}<option value={k}>{v}</option>{/each}
		</select>
	</td>
	<td class="px-2 py-1">
		<select
			value={card.language}
			onchange={(e) => patch({ language: e.currentTarget.value })}
			aria-label="Language"
			class="rounded bg-accent/20 px-1 text-text"
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
		<input
			type="number"
			step="0.01"
			min="0"
			value={card.priceManuallySet ? (card.price ?? '') : ''}
			placeholder={formatPrice(autoPrice, source) ?? '—'}
			onchange={(e) =>
				e.currentTarget.value === ''
					? patch({ price: undefined, priceManuallySet: false })
					: patch({ price: parseFloat(e.currentTarget.value), priceManuallySet: true })}
			aria-label="Purchase price override"
			class="w-24 rounded bg-surface-2 px-1 text-text ring-1 ring-border"
		/>
	</td>
	<td class="px-2 py-1"
		><button
			type="button"
			aria-label={`Remove ${card.name}`}
			onclick={() => onremove?.(card.id)}
			class="px-1 text-muted hover:text-red-400">✕</button
		></td
	>
</tr>
