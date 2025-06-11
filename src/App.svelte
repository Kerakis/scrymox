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

  // Current year
  const year = new Date().getFullYear();

  const saveSelectedTab = () => {
    localStorage.setItem('selectedTab', selectedTab);
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      optionsModal = false;
      tipsModal = false;
    }
  };

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  onMount(() => {
    window.addEventListener('keydown', handleEscape);
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

  const fetchCards = async (url) => {
    searchError = '';

    const response = await fetch(url);
    const data = await response.json();

    if (data.object === 'error' || data.warnings) {
      searchError = data.details ? data.details : '';
      if (data.warnings) {
        searchError += (searchError ? ' ' : '') + data.warnings.join(' ');
      }
      cards = [];
      totalCards = 0;
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
            prices: card.prices,
          };
        } else if (card.layout !== 'split' && card.layout !== 'flip') {
          return {
            id: card.id,
            collector_number: card.collector_number,
            set: card.set,
            image_uris: [
              card.card_faces[0].image_uris,
              card.card_faces[1].image_uris,
            ],
            name: card.name,
            finishes: card.finishes,
            selectedFinish: selectedFinish,
            displayFinish: displayFinish,
            count: 1,
            condition: 'NM',
            language: 'EN',
            alter: false,
            proxy: false,
            prices: card.prices,
          };
        } else {
          return {
            id: card.id,
            collector_number: card.collector_number,
            set: card.set,
            image_uris: card.image_uris
              ? card.image_uris
              : card.card_faces[0].image_uris,
            name: card.name,
            finishes: card.finishes,
            selectedFinish: selectedFinish,
            displayFinish: displayFinish,
            count: 1,
            condition: 'NM',
            language: 'EN',
            alter: false,
            proxy: false,
            prices: card.prices,
          };
        }
      }),
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
    cards = cards.map((card) => card.id === updatedCard.id ? updatedCard : card);
  };
</script>

<div class="min-h-screen bg-linear-to-b from-indigo-500 via-purple-500 to-pink-700 py-6 flex flex-col justify-center sm:py-12">
  <div class="max-w-7xl mx-auto">
    <div class="relative py-3 mx-auto">
      <div class="absolute inset-0 bg-linear-to-r from-purple-400 to-light-purple-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
      <div class="relative px-4 py-10 bg-indigo-900 shadow-lg sm:rounded-3xl sm:p-20">
        <div class="mx-auto">
          <button
            onclick={() => (tipsModal = true)}
            class="absolute top-0 right-0 mt-4 mr-4 w-8 h-8 font-serif flex items-center justify-center border border-transparent shadow-xs text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
          >
            i
          </button>
          
          {#if tipsModal}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
              onclick={() => (tipsModal = false)}
              role="dialog"
              aria-modal="true"
              tabindex="-1"
            >
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <div
                class="bg-indigo-800 text-gray-200 sm:w-4/5 md:w-96 bg-opacity-90 rounded-lg p-4"
                onclick={stopPropagation}
                role="document"
              >
                <h2 class="text-lg font-semibold mb-2">Tips</h2>
                <p class="mb-2">
                  Copy and paste the results into your deck using the Bulk
                  Editor on Moxfield, or you can download the text file and
                  import it on Moxfield.
                </p>
                <ul>
                  <li class="mb-2">Click on each card to increase the count by one.</li>
                  <li class="mb-2">Hold Shift and click the card to decrease the count by one.</li>
                  <li class="mb-2">Hold Ctrl and click a card to indicate that the card is foil or etched.</li>
                  <li>Hold Shift and Ctrl and click a card to remove the foil status.</li>
                </ul>
              </div>
            </div>
          {/if}
          
          <div>
            <h1 class="text-2xl text-gray-200 font-semibold">ScryMox</h1>
            <p class="mt-2 text-gray-200">
              Quickly transform a Scryfall query into an importable list of cards for Moxfield.
            </p>
          </div>
          
          <div class="text-red-500 mt-5">
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
            <input
              type="text"
              bind:value={query}
              placeholder="Scryfall Syntax Query"
              class="mt-1 pl-1.5 block w-full rounded-md text-gray-800 bg-gray-200 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
            />
            <button
              type="submit"
              class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-xs text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Search
            </button>
          </form>
          
          <button
            onclick={() => (optionsModal = true)}
            class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-xs text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Default Query Options
          </button>
          
          {#if optionsModal}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
              onclick={() => (optionsModal = false)}
              role="dialog"
              aria-modal="true"
              tabindex="-1"
            >
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <div
                class="bg-indigo-800 sm:w-4/5 md:w-96 bg-opacity-90 rounded-lg p-4"
                onclick={stopPropagation}
                role="document"
              >
                <h2 class="text-lg text-gray-200 font-semibold mb-2">Default Query Options</h2>
                <p class="text-gray-200">
                  Any additional queries listed here will be applied to all searches
                </p>
                <input
                  type="text"
                  bind:value={defaultQueryOptions}
                  placeholder="Default Query Options"
                  onblur={saveDefaultQueryOptions}
                  class="mt-4 pl-1.5 block w-full rounded-md text-gray-800 bg-gray-200 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
                />
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
                class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-l-md shadow-xs text-sm font-medium text-gray-200 {selectedTab === 'Bulk Edit' ? 'bg-indigo-700' : 'bg-indigo-600'} hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Bulk Edit
              </button>
              <button
                onclick={() => {
                  selectedTab = 'CSV';
                  saveSelectedTab();
                }}
                class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-r-md shadow-xs text-sm font-medium text-gray-200 {selectedTab === 'CSV' ? 'bg-indigo-700' : 'bg-indigo-600'} hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
    
    <footer class="shrink-0 mt-8 text-sm text-gray-200 text-center lg:fixed lg:m-1 lg:bottom-0 lg:right-1">
      <p>
        Made with <span class="font-sans">&#9749;</span> by
        <a href="https://github.com/Kerakis" target="_blank" rel="noopener noreferrer">
          &nbsp;Kerakis&nbsp;© {year}
        </a>
      </p>
    </footer>
  </div>
</div>