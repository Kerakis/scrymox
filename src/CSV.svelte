<script>
  // @ts-nocheck

  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import Card from './Card.svelte';
  export let cards = [];
  const dispatch = createEventDispatcher();
  let countInput;
  let languageDropdown;
  let conditionDropdown;
  let foilDropdown;
  let alterDropdown;
  let proxyDropdown;
  let priceDropdown;
  let showCountModal = false;
  let availableFinishes = [];

  $: {
    if (cards.length > 0 && languageDropdown) {
      languageDropdown.value = '';
    }
    if (cards.length > 0 && conditionDropdown) {
      conditionDropdown.value = '';
    }
    if (cards.length > 0 && alterDropdown) {
      alterDropdown.value = '';
    }
    if (cards.length > 0 && proxyDropdown) {
      proxyDropdown.value = '';
    }
    if (cards.length > 0 && priceDropdown) {
      priceDropdown.value = '';
    }
    if (cards.length > 0 && foilDropdown) {
      foilDropdown.value = '';
    }
    cards.forEach((card) => {
      if (!card.hasOwnProperty('displayedPrice')) {
        card.displayedPrice =
          card.selectedFinish === 'foil'
            ? card.prices.usd_foil
            : card.selectedFinish === 'etched'
              ? card.prices.usd_etched
              : card.prices.usd;
        card.priceManuallySet = false;
      }
    });
    availableFinishes = [...new Set(cards.flatMap((card) => card.finishes))];
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('click', handleClickOutside);
  });

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      showCountModal = false;
    }
  };

  const handleClickOutside = (event) => {
    if (event.target.closest('.modal') === null) {
      showCountModal = false;
    }
  };

  const toggleModal = (event) => {
    event.stopPropagation();
    showCountModal = !showCountModal;
  };

  const languages = {
    EN: 'English',
    ES: 'Spanish',
    FR: 'French',
    DE: 'German',
    IT: 'Italian',
    PT: 'Portuguese',
    JA: 'Japanese',
    KO: 'Korean',
    RU: 'Russian',
    ZHS: 'Simplified Chinese',
    ZHT: 'Traditional Chinese',
    HE: 'Hebrew',
    LA: 'Latin',
    GRC: 'Ancient Greek',
    AR: 'Arabic',
    SA: 'Sanskrit',
    PH: 'Phyrexian',
  };

  const conditions = {
    M: 'Mint',
    NM: 'Near Mint',
    LP: 'Lightly Played',
    MP: 'Played',
    HP: 'Heavily Played',
    DM: 'Damaged',
  };

  const finishes = ['nonfoil', 'foil', 'etched'];

  const updateCard = (index, field, value) => {
    let updatedCards = [...cards];
    if (value instanceof Event) {
      updatedCards[index][field] = value.currentTarget.value;
    } else {
      updatedCards[index][field] = value;
    }
    cards = updatedCards;
    dispatch('update', cards);
  };

  const changeAllCounts = () => {
    let updatedCards = [...cards];
    const newCount = parseInt(countInput.value);
    if (newCount >= 1 && newCount <= 99) {
      updatedCards.forEach((card) => {
        card.count = newCount;
      });
      cards = updatedCards;
      dispatch('update', cards);
    }
    showCountModal = false;
  };

  const changeAllLanguages = (event) => {
    let updatedCards = [...cards];
    updatedCards.forEach((card) => {
      card.language = event.currentTarget.value;
    });
    cards = updatedCards;
    dispatch('update', cards);
  };

  const changeAllConditions = (event) => {
    let updatedCards = [...cards];
    updatedCards.forEach((card) => {
      card.condition = event.target.value;
    });
    cards = updatedCards;
    dispatch('update', cards);
  };

  const changeAllFinishes = (event) => {
    let updatedCards = [...cards];
    updatedCards.forEach((card) => {
      if (card.finishes.includes(event.target.value)) {
        card.selectedFinish = event.target.value;
      }
    });
    cards = updatedCards;
    dispatch('update', cards);
  };

  const changeFinish = (index, event) => {
    if (cards[index].finishes.includes(event.target.value)) {
      updateCard(index, 'selectedFinish', event.target.value);
    }
  };

  const changeAllProxies = (event) => {
    let updatedCards = [...cards];
    updatedCards.forEach((card) => {
      card.proxy = event.target.value === 'TRUE';
    });
    cards = updatedCards;
    dispatch('update', cards);
  };

  const changeAllAlters = (event) => {
    let updatedCards = [...cards];
    updatedCards.forEach((card) => {
      card.alter = event.target.value === 'TRUE';
    });
    cards = updatedCards;
    dispatch('update', cards);
  };

  const updatePrice = (index, event) => {
    cards[index].displayedPrice = event.target.value;
    cards[index].priceManuallySet = true;
    dispatch('update', cards);
  };

  const changeAllPrices = (event) => {
    cards.forEach((card) => {
      if (event.target.value === 'Remove Prices') {
        card.displayedPrice = '';
        card.priceManuallySet = false;
      } else if (event.target.value === 'Use Current Prices') {
        card.displayedPrice =
          card.selectedFinish === 'foil'
            ? card.prices.usd_foil
            : card.selectedFinish === 'etched'
              ? card.prices.usd_etched
              : card.prices.usd;
        card.priceManuallySet = false;
      }
    });
    dispatch('update', cards);
  };

  const toggleStatus = (index, field) => {
    let updatedCards = [...cards];
    updatedCards[index][field] = !updatedCards[index][field];
    cards = updatedCards;
    dispatch('update', cards);
  };

  const downloadCSV = () => {
    const headers = [
      'Count',
      'Name',
      'Edition',
      'Condition',
      'Language',
      'Foil',
      'Collector Number',
      'Alter',
      'Proxy',
      'Purchase Price',
    ];
    const csvRows = cards.map((card, index) =>
      [
        card.count,
        `"${card.name}"`,
        card.set,
        card.condition,
        card.language,
        card.selectedFinish,
        card.collector_number,
        card.alter,
        card.proxy,
        card.displayedPrice,
      ].join(',')
    );
    const csvString = [headers.join(','), ...csvRows].join('\n');
    const csvBlob = new Blob([csvString], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = csvUrl;
    link.download = 'cards.csv';
    link.click();
  };
</script>

<div
  class="cards text-gray-200 border border-gray-500 rounded-md mt-4 overflow-auto h-64"
>
  <table class="table-auto w-full text-gray-200">
    <thead class="sticky z-40 top-0 bg-indigo-800">
      <tr>
        <th class="px-2 text-center relative">
          <button on:click={toggleModal}>Count</button>
          {#if showCountModal}
            <div
              class="modal absolute z-50 top-full left-0 mt-2 w-64 rounded-lg shadow-lg bg-indigo-800"
            >
              <div
                class="py-1"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                <div class="px-4 py-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    bind:this={countInput}
                    class="appearance-none outline-none bg-indigo-900 w-12"
                  />
                  <button
                    class="ml-2 px-2 py-1 bg-indigo-600 text-white rounded"
                    on:click={changeAllCounts}
                  >
                    Update All
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </th>
        <th class="px-2 text-center">Name</th>
        <th class="px-2 text-center">Edition</th>
        <th class="px-2 text-center">
          <select
            bind:this={conditionDropdown}
            class="appearance-none outline-none bg-indigo-800"
            on:change={changeAllConditions}
          >
            <option value="" selected disabled>Condition</option>
            {#each Object.entries(conditions) as [code, condition]}
              <option value={code}>{condition}</option>
            {/each}
          </select>
        </th>
        <th class="px-2 text-center">
          <select
            bind:this={languageDropdown}
            class="appearance-none outline-none bg-indigo-800"
            on:change={changeAllLanguages}
          >
            <option value="" selected disabled>Language</option>
            {#each Object.entries(languages) as [code, language]}
              <option value={code}>{language}</option>
            {/each}
          </select>
        </th>
        <th class="px-2 text-center">
          <select
            bind:this={foilDropdown}
            class="appearance-none outline-none bg-indigo-800"
            on:change={changeAllFinishes}
          >
            <option value="" selected disabled>Foil</option>
            {#each finishes as finish}
              <option
                value={finish}
                disabled={!availableFinishes.includes(finish)}
              >
                {finish}
              </option>
            {/each}
          </select>
        </th>
        <th class="px-2 text-center">Collector Number</th>
        <th class="px-2 text-center">
          <select
            bind:this={alterDropdown}
            class="appearance-none outline-none bg-indigo-800"
            on:change={changeAllAlters}
          >
            <option value="" selected disabled>Alter</option>
            <option value="TRUE">TRUE</option>
            <option value="FALSE">FALSE</option>
          </select>
        </th>
        <th class="px-2 text-center">
          <select
            bind:this={proxyDropdown}
            class="appearance-none outline-none bg-indigo-800"
            on:change={changeAllProxies}
          >
            <option value="" selected disabled>Proxy</option>
            <option value="TRUE">TRUE</option>
            <option value="FALSE">FALSE</option>
          </select>
        </th>
        <th class="px-2 text-center">
          <select
            bind:this={priceDropdown}
            class="appearance-none outline-none bg-indigo-800"
            on:change={changeAllPrices}
          >
            <option value="" selected disabled>Purchase Price</option>
            <option value="Use Current Prices">Use Current Prices</option>
            <option value="Remove Prices">Remove Prices</option>
          </select>
        </th>
      </tr>
    </thead>
    <tbody>
      {#each cards as card, index (card.id)}
        <tr>
          <td class="px-2 text-center">
            <input
              type="number"
              class="w-12 border-0 bg-transparent text-center outline-none text-gray-200"
              bind:value={card.count}
              on:input={(event) => updateCard(index, 'count', event)}
            />
          </td>
          <td class="px-2 text-center underline"
            ><Card bind:card displayMode="CSV" /></td
          >
          <td class="px-2 text-center uppercase">{card.set}</td>
          <td class="px-2 text-center">
            <select
              class="appearance-none outline-none bg-indigo-900"
              bind:value={card.condition}
              on:change={(event) =>
                updateCard(index, 'condition', event.target.value)}
            >
              {#each Object.entries(conditions) as [code, condition]}
                <option value={code}>{condition}</option>
              {/each}
            </select>
          </td>
          <td class="px-2 text-center">
            <select
              class="appearance-none outline-none bg-indigo-900"
              bind:value={card.language}
              on:change={(event) =>
                updateCard(index, 'language', event.target.value)}
            >
              {#each Object.entries(languages) as [code, language]}
                <option value={code}>{language}</option>
              {/each}
            </select>
          </td>
          <td class="px-2 text-center">
            <select
              class="appearance-none outline-none bg-indigo-900"
              bind:value={card.selectedFinish}
              on:change={(event) => changeFinish(index, event)}
            >
              {#each finishes as finish}
                {#if card.finishes.includes(finish)}
                  <option value={finish}>{finish}</option>
                {/if}
              {/each}
            </select>
          </td>
          <td class="px-2 text-center">{card.collector_number}</td>
          <td
            class="px-2 text-center uppercase cursor-pointer"
            on:click={() => toggleStatus(index, 'alter')}>{card.alter}</td
          >
          <td
            class="px-2 text-center uppercase cursor-pointer"
            on:click={() => toggleStatus(index, 'proxy')}>{card.proxy}</td
          >
          <td class="px-2 text-center">
            <input
              type="number"
              class="appearance-none outline-none bg-indigo-900"
              bind:value={card.displayedPrice}
              on:input={(event) => updatePrice(index, event)}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<button
  on:click={downloadCSV}
  class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
  Download
</button>
