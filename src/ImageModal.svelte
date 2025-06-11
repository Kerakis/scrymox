<script>
  let { show = $bindable(false), selectedImages = [], onclose } = $props();

  $effect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });
</script>

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    onclick={() => onclose && onclose()}
  >
    {#each selectedImages as image (image)}
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <img src={image} alt="Card image" class="w-full h-full object-contain" />
    {/each}
  </div>
{/if}