<script>
  import { createEventDispatcher } from 'svelte';
  export let show = false;
  export let selectedImages = [];
  const dispatch = createEventDispatcher();

  $: {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    on:click={() => dispatch('close')}
  >
    {#each selectedImages as image (image)}
      <!-- svelte-ignore a11y-img-redundant-alt -->
      <img src={image} alt="Card image" class="w-full h-full object-contain" />
    {/each}
  </div>
{/if}
