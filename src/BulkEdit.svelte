<script>
  import Card from './Card.svelte';
  export let cards = [];
  export let copyToClipboard;
  export let isCopyButtonDisabled;
  export let copyButtonText;
  export let download;
  export let downloadButtonText;
</script>

<div
  class="cards text-gray-200 border border-gray-500 rounded-md mt-4 overflow-auto h-64"
>
  {#each cards as card (card.id)}
    <Card bind:card />
  {/each}
</div>
{#if cards.length > 0}
  <button
    on:click={copyToClipboard}
    disabled={isCopyButtonDisabled}
    class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    {copyButtonText}
  </button>
  <button
    on:click={download}
    class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    {downloadButtonText}
  </button>
{/if}
