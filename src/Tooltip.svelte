<script>
	/**
	 * @type {{ text: string; align?: 'center' | 'left' | 'right'; children: import('svelte').Snippet }}
	 */
	let { text, align = 'center', children } = $props();
	let show = $state(false);
	const id = `tt-${Math.random().toString(36).slice(2, 9)}`;
	const pos = {
		center: 'left-1/2 -translate-x-1/2',
		left: 'left-0',
		right: 'right-0'
	};
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
			class="pointer-events-none absolute bottom-full z-50 mb-1 max-w-[min(16rem,90vw)] rounded bg-surface-2 px-2 py-1 text-xs whitespace-nowrap text-text shadow-lg ring-1 ring-border {pos[
				align
			]}"
		>
			{text}
		</span>
	{/if}
</span>
