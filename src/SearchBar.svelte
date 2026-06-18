<script>
	/**
	 * @type {{
	 *   query?: string; history?: string[]; isLoading?: boolean;
	 *   onsearch?: () => void; onpick?: (q: string) => void;
	 *   onremovehistory?: (q: string) => void; onclearhistory?: () => void;
	 * }}
	 */
	let {
		query = $bindable(''),
		history = [],
		isLoading = false,
		onsearch,
		onpick,
		onremovehistory,
		onclearhistory
	} = $props();
	let showHistory = $state(false);
	/** @type {HTMLElement | undefined} */
	let container = $state();

	const submit = (/** @type {SubmitEvent} */ e) => {
		e.preventDefault();
		showHistory = false;
		onsearch?.();
	};
	$effect(() => {
		const onDoc = (/** @type {MouseEvent} */ e) => {
			if (showHistory && container && !container.contains(/** @type {Node} */ (e.target)))
				showHistory = false;
		};
		window.addEventListener('click', onDoc);
		return () => window.removeEventListener('click', onDoc);
	});
</script>

<form onsubmit={submit} class="w-full">
	<div class="flex items-stretch gap-2" bind:this={container}>
		<div class="relative flex-1">
			<input
				type="text"
				bind:value={query}
				placeholder="Scryfall search query"
				aria-label="Scryfall search query"
				class="w-full rounded-md bg-surface px-3 py-2 pr-9 text-text ring-1 ring-border focus:ring-2 focus:ring-accent focus:outline-none"
			/>
			<button
				type="button"
				onclick={() => (showHistory = !showHistory)}
				aria-label="Toggle search history"
				class="absolute inset-y-0 right-0 px-3 text-muted hover:text-text"
				>{showHistory ? '▲' : '▼'}</button
			>

			{#if showHistory && history.length > 0}
				<ul
					class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface-2 text-text shadow-xl ring-1 ring-accent/40"
					role="listbox"
				>
					{#each history as item (item)}
						<li class="flex items-center" role="option" aria-selected="false">
							<button
								type="button"
								class="flex-1 px-3 py-2 text-left hover:bg-accent/15"
								onclick={() => {
									onpick?.(item);
									showHistory = false;
								}}>{item}</button
							>
							<button
								type="button"
								aria-label={`Remove ${item}`}
								class="px-3 py-2 text-muted hover:text-red-400"
								onclick={() => onremovehistory?.(item)}>✕</button
							>
						</li>
					{/each}
					<li class="border-t border-border">
						<button
							type="button"
							class="w-full px-3 py-2 text-left text-sm text-muted hover:bg-accent/15"
							onclick={() => {
								onclearhistory?.();
								showHistory = false;
							}}>Clear history</button
						>
					</li>
				</ul>
			{/if}
		</div>

		<button
			type="submit"
			disabled={isLoading}
			class="shrink-0 rounded-md bg-white/95 px-4 py-2 text-sm font-medium text-accent-strong shadow-sm hover:bg-white disabled:opacity-60"
		>
			{isLoading ? 'Searching…' : 'Search'}
		</button>
	</div>
</form>
