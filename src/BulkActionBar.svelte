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
	const toggle = (/** @type {string} */ id) => (open = open === id ? null : id);
	const apply = (/** @type {Partial<import('./types').Card>} */ p) => {
		onapply?.(p, scope);
		open = null;
	};
	const count = $derived(scope === 'all' ? totalCount : selectedCount);
</script>

<div
	class="flex items-center gap-2 overflow-hidden bg-surface-2 px-3 py-2 text-sm whitespace-nowrap text-text ring-1 ring-border"
>
	<select bind:value={scope} aria-label="Apply scope" class="rounded bg-accent/20 px-2 py-1">
		<option value="selected">Selected ({selectedCount})</option>
		<option value="all">All ({totalCount})</option>
	</select>
	<span class="text-muted">→</span>

	<!-- Quantity first -->
	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('qty')}
			>Quantity ▾</button
		>
		{#if open === 'qty'}
			<div class="absolute z-50 mt-1 rounded-md bg-surface p-2 shadow-lg ring-1 ring-border">
				<input
					type="number"
					min="1"
					max="99"
					placeholder="Qty"
					onkeydown={(e) =>
						e.key === 'Enter' &&
						apply({ count: Math.min(99, Math.max(1, parseInt(e.currentTarget.value))) })}
					class="w-20 rounded bg-surface-2 px-2 py-1 ring-1 ring-border"
				/>
			</div>
		{/if}
	</div>

	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('finish')}
			>Finish ▾</button
		>
		{#if open === 'finish'}
			<div
				class="absolute z-50 mt-1 flex flex-col rounded-md bg-surface p-1 shadow-lg ring-1 ring-border"
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
	</div>

	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('cond')}
			>Condition ▾</button
		>
		{#if open === 'cond'}
			<div
				class="absolute z-50 mt-1 flex max-h-60 flex-col overflow-auto rounded-md bg-surface p-1 shadow-lg ring-1 ring-border"
			>
				{#each Object.entries(CONDITIONS) as [k, v] (k)}<button
						type="button"
						class="px-3 py-1 text-left hover:bg-accent/20"
						onclick={() => apply({ condition: k })}>{v}</button
					>{/each}
			</div>
		{/if}
	</div>

	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('lang')}
			>Language ▾</button
		>
		{#if open === 'lang'}
			<div
				class="absolute z-50 mt-1 flex max-h-60 flex-col overflow-auto rounded-md bg-surface p-1 shadow-lg ring-1 ring-border"
			>
				{#each Object.entries(LANGUAGES) as [k, v] (k)}<button
						type="button"
						class="px-3 py-1 text-left hover:bg-accent/20"
						onclick={() => apply({ language: k })}>{v}</button
					>{/each}
			</div>
		{/if}
	</div>

	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('price')}
			>Price ▾</button
		>
		{#if open === 'price'}
			<div
				class="absolute z-50 mt-1 flex flex-col gap-1 rounded-md bg-surface p-2 shadow-lg ring-1 ring-border"
			>
				<button
					type="button"
					class="px-3 py-1 text-left hover:bg-accent/20"
					onclick={() => apply({ price: undefined, priceManuallySet: false })}>Reset to auto</button
				>
				<input
					type="number"
					step="0.01"
					min="0"
					placeholder="Set price"
					onkeydown={(e) =>
						e.key === 'Enter' &&
						apply({ price: parseFloat(e.currentTarget.value), priceManuallySet: true })}
					class="w-24 rounded bg-surface-2 px-2 py-1 ring-1 ring-border"
				/>
			</div>
		{/if}
	</div>

	<button
		type="button"
		class="rounded bg-accent/20 px-2 py-1"
		onclick={() => apply({ alter: true })}>Alter</button
	>
	<button
		type="button"
		class="rounded bg-accent/20 px-2 py-1"
		onclick={() => apply({ proxy: true })}>Proxy</button
	>
	<button
		type="button"
		class="rounded bg-red-500/20 px-2 py-1 text-red-300"
		onclick={() => {
			onremove?.(scope);
			open = null;
		}}>🗑 Remove</button
	>
	<span class="ml-auto text-muted">{count} card{count === 1 ? '' : 's'}</span>
</div>
