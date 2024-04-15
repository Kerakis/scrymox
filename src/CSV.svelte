<script>
  import { createEventDispatcher } from 'svelte';
  import Card from './Card.svelte';
  export let cards = [];
  const dispatch = createEventDispatcher();
  let languageDropdown;
  let conditionDropdown;

  $: {
    if (cards.length > 0 && languageDropdown) {
      languageDropdown.value = '';
    }
    if (cards.length > 0 && conditionDropdown) {
      conditionDropdown.value = '';
    }
  }

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
        card.name,
        card.set,
        card.condition,
        card.language,
        card.selectedFinish,
        card.collector_number,
        card.alter,
        card.proxy,
        card.price,
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
  <table class="table-auto w-full mt-4 text-gray-200">
    <thead>
      <tr>
        <th class="px-2 text-center">Count</th>
        <th class="px-2 text-center">Name</th>
        <th class="px-2 text-center">Edition</th>
        <th class="px-2 text-center">
          <select
            bind:this={conditionDropdown}
            class="appearance-none outline-none bg-indigo-900"
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
            class="appearance-none outline-none bg-indigo-900"
            on:change={changeAllLanguages}
          >
            <option value="" selected disabled>Language</option>
            {#each Object.entries(languages) as [code, language]}
              <option value={code}>{language}</option>
            {/each}
          </select>
        </th>
        <th class="px-2 text-center">Foil</th>
        <th class="px-2 text-center">Collector Number</th>
        <th class="px-2 text-center">Alter</th>
        <th class="px-2 text-center">Proxy</th>
        <th class="px-2 text-center">Purchase Price</th>
      </tr>
    </thead>
    <tbody>
      {#each cards as card, index (card.id)}
        <tr>
          <td class="px-2 text-center">
            <input
              type="text"
              inputmode="numeric"
              class="w-12 border-0 bg-transparent text-center outline-none text-gray-200"
              bind:value={card.count}
              on:input={(event) => updateCard(index, 'count', event)}
            />
          </td>
          <td class="px-2 text-center underline"
            ><Card bind:card displayMode="name" /></td
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
            {card.selectedFinish === '*F*'
              ? 'foil'
              : card.selectedFinish === '*E*'
                ? 'etched'
                : ''}
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
          <td class="px-2 text-center">{card.price}</td>
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
