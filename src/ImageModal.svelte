<script>
  import { createEventDispatcher } from 'svelte';
  export let show = false;
  export let selectedImage = '';
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
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    on:click={() => dispatch('close')}
  >
    <!-- svelte-ignore a11y-img-redundant-alt -->
    <img
      src={selectedImage}
      alt="Card image"
      class="w-full h-full object-contain"
    />
  </div>
{/if}
