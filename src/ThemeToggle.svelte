<script>
	import Tooltip from './Tooltip.svelte';
	/** @type {{ theme?: import('./lib/theme').Theme; onchange?: (t: import('./lib/theme').Theme) => void }} */
	let { theme = $bindable('system'), onchange } = $props();
	const order = /** @type {const} */ (['system', 'light', 'dark']);
	const icon = { system: '◐', light: '☀', dark: '☾' };
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
		class="rounded-full bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30"
	>
		{icon[theme]}
	</button>
</Tooltip>
