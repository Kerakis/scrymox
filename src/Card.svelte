<script>
  import { onMount, onDestroy } from 'svelte';
  import device from 'svelte-device-info';
  export let card;
  let cardImageFront;
  let cardImageBack;
  let finishModal = false;
  card.selectedFinish = '';

  const handleCtrlClick = (event) => {
    if (!device.isMobile) {
      // Not a mobile device
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
        if (
          card.finishes.includes('foil') &&
          card.finishes.includes('etched')
        ) {
          finishModal = true;
        } else if (card.finishes.includes('foil')) {
          card.selectedFinish = '*F*';
        } else if (card.finishes.includes('etched')) {
          card.selectedFinish = '*E*';
        }
      } else if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        card.selectedFinish = '';
      } else {
        if (event.shiftKey) {
          if (card.count > 1) {
            card.count -= 1;
          }
        } else {
          if (card.count < 99) {
            card.count += 1;
          }
        }
      }
    }
  };

  const moveImage = (event) => {
    if (cardImageFront) {
      cardImageFront.style.top = `${event.clientY + 5}px`;
      cardImageFront.style.left = `${event.clientX + 5}px`;
    }
    if (cardImageBack) {
      cardImageBack.style.top = `${event.clientY + 5}px`;
      cardImageBack.style.left = `${event.clientX + 250}px`; // 250px for the image width
    }
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      finishModal = false;
    }
  };

  onMount(() => {
    window.addEventListener('mousemove', moveImage);
    window.addEventListener('keydown', handleEscape);
  });

  onDestroy(() => {
    window.removeEventListener('mousemove', moveImage);
    window.removeEventListener('keydown', handleEscape);
  });
</script>

<div class="relative">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <span
    on:click|preventDefault={handleCtrlClick}
    on:mouseover={() => {
      if (!device.isMobile) {
        // Not a mobile device
        if (cardImageFront) {
          cardImageFront.classList.remove('hidden');
        }
        if (cardImageBack) {
          cardImageBack.classList.remove('hidden');
        }
      }
    }}
    on:mouseout={() => {
      if (!device.isMobile) {
        // Not a mobile device
        if (cardImageFront) {
          cardImageFront.classList.add('hidden');
        }
        if (cardImageBack) {
          cardImageBack.classList.add('hidden');
        }
      }
    }}
  >
    {card.count}
    {card.name} ({card.set}) {card.collector_number}
    {card.selectedFinish}
  </span>
  {#if finishModal}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      on:click={() => (finishModal = false)}
    >
      <div
        class="bg-slate-800 bg-opacity-75 rounded-lg p-4"
        on:click|stopPropagation
      >
        <h2 class="text-lg font-semibold mb-2">{card.name}</h2>
        <button
          on:click={() => {
            card.selectedFinish = '*F*';
            finishModal = false;
          }}
          class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >Foil</button
        >
        <button
          on:click={() => {
            card.selectedFinish = '*E*';
            finishModal = false;
          }}
          class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >Etched</button
        >
      </div>
    </div>
  {/if}
  {#if Array.isArray(card.image_uris)}
    {#if card.image_uris[0] && card.image_uris[0].border_crop}
      <img
        bind:this={cardImageFront}
        src={card.image_uris[0].border_crop}
        alt={`${card.name} front`}
        class="rounded hidden fixed max-w-[250px] z-50"
      />
    {/if}
    {#if card.image_uris.length > 1 && card.image_uris[1] && card.image_uris[1].border_crop}
      <img
        bind:this={cardImageBack}
        src={card.image_uris[1].border_crop}
        alt={`${card.name} back`}
        class="rounded hidden fixed max-w-[250px] z-50"
      />
    {/if}
  {:else if card.image_uris && card.image_uris.border_crop}
    <img
      bind:this={cardImageFront}
      src={card.image_uris.border_crop}
      alt={card.name}
      class="rounded hidden fixed max-w-[250px] z-50"
    />
  {/if}
</div>
