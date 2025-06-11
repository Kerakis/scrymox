<script>
  import Card from './Card.svelte';
  
  let { cards = [], onupdate } = $props();
  let isCopyButtonDisabled = $state(false);
  let copyButtonText = $state('Copy');
  let downloadButtonText = $state('Download');
  let downloadLink = $state('');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      cards
        .map(
          (card) =>
            `${card.count} ${card.name} (${card.set}) ${card.collector_number} ${card.displayFinish}`
        )
        .join('\n')
    );

    copyButtonText = 'Copied!';
    isCopyButtonDisabled = true;

    setTimeout(() => {
      copyButtonText = 'Copy';
      isCopyButtonDisabled = false;
    }, 5000);
  };

  const originalDownload = () => {
    const a = document.createElement('a');
    a.href = downloadLink;
    a.download = 'cards.txt';
    a.click();

    downloadButtonText = 'Import into Moxfield';
    download = () => {
      const a = document.createElement('a');
      a.href = 'https://www.moxfield.com/';
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.click();
    };

    setTimeout(() => {
      downloadButtonText = 'Download';
      download = originalDownload;
    }, 5000);
  };

  let download = $state(originalDownload);

  $effect(() => {
    const text = cards
      .map(
        (card) =>
          `${card.count} ${card.name} (${card.set}) ${card.collector_number} ${card.displayFinish}`
      )
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadLink = URL.createObjectURL(blob);
  });

  const handleCardUpdate = (updatedCard) => {
    if (onupdate) {
      onupdate(updatedCard);
    }
  };
</script>

<div
  class="cards text-gray-200 border border-gray-500 rounded-md mt-4 overflow-auto h-64"
>
  {#each cards as card (card.id)}
    <Card {card} onupdate={handleCardUpdate} />
  {/each}
</div>
{#if cards.length > 0}
  <button
    onclick={copyToClipboard}
    disabled={isCopyButtonDisabled}
    class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    {copyButtonText}
  </button>
  <button
    onclick={download}
    class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    {downloadButtonText}
  </button>
{/if}