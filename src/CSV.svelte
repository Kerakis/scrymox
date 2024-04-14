<script>
  import { createEventDispatcher } from 'svelte';
  import Card from './Card.svelte';
  export let cards = [];
  const dispatch = createEventDispatcher();
  let languageDropdown;

  $: {
    if (cards.length > 0 && languageDropdown) {
      languageDropdown.value = '';
    }
  }

  const languages = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    ko: 'Korean',
    ru: 'Russian',
    zhs: 'Simplified Chinese',
    zht: 'Traditional Chinese',
    he: 'Hebrew',
    la: 'Latin',
    grc: 'Ancient Greek',
    ar: 'Arabic',
    sa: 'Sanskrit',
    ph: 'Phyrexian',
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

  const toggleStatus = (index, field) => {
    let updatedCards = [...cards];
    updatedCards[index][field] = !updatedCards[index][field];
    cards = updatedCards;
    dispatch('update', cards);
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
        <th class="px-2 text-center">Condition</th>
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
              type="number"
              min="1"
              max="99"
              class="appearance-none -webkit-appearance-textfield -webkit-outer-spin-button -webkit-inner-spin-button w-12 border-0 bg-transparent text-center outline-none text-gray-200"
              bind:value={card.count}
              on:input={(event) => updateCard(index, 'count', event)}
            />
          </td>
          <td class="px-2 text-center underline"
            ><Card bind:card displayMode="name" /></td
          >
          <td class="px-2 text-center uppercase">{card.set}</td>
          <td class="px-2 text-center uppercase">{card.condition}</td>
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
