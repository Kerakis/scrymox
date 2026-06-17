<script>
	import Modal from './Modal.svelte';

	/**
	 * @type {{
	 *   show?: boolean;
	 *   selectedImages?: (string | undefined)[];
	 *   onclose?: () => void;
	 * }}
	 */
	let { show = $bindable(false), selectedImages = [], onclose } = $props();
</script>

<Modal
	bind:show
	{onclose}
	panelClass="flex max-w-full items-center justify-center gap-2 bg-transparent p-2"
>
	{#each selectedImages as image (image)}
		{#if image}
			<img src={image} alt="" class="max-h-[85vh] max-w-full rounded-sm object-contain" />
		{/if}
	{/each}
</Modal>
