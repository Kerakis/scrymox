<script>
	import { onMount, onDestroy } from 'svelte';
	import BulkEdit from './BulkEdit.svelte';
	import CSV from './CSV.svelte';

	let query = $state('');
	let selectedTab = $state(localStorage.getItem('selectedTab') || 'Bulk Edit');
	let defaultQueryOptions = $state(localStorage.getItem('defaultQueryOptions') || '');
	let cards = $state([]);
	let totalCards = $state(0);
	let optionsModal = $state(false);
	let tipsModal = $state(false);
	let isLoading = $state(false);
	let searchError = $state('');
	let searchHistory = $state([]);
	let showDropdown = $state(false);

	// Current year
	const year = new Date().getFullYear();

	const saveSelectedTab = () => {
		localStorage.setItem('selectedTab', selectedTab);
	};

	const handleEscape = (event) => {
		if (event.key === 'Escape') {
			optionsModal = false;
			tipsModal = false;
			showDropdown = false;
		}
	};

	const stopPropagation = (event) => {
		event.stopPropagation();
	};

	onMount(() => {
		window.addEventListener('keydown', handleEscape);
		searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleEscape);
	});

	const getDefaultFinish = (finishes) => {
		if (finishes.includes('nonfoil')) {
			return '';
		} else if (finishes.includes('foil')) {
			return 'foil';
		} else if (finishes.includes('etched')) {
			return 'etched';
		} else {
			return null;
		}
	};

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	let lastScryfallRequest = 0;

	const fetchCards = async (url) => {
		searchError = '';

		const now = Date.now();
		if (lastScryfallRequest && now - lastScryfallRequest < 1000) {
			await delay(1000 - (now - lastScryfallRequest));
		}
		lastScryfallRequest = Date.now();

		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Scrymox'
			}
		});
		const data = await response.json();

		if (data.object === 'error' || data.warnings) {
			searchError = data.details ? data.details : '';
			if (data.warnings) {
				searchError += (searchError ? ' ' : '') + data.warnings.join(' ');
			}
			cards = [];
			totalCards = 0;
			isLoading = false;
			return;
		}

		cards = [
			...cards,
			...data.data.map((card) => {
				let selectedFinish = getDefaultFinish(card.finishes);
				let displayFinish = '';
				if (selectedFinish === 'foil') {
					displayFinish = '*F*';
				} else if (selectedFinish === 'etched') {
					displayFinish = '*E*';
				}

				if (!card.card_faces) {
					return {
						id: card.id,
						collector_number: card.collector_number,
						set: card.set,
						image_uris: card.image_uris,
						name: card.name,
						finishes: card.finishes,
						selectedFinish: selectedFinish,
						displayFinish: displayFinish,
						count: 1,
						condition: 'NM',
						language: 'EN',
						alter: false,
						proxy: false,
						prices: card.prices
					};
				} else if (card.layout !== 'split' && card.layout !== 'flip') {
					const cardName =
						card.layout === 'reversible_card' && card.card_faces?.length
							? card.card_faces[0].name
							: card.name;

					return {
						id: card.id,
						collector_number: card.collector_number,
						set: card.set,
						image_uris: [card.card_faces[0].image_uris, card.card_faces[1].image_uris],
						name: cardName,
						finishes: card.finishes,
						selectedFinish: selectedFinish,
						displayFinish: displayFinish,
						count: 1,
						condition: 'NM',
						language: 'EN',
						alter: false,
						proxy: false,
						prices: card.prices
					};
				} else {
					return {
						id: card.id,
						collector_number: card.collector_number,
						set: card.set,
						image_uris: card.image_uris ? card.image_uris : card.card_faces[0].image_uris,
						name: card.name,
						finishes: card.finishes,
						selectedFinish: selectedFinish,
						displayFinish: displayFinish,
						count: 1,
						condition: 'NM',
						language: 'EN',
						alter: false,
						proxy: false,
						prices: card.prices
					};
				}
			})
		];

		totalCards = data.total_cards;
		if (data.has_more) {
			setTimeout(() => fetchCards(data.next_page), 100);
		} else {
			isLoading = false;
		}
	};

	const search = (event) => {
		if (event) event.preventDefault();

		if (!query.trim()) {
			searchError = 'Please enter a query.';
			return;
		}

		// Add to search history
		const trimmedQuery = query.trim();
		if (!searchHistory.includes(trimmedQuery)) {
			searchHistory = [trimmedQuery, ...searchHistory.slice(0, 9)];
			localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
		}

		const encodedQuery = encodeURIComponent(query + ' ' + defaultQueryOptions);
		const url = `https://api.scryfall.com/cards/search?q=${encodedQuery}`;
		cards = [];
		isLoading = true;
		fetchCards(url);
	};

	const saveDefaultQueryOptions = () => {
		localStorage.setItem('defaultQueryOptions', defaultQueryOptions);
	};

	// Handle card updates from child components
	const handleCardUpdate = (updatedCards) => {
		cards = updatedCards;
	};

	const handleSingleCardUpdate = (updatedCard) => {
		cards = cards.map((card) => (card.id === updatedCard.id ? updatedCard : card));
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
						class="absolute top-0 right-0 mt-4 mr-4 flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-indigo-600 font-serif text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
					>
						i
					</button>

					{#if tipsModal}
						<div
							class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
							onclick={() => (tipsModal = false)}
							onkeydown={(e) => {
								if (e.key === 'Escape') tipsModal = false;
							}}
							role="button"
							tabindex="0"
						>
							<div
								class="bg-opacity-90 rounded-lg bg-indigo-800 p-4 text-gray-200 sm:w-4/5 md:w-96"
								role="document"
							>
								<h2 class="mb-2 text-lg font-semibold">Tips</h2>
								<p class="mb-2">
									Copy and paste the results into your deck using the Bulk Editor on Moxfield, or
									you can download the text file and import it on Moxfield.
								</p>
								<ul>
									<li class="mb-2">Click on each card to increase the count by one.</li>
									<li class="mb-2">Hold Shift and click the card to decrease the count by one.</li>
									<li class="mb-2">
										Hold Ctrl and click a card to indicate that the card is foil or etched.
									</li>
									<li>Hold Shift and Ctrl and click a card to remove the foil status.</li>
								</ul>
							</div>
						</div>
					{/if}

					<div>
						<h1 class="text-2xl font-semibold text-gray-200">ScryMox</h1>
						<p class="mt-2 text-gray-200">
							Quickly transform a Scryfall query into an importable list of cards for Moxfield.
						</p>
					</div>

					<div class="mt-5 text-red-500">
						{#if searchError}
							<div>{searchError}</div>
						{/if}
					</div>

					<div class="mt-5">
						{#if isLoading}
							<p class="mt-4 text-center text-gray-200">Loading...</p>
						{/if}
					</div>

					<form onsubmit={search} class="mt-8">
						<div class="relative">
							<input
								type="text"
								bind:value={query}
								placeholder="Scryfall Syntax Query"
								class="mt-1 block w-full rounded-md border-transparent bg-gray-200 pr-10 pl-1.5 text-gray-800 focus:border-gray-500 focus:bg-white focus:ring-0"
							/>
							<button
								type="button"
								onclick={() => (showDropdown = !showDropdown)}
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
							>
								{showDropdown ? '▲' : '▼'}
							</button>
							{#if showDropdown && searchHistory.length > 0}
								<ul
									class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg"
									role="listbox"
								>
									{#each searchHistory as historyItem}
										<li role="option" aria-selected="false">
											<button
												type="button"
												onclick={() => {
													query = historyItem;
													showDropdown = false;
												}}
												class="w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
											>
												{historyItem}
											</button>
										</li>
									{/each}
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

					{#if optionsModal}
						<div
							class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
							onclick={() => (optionsModal = false)}
							onkeydown={(e) => {
								if (e.key === 'Escape') optionsModal = false;
							}}
							role="button"
							tabindex="0"
						>
							<div
								class="bg-opacity-90 rounded-lg bg-indigo-800 p-4 sm:w-4/5 md:w-96"
								role="document"
							>
								<h2 class="mb-2 text-lg font-semibold text-gray-200">Default Query Options</h2>
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
							</div>
						</div>
					{/if}

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
					{/if}

					{#if !isLoading && cards.length > 0}
						{#if selectedTab === 'Bulk Edit'}
							<BulkEdit {cards} onupdate={handleSingleCardUpdate} />
						{:else if selectedTab === 'CSV'}
							<CSV {cards} onupdate={handleCardUpdate} />
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
