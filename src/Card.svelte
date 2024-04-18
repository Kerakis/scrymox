<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import device from 'svelte-device-info';
  import ImageModal from './ImageModal.svelte';
  export let card;
  export let displayMode = 'bulkEdit';
  let cardImageFront;
  let cardImageBack;
  let cardImageFrontSrc = '';
  let cardImageBackSrc = '';
  let finishModal = false;
  let showImageModal = false;
  let selectedImages = null;

  $: {
    if (card.selectedFinish === 'foil') {
      card.displayFinish = '*F*';
      if (!card.priceManuallySet) {
        card.displayedPrice = card.prices.usd_foil;
      }
    } else if (card.selectedFinish === 'etched') {
      card.displayFinish = '*E*';
      if (!card.priceManuallySet) {
        card.displayedPrice = card.prices.usd_etched;
      }
    } else {
      card.displayFinish = '';
      if (!card.priceManuallySet) {
        card.displayedPrice = card.prices.usd;
      }
    }
  }

  const dispatch = createEventDispatcher();

  const handleMouseOver = () => {
    if (!device.isMobile) {
      // Not a mobile device
      if (Array.isArray(card.image_uris)) {
        // If the card has multiple faces, use the images of all faces
        cardImageFrontSrc = card.image_uris[0]?.border_crop;
        cardImageBackSrc = card.image_uris[1]?.border_crop;
      } else {
        cardImageFrontSrc = card.image_uris?.border_crop;
      }
      if (cardImageFront) {
        cardImageFront.classList.remove('hidden');
      }
      if (cardImageBack) {
        cardImageBack.classList.remove('hidden');
      }
    }
  };

  const handleCtrlClick = (event) => {
    if (device.isMobile) {
      // Mobile device
      if (Array.isArray(card.image_uris)) {
        // If the card has multiple faces, use the images of all faces
        selectedImages = card.image_uris.map((face) => face?.border_crop);
      } else {
        selectedImages = [card.image_uris?.border_crop];
      }
      showImageModal = true;
    } else {
      // Not a mobile device
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
        if (
          card.finishes.includes('foil') &&
          card.finishes.includes('etched')
        ) {
          finishModal = true;
        } else if (card.finishes.includes('foil')) {
          card.selectedFinish = 'foil';
          card.displayFinish = '*F*';
          if (!card.priceManuallySet) {
            card.displayedPrice = card.prices.usd_foil;
          }
        } else if (card.finishes.includes('etched')) {
          card.selectedFinish = 'etched';
          card.displayFinish = '*E*';
          if (!card.priceManuallySet) {
            card.displayedPrice = card.prices.usd_etched;
          }
        }
        dispatch('update', card);
      } else if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        if (card.finishes.includes('nonfoil')) {
          card.selectedFinish = '';
          card.displayFinish = '';
          if (!card.priceManuallySet) {
            card.displayedPrice = card.prices.usd;
          }
        }
        dispatch('update', card);
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
  {#if displayMode === 'bulkEdit'}
    <span
      on:click|preventDefault={handleCtrlClick}
      on:mouseover={handleMouseOver}
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
      {card.displayFinish === '*F*'
        ? '*F*'
        : card.displayFinish === '*E*'
          ? '*E*'
          : ''}
    </span>
  {:else if displayMode === 'CSV'}
    <div class="flex items-center">
      <div class="flex-1 min-w-0">
        <span
          class="text-gray-200"
          on:click|preventDefault={handleCtrlClick}
          on:mouseover={handleMouseOver}
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
          {card.name}
        </span>
      </div>
    </div>
  {/if}

  {#if finishModal}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      on:click={() => (finishModal = false)}
    >
      <div
        class="bg-indigo-800 bg-opacity-90 rounded-lg p-4"
        on:click|stopPropagation
      >
        <h2 class="text-lg font-semibold mb-2">{card.name}</h2>
        <button
          on:click={() => {
            card.displayFinish = '*F*';
            card.selectedFinish = 'foil';
            if (!card.priceManuallySet) {
              card.displayedPrice = card.prices.usd_foil;
            }
            finishModal = false;
            dispatch('update', card);
          }}
          class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >Foil</button
        >

        <button
          on:click={() => {
            card.displayFinish = '*E*';
            card.selectedFinish = 'etched';
            if (!card.priceManuallySet) {
              card.displayedPrice = card.prices.usd_etched;
            }
            finishModal = false;
            dispatch('update', card);
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
        src={cardImageFrontSrc}
        alt={`${card.name} front`}
        class="rounded hidden fixed max-w-[250px] z-50"
      />
    {/if}
    {#if card.image_uris.length > 1 && card.image_uris[1] && card.image_uris[1].border_crop}
      <img
        bind:this={cardImageBack}
        src={cardImageBackSrc}
        alt={`${card.name} back`}
        class="rounded hidden fixed max-w-[250px] z-50"
      />
    {/if}
  {:else if card.image_uris && card.image_uris.border_crop}
    <img
      bind:this={cardImageFront}
      src={cardImageFrontSrc}
      alt={card.name}
      class="rounded hidden fixed max-w-[250px] z-50"
    />
  {/if}
</div>

<ImageModal
  bind:show={showImageModal}
  {selectedImages}
  on:close={() => (showImageModal = false)}
/>
