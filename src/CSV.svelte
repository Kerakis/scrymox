<script>
  import { onMount, onDestroy } from 'svelte';
  import Card from './Card.svelte';

  let { cards = [], onupdate } = $props();
  let countInput = $state();
  let languageDropdown = $state();
  let conditionDropdown = $state();
  let foilDropdown = $state();
  let alterDropdown = $state();
  let proxyDropdown = $state();
  let priceDropdown = $state();
  let showCountModal = $state(false);
  let availableFinishes = $state([]);

  $effect(() => {
    if (cards.length > 0 && languageDropdown) {
      languageDropdown.value = 'EN';
    }
    if (cards.length > 0 && conditionDropdown) {
      conditionDropdown.value = 'NM';
    }
    if (cards.length > 0 && alterDropdown) {
      alterDropdown.value = false;
    }
    if (cards.length > 0 && proxyDropdown) {
      proxyDropdown.value = false;
    }
    if (cards.length > 0 && priceDropdown) {
      priceDropdown.value = 'auto';
    }
    if (cards.length > 0 && foilDropdown) {
      foilDropdown.value = '';
    }
    availableFinishes = [...new Set(cards.flatMap((card) => card.finishes))];
  });

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
    if (event.key === 'Enter' && showCountModal) {
      changeAllCounts();
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

  const updateCard = (index, field, eventOrValue) => {
    let updatedCards = [...cards];
    if (field === 'count') {
      const newCount = parseInt(eventOrValue);
      if (newCount >= 1 && newCount <= 99) {
        updatedCards[index][field] = newCount;
      }
    } else if (eventOrValue instanceof Event) {
      const target = eventOrValue.currentTarget;
      if (target && 'value' in target) {
        updatedCards[index][field] = target.value;
      }
    } else {
      updatedCards[index][field] = eventOrValue;
    }
    if (onupdate) {
      onupdate(updatedCards);
    }
  };

  const changeAllCounts = () => {
    let updatedCards = [...cards];
    const newCount = parseInt(countInput.value);
    if (newCount >= 1 && newCount <= 99) {
      updatedCards.forEach((card) => {
        card.count = newCount;
      });
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
    showCountModal = false;
  };

  const changeAllLanguages = (event) => {
    let updatedCards = [...cards];
    const target = event.currentTarget;
    if (target && 'value' in target) {
      updatedCards.forEach((card) => {
        card.language = target.value;
      });
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
  };

  const changeAllConditions = (event) => {
    let updatedCards = [...cards];
    const target = event.currentTarget;
    if (target && 'value' in target) {
      updatedCards.forEach((card) => {
        card.condition = target.value;
      });
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
  };

  const changeAllFinishes = (event) => {
    let updatedCards = [...cards];
    const target = event.currentTarget;
    if (target && 'value' in target) {
      const selectedFinish = target.value;
      updatedCards.forEach((card) => {
        card.selectedFinish = selectedFinish;
        if (selectedFinish === 'foil') {
          card.displayFinish = '*F*';
        } else if (selectedFinish === 'etched') {
          card.displayFinish = '*E*';
        } else {
          card.displayFinish = '';
        }
      });
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
  };

  const changeFinish = (index, event) => {
    let updatedCards = [...cards];
    const target = event.currentTarget;
    if (target && 'value' in target) {
      const selectedFinish = target.value;
      updatedCards[index].selectedFinish = selectedFinish;
      if (selectedFinish === 'foil') {
        updatedCards[index].displayFinish = '*F*';
      } else if (selectedFinish === 'etched') {
        updatedCards[index].displayFinish = '*E*';
      } else {
        updatedCards[index].displayFinish = '';
      }
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
  };

  const changeAllProxies = (event) => {
    let updatedCards = [...cards];
    const target = event.currentTarget;
    if (target && 'value' in target) {
      const isProxy = target.value === 'true';
      updatedCards.forEach((card) => {
        card.proxy = isProxy;
      });
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
  };

  const changeAllAlters = (event) => {
    let updatedCards = [...cards];
    const target = event.currentTarget;
    if (target && 'value' in target) {
      const isAlter = target.value === 'true';
      updatedCards.forEach((card) => {
        card.alter = isAlter;
      });
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
  };

  const updatePrice = (index, event) => {
    let updatedCards = [...cards];
    const target = event.currentTarget;
    if (target && 'value' in target) {
      updatedCards[index].price = parseFloat(target.value);
      updatedCards[index].priceManuallySet = true;
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
  };

  const changeAllPrices = (event) => {
    let updatedCards = [...cards];
    const target = event.currentTarget;
    if (target && 'value' in target) {
      const priceType = target.value;
      if (priceType === 'auto') {
        updatedCards.forEach((card) => {
          card.priceManuallySet = false;
        });
      }
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
  };

  const toggleStatus = (index, field) => {
    let updatedCards = [...cards];
    updatedCards[index][field] = !updatedCards[index][field];
    if (onupdate) {
      onupdate(updatedCards);
    }
  };

  // Handle card updates from the Card component in CSV mode
  const handleCardUpdate = (updatedCard) => {
    let updatedCards = [...cards];
    const cardIndex = updatedCards.findIndex((c) => c.id === updatedCard.id);
    if (cardIndex !== -1) {
      updatedCards[cardIndex] = updatedCard;
      if (onupdate) {
        onupdate(updatedCards);
      }
    }
  };

  const downloadCSV = () => {
    const csvContent = [
      [
        'Count',
        'Name',
        'Edition',
        'Collector Number',
        'Condition',
        'Language',
        'Foil',
        'Alter',
        'Proxy',
        'Price',
      ].join(','),
      ...cards.map((card) =>
        [
          card.count,
          `"${card.name}"`,
          card.set.toUpperCase(),
          card.collector_number,
          card.condition,
          card.language,
          card.selectedFinish === 'foil'
            ? 'foil'
            : card.selectedFinish === 'etched'
              ? 'etched'
              : '',
          card.alter ? 'Yes' : '',
          card.proxy ? 'Yes' : '',
          card.price || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cards.csv';
    link.click();
  };
</script>

<div
  class="cards text-gray-200 border border-gray-500 rounded-md mt-4 overflow-auto h-64"
>
  <table class="table-auto w-full text-gray-200">
    <thead>
      <tr class="border-b border-gray-500">
        <th class="px-2 py-1 text-left">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span onclick={toggleModal} class="cursor-pointer">Count</span>
          {#if showCountModal}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 modal"
              onclick={() => (showCountModal = false)}
            >
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="bg-indigo-800 text-gray-200 p-4 rounded-lg"
                onclick={(e) => e.stopPropagation()}
              >
                <input
                  bind:this={countInput}
                  type="number"
                  min="1"
                  max="99"
                  placeholder="Count"
                  class="px-2 py-1 rounded-sm text-gray-200"
                />
                <button
                  onclick={changeAllCounts}
                  class="ml-2 px-2 py-1 bg-indigo-600 rounded-sm"
                >
                  Apply to All
                </button>
              </div>
            </div>
          {/if}
        </th>
        <th class="px-2 py-1 text-left">Name</th>
        <th class="px-2 py-1 text-left">Edition</th>
        <th class="px-2 py-1 text-left">
          <select
            bind:this={conditionDropdown}
            onchange={changeAllConditions}
            class="bg-indigo-700 text-gray-200 rounded-sm"
          >
            <option value="">Condition</option>
            {#each Object.entries(conditions) as [key, value]}
              <option value={key}>{value}</option>
            {/each}
          </select>
        </th>
        <th class="px-2 py-1 text-left">
          <select
            bind:this={languageDropdown}
            onchange={changeAllLanguages}
            class="bg-indigo-700 text-gray-200 rounded-sm"
          >
            <option value="">Language</option>
            {#each Object.entries(languages) as [key, value]}
              <option value={key}>{value}</option>
            {/each}
          </select>
        </th>
        <th class="px-2 py-1 text-left">
          <select
            bind:this={foilDropdown}
            onchange={changeAllFinishes}
            class="bg-indigo-700 text-gray-200 rounded-sm"
          >
            <option value="">Finish</option>
            <option value="">Non-foil</option>
            <option value="foil">Foil</option>
            <option value="etched">Etched</option>
          </select>
        </th>
        <th class="px-2 py-1 text-left">
          <select
            bind:this={alterDropdown}
            onchange={changeAllAlters}
            class="bg-indigo-700 text-gray-200 rounded-sm"
          >
            <option value="">Alter</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </th>
        <th class="px-2 py-1 text-left">
          <select
            bind:this={proxyDropdown}
            onchange={changeAllProxies}
            class="bg-indigo-700 text-gray-200 rounded-sm"
          >
            <option value="">Proxy</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </th>
        <th class="px-2 py-1 text-left">
          <select
            bind:this={priceDropdown}
            onchange={changeAllPrices}
            class="bg-indigo-700 text-gray-200 rounded-sm"
          >
            <option value="auto">Price</option>
            <option value="auto">Auto</option>
          </select>
        </th>
      </tr>
    </thead>
    <tbody>
      {#each cards as card, index (card.id)}
        <tr class="border-b border-gray-600">
          <td class="px-2 py-1">
            <input
              type="number"
              min="1"
              max="99"
              value={card.count}
              onchange={(e) =>
                updateCard(index, 'count', e.currentTarget.value)}
              class="w-16 px-1 py-1 text-gray-200 rounded-sm"
            />
          </td>
          <td class="px-2 py-1">
            <Card {card} displayMode="CSV" onupdate={handleCardUpdate} />
          </td>
          <td class="px-2 py-1">{card.set.toUpperCase()}</td>
          <td class="px-2 py-1">
            <select
              value={card.condition}
              onchange={(e) => updateCard(index, 'condition', e)}
              class="bg-indigo-700 text-gray-200 rounded-sm px-1 py-1"
            >
              {#each Object.entries(conditions) as [key, value]}
                <option value={key}>{value}</option>
              {/each}
            </select>
          </td>
          <td class="px-2 py-1">
            <select
              value={card.language}
              onchange={(e) => updateCard(index, 'language', e)}
              class="bg-indigo-700 text-gray-200 rounded-sm px-1 py-1"
            >
              {#each Object.entries(languages) as [key, value]}
                <option value={key}>{value}</option>
              {/each}
            </select>
          </td>
          <td class="px-2 py-1">
            <select
              value={card.selectedFinish}
              onchange={(e) => changeFinish(index, e)}
              class="bg-indigo-700 text-gray-200 rounded-sm px-1 py-1"
            >
              <option value="">Non-foil</option>
              {#if card.finishes.includes('foil')}
                <option value="foil">Foil</option>
              {/if}
              {#if card.finishes.includes('etched')}
                <option value="etched">Etched</option>
              {/if}
            </select>
          </td>
          <td class="px-2 py-1">
            <input
              type="checkbox"
              checked={card.alter}
              onchange={() => toggleStatus(index, 'alter')}
              class="rounded-sm"
            />
          </td>
          <td class="px-2 py-1">
            <input
              type="checkbox"
              checked={card.proxy}
              onchange={() => toggleStatus(index, 'proxy')}
              class="rounded-sm"
            />
          </td>
          <td class="px-2 py-1">
            <input
              type="number"
              step="0.01"
              min="0"
              value={card.price || ''}
              onchange={(e) => updatePrice(index, e)}
              class="w-20 px-1 py-1 text-gray-200 rounded-sm"
              placeholder="Auto"
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<button
  onclick={downloadCSV}
  class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-xs text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
  Download CSV
</button>
