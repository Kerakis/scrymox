<script>
	/**
	 * @type {{ text: string; children: import('svelte').Snippet }}
	 */
	let { text, children } = $props();
	let show = $state(false);
	const id = `tt-${Math.random().toString(36).slice(2, 9)}`;
</script>

<span
	class="relative inline-flex"
	onmouseenter={() => (show = true)}
	onmouseleave={() => (show = false)}
	onfocusin={() => (show = true)}
	onfocusout={() => (show = false)}
	aria-describedby={show ? id : undefined}
	role="presentation"
>
	{@render children()}
	{#if show}
		<span
			{id}
			role="tooltip"
			class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 rounded bg-surface-2 px-2 py-1 text-xs whitespace-nowrap text-text shadow-lg ring-1 ring-border"
		>
			{text}
		</span>
	{/if}
</span>
