<script>
  import { createEventDispatcher } from 'svelte';
  import Card from './Card.svelte';
  export let cards = [];
  const dispatch = createEventDispatcher();

  const updateCard = (index, field, event) => {
    let updatedCards = [...cards];
    updatedCards[index][field] = event.target.value;
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
        <th>Count</th>
        <th>Name</th>
        <th>Edition</th>
        <th>Condition</th>
        <th>Language</th>
        <th>Foil</th>
        <th>Collector Number</th>
        <th>Alter</th>
        <th>Proxy</th>
        <th>Purchase Price</th>
      </tr>
    </thead>
    <tbody>
      {#each cards as card, index (card.id)}
        <tr>
          <td
            ><input
              type="number"
              bind:value={card.count}
              on:input={(event) => updateCard(index, 'count', event)}
            /></td
          >
          <td class="underline"><Card bind:card displayMode="name" /></td>
          <td class="uppercase">{card.set}</td>
          <td class="uppercase">{card.condition}</td>
          <td>{card.language}</td>
          <td>
            {card.selectedFinish === '*F*'
              ? 'foil'
              : card.selectedFinish === '*E*'
                ? 'etched'
                : ''}
          </td>
          <td>{card.collector_number}</td>
          <td
            class="uppercase cursor-pointer"
            on:click={() => toggleStatus(index, 'alter')}>{card.alter}</td
          >
          <td
            class="uppercase cursor-pointer"
            on:click={() => toggleStatus(index, 'proxy')}>{card.proxy}</td
          >
          <td>{card.price}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
