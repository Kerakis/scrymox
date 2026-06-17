<script>
	import { onMount } from 'svelte';
	import SearchBar from './SearchBar.svelte';
	import ResultsToolbar from './ResultsToolbar.svelte';
	import SettingsDrawer from './SettingsDrawer.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import Gallery from './Gallery.svelte';
	import CompactTable from './CompactTable.svelte';
	import BulkActionBar from './BulkActionBar.svelte';
	import ExportPanel from './ExportPanel.svelte';
	import BottomSheet from './BottomSheet.svelte';
	import Tooltip from './Tooltip.svelte';

	import { buildSearchUrl, searchAllPages } from './lib/scryfall.js';
	import { readCache, writeCache, invalidateCache } from './lib/cache.js';
	import { applyBulk } from './lib/bulk.js';
	import { toggle, selectRange, selectAll, clear } from './lib/selection.js';
	import { readJSON, writeJSON, readString, writeString } from './lib/storage.js';
	import { getStoredTheme, setStoredTheme, resolveTheme, applyTheme } from './lib/theme.js';

	// settings
	let query = $state('');
	let defaultQueryOptions = $state(readString('scrymox:defaultQuery', ''));
	let source = $state(
		/** @type {import('./lib/prices').PriceSource} */ (readString('scrymox:source', 'tcgplayer'))
	);
	let view = $state(/** @type {'gallery'|'compact'} */ (readString('scrymox:view', 'gallery')));
	let theme = $state(getStoredTheme());

	// data + ui
	/** @type {import('./types').Card[]} */
	let cards = $state([]);
	let totalCards = $state(0);
	let isLoading = $state(false);
	let searchError = $state('');
	let bulkNote = $state('');
	/** @type {string[]} */
	let searchHistory = $state([]);
	/** @type {Set<string>} */
	let selectedIds = $state(new Set());
	/** @type {string | null} */
	let anchorId = null;
	let settingsOpen = $state(false);
	let exportOpen = $state(false);
	let lastQuery = '';

	const ids = $derived(cards.map((c) => c.id));
	const orderedIds = () => ids;

	// ---- persistence ----
	onMount(() => {
		searchHistory = readJSON('scrymox:history', []);
		const saved =
			/** @type {{ cards?: import('./types').Card[], totalCards?: number, query?: string } | null} */ (
				readJSON('scrymox:working', null)
			);
		if (saved) {
			cards = saved.cards ?? [];
			totalCards = saved.totalCards ?? cards.length;
			lastQuery = saved.query ?? '';
			query = saved.query ?? '';
		}
		// react to OS theme changes while in 'system'
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const onMq = () => applyTheme(resolveTheme(theme, mq.matches));
		mq.addEventListener('change', onMq);
		return () => mq.removeEventListener('change', onMq);
	});

	$effect(() => {
		writeString('scrymox:defaultQuery', defaultQueryOptions);
	});
	$effect(() => {
		writeString('scrymox:source', source);
	});
	$effect(() => {
		writeString('scrymox:view', view);
	});
	$effect(() => {
		writeJSON('scrymox:working', { query: lastQuery, cards, totalCards });
	});

	const onThemeChange = (/** @type {import('./lib/theme').Theme} */ t) => {
		theme = t;
		setStoredTheme(t);
		applyTheme(resolveTheme(t, window.matchMedia('(prefers-color-scheme: dark)').matches));
	};

	// ---- search ----
	const runSearch = async (/** @type {string} */ q, { refresh = false } = {}) => {
		const trimmed = q.trim();
		if (!trimmed) {
			searchError = 'Please enter a query.';
			return;
		}
		if (isLoading) return; // in-flight lock
		searchError = '';
		bulkNote = '';
		selectedIds = clear();
		lastQuery = trimmed;

		if (refresh) invalidateCache(`${trimmed} ${defaultQueryOptions}`);
		const cached = !refresh && readCache(`${trimmed} ${defaultQueryOptions}`);
		if (cached) {
			cards = cached.cards;
			totalCards = cached.totalCards;
			recordHistory(trimmed);
			return;
		}

		isLoading = true;
		cards = [];
		totalCards = 0;
		/** @type {{ error?: string }} */
		let result;
		try {
			result = await searchAllPages(buildSearchUrl(trimmed, defaultQueryOptions), {
				source,
				onPage: (newCards, total) => {
					cards = [...cards, ...newCards];
					totalCards = total;
				}
			});
		} catch {
			result = { error: 'Could not reach Scryfall. Please try again.' };
		}
		isLoading = false;

		if (result.error) {
			searchError = result.error;
			cards = [];
			totalCards = 0;
			return;
		}
		writeCache(`${trimmed} ${defaultQueryOptions}`, cards, totalCards);
		recordHistory(trimmed);
	};

	const recordHistory = (/** @type {string} */ q) => {
		if (!searchHistory.includes(q)) {
			searchHistory = [q, ...searchHistory.slice(0, 14)];
			writeJSON('scrymox:history', searchHistory);
		}
	};
	const removeHistory = (/** @type {string} */ q) => {
		searchHistory = searchHistory.filter((x) => x !== q);
		writeJSON('scrymox:history', searchHistory);
	};
	const clearHistory = () => {
		searchHistory = [];
		writeJSON('scrymox:history', searchHistory);
	};

	// ---- edits ----
	const updateCard = (/** @type {import('./types').Card} */ c) =>
		(cards = cards.map((x) => (x.id === c.id ? c : x)));
	const removeCard = (/** @type {string} */ id) => {
		cards = cards.filter((x) => x.id !== id);
		selectedIds = new Set([...selectedIds].filter((x) => x !== id));
	};
	const onBulkApply = (
		/** @type {Partial<import('./types').Card>} */ patch,
		/** @type {'selected'|'all'} */ scope
	) => {
		const target = scope === 'all' ? new Set(ids) : selectedIds;
		const { cards: next, skipped } = applyBulk(cards, target, patch);
		cards = next;
		bulkNote =
			skipped > 0
				? `${skipped} card${skipped === 1 ? '' : 's'} skipped (finish not available).`
				: '';
	};
	const onBulkRemove = (/** @type {'selected'|'all'} */ scope) => {
		if (scope === 'all') {
			cards = [];
			totalCards = 0;
		} else cards = cards.filter((c) => !selectedIds.has(c.id));
		selectedIds = clear();
	};

	// ---- selection ----
	const onSelect = (/** @type {MouseEvent} */ e, /** @type {string} */ id) => {
		if (e.shiftKey && anchorId) selectedIds = selectRange(selectedIds, orderedIds(), anchorId, id);
		else {
			selectedIds = toggle(selectedIds, id);
			anchorId = id;
		}
	};

	const isTyping = (/** @type {EventTarget | null} */ t) =>
		t instanceof HTMLElement &&
		(['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName) || t.isContentEditable);

	const onKeydown = (/** @type {KeyboardEvent} */ e) => {
		if (isTyping(e.target)) return;
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && cards.length) {
			e.preventDefault();
			selectedIds = selectAll(ids);
		} else if (e.key === 'Escape') {
			selectedIds = clear();
		}
	};
</script>

<svelte:window onkeydown={onKeydown} />

<div class="min-h-screen bg-bg text-text">
	<header class="bg-linear-to-r from-(--bar-from) to-(--bar-to) px-4 py-3 text-white shadow">
		<div class="mx-auto flex max-w-[1800px] items-center gap-3">
			<h1 class="text-xl font-bold">ScryMox</h1>
			<div class="flex-1">
				<SearchBar
					bind:query
					history={searchHistory}
					{isLoading}
					onsearch={() => runSearch(query)}
					onpick={(q) => {
						query = q;
						runSearch(q);
					}}
					onremovehistory={removeHistory}
					onclearhistory={clearHistory}
				/>
			</div>
			<ThemeToggle bind:theme onchange={onThemeChange} />
			<Tooltip text="Settings">
				<button
					type="button"
					aria-label="Settings"
					onclick={() => (settingsOpen = true)}
					class="rounded-full bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30">⚙</button
				>
			</Tooltip>
		</div>
	</header>

	{#if searchError}<p role="alert" class="mx-auto max-w-[1800px] px-4 pt-3 text-red-500">
			{searchError}
		</p>{/if}

	{#if cards.length > 0}
		<main class="mx-auto max-w-[1800px] p-3">
			<ResultsToolbar
				{totalCards}
				selectedCount={selectedIds.size}
				bind:source
				bind:view
				onrefresh={() => runSearch(lastQuery, { refresh: true })}
			/>
			{#if bulkNote}<p class="px-1 py-1 text-sm text-amber-500">{bulkNote}</p>{/if}

			<div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_480px] 2xl:grid-cols-[1fr_580px]">
				<div>
					{#if view === 'gallery'}
						<Gallery
							{cards}
							{source}
							{selectedIds}
							onupdate={updateCard}
							onremove={removeCard}
							onselect={onSelect}
						/>
					{:else}
						<CompactTable
							{cards}
							{source}
							{selectedIds}
							onupdate={updateCard}
							onremove={removeCard}
							onselect={onSelect}
						/>
					{/if}
				</div>
				<!-- Export: side-by-side on lg+, button + bottom sheet below lg -->
				<aside class="hidden lg:block">
					<div class="sticky top-3"><ExportPanel {cards} {source} /></div>
				</aside>
			</div>

			<button
				type="button"
				onclick={() => (exportOpen = true)}
				class="mt-3 w-full rounded-md bg-accent px-4 py-2 text-accent-contrast lg:hidden"
				>⬆ Export</button
			>

			{#if selectedIds.size > 0}
				<div class="sticky bottom-0 z-30 mt-3">
					<BulkActionBar
						selectedCount={selectedIds.size}
						totalCount={cards.length}
						onapply={onBulkApply}
						onremove={onBulkRemove}
					/>
				</div>
			{/if}
		</main>
	{:else if isLoading}
		<p class="mx-auto max-w-[1800px] p-6 text-center text-muted">
			Loading {cards.length}{totalCards ? ` of ${totalCards}` : ''} cards…
		</p>
	{:else}
		<p class="mx-auto max-w-[1800px] p-6 text-center text-muted">
			Enter a Scryfall query to begin.
		</p>
	{/if}

	<SettingsDrawer
		bind:show={settingsOpen}
		bind:defaultQueryOptions
		bind:source
		bind:theme
		onthemechange={onThemeChange}
	/>
	<BottomSheet bind:show={exportOpen} title="Export"><ExportPanel {cards} {source} /></BottomSheet>
</div>
