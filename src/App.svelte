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
	import CardPreview from './CardPreview.svelte';
	import BottomSheet from './BottomSheet.svelte';
	import Tooltip from './Tooltip.svelte';

	import { buildSearchUrl, searchAllPages } from './lib/scryfall.js';
	import { readCache, writeCache, invalidateCache } from './lib/cache.js';
	import { applyBulk } from './lib/bulk.js';
	import { toggle, selectRange, selectAll, clear } from './lib/selection.js';
	import { readJSON, writeJSON, readString, writeString } from './lib/storage.js';
	import { getStoredTheme, setStoredTheme, resolveTheme, applyTheme } from './lib/theme.js';

	const PAGE_SIZE = 60;
	const REFRESH_COOLDOWN_MS = 10_000;

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
	/** @type {import('./types').Card | null} */
	let previewCard = $state(null);
	let page = $state(1);
	/** @type {string | null} */
	let anchorId = null;
	let settingsOpen = $state(false);
	let exportOpen = $state(false);
	let lastQuery = '';
	let lastRefreshAt = 0;

	const ids = $derived(cards.map((c) => c.id));
	const orderedIds = () => ids;
	const totalPages = $derived(Math.max(1, Math.ceil(cards.length / PAGE_SIZE)));
	const pagedCards = $derived(cards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));

	// Keep the page in range and the preview defaulted to the first card.
	$effect(() => {
		if (page > totalPages) page = totalPages;
	});
	$effect(() => {
		if (!cards.length) {
			previewCard = null;
		} else if (!previewCard || !cards.some((c) => c.id === previewCard?.id)) {
			previewCard = cards[0];
		}
	});

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
		page = 1;
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

	// Manual refresh: in-flight lock + a short cooldown so the button can't be
	// hammered (the shared queue also spaces requests and backs off on 429).
	const onRefresh = () => {
		if (isLoading || !lastQuery) return;
		const now = Date.now();
		if (now - lastRefreshAt < REFRESH_COOLDOWN_MS) {
			bulkNote = 'Refreshing is rate-limited — please wait a few seconds.';
			return;
		}
		lastRefreshAt = now;
		runSearch(lastQuery, { refresh: true });
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
	// Shift+click selects the contiguous range from the anchor (replacing the
	// prior range, like Windows Explorer); Ctrl/⌘+click toggles individuals.
	const onSelect = (/** @type {MouseEvent} */ e, /** @type {string} */ id) => {
		if (e.shiftKey && anchorId) {
			selectedIds = selectRange(new Set(), orderedIds(), anchorId, id);
		} else {
			selectedIds = toggle(selectedIds, id);
			anchorId = id;
		}
	};
	const onHover = (/** @type {import('./types').Card} */ c) => (previewCard = c);

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
	<header class="bg-linear-to-r from-(--bar-from) to-(--bar-to) shadow">
		<div
			class="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-white"
		>
			<h1 class="text-xl font-bold">ScryMox</h1>
			<div class="order-last w-full sm:order-0 sm:w-auto sm:flex-1">
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
			<div class="ml-auto flex items-center gap-2">
				<ThemeToggle bind:theme onchange={onThemeChange} />
				<Tooltip text="Settings">
					<button
						type="button"
						aria-label="Settings"
						onclick={() => (settingsOpen = true)}
						class="flex items-center justify-center rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="h-4 w-4"
						>
							<circle cx="12" cy="12" r="3" />
							<path
								d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
							/>
						</svg>
					</button>
				</Tooltip>
			</div>
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
				refreshDisabled={isLoading}
				onrefresh={onRefresh}
			/>
			{#if bulkNote}<p class="px-1 py-1 text-sm text-amber-500">{bulkNote}</p>{/if}

			<div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_480px] 2xl:grid-cols-[1fr_580px]">
				<div>
					{#if view === 'gallery'}
						<Gallery
							cards={pagedCards}
							{source}
							{selectedIds}
							onupdate={updateCard}
							onremove={removeCard}
							onselect={onSelect}
							onhover={onHover}
						/>
					{:else}
						<CompactTable
							cards={pagedCards}
							{source}
							{selectedIds}
							onupdate={updateCard}
							onremove={removeCard}
							onselect={onSelect}
							onhover={onHover}
						/>
					{/if}

					{#if totalPages > 1}
						<div class="mt-3 flex items-center justify-center gap-3 text-sm">
							<button
								type="button"
								onclick={() => (page = Math.max(1, page - 1))}
								disabled={page === 1}
								class="rounded bg-accent/20 px-3 py-1 disabled:opacity-50">‹ Prev</button
							>
							<span class="text-muted">Page {page} of {totalPages}</span>
							<button
								type="button"
								onclick={() => (page = Math.min(totalPages, page + 1))}
								disabled={page === totalPages}
								class="rounded bg-accent/20 px-3 py-1 disabled:opacity-50">Next ›</button
							>
						</div>
					{/if}
				</div>

				<!-- Export + live preview: side-by-side on lg+, bottom sheet below lg -->
				<aside class="hidden lg:block">
					<div class="sticky top-3 space-y-3">
						<ExportPanel {cards} {source} />
						<CardPreview card={previewCard} />
					</div>
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
