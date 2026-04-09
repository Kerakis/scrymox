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
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		onclick={() => onclose && onclose()}
		onkeydown={(e) => {
			if (e.key === 'Escape' && onclose) onclose();
		}}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		{#each selectedImages as image (image)}
			<img src={image} alt="" class="h-full w-full object-contain" />
		{/each}
	</div>
{/if}
