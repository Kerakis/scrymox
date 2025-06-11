<script>
  import { onMount, onDestroy } from 'svelte';
  import device from 'svelte-device-info';
  import ImageModal from './ImageModal.svelte';

  let { card, displayMode = 'bulkEdit', onupdate } = $props();
  let cardImageFront = $state();
  let cardImageBack = $state();
  let cardImageFrontSrc = $state('');
  let cardImageBackSrc = $state('');
  let finishModal = $state(false);
  let showImageModal = $state(false);
  let selectedImages = $state(null);

  // Remove the $effect that was mutating the card prop
  // Instead, we'll handle this in the event handlers

  const handleMouseOver = () => {
    if (!device.isMobile) {
      if (Array.isArray(card.image_uris)) {
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
      if (Array.isArray(card.image_uris)) {
        selectedImages = card.image_uris.map((face) => face?.border_crop);
      } else {
        selectedImages = [card.image_uris?.border_crop];
      }
      showImageModal = true;
    } else {
      let updatedCard = { ...card };
      
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
        if (
          card.finishes.includes('foil') &&
          card.finishes.includes('etched')
        ) {
          finishModal = true;
          return; // Don't update yet, wait for user selection
        } else if (card.finishes.includes('foil')) {
          updatedCard.selectedFinish = 'foil';
          updatedCard.displayFinish = '*F*';
          if (!updatedCard.priceManuallySet) {
            updatedCard.displayedPrice = updatedCard.prices.usd_foil;
          }
        } else if (card.finishes.includes('etched')) {
          updatedCard.selectedFinish = 'etched';
          updatedCard.displayFinish = '*E*';
          if (!updatedCard.priceManuallySet) {
            updatedCard.displayedPrice = updatedCard.prices.usd_etched;
          }
        }
      } else if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        if (card.finishes.includes('nonfoil')) {
          updatedCard.selectedFinish = '';
          updatedCard.displayFinish = '';
          if (!updatedCard.priceManuallySet) {
            updatedCard.displayedPrice = updatedCard.prices.usd;
          }
        }
      } else {
        if (event.shiftKey) {
          if (updatedCard.count > 1) {
            updatedCard.count -= 1;
          }
        } else {
          if (updatedCard.count < 99) {
            updatedCard.count += 1;
          }
        }
      }
      
      if (onupdate) onupdate(updatedCard);
    }
  };

  const handleMouseOut = () => {
    if (!device.isMobile) {
      if (cardImageFront) {
        cardImageFront.classList.add('hidden');
      }
      if (cardImageBack) {
        cardImageBack.classList.add('hidden');
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
      cardImageBack.style.left = `${event.clientX + 250}px`;
    }
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      finishModal = false;
    }
  };

  const handleFinishSelection = (finish) => {
    let updatedCard = { ...card };
    
    if (finish === 'foil') {
      updatedCard.displayFinish = '*F*';
      updatedCard.selectedFinish = 'foil';
      if (!updatedCard.priceManuallySet) {
        updatedCard.displayedPrice = updatedCard.prices.usd_foil;
      }
    } else if (finish === 'etched') {
      updatedCard.displayFinish = '*E*';
      updatedCard.selectedFinish = 'etched';
      if (!updatedCard.priceManuallySet) {
        updatedCard.displayedPrice = updatedCard.prices.usd_etched;
      }
    }
    
    finishModal = false;
    if (onupdate) onupdate(updatedCard);
  };

  const stopPropagation = (event) => {
    event.stopPropagation();
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
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  {#if displayMode === 'bulkEdit'}
    <span
      onclick={handleCtrlClick}
      onmouseover={handleMouseOver}
      onmouseout={handleMouseOut}
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
          onclick={handleCtrlClick}
          onmouseover={handleMouseOver}
          onmouseout={handleMouseOut}
        >
          {card.name}
        </span>
      </div>
    </div>
  {/if}

  {#if finishModal}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      onclick={() => (finishModal = false)}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="bg-indigo-800 bg-opacity-90 rounded-lg p-4"
        onclick={stopPropagation}
      >
        <h2 class="text-lg font-semibold mb-2">{card.name}</h2>
        <button
          onclick={() => handleFinishSelection('foil')}
          class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-xs text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Foil
        </button>

        <button
          onclick={() => handleFinishSelection('etched')}
          class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-xs text-sm font-medium text-gray-200 bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Etched
        </button>
      </div>
    </div>
  {/if}
  
  {#if Array.isArray(card.image_uris)}
    {#if card.image_uris[0] && card.image_uris[0].border_crop}
      <img
        bind:this={cardImageFront}
        src={cardImageFrontSrc}
        alt={`${card.name} front`}
        class="rounded-sm hidden fixed max-w-[250px] z-50"
      />
    {/if}
    {#if card.image_uris.length > 1 && card.image_uris[1] && card.image_uris[1].border_crop}
      <img
        bind:this={cardImageBack}
        src={cardImageBackSrc}
        alt={`${card.name} back`}
        class="rounded-sm hidden fixed max-w-[250px] z-50"
      />
    {/if}
  {:else if card.image_uris && card.image_uris.border_crop}
    <img
      bind:this={cardImageFront}
      src={cardImageFrontSrc}
      alt={card.name}
      class="rounded-sm hidden fixed max-w-[250px] z-50"
    />
  {/if}
</div>

<ImageModal
  bind:show={showImageModal}
  {selectedImages}
  onclose={() => (showImageModal = false)}
/>