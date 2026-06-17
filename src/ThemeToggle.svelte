<script>
	import Tooltip from './Tooltip.svelte';
	/** @type {{ theme?: import('./lib/theme').Theme; onchange?: (t: import('./lib/theme').Theme) => void }} */
	let { theme = $bindable('system'), onchange } = $props();
	const order = /** @type {const} */ (['system', 'light', 'dark']);
	const cycle = () => {
		theme = order[(order.indexOf(theme) + 1) % order.length];
		onchange?.(theme);
	};
</script>

<Tooltip text={`Theme: ${theme} — click to change`}>
	<button
		type="button"
		onclick={cycle}
		aria-label={`Theme: ${theme}. Click to change.`}
		class="flex items-center justify-center rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
	>
		{#if theme === 'light'}
			<!-- sun -->
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
				<circle cx="12" cy="12" r="4" />
				<path
					stroke-linecap="round"
					d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
				/>
			</svg>
		{:else if theme === 'dark'}
			<!-- moon -->
			<svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
				<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
			</svg>
		{:else}
			<!-- system: half-filled circle -->
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
				<circle cx="12" cy="12" r="9" />
				<path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
			</svg>
		{/if}
	</button>
</Tooltip>
