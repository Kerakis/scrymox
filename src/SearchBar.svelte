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
	<div class="relative" bind:this={container}>
		<input
			type="text"
			bind:value={query}
			placeholder="Scryfall search query"
			aria-label="Scryfall search query"
			class="w-full rounded-md bg-white px-3 py-2 pr-10 text-gray-800 focus:outline-none"
		/>
		<button
			type="button"
			onclick={() => (showHistory = !showHistory)}
			aria-label="Toggle search history"
			class="absolute inset-y-0 right-0 px-3 text-gray-500">{showHistory ? '▲' : '▼'}</button
		>

		{#if showHistory && history.length > 0}
			<ul
				class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface text-text shadow-lg ring-1 ring-border"
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

	<div class="mt-2 flex items-center gap-3">
		<button
			type="submit"
			disabled={isLoading}
			class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-strong disabled:opacity-60"
		>
			{isLoading ? 'Searching…' : 'Search'}
		</button>
		<a
			href="https://scryfall.com/docs/syntax"
			target="_blank"
			rel="noopener noreferrer"
			class="text-sm text-white/80 underline hover:text-white">Syntax guide ↗</a
		>
	</div>
</form>
