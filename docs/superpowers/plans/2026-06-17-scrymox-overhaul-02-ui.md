# ScryMox Overhaul — Plan 02: UI & Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **This plan depends on Plan 01 being complete.**

**Goal:** Rebuild the ScryMox UI on top of the Plan 01 engine — a gallery-forward, mobile-first responsive layout with a Gallery/Compact toggle, individual + bulk editing, source-aware pricing, dark/light theme, a live dual-format export panel, search history, default query options, tooltips, image zoom, and session persistence — then remove the old components.

**Architecture:** `App.svelte` owns all state (cards, selection, query, settings) and wires the engine modules; presentational components receive props and emit changes via callback props (matching the existing codebase style). Logic stays in the tested `lib/` modules; components are verified by `npm run build` + a manual run.

**Tech Stack:** Svelte 5 runes, Vite 8, Tailwind CSS 4. No new dependencies (and we remove `svelte-device-info`).

## Global Constraints

Inherits **all** Global Constraints from Plan 01. Additionally:

- Mobile-first. Breakpoints (Tailwind defaults): base = phone; `sm`/`md` = tablet; `lg` = desktop (side-by-side export panel); `2xl` = ultrawide (more columns, wider panel). The side-by-side split appears only at `lg`+; below `lg` the export panel is a drawer/bottom sheet.
- Theme defaults to OS preference (`system`), with a persisted manual override; dark mode is the `.dark` class on `<html>`.
- Card images use `border_crop` in tiles and `large`/`png` for zoom; **never** `art_crop`.
- Selection shortcuts are scoped to the results region and must NOT fire while focus is in an `input`, `select`, `textarea`, or `[contenteditable]`: Click=toggle, Shift+Click=range, Ctrl/⌘+Click=add/remove, Ctrl/⌘+A=select all, Esc=clear.
- The bulk action bar is a single line and never wraps (`white-space: nowrap; overflow:hidden`), abbreviating labels when constrained.
- Every icon-only/abbreviated control has an accessible tooltip/`aria-label`.
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## File Structure

- `src/lib/constants.js` — **create**: conditions, languages, finish labels.
- `src/ThemeToggle.svelte` — **create**.
- `src/Tooltip.svelte` — **create**.
- `src/Drawer.svelte`, `src/BottomSheet.svelte` — **create** (reuse `Modal.svelte` patterns).
- `src/CardImage.svelte` — **create** (inline image + hover zoom + lightbox + DFC flip).
- `src/CardTile.svelte` — **create** (gallery tile, responsive to row on phone).
- `src/CardRow.svelte` + `src/CompactTable.svelte` — **create** (compact view).
- `src/Gallery.svelte` — **create**.
- `src/BulkActionBar.svelte` — **create**.
- `src/SearchBar.svelte` — **create**.
- `src/ResultsToolbar.svelte` — **create**.
- `src/SettingsDrawer.svelte` — **create**.
- `src/ExportPanel.svelte` — **create**.
- `src/App.svelte` — **rewrite** (integration).
- `src/main.js` — **modify** (early theme application to avoid flash).
- **Delete:** `src/Card.svelte`, `src/BulkEdit.svelte`, `src/CSV.svelte`, `src/ImageModal.svelte`.
- `package.json` — **modify** (drop `svelte-device-info`).
- `src/types.d.ts` + `src/lib/scryfall.js` — **modify** (remove transitional `displayedPrice`).

---

### Task 1: constants.js — shared option maps

**Files:**
- Create: `src/lib/constants.js`
- Test: `src/lib/constants.test.js`

**Interfaces:**
- Produces: `CONDITIONS`, `LANGUAGES`, `FINISH_LABELS` (plain objects keyed by code).

- [ ] **Step 1: Write the failing test** — create `src/lib/constants.test.js`:

```js
import { test, expect } from 'vitest';
import { CONDITIONS, LANGUAGES, FINISH_LABELS } from './constants.js';

test('constants expose expected keys', () => {
	expect(CONDITIONS.NM).toBe('Near Mint');
	expect(LANGUAGES.EN).toBe('English');
	expect(FINISH_LABELS.foil).toBe('Foil');
	expect(FINISH_LABELS['']).toBe('Nonfoil');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/constants.test.js`
Expected: FAIL — cannot find module `./constants.js`.

- [ ] **Step 3: Write the implementation** — create `src/lib/constants.js`:

```js
/** Shared option maps for the editable card attributes. */

export const CONDITIONS = {
	M: 'Mint',
	NM: 'Near Mint',
	LP: 'Lightly Played',
	MP: 'Played',
	HP: 'Heavily Played',
	DM: 'Damaged'
};

export const LANGUAGES = {
	EN: 'English',
	ES: 'Spanish',
	FR: 'French',
	DE: 'German',
	IT: 'Italian',
	PT: 'Portuguese',
	JA: 'Japanese',
	KO: 'Korean',
	RU: 'Russian',
	ZHS: 'Simplified Chinese',
	ZHT: 'Traditional Chinese',
	HE: 'Hebrew',
	LA: 'Latin',
	GRC: 'Ancient Greek',
	AR: 'Arabic',
	SA: 'Sanskrit',
	PH: 'Phyrexian'
};

export const FINISH_LABELS = { '': 'Nonfoil', foil: 'Foil', etched: 'Etched' };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/constants.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/constants.js src/lib/constants.test.js
git commit -m "feat: add shared condition/language/finish constants

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Tooltip primitive

**Files:**
- Create: `src/Tooltip.svelte`

**Interfaces:**
- Produces: `<Tooltip text="...">{trigger}</Tooltip>` — wraps a trigger, shows `text` on hover/focus, adds `aria-describedby`.

- [ ] **Step 1: Create `src/Tooltip.svelte`**:

```svelte
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/Tooltip.svelte
git commit -m "feat: add accessible Tooltip primitive

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: ThemeToggle + early theme application

**Files:**
- Create: `src/ThemeToggle.svelte`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `resolveTheme`, `applyTheme`, `getStoredTheme` (theme.js).
- Produces: `<ThemeToggle bind:theme onchange={(t) => ...} />`; `main.js` applies the stored/resolved theme before mount.

- [ ] **Step 1: Create `src/ThemeToggle.svelte`**:

```svelte
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
```

- [ ] **Step 2: Update `src/main.js`** to apply the theme before mount. Current `main.js` mounts the app; add theme bootstrap at the top. Replace the file with:

```js
import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { getStoredTheme, resolveTheme, applyTheme } from './lib/theme.js';

// Apply the persisted/OS theme before the app renders to avoid a flash.
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(resolveTheme(getStoredTheme(), prefersDark));

const app = mount(App, { target: document.getElementById('app') });

export default app;
```

> If the existing `main.js` differs (e.g. uses `new App(...)`), keep its mount mechanism and only add the three theme lines + the import.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/ThemeToggle.svelte src/main.js
git commit -m "feat: add ThemeToggle and apply theme before mount

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Drawer + BottomSheet primitives

**Files:**
- Create: `src/Drawer.svelte`, `src/BottomSheet.svelte`

**Interfaces:**
- Produces: `<Drawer bind:show onclose title>{children}</Drawer>` (right slide-over); `<BottomSheet bind:show onclose title>{children}</BottomSheet>` (bottom). Both: backdrop, Esc/click-out close, body scroll lock.

- [ ] **Step 1: Create `src/Drawer.svelte`**:

```svelte
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
		return () => (document.body.style.overflow = '');
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
```

- [ ] **Step 2: Create `src/BottomSheet.svelte`**:

```svelte
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
		return () => (document.body.style.overflow = '');
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
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/Drawer.svelte src/BottomSheet.svelte
git commit -m "feat: add Drawer and BottomSheet primitives

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: CardImage — inline image, hover zoom, lightbox, DFC flip

**Files:**
- Create: `src/CardImage.svelte`

**Interfaces:**
- Consumes: `Modal.svelte` (existing).
- Produces: `<CardImage {card} />`. Internally resolves front/back `border_crop` (inline) and `large`/`png` (zoom). Hover-capable devices show a fixed enlarged preview; touch devices open a lightbox on tap. DFC cards show a flip button.

- [ ] **Step 1: Create `src/CardImage.svelte`**:

```svelte
<script>
	import Modal from './Modal.svelte';
	/** @type {{ card: import('./types').Card }} */
	let { card } = $props();

	const faces = Array.isArray(card.image_uris) ? card.image_uris : [card.image_uris];
	const isDfc = faces.length > 1 && !!faces[1];
	let flipped = $state(false);
	let lightbox = $state(false);
	let hovering = $state(false);

	const canHover =
		typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	const face = () => faces[flipped && isDfc ? 1 : 0];
	const inlineSrc = () => face()?.border_crop ?? face()?.normal ?? '';
	const zoomSrc = () => face()?.large ?? face()?.png ?? face()?.normal ?? inlineSrc();

	const onClick = () => {
		if (!canHover) lightbox = true;
	};
</script>

<div class="relative">
	<button
		type="button"
		class="block w-full"
		onclick={onClick}
		onmouseenter={() => (hovering = canHover)}
		onmouseleave={() => (hovering = false)}
		aria-label={`${card.name} image${canHover ? '' : ' — tap to enlarge'}`}
	>
		<img
			src={inlineSrc()}
			alt={card.name}
			loading="lazy"
			class="block aspect-5/7 w-full rounded-md object-cover"
		/>
	</button>

	{#if isDfc}
		<button
			type="button"
			onclick={() => (flipped = !flipped)}
			aria-label="Flip card"
			title="Flip card"
			class="absolute right-1 bottom-1 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white hover:bg-black/75"
		>
			⤺
		</button>
	{/if}

	{#if hovering && canHover}
		<img
			src={zoomSrc()}
			alt=""
			aria-hidden="true"
			class="pointer-events-none fixed top-4 right-4 z-50 hidden max-h-[80vh] rounded-lg shadow-2xl lg:block"
		/>
	{/if}
</div>

<Modal bind:show={lightbox} onclose={() => (lightbox = false)} panelClass="bg-transparent p-2">
	<img src={zoomSrc()} alt={card.name} class="max-h-[85vh] max-w-full rounded-md object-contain" />
	{#if isDfc}
		<button
			type="button"
			onclick={() => (flipped = !flipped)}
			class="mt-2 w-full rounded-md bg-accent px-4 py-2 text-sm text-accent-contrast"
		>
			Flip
		</button>
	{/if}
</Modal>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/CardImage.svelte
git commit -m "feat: add CardImage with hover zoom, lightbox, and DFC flip

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: CardTile — gallery tile (responsive to phone row)

**Files:**
- Create: `src/CardTile.svelte`

**Interfaces:**
- Consumes: `CardImage`, `Tooltip`, `getPrice`/`PRICE_SOURCES` (prices.js), `getDisplayFinish` (finishes.js), `CONDITIONS`/`LANGUAGES`/`FINISH_LABELS` (constants.js).
- Produces: `<CardTile {card} {source} {selected} onupdate={(card)=>...} onremove={(id)=>...} onselect={(event, id)=>...} />`. The footer surfaces Qty, Finish (constrained to `card.finishes`), Price (override), Condition, Language, Alter, Proxy.

- [ ] **Step 1: Create `src/CardTile.svelte`**:

```svelte
<script>
	import CardImage from './CardImage.svelte';
	import Tooltip from './Tooltip.svelte';
	import { getPrice } from './lib/prices.js';
	import { getDisplayFinish } from './lib/finishes.js';
	import { CONDITIONS, LANGUAGES, FINISH_LABELS } from './lib/constants.js';

	/**
	 * @type {{
	 *   card: import('./types').Card;
	 *   source: import('./lib/prices').PriceSource;
	 *   selected?: boolean;
	 *   onupdate?: (card: import('./types').Card) => void;
	 *   onremove?: (id: string) => void;
	 *   onselect?: (event: MouseEvent, id: string) => void;
	 * }}
	 */
	let { card, source, selected = false, onupdate, onremove, onselect } = $props();

	const finishOptions = $derived(
		['', 'foil', 'etched'].filter((f) => (f === '' ? card.finishes.includes('nonfoil') : card.finishes.includes(f)))
	);
	const autoPrice = $derived(getPrice(card.prices, source, card.selectedFinish));
	const shownPrice = $derived(card.priceManuallySet ? card.price : autoPrice);

	const patch = (/** @type {Partial<import('./types').Card>} */ p) => onupdate?.({ ...card, ...p });
	const setFinish = (/** @type {string} */ f) => patch({ selectedFinish: f, displayFinish: getDisplayFinish(f) });
	const setQty = (/** @type {number} */ n) => patch({ count: Math.min(99, Math.max(1, n)) });
	const setPrice = (/** @type {string} */ v) =>
		v === '' ? patch({ price: undefined, priceManuallySet: false }) : patch({ price: parseFloat(v), priceManuallySet: true });
</script>

<div
	class="flex flex-row gap-2 rounded-lg border border-border bg-surface p-2 sm:flex-col sm:p-0 {selected
		? 'ring-2 ring-accent'
		: ''}"
>
	<!-- select / remove strip: above image on tile, inline on phone row -->
	<div class="order-2 flex shrink-0 flex-col items-center justify-between sm:order-0 sm:flex-row sm:px-2 sm:py-1">
		<button
			type="button"
			role="checkbox"
			aria-checked={selected}
			aria-label={`Select ${card.name}`}
			onclick={(e) => onselect?.(e, card.id)}
			class="h-4 w-4 rounded border-2 border-accent {selected ? 'bg-accent' : 'bg-transparent'}"
		></button>
		<Tooltip text="Remove">
			<button type="button" aria-label={`Remove ${card.name}`} onclick={() => onremove?.(card.id)} class="px-1 text-muted hover:text-red-400">✕</button>
		</Tooltip>
	</div>

	<div class="order-1 w-28 shrink-0 sm:order-0 sm:w-full sm:px-2">
		<CardImage {card} />
	</div>

	<!-- footer controls: qty+price · finish · condition|language · alter|proxy -->
	<div class="order-3 flex flex-1 flex-col gap-1.5 sm:order-0 sm:p-2">
		<div class="flex items-center justify-between gap-2">
			<span class="inline-flex overflow-hidden rounded-md border border-accent text-sm">
				<button type="button" aria-label="Decrease quantity" onclick={() => setQty(card.count - 1)} class="bg-accent/20 px-2">–</button>
				<input
					type="number" min="1" max="99" value={card.count}
					onchange={(e) => setQty(parseInt(e.currentTarget.value))}
					aria-label="Quantity"
					class="w-10 bg-transparent text-center text-text"
				/>
				<button type="button" aria-label="Increase quantity" onclick={() => setQty(card.count + 1)} class="bg-accent/20 px-2">+</button>
			</span>
			<span class="text-sm font-semibold {shownPrice == null ? 'text-muted' : ''}">
				{shownPrice == null ? '—' : shownPrice}
			</span>
		</div>

		<select
			value={card.selectedFinish}
			onchange={(e) => setFinish(e.currentTarget.value)}
			aria-label="Finish"
			class="w-full rounded-md bg-accent/20 px-2 py-1 text-center text-sm text-text"
		>
			{#each finishOptions as f (f)}<option value={f}>{FINISH_LABELS[f]}</option>{/each}
		</select>

		<div class="grid grid-cols-2 gap-1.5">
			<select value={card.condition} onchange={(e) => patch({ condition: e.currentTarget.value })} aria-label="Condition" class="rounded-md bg-accent/20 px-2 py-1 text-sm text-text">
				{#each Object.entries(CONDITIONS) as [k, v] (k)}<option value={k}>{v}</option>{/each}
			</select>
			<select value={card.language} onchange={(e) => patch({ language: e.currentTarget.value })} aria-label="Language" class="rounded-md bg-accent/20 px-2 py-1 text-sm text-text">
				{#each Object.entries(LANGUAGES) as [k, v] (k)}<option value={k}>{v}</option>{/each}
			</select>
		</div>

		<div class="grid grid-cols-2 gap-1.5">
			<button type="button" aria-pressed={card.alter} onclick={() => patch({ alter: !card.alter })} class="rounded-md border border-accent px-2 py-1 text-sm {card.alter ? 'bg-accent text-accent-contrast' : 'text-muted'}">Alter</button>
			<button type="button" aria-pressed={card.proxy} onclick={() => patch({ proxy: !card.proxy })} class="rounded-md border border-accent px-2 py-1 text-sm {card.proxy ? 'bg-accent text-accent-contrast' : 'text-muted'}">Proxy</button>
		</div>

		<input
			type="number" step="0.01" min="0"
			value={card.priceManuallySet ? (card.price ?? '') : ''}
			placeholder={autoPrice ?? 'price'}
			onchange={(e) => setPrice(e.currentTarget.value)}
			aria-label="Price override"
			class="w-full rounded-md bg-surface-2 px-2 py-1 text-sm text-text ring-1 ring-border"
		/>
	</div>
</div>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/CardTile.svelte
git commit -m "feat: add CardTile with constrained per-card editing

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: CompactTable + CardRow

**Files:**
- Create: `src/CardRow.svelte`, `src/CompactTable.svelte`

**Interfaces:**
- Consumes: `CardImage`, `getPrice`, `getDisplayFinish`, constants.
- Produces: `<CompactTable {cards} {source} {selectedIds} onupdate onremove onselect />`; `CardRow` mirrors `CardTile`'s editing in a table row. `onselect(event, id)`; `selectedIds: Set<string>`.

- [ ] **Step 1: Create `src/CardRow.svelte`**:

```svelte
<script>
	import { getPrice } from './lib/prices.js';
	import { getDisplayFinish } from './lib/finishes.js';
	import { CONDITIONS, LANGUAGES, FINISH_LABELS } from './lib/constants.js';

	/**
	 * @type {{
	 *   card: import('./types').Card;
	 *   source: import('./lib/prices').PriceSource;
	 *   selected?: boolean;
	 *   onupdate?: (card: import('./types').Card) => void;
	 *   onremove?: (id: string) => void;
	 *   onselect?: (event: MouseEvent, id: string) => void;
	 * }}
	 */
	let { card, source, selected = false, onupdate, onremove, onselect } = $props();
	const finishOptions = $derived(
		['', 'foil', 'etched'].filter((f) => (f === '' ? card.finishes.includes('nonfoil') : card.finishes.includes(f)))
	);
	const autoPrice = $derived(getPrice(card.prices, source, card.selectedFinish));
	const patch = (/** @type {Partial<import('./types').Card>} */ p) => onupdate?.({ ...card, ...p });
</script>

<tr class="border-b border-border {selected ? 'bg-accent/10' : ''}">
	<td class="px-2 py-1">
		<button type="button" role="checkbox" aria-checked={selected} aria-label={`Select ${card.name}`}
			onclick={(e) => onselect?.(e, card.id)}
			class="h-4 w-4 rounded border-2 border-accent {selected ? 'bg-accent' : ''}"></button>
	</td>
	<td class="px-2 py-1">
		<input type="number" min="1" max="99" value={card.count}
			onchange={(e) => patch({ count: Math.min(99, Math.max(1, parseInt(e.currentTarget.value))) })}
			aria-label="Quantity" class="w-14 rounded bg-surface-2 px-1 text-text ring-1 ring-border" />
	</td>
	<td class="max-w-[16rem] truncate px-2 py-1">{card.name}</td>
	<td class="px-2 py-1 whitespace-nowrap text-muted">{card.set.toUpperCase()} {card.collector_number}</td>
	<td class="px-2 py-1">
		<select value={card.selectedFinish} onchange={(e) => patch({ selectedFinish: e.currentTarget.value, displayFinish: getDisplayFinish(e.currentTarget.value) })} aria-label="Finish" class="rounded bg-accent/20 px-1 text-text">
			{#each finishOptions as f (f)}<option value={f}>{FINISH_LABELS[f]}</option>{/each}
		</select>
	</td>
	<td class="px-2 py-1">
		<select value={card.condition} onchange={(e) => patch({ condition: e.currentTarget.value })} aria-label="Condition" class="rounded bg-accent/20 px-1 text-text">
			{#each Object.entries(CONDITIONS) as [k, v] (k)}<option value={k}>{v}</option>{/each}
		</select>
	</td>
	<td class="px-2 py-1">
		<select value={card.language} onchange={(e) => patch({ language: e.currentTarget.value })} aria-label="Language" class="rounded bg-accent/20 px-1 text-text">
			{#each Object.entries(LANGUAGES) as [k, v] (k)}<option value={k}>{v}</option>{/each}
		</select>
	</td>
	<td class="px-2 py-1 text-center"><input type="checkbox" checked={card.alter} onchange={() => patch({ alter: !card.alter })} aria-label="Alter" /></td>
	<td class="px-2 py-1 text-center"><input type="checkbox" checked={card.proxy} onchange={() => patch({ proxy: !card.proxy })} aria-label="Proxy" /></td>
	<td class="px-2 py-1">
		<input type="number" step="0.01" min="0" value={card.priceManuallySet ? (card.price ?? '') : ''} placeholder={autoPrice ?? '—'}
			onchange={(e) => (e.currentTarget.value === '' ? patch({ price: undefined, priceManuallySet: false }) : patch({ price: parseFloat(e.currentTarget.value), priceManuallySet: true }))}
			aria-label="Price override" class="w-20 rounded bg-surface-2 px-1 text-text ring-1 ring-border" />
	</td>
	<td class="px-2 py-1"><button type="button" aria-label={`Remove ${card.name}`} onclick={() => onremove?.(card.id)} class="px-1 text-muted hover:text-red-400">✕</button></td>
</tr>
```

- [ ] **Step 2: Create `src/CompactTable.svelte`**:

```svelte
<script>
	import CardRow from './CardRow.svelte';
	/**
	 * @type {{
	 *   cards: import('./types').Card[];
	 *   source: import('./lib/prices').PriceSource;
	 *   selectedIds: Set<string>;
	 *   onupdate?: (card: import('./types').Card) => void;
	 *   onremove?: (id: string) => void;
	 *   onselect?: (event: MouseEvent, id: string) => void;
	 * }}
	 */
	let { cards, source, selectedIds, onupdate, onremove, onselect } = $props();
	const headers = ['', 'Qty', 'Name', 'Set·#', 'Finish', 'Condition', 'Language', 'Alter', 'Proxy', 'Price', ''];
</script>

<div class="overflow-auto rounded-md border border-border">
	<table class="w-full text-left text-sm text-text">
		<thead class="bg-accent/15">
			<tr>{#each headers as h (h)}<th class="px-2 py-1 font-semibold">{h}</th>{/each}</tr>
		</thead>
		<tbody>
			{#each cards as card (card.id)}
				<CardRow {card} {source} selected={selectedIds.has(card.id)} {onupdate} {onremove} {onselect} />
			{/each}
		</tbody>
	</table>
</div>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/CardRow.svelte src/CompactTable.svelte
git commit -m "feat: add compact table view

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Gallery

**Files:**
- Create: `src/Gallery.svelte`

**Interfaces:**
- Consumes: `CardTile`.
- Produces: `<Gallery {cards} {source} {selectedIds} onupdate onremove onselect />`. Responsive grid: 1 col phone → up to 7 cols ultrawide.

- [ ] **Step 1: Create `src/Gallery.svelte`**:

```svelte
<script>
	import CardTile from './CardTile.svelte';
	/**
	 * @type {{
	 *   cards: import('./types').Card[];
	 *   source: import('./lib/prices').PriceSource;
	 *   selectedIds: Set<string>;
	 *   onupdate?: (card: import('./types').Card) => void;
	 *   onremove?: (id: string) => void;
	 *   onselect?: (event: MouseEvent, id: string) => void;
	 * }}
	 */
	let { cards, source, selectedIds, onupdate, onremove, onselect } = $props();
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
	{#each cards as card (card.id)}
		<CardTile {card} {source} selected={selectedIds.has(card.id)} {onupdate} {onremove} {onselect} />
	{/each}
</div>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/Gallery.svelte
git commit -m "feat: add responsive Gallery grid

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: BulkActionBar

**Files:**
- Create: `src/BulkActionBar.svelte`

**Interfaces:**
- Consumes: `CONDITIONS`, `LANGUAGES`, `FINISH_LABELS`.
- Produces: `<BulkActionBar {selectedCount} {totalCount} onapply={(patch, scope)=>...} onremove={(scope)=>...} />`. `scope: 'selected' | 'all'`. Single line, never wraps; popover controls for Quantity (first), Finish, Condition, Language, Price, Alter, Proxy, Remove.

- [ ] **Step 1: Create `src/BulkActionBar.svelte`**:

```svelte
<script>
	import { CONDITIONS, LANGUAGES, FINISH_LABELS } from './lib/constants.js';
	/**
	 * @type {{
	 *   selectedCount: number;
	 *   totalCount: number;
	 *   onapply?: (patch: Partial<import('./types').Card>, scope: 'selected' | 'all') => void;
	 *   onremove?: (scope: 'selected' | 'all') => void;
	 * }}
	 */
	let { selectedCount, totalCount, onapply, onremove } = $props();

	let scope = $state(/** @type {'selected' | 'all'} */ ('selected'));
	let open = $state(/** @type {string | null} */ (null));
	const toggle = (id) => (open = open === id ? null : id);
	const apply = (/** @type {Partial<import('./types').Card>} */ p) => {
		onapply?.(p, scope);
		open = null;
	};
	const count = $derived(scope === 'all' ? totalCount : selectedCount);
</script>

<div class="flex items-center gap-2 overflow-hidden bg-surface-2 px-3 py-2 text-sm whitespace-nowrap text-text ring-1 ring-border">
	<select bind:value={scope} aria-label="Apply scope" class="rounded bg-accent/20 px-2 py-1">
		<option value="selected">Selected ({selectedCount})</option>
		<option value="all">All ({totalCount})</option>
	</select>
	<span class="text-muted">→</span>

	<!-- Quantity first -->
	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('qty')}>Quantity ▾</button>
		{#if open === 'qty'}
			<div class="absolute z-50 mt-1 rounded-md bg-surface p-2 shadow-lg ring-1 ring-border">
				<input type="number" min="1" max="99" placeholder="Qty"
					onkeydown={(e) => e.key === 'Enter' && apply({ count: Math.min(99, Math.max(1, parseInt(e.currentTarget.value))) })}
					class="w-20 rounded bg-surface-2 px-2 py-1 ring-1 ring-border" />
			</div>
		{/if}
	</div>

	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('finish')}>Finish ▾</button>
		{#if open === 'finish'}
			<div class="absolute z-50 mt-1 flex flex-col rounded-md bg-surface p-1 shadow-lg ring-1 ring-border">
				{#each Object.entries(FINISH_LABELS) as [k, v] (k)}
					<button type="button" class="px-3 py-1 text-left hover:bg-accent/20" onclick={() => apply({ selectedFinish: k })}>{v}</button>
				{/each}
			</div>
		{/if}
	</div>

	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('cond')}>Condition ▾</button>
		{#if open === 'cond'}
			<div class="absolute z-50 mt-1 flex max-h-60 flex-col overflow-auto rounded-md bg-surface p-1 shadow-lg ring-1 ring-border">
				{#each Object.entries(CONDITIONS) as [k, v] (k)}<button type="button" class="px-3 py-1 text-left hover:bg-accent/20" onclick={() => apply({ condition: k })}>{v}</button>{/each}
			</div>
		{/if}
	</div>

	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('lang')}>Language ▾</button>
		{#if open === 'lang'}
			<div class="absolute z-50 mt-1 flex max-h-60 flex-col overflow-auto rounded-md bg-surface p-1 shadow-lg ring-1 ring-border">
				{#each Object.entries(LANGUAGES) as [k, v] (k)}<button type="button" class="px-3 py-1 text-left hover:bg-accent/20" onclick={() => apply({ language: k })}>{v}</button>{/each}
			</div>
		{/if}
	</div>

	<div class="relative">
		<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => toggle('price')}>Price ▾</button>
		{#if open === 'price'}
			<div class="absolute z-50 mt-1 flex flex-col gap-1 rounded-md bg-surface p-2 shadow-lg ring-1 ring-border">
				<button type="button" class="px-3 py-1 text-left hover:bg-accent/20" onclick={() => apply({ price: undefined, priceManuallySet: false })}>Reset to auto</button>
				<input type="number" step="0.01" min="0" placeholder="Set price"
					onkeydown={(e) => e.key === 'Enter' && apply({ price: parseFloat(e.currentTarget.value), priceManuallySet: true })}
					class="w-24 rounded bg-surface-2 px-2 py-1 ring-1 ring-border" />
			</div>
		{/if}
	</div>

	<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => apply({ alter: true })}>Alter</button>
	<button type="button" class="rounded bg-accent/20 px-2 py-1" onclick={() => apply({ proxy: true })}>Proxy</button>
	<button type="button" class="rounded bg-red-500/20 px-2 py-1 text-red-300" onclick={() => { onremove?.(scope); open = null; }}>🗑 Remove</button>
	<span class="ml-auto text-muted">{count} card{count === 1 ? '' : 's'}</span>
</div>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/BulkActionBar.svelte
git commit -m "feat: add single-line bulk action bar with selected/all scope

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: SearchBar

**Files:**
- Create: `src/SearchBar.svelte`

**Interfaces:**
- Produces: `<SearchBar bind:query {history} {isLoading} onsearch={()=>...} onpick={(q)=>...} onremovehistory={(q)=>...} onclearhistory={()=>...} />`. Includes a Scryfall syntax-guide link and a history dropdown.

- [ ] **Step 1: Create `src/SearchBar.svelte`**:

```svelte
<script>
	import Tooltip from './Tooltip.svelte';
	/**
	 * @type {{
	 *   query?: string; history?: string[]; isLoading?: boolean;
	 *   onsearch?: () => void; onpick?: (q: string) => void;
	 *   onremovehistory?: (q: string) => void; onclearhistory?: () => void;
	 * }}
	 */
	let { query = $bindable(''), history = [], isLoading = false, onsearch, onpick, onremovehistory, onclearhistory } = $props();
	let showHistory = $state(false);
	let container = $state();

	const submit = (/** @type {SubmitEvent} */ e) => {
		e.preventDefault();
		showHistory = false;
		onsearch?.();
	};
	$effect(() => {
		const onDoc = (/** @type {MouseEvent} */ e) => {
			if (showHistory && container && !container.contains(/** @type {Node} */ (e.target))) showHistory = false;
		};
		window.addEventListener('click', onDoc);
		return () => window.removeEventListener('click', onDoc);
	});
</script>

<form onsubmit={submit} class="w-full">
	<div class="relative" bind:this={container}>
		<input
			type="text" bind:value={query} placeholder="Scryfall search query"
			aria-label="Scryfall search query"
			class="w-full rounded-md bg-white px-3 py-2 pr-10 text-gray-800 focus:outline-none"
		/>
		<button type="button" onclick={() => (showHistory = !showHistory)} aria-label="Toggle search history"
			class="absolute inset-y-0 right-0 px-3 text-gray-500">{showHistory ? '▲' : '▼'}</button>

		{#if showHistory && history.length > 0}
			<ul class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface text-text shadow-lg ring-1 ring-border" role="listbox">
				{#each history as item (item)}
					<li class="flex items-center" role="option" aria-selected="false">
						<button type="button" class="flex-1 px-3 py-2 text-left hover:bg-accent/15" onclick={() => { onpick?.(item); showHistory = false; }}>{item}</button>
						<button type="button" aria-label={`Remove ${item}`} class="px-3 py-2 text-muted hover:text-red-400" onclick={() => onremovehistory?.(item)}>✕</button>
					</li>
				{/each}
				<li class="border-t border-border"><button type="button" class="w-full px-3 py-2 text-left text-sm text-muted hover:bg-accent/15" onclick={() => { onclearhistory?.(); showHistory = false; }}>Clear history</button></li>
			</ul>
		{/if}
	</div>

	<div class="mt-2 flex items-center gap-3">
		<button type="submit" disabled={isLoading}
			class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-strong disabled:opacity-60">
			{isLoading ? 'Searching…' : 'Search'}
		</button>
		<a href="https://scryfall.com/docs/syntax" target="_blank" rel="noopener noreferrer" class="text-sm text-white/80 underline hover:text-white">Syntax guide ↗</a>
	</div>
</form>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/SearchBar.svelte
git commit -m "feat: add SearchBar with history and syntax link

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: ResultsToolbar

**Files:**
- Create: `src/ResultsToolbar.svelte`

**Interfaces:**
- Consumes: `PRICE_SOURCES`, `Tooltip`.
- Produces: `<ResultsToolbar {totalCards} {selectedCount} bind:source bind:view onrefresh={()=>...} />`. `view: 'gallery' | 'compact'`.

- [ ] **Step 1: Create `src/ResultsToolbar.svelte`**:

```svelte
<script>
	import Tooltip from './Tooltip.svelte';
	import { PRICE_SOURCES } from './lib/prices.js';
	/**
	 * @type {{
	 *   totalCards: number; selectedCount: number;
	 *   source?: import('./lib/prices').PriceSource; view?: 'gallery' | 'compact';
	 *   onrefresh?: () => void;
	 * }}
	 */
	let { totalCards, selectedCount, source = $bindable('tcgplayer'), view = $bindable('gallery'), onrefresh } = $props();
</script>

<div class="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 text-sm text-text">
	<span class="rounded-full bg-accent/20 px-3 py-1">{totalCards} cards{selectedCount ? ` · ${selectedCount} selected` : ''}</span>

	<label class="flex items-center gap-1">
		<span class="text-muted">Prices:</span>
		<select bind:value={source} aria-label="Price source" class="rounded bg-accent/20 px-2 py-1">
			{#each Object.entries(PRICE_SOURCES) as [k, v] (k)}<option value={k}>{v.label} ({v.currency})</option>{/each}
		</select>
	</label>

	<Tooltip text="Refresh from Scryfall (also refreshes prices, max once/day)">
		<button type="button" onclick={onrefresh} aria-label="Refresh results" class="rounded bg-accent/20 px-2 py-1">⟳</button>
	</Tooltip>

	<div class="ml-auto inline-flex overflow-hidden rounded-md ring-1 ring-accent" role="group" aria-label="View">
		<button type="button" aria-pressed={view === 'gallery'} onclick={() => (view = 'gallery')} class="px-3 py-1 {view === 'gallery' ? 'bg-accent text-accent-contrast' : 'text-muted'}">▦ Gallery</button>
		<button type="button" aria-pressed={view === 'compact'} onclick={() => (view = 'compact')} class="px-3 py-1 {view === 'compact' ? 'bg-accent text-accent-contrast' : 'text-muted'}">☰ Compact</button>
	</div>
</div>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/ResultsToolbar.svelte
git commit -m "feat: add ResultsToolbar with price source and view toggle

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: SettingsDrawer

**Files:**
- Create: `src/SettingsDrawer.svelte`

**Interfaces:**
- Consumes: `Drawer`, `ThemeToggle`, `PRICE_SOURCES`.
- Produces: `<SettingsDrawer bind:show bind:defaultQueryOptions bind:source bind:theme onthemechange={(t)=>...} />`.

- [ ] **Step 1: Create `src/SettingsDrawer.svelte`**:

```svelte
<script>
	import Drawer from './Drawer.svelte';
	import { PRICE_SOURCES } from './lib/prices.js';
	/**
	 * @type {{
	 *   show?: boolean;
	 *   defaultQueryOptions?: string;
	 *   source?: import('./lib/prices').PriceSource;
	 *   theme?: import('./lib/theme').Theme;
	 *   onthemechange?: (t: import('./lib/theme').Theme) => void;
	 * }}
	 */
	let { show = $bindable(false), defaultQueryOptions = $bindable(''), source = $bindable('tcgplayer'), theme = $bindable('system'), onthemechange } = $props();
	const cycle = () => {
		const order = ['system', 'light', 'dark'];
		theme = /** @type {any} */ (order[(order.indexOf(theme) + 1) % 3]);
		onthemechange?.(theme);
	};
</script>

<Drawer bind:show title="Settings">
	<label class="mb-1 block text-sm font-medium">Default query options</label>
	<p class="mb-2 text-sm text-muted">Appended to every search.
		<a href="https://scryfall.com/docs/syntax" target="_blank" rel="noopener noreferrer" class="underline">Syntax guide ↗</a>
	</p>
	<input type="text" bind:value={defaultQueryOptions} placeholder="e.g. not:digital"
		class="mb-5 w-full rounded-md bg-surface-2 px-3 py-2 text-text ring-1 ring-border" />

	<label class="mb-1 block text-sm font-medium">Price source</label>
	<select bind:value={source} class="mb-5 w-full rounded-md bg-surface-2 px-3 py-2 text-text ring-1 ring-border">
		{#each Object.entries(PRICE_SOURCES) as [k, v] (k)}<option value={k}>{v.label} ({v.currency})</option>{/each}
	</select>

	<label class="mb-1 block text-sm font-medium">Theme</label>
	<button type="button" onclick={cycle} class="rounded-md bg-accent px-4 py-2 text-sm text-accent-contrast">Theme: {theme} (click to change)</button>
</Drawer>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/SettingsDrawer.svelte
git commit -m "feat: add SettingsDrawer (default query, price source, theme)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 13: ExportPanel

**Files:**
- Create: `src/ExportPanel.svelte`

**Interfaces:**
- Consumes: `buildBulkText`, `buildCsv` (export.js).
- Produces: `<ExportPanel {cards} {source} />`. Tabs Bulk Edit / CSV; live preview; Copy + Download per format.

- [ ] **Step 1: Create `src/ExportPanel.svelte`**:

```svelte
<script>
	import { buildBulkText, buildCsv } from './lib/export.js';
	/** @type {{ cards: import('./types').Card[]; source: import('./lib/prices').PriceSource }} */
	let { cards, source } = $props();

	let tab = $state(/** @type {'bulk' | 'csv'} */ ('bulk'));
	let copied = $state(false);

	const text = $derived(tab === 'bulk' ? buildBulkText(cards) : buildCsv(cards, source));
	const filename = $derived(tab === 'bulk' ? 'cards.txt' : 'cards.csv');
	const mime = $derived(tab === 'bulk' ? 'text/plain' : 'text/csv');

	const copy = async () => {
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2500);
	};
	const download = () => {
		const blob = new Blob([text], { type: `${mime};charset=utf-8` });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};
</script>

<div class="flex h-full flex-col rounded-md bg-surface-2 p-3 text-text ring-1 ring-border">
	<div class="mb-2 flex items-center gap-2">
		<button type="button" onclick={() => (tab = 'bulk')} class="rounded-full px-3 py-1 text-sm {tab === 'bulk' ? 'bg-accent text-accent-contrast' : 'bg-accent/20'}">Bulk Edit</button>
		<button type="button" onclick={() => (tab = 'csv')} class="rounded-full px-3 py-1 text-sm {tab === 'csv' ? 'bg-accent text-accent-contrast' : 'bg-accent/20'}">CSV</button>
		<span class="ml-auto text-xs text-muted">live</span>
	</div>
	<textarea readonly value={text} aria-label="Export preview"
		class="min-h-40 flex-1 resize-none rounded bg-surface p-2 font-mono text-xs text-text ring-1 ring-border"></textarea>
	<div class="mt-2 flex gap-2">
		<button type="button" onclick={copy} class="flex-1 rounded-md bg-accent px-3 py-2 text-sm text-accent-contrast hover:bg-accent-strong">{copied ? 'Copied!' : 'Copy'}</button>
		<button type="button" onclick={download} class="flex-1 rounded-md bg-accent/20 px-3 py-2 text-sm">⬇ {filename}</button>
	</div>
</div>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/ExportPanel.svelte
git commit -m "feat: add ExportPanel with live dual-format preview

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 14: App integration

**Files:**
- Rewrite: `src/App.svelte`

**Interfaces:**
- Consumes: every component above; `buildSearchUrl`, `searchAllPages` (scryfall.js); `readCache`/`writeCache`/`invalidateCache` (cache.js); `applyBulk` (bulk.js); `toggle`/`selectRange`/`selectAll`/`clear` (selection.js); `getStoredTheme`/`setStoredTheme`/`resolveTheme`/`applyTheme` (theme.js); `readJSON`/`writeJSON`/`readString`/`writeString` (storage.js).
- Produces: the full app. Owns state and persistence; implements debounced/locked search, cache + refresh, selection keyboard shortcuts, and the responsive shell (lg+ side-by-side; below lg an Export bottom sheet/drawer).

- [ ] **Step 1: Rewrite `src/App.svelte`**:

```svelte
<script>
	import { onMount } from 'svelte';
	import SearchBar from './SearchBar.svelte';
	import ResultsToolbar from './ResultsToolbar.svelte';
	import SettingsDrawer from './SettingsDrawer.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import Gallery from './Gallery.svelte';
	import CompactTable from './CompactTable.svelte';
	import BulkActionBar from './BulkActionBar.svelte';
	import ExportPanel from './ExportPanel.svelte';
	import BottomSheet from './BottomSheet.svelte';
	import Tooltip from './Tooltip.svelte';

	import { buildSearchUrl, searchAllPages } from './lib/scryfall.js';
	import { readCache, writeCache, invalidateCache } from './lib/cache.js';
	import { applyBulk } from './lib/bulk.js';
	import { toggle, selectRange, selectAll, clear } from './lib/selection.js';
	import { readJSON, writeJSON, readString, writeString } from './lib/storage.js';
	import { getStoredTheme, setStoredTheme, resolveTheme, applyTheme } from './lib/theme.js';

	// settings
	let query = $state('');
	let defaultQueryOptions = $state(readString('scrymox:defaultQuery', ''));
	let source = $state(/** @type {import('./lib/prices').PriceSource} */ (readString('scrymox:source', 'tcgplayer')));
	let view = $state(/** @type {'gallery'|'compact'} */ (readString('scrymox:view', 'gallery')));
	let theme = $state(getStoredTheme());

	// data + ui
	/** @type {import('./types').Card[]} */
	let cards = $state([]);
	let totalCards = $state(0);
	let isLoading = $state(false);
	let searchError = $state('');
	let bulkNote = $state('');
	/** @type {string[]} */
	let searchHistory = $state([]);
	let selectedIds = $state(new Set());
	/** @type {string | null} */
	let anchorId = null;
	let settingsOpen = $state(false);
	let exportOpen = $state(false);
	let lastQuery = '';

	const ids = $derived(cards.map((c) => c.id));
	const orderedIds = () => ids;

	// ---- persistence ----
	onMount(() => {
		searchHistory = readJSON('scrymox:history', []);
		const saved = readJSON('scrymox:working', null);
		if (saved) {
			cards = saved.cards ?? [];
			totalCards = saved.totalCards ?? cards.length;
			lastQuery = saved.query ?? '';
			query = saved.query ?? '';
		}
		// react to OS theme changes while in 'system'
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const onMq = () => applyTheme(resolveTheme(theme, mq.matches));
		mq.addEventListener('change', onMq);
		return () => mq.removeEventListener('change', onMq);
	});

	$effect(() => writeString('scrymox:defaultQuery', defaultQueryOptions));
	$effect(() => writeString('scrymox:source', source));
	$effect(() => writeString('scrymox:view', view));
	$effect(() => writeJSON('scrymox:working', { query: lastQuery, cards, totalCards }));

	const onThemeChange = (/** @type {import('./lib/theme').Theme} */ t) => {
		theme = t;
		setStoredTheme(t);
		applyTheme(resolveTheme(t, window.matchMedia('(prefers-color-scheme: dark)').matches));
	};

	// ---- search ----
	const runSearch = async (/** @type {string} */ q, { refresh = false } = {}) => {
		const trimmed = q.trim();
		if (!trimmed) {
			searchError = 'Please enter a query.';
			return;
		}
		if (isLoading) return; // in-flight lock
		searchError = '';
		bulkNote = '';
		selectedIds = clear();
		lastQuery = trimmed;

		if (refresh) invalidateCache(`${trimmed} ${defaultQueryOptions}`);
		const cached = !refresh && readCache(`${trimmed} ${defaultQueryOptions}`);
		if (cached) {
			cards = cached.cards;
			totalCards = cached.totalCards;
			recordHistory(trimmed);
			return;
		}

		isLoading = true;
		cards = [];
		totalCards = 0;
		/** @type {{ error?: string }} */
		let result;
		try {
			result = await searchAllPages(buildSearchUrl(trimmed, defaultQueryOptions), {
				source,
				onPage: (newCards, total) => {
					cards = [...cards, ...newCards];
					totalCards = total;
				}
			});
		} catch {
			result = { error: 'Could not reach Scryfall. Please try again.' };
		}
		isLoading = false;

		if (result.error) {
			searchError = result.error;
			cards = [];
			totalCards = 0;
			return;
		}
		writeCache(`${trimmed} ${defaultQueryOptions}`, cards, totalCards);
		recordHistory(trimmed);
	};

	const recordHistory = (/** @type {string} */ q) => {
		if (!searchHistory.includes(q)) {
			searchHistory = [q, ...searchHistory.slice(0, 14)];
			writeJSON('scrymox:history', searchHistory);
		}
	};
	const removeHistory = (/** @type {string} */ q) => {
		searchHistory = searchHistory.filter((x) => x !== q);
		writeJSON('scrymox:history', searchHistory);
	};
	const clearHistory = () => {
		searchHistory = [];
		writeJSON('scrymox:history', searchHistory);
	};

	// ---- edits ----
	const updateCard = (/** @type {import('./types').Card} */ c) => (cards = cards.map((x) => (x.id === c.id ? c : x)));
	const removeCard = (/** @type {string} */ id) => {
		cards = cards.filter((x) => x.id !== id);
		const next = new Set(selectedIds);
		next.delete(id);
		selectedIds = next;
	};
	const onBulkApply = (/** @type {Partial<import('./types').Card>} */ patch, /** @type {'selected'|'all'} */ scope) => {
		const target = scope === 'all' ? new Set(ids) : selectedIds;
		const { cards: next, skipped } = applyBulk(cards, target, patch);
		cards = next;
		bulkNote = skipped > 0 ? `${skipped} card${skipped === 1 ? '' : 's'} skipped (finish not available).` : '';
	};
	const onBulkRemove = (/** @type {'selected'|'all'} */ scope) => {
		if (scope === 'all') { cards = []; totalCards = 0; }
		else cards = cards.filter((c) => !selectedIds.has(c.id));
		selectedIds = clear();
	};

	// ---- selection ----
	const onSelect = (/** @type {MouseEvent} */ e, /** @type {string} */ id) => {
		if (e.shiftKey && anchorId) selectedIds = selectRange(selectedIds, orderedIds(), anchorId, id);
		else { selectedIds = toggle(selectedIds, id); anchorId = id; }
	};

	const isTyping = (/** @type {EventTarget | null} */ t) =>
		t instanceof HTMLElement && (['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName) || t.isContentEditable);

	const onKeydown = (/** @type {KeyboardEvent} */ e) => {
		if (isTyping(e.target)) return;
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && cards.length) {
			e.preventDefault();
			selectedIds = selectAll(ids);
		} else if (e.key === 'Escape') {
			selectedIds = clear();
		}
	};
</script>

<svelte:window onkeydown={onKeydown} />

<div class="min-h-screen bg-bg text-text">
	<header class="bg-linear-to-r from-(--bar-from) to-(--bar-to) px-4 py-3 text-white shadow">
		<div class="mx-auto flex max-w-[1800px] items-center gap-3">
			<h1 class="text-xl font-bold">ScryMox</h1>
			<div class="flex-1"><SearchBar bind:query history={searchHistory} {isLoading}
				onsearch={() => runSearch(query)} onpick={(q) => { query = q; runSearch(q); }}
				onremovehistory={removeHistory} onclearhistory={clearHistory} /></div>
			<ThemeToggle bind:theme onchange={onThemeChange} />
			<Tooltip text="Settings"><button type="button" aria-label="Settings" onclick={() => (settingsOpen = true)} class="rounded-full bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30">⚙</button></Tooltip>
		</div>
	</header>

	{#if searchError}<p role="alert" class="mx-auto max-w-[1800px] px-4 pt-3 text-red-500">{searchError}</p>{/if}

	{#if cards.length > 0}
		<main class="mx-auto max-w-[1800px] p-3">
			<ResultsToolbar {totalCards} selectedCount={selectedIds.size} bind:source bind:view onrefresh={() => runSearch(lastQuery, { refresh: true })} />
			{#if bulkNote}<p class="px-1 py-1 text-sm text-amber-500">{bulkNote}</p>{/if}

			<div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_480px] 2xl:grid-cols-[1fr_580px]">
				<div>
					{#if view === 'gallery'}
						<Gallery {cards} {source} {selectedIds} onupdate={updateCard} onremove={removeCard} onselect={onSelect} />
					{:else}
						<CompactTable {cards} {source} {selectedIds} onupdate={updateCard} onremove={removeCard} onselect={onSelect} />
					{/if}
				</div>
				<!-- Export: side-by-side on lg+, button + bottom sheet below lg -->
				<aside class="hidden lg:block"><div class="sticky top-3"><ExportPanel {cards} {source} /></div></aside>
			</div>

			<button type="button" onclick={() => (exportOpen = true)} class="mt-3 w-full rounded-md bg-accent px-4 py-2 text-accent-contrast lg:hidden">⬆ Export</button>

			{#if selectedIds.size > 0}
				<div class="sticky bottom-0 z-30 mt-3"><BulkActionBar selectedCount={selectedIds.size} totalCount={cards.length} onapply={onBulkApply} onremove={onBulkRemove} /></div>
			{/if}
		</main>
	{:else if isLoading}
		<p class="mx-auto max-w-[1800px] p-6 text-center text-muted">Loading {cards.length}{totalCards ? ` of ${totalCards}` : ''} cards…</p>
	{:else}
		<p class="mx-auto max-w-[1800px] p-6 text-center text-muted">Enter a Scryfall query to begin.</p>
	{/if}

	<SettingsDrawer bind:show={settingsOpen} bind:defaultQueryOptions bind:source bind:theme onthemechange={onThemeChange} />
	<BottomSheet bind:show={exportOpen} title="Export"><ExportPanel {cards} {source} /></BottomSheet>
</div>
```

- [ ] **Step 2: Verify build + types**

Run: `npm run build && npm run check:types`
Expected: PASS (the old components still exist but are now unused; they are removed in Task 15).

- [ ] **Step 3: Commit**

```bash
git add src/App.svelte
git commit -m "feat: integrate overhauled app shell, search, selection, persistence

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 15: Remove legacy code + transitional shims

**Files:**
- Delete: `src/Card.svelte`, `src/BulkEdit.svelte`, `src/CSV.svelte`, `src/ImageModal.svelte`
- Modify: `package.json` (drop `svelte-device-info`), `src/lib/scryfall.js` and `src/types.d.ts` (remove `displayedPrice`), `src/lib/finishes.js` (remove now-unused `getFinishPrice`) and its test.

**Interfaces:**
- Produces: a codebase with a single source of truth for price display (`getPrice`) and no dead components.

- [ ] **Step 1: Delete the legacy components**

```bash
git rm src/Card.svelte src/BulkEdit.svelte src/CSV.svelte src/ImageModal.svelte
```

- [ ] **Step 2: Remove `displayedPrice`** — in `src/lib/scryfall.js` delete the two lines in `normalizeCard`:

```js
		// Transitional: kept so existing components keep rendering until Plan 02
		// switches them to live getPrice(prices, source, finish).
		displayedPrice: getFinishPrice(scryfallCard.prices, selectedFinish),
```

and remove `getFinishPrice` from the import at the top so it reads:

```js
import { getDefaultFinish, getDisplayFinish } from './finishes.js';
```

- [ ] **Step 3: Remove `displayedPrice`** from `src/types.d.ts` (delete the two-line `displayedPrice` field from `Card`).

- [ ] **Step 4: Remove `getFinishPrice`** from `src/lib/finishes.js` and delete its test block in `src/lib/finishes.test.js` (the `getFinishPrice` import and its `test(...)` cases). Keep `getDefaultFinish`, `getDisplayFinish`, `isFinishAllowed`.

- [ ] **Step 5: Drop the unused dependency**

Run: `npm uninstall svelte-device-info`
Expected: `package.json`/`package-lock.json` updated; no source references remain (verify none): `git grep svelte-device-info` returns nothing.

- [ ] **Step 6: Verify the full check passes**

Run: `npm run check`
Expected: PASS — prettier, eslint, svelte-check, vitest, build all green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove legacy components and transitional price shim

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 16: Final verification + README + PR

**Files:**
- Modify: `README.md` (update tips to match new UX).

- [ ] **Step 1: Update `README.md`** — replace the "Tips" section to reflect the new editing model:

```markdown
## Tips

- Search with Scryfall syntax; set a Default Query (e.g. `not:digital`) in Settings to apply to every search.
- Edit any card's quantity, finish, condition, language, price, alter, and proxy directly on its tile (or in Compact view).
- Select cards (Click, Shift+Click for a range, Ctrl/⌘+Click to add, Ctrl/⌘+A for all, Esc to clear) and use the bulk bar to change many at once.
- Export as Moxfield Bulk Edit text or CSV — copy or download either.
```

- [ ] **Step 2: Run the full check**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Manual verification (record results)** — `npm run dev`, then confirm:
  - A real query (e.g. `set:dsk type:legendary`) loads incrementally; a second identical search is instant (cache); Refresh refetches.
  - Theme follows OS, toggle persists across reload; working set restores after reload.
  - Gallery↔Compact; per-card and bulk edits (incl. a finish-skip note); price changes with source + finish, blank when missing; DFC flip + image zoom/lightbox.
  - Phone (single column), tablet (drawer/sheet, one-line bulk bar both orientations), desktop/ultrawide (side-by-side, more columns) via devtools responsive mode.
  - CSV includes the Scryfall ID column; bulk text markers correct.

- [ ] **Step 4: Commit README + push branch**

```bash
git add README.md
git commit -m "docs: update README for the overhauled UX

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push -u origin feat/ui-overhaul
```

- [ ] **Step 5: Open the PR**

```bash
gh pr create --title "Overhaul ScryMox UI/UX" --body "$(cat <<'EOF'
Complete UI/UX overhaul: gallery-forward responsive layout (phone→ultrawide),
Twilight Purple dark/light theme (OS default), individual + bulk editing with
data constraints, source-aware pricing, search history, default query options,
tooltips, image zoom + DFC flip, session persistence, and a rate-limit-compliant
Scryfall request layer (500ms spacing, 429 backoff, 24h cache). CSV now includes
the Scryfall ID. See docs/superpowers/specs and docs/superpowers/plans.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage (UI portion):**
- Mobile-first responsive (phone/tablet/desktop/ultrawide) → Tasks 6, 8, 14. ✓
- Gallery/Compact toggle → Tasks 7, 8, 11, 14. ✓
- Dark/light + OS default + persisted toggle → Tasks 3, 12, 14. ✓
- Search history + default query options + syntax link → Tasks 10, 12. ✓
- Individual editing of every attribute → Tasks 6, 7. ✓
- Bulk editing (selected/all) with constraints + skip note → Tasks 9, 14 (uses `applyBulk`). ✓
- Selection keyboard shortcuts scoped to results → Task 14. ✓
- Source-aware, finish-aware pricing; blank when missing → Tasks 6, 7, 11. ✓
- Dual export with live preview, copy/download, Scryfall ID → Task 13 (+ Plan 01 Task 7). ✓
- Image zoom (hover/tap) + DFC flip; no art_crop → Task 5. ✓
- Tooltips → Tasks 2, used throughout. ✓
- Working-set persistence → Task 14. ✓
- Favicon → Plan 01 Task 13. ✓
- Anti-spam (debounce/in-flight lock/cache/refresh) → Task 14 (+ Plan 01 queue). ✓
- Remove legacy + shims; drop unused dep → Task 15. ✓

**Placeholder scan:** none — each step has concrete code/commands. (Task 14 Step 2 notes legacy files are still present but unused; Task 15 removes them.)

**Type consistency:** callback-prop names are consistent across producer/consumer (`onupdate(card)`, `onremove(id)`, `onselect(event, id)`, `onapply(patch, scope)`, `onremove(scope)`); `source: PriceSource` and `view: 'gallery'|'compact'` used uniformly; `selectedIds: Set<string>` threaded from `App` → `Gallery`/`CompactTable` → tiles; `applyBulk(cards, Set, patch) => { cards, skipped }` matches Plan 01 Task 9.

**Fix applied during review:** `removeCard` in Task 14 dedupes selection cleanly via a fresh `Set` delete (the earlier toggle-based form was redundant) — implementers should use the `const next = new Set(selectedIds); next.delete(id); selectedIds = next;` form and also filter `cards`.
```
