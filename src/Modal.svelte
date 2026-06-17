<script>
	/**
	 * Reusable accessible modal dialog.
	 *
	 * Handles the concerns every modal in the app needs: a backdrop, Escape /
	 * click-outside to dismiss, body scroll lock, focus trapping, and restoring
	 * focus to the previously focused element on close.
	 *
	 * @type {{
	 *   show?: boolean;
	 *   onclose?: () => void;
	 *   title?: string;
	 *   labelledby?: string;
	 *   panelClass?: string;
	 *   children?: import('svelte').Snippet;
	 * }}
	 */
	let {
		show = $bindable(false),
		onclose,
		title,
		labelledby,
		panelClass = 'bg-opacity-90 rounded-lg bg-indigo-800 p-4 text-gray-200',
		children
	} = $props();

	/** @type {HTMLDivElement | undefined} */
	let panel = $state();
	/** @type {Element | null} */
	let previouslyFocused = null;

	const close = () => {
		show = false;
		onclose?.();
	};

	const focusableSelector =
		'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	const handleKeydown = (/** @type {KeyboardEvent} */ event) => {
		if (event.key === 'Escape') {
			event.stopPropagation();
			close();
			return;
		}
		if (event.key !== 'Tab' || !panel) return;

		const focusables = /** @type {HTMLElement[]} */ ([
			...panel.querySelectorAll(focusableSelector)
		]);
		if (focusables.length === 0) {
			event.preventDefault();
			panel.focus();
			return;
		}
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	};

	$effect(() => {
		if (!show) return;
		previouslyFocused = document.activeElement;
		document.body.style.overflow = 'hidden';
		// Focus the first focusable element (or the panel) once it has rendered.
		const focusables = panel?.querySelectorAll(focusableSelector);
		if (focusables && focusables.length > 0) {
			/** @type {HTMLElement} */ (focusables[0]).focus();
		} else {
			panel?.focus();
		}
		return () => {
			document.body.style.overflow = '';
			if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
		};
	});
</script>

{#if show}
	<!-- Backdrop: click-outside and Escape both dismiss; the dialog inside owns the content. -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
		onkeydown={handleKeydown}
		role="presentation"
	>
		<div
			bind:this={panel}
			class="max-h-[90vh] overflow-auto {panelClass}"
			role="dialog"
			aria-modal="true"
			aria-label={labelledby ? undefined : title}
			aria-labelledby={labelledby}
			tabindex="-1"
		>
			{#if title}
				<h2 class="mb-2 text-lg font-semibold">{title}</h2>
			{/if}
			{@render children?.()}
		</div>
	</div>
{/if}
