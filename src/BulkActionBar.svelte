<script>
	import { CONDITIONS, LANGUAGES, FINISH_LABELS } from './lib/constants.js';
	/**
	 * @type {{
	 *   selectedCount: number;
	 *   totalCount: number;
	 *   onapply?: (patch: Partial<import('./types').Card>, scope: 'selected' | 'all') => void;
	 *   onremove?: (scope: 'selected' | 'all') => void;
	 * }}
	 */
	let { selectedCount, totalCount, onapply, onremove } = $props();

	let scope = $state(/** @type {'selected' | 'all'} */ ('selected'));
	let open = $state(/** @type {string | null} */ (null));
	// Menus are positioned `fixed` from the trigger so the bar can scroll
	// horizontally without clipping them (overflow can't be x-auto + y-visible).
	let menuStyle = $state('');
	// Bound to the qty/price inputs so a tap-able ✓ button can submit them —
	// a mobile number pad has no Enter key. ponytail: two vars beats a DOM ref.
	let qtyInput = $state('');
	let priceInput = $state('');

	const toggle = (/** @type {string} */ id, /** @type {MouseEvent} */ e) => {
		if (open === id) {
			open = null;
			return;
		}
		open = id;
		const r = /** @type {HTMLElement} */ (e.currentTarget).getBoundingClientRect();
		menuStyle = `left:${r.left}px;bottom:${window.innerHeight - r.top + 6}px`;
	};
	const apply = (/** @type {Partial<import('./types').Card>} */ p) => {
		onapply?.(p, scope);
		open = null;
	};
	const applyQty = (/** @type {string} */ v) => {
		const n = parseInt(v);
		if (Number.isNaN(n)) return;
		apply({ count: Math.min(99, Math.max(1, n)) });
		qtyInput = '';
	};
	const applyPrice = (/** @type {string} */ v) => {
		const n = parseFloat(v);
		if (Number.isNaN(n) || n < 0) return;
		apply({ price: n, priceManuallySet: true });
		priceInput = '';
	};
	const count = $derived(scope === 'all' ? totalCount : selectedCount);
</script>

<div
	class="flex items-center gap-2 overflow-x-auto rounded-md bg-surface-2 px-3 py-2 text-sm whitespace-nowrap text-text ring-1 ring-border"
>
	<button
		type="button"
		class="rounded-md bg-accent/20 px-2 py-1"
		onclick={(e) => toggle('scope', e)}
		>{scope === 'all' ? `All (${totalCount})` : `Selected (${selectedCount})`} ▾</button
	>
	{#if open === 'scope'}
		<div
			class="fixed z-50 flex flex-col rounded-md bg-surface p-1 shadow-lg ring-1 ring-border"
			style={menuStyle}
		>
			<button
				type="button"
				class="px-3 py-1 text-left hover:bg-accent/20"
				onclick={() => {
					scope = 'selected';
					open = null;
				}}>Selected ({selectedCount})</button
			>
			<button
				type="button"
				class="px-3 py-1 text-left hover:bg-accent/20"
				onclick={() => {
					scope = 'all';
					open = null;
				}}>All ({totalCount})</button
			>
		</div>
	{/if}
	<span class="text-muted">→</span>

	<!-- Quantity first -->
	<button type="button" class="rounded-md bg-accent/20 px-2 py-1" onclick={(e) => toggle('qty', e)}
		>Quantity ▾</button
	>
	{#if open === 'qty'}
		<div
			class="fixed z-50 flex items-center gap-1 rounded-md bg-surface p-2 shadow-lg ring-1 ring-border"
			style={menuStyle}
		>
			<input
				type="number"
				min="1"
				max="99"
				placeholder="Qty"
				bind:value={qtyInput}
				onkeydown={(e) => e.key === 'Enter' && applyQty(qtyInput)}
				class="w-20 rounded-md bg-surface-2 px-2 py-1 ring-1 ring-border"
			/>
			<button
				type="button"
				aria-label="Apply quantity"
				onclick={() => applyQty(qtyInput)}
				class="rounded-md bg-accent px-2 py-1 text-accent-contrast">✓</button
			>
		</div>
	{/if}

	<button
		type="button"
		class="rounded-md bg-accent/20 px-2 py-1"
		onclick={(e) => toggle('finish', e)}>Finish ▾</button
	>
	{#if open === 'finish'}
		<div
			class="fixed z-50 flex flex-col rounded-md bg-surface p-1 shadow-lg ring-1 ring-border"
			style={menuStyle}
		>
			{#each Object.entries(FINISH_LABELS) as [k, v] (k)}
				<button
					type="button"
					class="px-3 py-1 text-left hover:bg-accent/20"
					onclick={() => apply({ selectedFinish: k })}>{v}</button
				>
			{/each}
		</div>
	{/if}

	<button type="button" class="rounded-md bg-accent/20 px-2 py-1" onclick={(e) => toggle('cond', e)}
		>Condition ▾</button
	>
	{#if open === 'cond'}
		<div
			class="fixed z-50 flex max-h-60 flex-col overflow-auto rounded-md bg-surface p-1 shadow-lg ring-1 ring-border"
			style={menuStyle}
		>
			{#each Object.entries(CONDITIONS) as [k, v] (k)}<button
					type="button"
					class="px-3 py-1 text-left hover:bg-accent/20"
					onclick={() => apply({ condition: k })}>{v}</button
				>{/each}
		</div>
	{/if}

	<button type="button" class="rounded-md bg-accent/20 px-2 py-1" onclick={(e) => toggle('lang', e)}
		>Language ▾</button
	>
	{#if open === 'lang'}
		<div
			class="fixed z-50 flex max-h-60 flex-col overflow-auto rounded-md bg-surface p-1 shadow-lg ring-1 ring-border"
			style={menuStyle}
		>
			{#each Object.entries(LANGUAGES) as [k, v] (k)}<button
					type="button"
					class="px-3 py-1 text-left hover:bg-accent/20"
					onclick={() => apply({ language: k })}>{v}</button
				>{/each}
		</div>
	{/if}

	<button
		type="button"
		class="rounded-md bg-accent/20 px-2 py-1"
		onclick={(e) => toggle('price', e)}>Price ▾</button
	>
	{#if open === 'price'}
		<div
			class="fixed z-50 flex flex-col gap-1 rounded-md bg-surface p-2 shadow-lg ring-1 ring-border"
			style={menuStyle}
		>
			<button
				type="button"
				class="rounded-md px-3 py-1 text-left hover:bg-accent/20"
				onclick={() => apply({ price: undefined, priceManuallySet: false })}>Reset to auto</button
			>
			<div class="flex items-center gap-1">
				<input
					type="number"
					step="0.01"
					min="0"
					placeholder="Set price"
					bind:value={priceInput}
					onkeydown={(e) => e.key === 'Enter' && applyPrice(priceInput)}
					class="w-24 rounded-md bg-surface-2 px-2 py-1 ring-1 ring-border"
				/>
				<button
					type="button"
					aria-label="Apply price"
					onclick={() => applyPrice(priceInput)}
					class="rounded-md bg-accent px-2 py-1 text-accent-contrast">✓</button
				>
			</div>
		</div>
	{/if}

	<button
		type="button"
		class="rounded-md bg-accent/20 px-2 py-1"
		onclick={() => apply({ alter: true })}>Alter</button
	>
	<button
		type="button"
		class="rounded-md bg-accent/20 px-2 py-1"
		onclick={() => apply({ proxy: true })}>Proxy</button
	>
	<button
		type="button"
		class="rounded-md bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30"
		onclick={() => {
			onremove?.(scope);
			open = null;
		}}>Remove</button
	>
	<span class="ml-auto pl-2 text-muted">{count} card{count === 1 ? '' : 's'}</span>
</div>
