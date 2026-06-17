<script>
	import { onMount, onDestroy } from 'svelte';
	import BulkEdit from './BulkEdit.svelte';
	import CSV from './CSV.svelte';
	import Modal from './Modal.svelte';
	import { buildSearchUrl, searchAllPages } from './lib/scryfall.js';
	import { readJSON, writeJSON, readString, writeString } from './lib/storage.js';

	let query = $state('');
	let selectedTab = $state(readString('selectedTab', 'Bulk Edit'));
	let defaultQueryOptions = $state(readString('defaultQueryOptions', ''));
	/** @type {import('./types').Card[]} */
	let cards = $state([]);
	let totalCards = $state(0);
	let optionsModal = $state(false);
	let tipsModal = $state(false);
	let isLoading = $state(false);
	let searchError = $state('');
	/** @type {string[]} */
	let searchHistory = $state([]);
	let showDropdown = $state(false);
	/** @type {HTMLDivElement | undefined} */
	let searchContainer = $state();

	const year = new Date().getFullYear();

	const saveSelectedTab = () => writeString('selectedTab', selectedTab);
	const saveDefaultQueryOptions = () => writeString('defaultQueryOptions', defaultQueryOptions);

	const handleWindowClick = (/** @type {MouseEvent} */ event) => {
		if (
			showDropdown &&
			searchContainer &&
			!searchContainer.contains(/** @type {Node} */ (event.target))
		) {
			showDropdown = false;
		}
	};

	const handleWindowKeydown = (/** @type {KeyboardEvent} */ event) => {
		if (event.key === 'Escape') showDropdown = false;
	};

	onMount(() => {
		searchHistory = readJSON('searchHistory', []);
		window.addEventListener('click', handleWindowClick);
		window.addEventListener('keydown', handleWindowKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('click', handleWindowClick);
		window.removeEventListener('keydown', handleWindowKeydown);
	});

	const runSearch = async (/** @type {string} */ url) => {
		isLoading = true;
		searchError = '';
		cards = [];
		totalCards = 0;

		/** @type {{ error?: string }} */
		let result;
		try {
			result = await searchAllPages(url, {
				// Append each page as it arrives so results render incrementally.
				onPage: (newCards, total) => {
					cards = [...cards, ...newCards];
					totalCards = total;
				}
			});
		} catch {
			result = { error: 'Could not reach Scryfall. Please try again.' };
		}

		if (result.error) {
			searchError = result.error;
			cards = [];
			totalCards = 0;
		}

		isLoading = false;
	};

	const search = (/** @type {SubmitEvent} */ event) => {
		event?.preventDefault();

		const trimmedQuery = query.trim();
		if (!trimmedQuery) {
			searchError = 'Please enter a query.';
			return;
		}

		if (!searchHistory.includes(trimmedQuery)) {
			searchHistory = [trimmedQuery, ...searchHistory.slice(0, 9)];
			writeJSON('searchHistory', searchHistory);
		}

		showDropdown = false;
		runSearch(buildSearchUrl(query, defaultQueryOptions));
	};

	const removeHistoryItem = (/** @type {string} */ item) => {
		searchHistory = searchHistory.filter((entry) => entry !== item);
		writeJSON('searchHistory', searchHistory);
	};

	const clearHistory = () => {
		searchHistory = [];
		writeJSON('searchHistory', searchHistory);
		showDropdown = false;
	};

	const handleCardUpdate = (/** @type {import('./types').Card[]} */ updatedCards) => {
		cards = updatedCards;
	};

	const handleSingleCardUpdate = (/** @type {import('./types').Card} */ updatedCard) => {
		cards = cards.map((card) => (card.id === updatedCard.id ? updatedCard : card));
	};

	const handleRemove = (/** @type {string} */ id) => {
		cards = cards.filter((card) => card.id !== id);
	};
</script>

<div
	class="flex min-h-screen flex-col justify-center bg-linear-to-b from-indigo-500 via-purple-500 to-pink-700 py-6 sm:py-12"
>
	<div class="mx-auto max-w-7xl">
		<div class="relative mx-auto py-3">
			<div
				class="to-light-purple-500 absolute inset-0 -skew-y-6 transform bg-linear-to-r from-purple-400 shadow-lg sm:-rotate-6 sm:skew-y-0 sm:rounded-3xl"
			></div>
			<div class="relative bg-indigo-900 px-4 py-10 shadow-lg sm:rounded-3xl sm:p-20">
				<div class="mx-auto">
					<button
						onclick={() => (tipsModal = true)}
						aria-label="Show tips"
						class="absolute top-0 right-0 mt-4 mr-4 flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-indigo-600 font-serif text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
					>
						i
					</button>

					<Modal
						bind:show={tipsModal}
						title="Tips"
						onclose={() => (tipsModal = false)}
						panelClass="bg-opacity-90 rounded-lg bg-indigo-800 p-4 text-gray-200 sm:w-4/5 md:w-96"
					>
						<p class="mb-2">
							Copy and paste the results into your deck using the Bulk Editor on Moxfield, or you
							can download the text file and import it on Moxfield.
						</p>
						<ul>
							<li class="mb-2">Click on each card to increase the count by one.</li>
							<li class="mb-2">Hold Shift and click the card to decrease the count by one.</li>
							<li class="mb-2">
								Hold Ctrl and click a card to indicate that the card is foil or etched.
							</li>
							<li>Hold Shift and Ctrl and click a card to remove the foil status.</li>
						</ul>
					</Modal>

					<div>
						<h1 class="text-2xl font-semibold text-gray-200">ScryMox</h1>
						<p class="mt-2 text-gray-200">
							Quickly transform a Scryfall query into an importable list of cards for Moxfield.
						</p>
					</div>

					<div class="mt-5 text-red-300" role="alert">
						{#if searchError}
							<div>{searchError}</div>
						{/if}
					</div>

					<div class="mt-5">
						{#if isLoading}
							<p class="mt-4 text-center text-gray-200">
								Loading {cards.length}{totalCards ? ` of ${totalCards}` : ''} cards…
							</p>
						{/if}
					</div>

					<form onsubmit={search} class="mt-8">
						<div class="relative" bind:this={searchContainer}>
							<input
								type="text"
								bind:value={query}
								placeholder="Scryfall Syntax Query"
								class="mt-1 block w-full rounded-md border-transparent bg-gray-200 pr-10 pl-1.5 text-gray-800 focus:border-gray-500 focus:bg-white focus:ring-0"
							/>
							<button
								type="button"
								onclick={() => (showDropdown = !showDropdown)}
								aria-label="Toggle search history"
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
							>
								{showDropdown ? '▲' : '▼'}
							</button>
							{#if showDropdown && searchHistory.length > 0}
								<ul
									class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg"
									role="listbox"
								>
									{#each searchHistory as historyItem (historyItem)}
										<li role="option" aria-selected="false" class="flex items-center">
											<button
												type="button"
												onclick={() => {
													query = historyItem;
													showDropdown = false;
												}}
												class="flex-1 px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
											>
												{historyItem}
											</button>
											<button
												type="button"
												onclick={() => removeHistoryItem(historyItem)}
												aria-label={`Remove ${historyItem} from history`}
												class="px-3 py-2 text-gray-400 hover:text-red-500"
											>
												✕
											</button>
										</li>
									{/each}
									<li class="border-t border-gray-200">
										<button
											type="button"
											onclick={clearHistory}
											class="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
										>
											Clear history
										</button>
									</li>
								</ul>
							{/if}
						</div>
						<button
							type="submit"
							class="mt-4 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
						>
							Search
						</button>
					</form>

					<button
						onclick={() => (optionsModal = true)}
						class="mt-4 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
					>
						Default Query Options
					</button>

					<Modal
						bind:show={optionsModal}
						title="Default Query Options"
						onclose={saveDefaultQueryOptions}
						panelClass="bg-opacity-90 rounded-lg bg-indigo-800 p-4 text-gray-200 sm:w-4/5 md:w-96"
					>
						<p class="text-gray-200">
							Any additional queries listed here will be applied to all searches
						</p>
						<input
							type="text"
							bind:value={defaultQueryOptions}
							placeholder="Default Query Options"
							onblur={saveDefaultQueryOptions}
							class="mt-4 block w-full rounded-md border-transparent bg-gray-200 pl-1.5 text-gray-800 focus:border-gray-500 focus:bg-white focus:ring-0"
						/>
						<button
							onclick={() => {
								saveDefaultQueryOptions();
								optionsModal = false;
							}}
							class="mt-4 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
						>
							Save
						</button>
					</Modal>

					{#if cards.length > 0}
						<p class="mt-4 text-center text-gray-200">
							Total cards: <span class="font-bold">{totalCards}</span>
						</p>

						<div class="mt-4 flex justify-center">
							<button
								onclick={() => {
									selectedTab = 'Bulk Edit';
									saveSelectedTab();
								}}
								class="mt-4 flex w-full justify-center rounded-l-md border border-transparent px-4 py-2 text-sm font-medium text-gray-200 shadow-xs {selectedTab ===
								'Bulk Edit'
									? 'bg-indigo-700'
									: 'bg-indigo-600'} hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
							>
								Bulk Edit
							</button>
							<button
								onclick={() => {
									selectedTab = 'CSV';
									saveSelectedTab();
								}}
								class="mt-4 flex w-full justify-center rounded-r-md border border-transparent px-4 py-2 text-sm font-medium text-gray-200 shadow-xs {selectedTab ===
								'CSV'
									? 'bg-indigo-700'
									: 'bg-indigo-600'} hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
							>
								CSV
							</button>
						</div>

						{#if selectedTab === 'Bulk Edit'}
							<BulkEdit {cards} onupdate={handleSingleCardUpdate} onremove={handleRemove} />
						{:else if selectedTab === 'CSV'}
							<CSV {cards} onupdate={handleCardUpdate} onremove={handleRemove} />
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<footer
			class="mt-8 shrink-0 text-center text-sm text-gray-200 lg:fixed lg:right-1 lg:bottom-0 lg:m-1"
		>
			<p>
				Made with <span class="font-sans">&#9749;</span> by
				<a href="https://github.com/Kerakis" target="_blank" rel="noopener noreferrer">
					&nbsp;Kerakis&nbsp;© {year}
				</a>
			</p>
		</footer>
	</div>
</div>
