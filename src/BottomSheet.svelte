<script>
	/** @type {{ show?: boolean; onclose?: () => void; title?: string; children?: import('svelte').Snippet }} */
	let { show = $bindable(false), onclose, title, children } = $props();
	const close = () => {
		show = false;
		onclose?.();
	};
	$effect(() => {
		if (!show) return;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 bg-black/50"
		role="presentation"
		onclick={(e) => e.target === e.currentTarget && close()}
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<div
			class="absolute right-0 bottom-0 left-0 max-h-[85vh] overflow-auto rounded-t-2xl bg-surface p-4 text-text shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-label={title}
		>
			{#if title}<h2 class="mb-3 text-lg font-semibold">{title}</h2>{/if}
			{@render children?.()}
		</div>
	</div>
{/if}
