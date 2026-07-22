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
				class="bg-surface text-text ring-border focus:ring-accent w-full rounded-md px-3 py-2 pr-9 ring-1 focus:ring-2 focus:outline-none"
			/>
			<button
				type="button"
				onclick={() => (showHistory = !showHistory)}
				aria-label="Toggle search history"
				class="text-muted hover:text-text absolute inset-y-0 right-0 px-3"
				><span
					class="inline-block transition-transform duration-200 {showHistory ? 'rotate-180' : ''}"
					aria-hidden="true">▼</span
				></button
			>

			{#if showHistory && history.length > 0}
				<ul
					class="bg-surface-2 text-text ring-accent/40 absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md shadow-xl ring-1"
					role="listbox"
				>
					{#each history as item (item)}
						<li class="flex items-center" role="option" aria-selected="false">
							<button
								type="button"
								class="hover:bg-accent/15 flex-1 px-3 py-2 text-left"
								onclick={() => {
									onpick?.(item);
									showHistory = false;
								}}>{item}</button
							>
							<button
								type="button"
								aria-label={`Remove ${item}`}
								class="text-muted px-3 py-2 hover:text-red-400"
								onclick={() => onremovehistory?.(item)}>✕</button
							>
						</li>
					{/each}
					<li class="border-border border-t">
						<button
							type="button"
							class="text-muted hover:bg-accent/15 w-full px-3 py-2 text-left text-sm"
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
			class="text-accent-strong shrink-0 rounded-md bg-white/95 px-4 py-2 text-sm font-medium shadow-sm hover:bg-white disabled:opacity-60"
		>
			{isLoading ? 'Searching…' : 'Search'}
		</button>
	</div>
</form>
