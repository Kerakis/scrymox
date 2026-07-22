<script>
	/**
	 * @type {{
	 *   text: string;
	 *   align?: 'center' | 'left' | 'right';
	 *   side?: 'top' | 'bottom';
	 *   children: import('svelte').Snippet;
	 * }}
	 */
	let { text, align = 'center', side = 'top', children } = $props();
	let show = $state(false);
	const id = `tt-${Math.random().toString(36).slice(2, 9)}`;
	const pos = {
		center: 'left-1/2 -translate-x-1/2',
		left: 'left-0',
		right: 'right-0'
	};
	const sideClass = $derived(side === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1');
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
			class="bg-surface-2 text-text ring-border pointer-events-none absolute z-50 max-w-[min(16rem,90vw)] rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg ring-1 {sideClass} {pos[
				align
			]}"
		>
			{text}
		</span>
	{/if}
</span>
