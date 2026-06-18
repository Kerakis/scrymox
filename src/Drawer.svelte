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
		const onKey = (/** @type {KeyboardEvent} */ e) => {
			if (e.key === 'Escape') close();
		};
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('keydown', onKey);
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
			class="absolute top-0 right-0 flex h-full w-[min(92vw,420px)] flex-col overflow-auto bg-surface p-4 text-text shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-label={title}
		>
			{#if title}<h2 class="mb-3 text-lg font-semibold">{title}</h2>{/if}
			{@render children?.()}
		</div>
	</div>
{/if}
