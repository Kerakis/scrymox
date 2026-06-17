# ScryMox UI/UX Overhaul — Design

**Date:** 2026-06-17
**Branch:** `feat/ui-overhaul`
**Status:** Approved design, pending implementation plan

## Summary

ScryMox turns a Scryfall search query into an importable card list for Moxfield.
This overhaul keeps that core purpose but completely rebuilds the UI/UX: a
gallery-forward, mobile-first responsive layout; a refined dark/light "Twilight
Purple" theme; first-class bulk editing; correct, source-aware pricing; and a
disciplined Scryfall request layer that respects rate limits and prevents API
spam.

The app stays a **client-only static SPA** built with **Svelte 5 + Vite +
Tailwind 4**, deployed to GitHub Pages exactly as today. No backend is
introduced: Scryfall wants browsers to call its API directly (each user gets
their own rate budget and keeps their native `User-Agent`), and it explicitly
discourages proxying/repackaging its data. "Anti-spam" is therefore handled
entirely client-side.

## Goals

- Dramatically improve UI/UX while preserving core functionality.
- Mobile-first responsive design across phone, tablet (both orientations),
  desktop, and an ultrawide layout; everything usable at every size.
- Dark/light themes defaulting to OS preference; retain purple.
- Robust Scryfall rate-limit compliance with exponential backoff on HTTP 429,
  plus client-side guards against hammering the API.
- Individual **and** bulk editing of every reasonable card attribute, with edits
  constrained by the card's actual data.
- Dual export (Moxfield CSV and Bulk Edit text) from a single edited source of
  truth, with copy and download for each, including the Scryfall ID in CSV.
- Source-aware, finish-aware pricing; blank when unavailable.
- Tooltips, search history, default query options, and a real favicon.

## Non-goals

- No backend / server / proxy (conflicts with Scryfall guidance; shares one rate
  budget across all users).
- No migration to SvelteKit (single-page tool; routing/SSR add no value here).
- No accounts, no server-side storage, no analytics.
- No use of `art_crop` imagery (insufficient to distinguish printings, and
  carries attribution obligations); we use full card images.

## Key facts from the Scryfall API docs

These constraints drive the engine design:

- **Rate limits:** `/cards/search` is **2 requests/second (500 ms apart)**; other
  endpoints 10/sec. Image hosts (`*.scryfall.io`) are unthrottled.
- **HTTP 429** limits access for **30 seconds**; ignoring 429s risks a temporary
  or permanent ban. We must reduce load on 429, not retry blindly.
- **Caching:** cache data for at least **24 hours**; prices update only once per
  day, so refetching sooner yields nothing new.
- **Headers:** requests need `User-Agent` and `Accept`. For browser JavaScript,
  **keep the browser's `User-Agent` intact** (it cannot be overridden in fetch),
  and send an `Accept` header. The current `User-Agent: 'Scrymox'` fetch header
  is ineffective and will be removed.
- **Search:** returns 175 cards/page with `total_cards`, `has_more`,
  `next_page`; `q` max 1000 chars; error/`warnings` reported in the body.
- **Card fields used:** `id`, `oracle_id`, `name`, `set`, `set_name`,
  `collector_number`, `lang`, `layout`, `finishes` (`foil`/`nonfoil`/`etched`),
  `image_uris` (`small`/`normal`/`large`/`png`/`border_crop`; `art_crop` unused),
  `card_faces` (per-face `name`/`image_uris`), `prices` (`usd`, `usd_foil`,
  `usd_etched`, `eur`, `eur_foil`, `eur_etched`, `tix`), `games`.
- **Data rules:** no paywalling, no plain proxying/repackaging. Full card images
  already carry artist + copyright, satisfying attribution.

## Architecture

Client-only Svelte 5 SPA. Logic lives in pure, unit-tested `lib/` modules;
Svelte components handle rendering and DOM side effects.

### lib/ modules

- **`requestQueue.js`** — a single shared FIFO queue serializing all Scryfall API
  requests. Enforces a minimum spacing (default 500 ms, configurable per
  endpoint class) and centralizes 429 backoff. `fetch`/`sleep` are injectable for
  tests. Exposes something like `enqueue(url, init) => Promise<Response>`.
- **`scryfall.js`** — `buildSearchUrl(query, defaultOptions)` and
  `searchAllPages(url, { onPage })`. Uses `requestQueue` for every page, sets
  `Accept: application/json;q=0.9,*/*;q=0.8` (no `User-Agent`), parses
  `error`/`warnings`, and reports each normalized page incrementally. Also
  `normalizeCard(scryfallCard) => Card`.
- **`cache.js`** — localStorage-backed query result cache keyed by the normalized
  query string, TTL 24 h. `read(query)`, `write(query, cards, totalCards)`,
  `invalidate(query)`. Stale/missing → caller fetches. Stores the normalized
  cards (post-`normalizeCard`) so reloads are instant.
- **`backoff.js`** (or inside `requestQueue`) — computes retry delays: honor a
  `Retry-After` header when present; otherwise exponential backoff seeded near
  the documented 30 s lockout, capped, with a small number of attempts.
- **`finishes.js`** — default finish selection (nonfoil → foil → etched), the
  Moxfield marker map (`foil` → `*F*`, `etched` → `*E*`), and a guard that a
  requested finish is permitted by the card's `finishes`.
- **`prices.js`** — maps `(source, finish)` to the right price key and returns the
  string value or `null`. Sources: TCGplayer (`usd`/`usd_foil`/`usd_etched`),
  Cardmarket (`eur`/`eur_foil`/`eur_etched`), Cardhoarder (`tix`, finish-agnostic).
- **`export.js`** — `buildBulkText(cards)` and `buildCsv(cards)` (pure string
  builders), the latter including the Scryfall ID column and RFC-4180 quoting.
- **`storage.js`** — typed localStorage wrappers (exists today; reused/extended).
- **`theme.js`** — resolves OS preference, applies/persists the theme choice,
  exposes a toggle.

### Components

- `App` — shell, state owner for the card list, query, selection, settings.
- `SearchBar` — query input, history dropdown, syntax-guide link, submit (with
  debounce + in-flight lock).
- `SettingsDrawer` — freeform default query options (with syntax-guide link),
  price source selector, theme toggle.
- `ResultsToolbar` — result count, price source, Gallery/Compact view toggle.
- `Gallery` + `CardTile` — responsive tile grid; tile = card image + select strip
  + symmetric control footer.
- `CompactTable` + `CardRow` — dense editable table view (same data/actions).
- `BulkActionBar` — appears when a selection exists; single-line, never wraps.
- `ExportPanel` — tabbed Bulk Edit / CSV live preview with Copy + Download.
- `CardImage` — gallery image plus hover-enlarge (desktop) / tap-lightbox (mobile)
  and a DFC flip control.
- Primitives: `Tooltip`, `Modal`, `Drawer`, `BottomSheet`, `ThemeToggle`.

## Scryfall integration & anti-spam

- All API calls flow through `requestQueue` with **≥500 ms** spacing for search.
- **No `User-Agent` header**; send `Accept` only. Browser supplies the UA.
- **429 handling:** on 429, stop issuing new requests, wait per `Retry-After`
  (or exponential backoff respecting the 30 s lockout), retry a capped number of
  times, and surface a calm message ("Scryfall asked us to slow down — retrying
  in Ns"). Never ignore a 429.
- **Spam guards:** debounce search submission; disable Search while a search is
  in flight; ignore a duplicate identical query already running; and serve
  repeat queries from the **24 h localStorage cache** so they never hit the API.
  A manual **Refresh** action bypasses the cache for the current query.
- Results render incrementally per 175-card page, as today.

## Data model

`normalizeCard` produces the editable `Card`:

- Identity/display: `id` (Scryfall ID), `oracle_id`, `name`, `set`, `set_name`,
  `collector_number`, `lang`, `layout`, `games`.
- Imagery: `image_uris` — single object, or `[front, back]` for multi-face
  layouts (split/flip kept single per current logic; transform/modal_dfc/
  reversible etc. expose both faces).
- Finishes: `finishes` (from card), `selectedFinish` (default nonfoil → foil →
  etched), `displayFinish` (Moxfield marker).
- Editable user data: `count` (1–99, default 1), `condition` (default **NM**),
  `language` (defaults to the card's `lang`, uppercased for Moxfield),
  `alter`/`proxy` (default false), `priceManuallySet` + optional `price`.
- Pricing: `prices` (all keys retained), derived display price from
  `(source, finish)`.

**Edit constraints:** `selectedFinish` may only be a finish present in
`finishes`; the UI hides/omits unavailable finishes and bulk operations skip
cards that don't support the requested finish.

## Pricing

- A **global price source** selector (persisted): TCGplayer (USD), Cardmarket
  (EUR), Cardhoarder (TIX).
- Displayed price = `prices[key(source, selectedFinish)]`:
  foil → `*_foil`, etched → `*_etched`, otherwise the base key; Cardhoarder uses
  `tix` regardless of finish.
- When the resolved key is `null`/absent, show **"—" / blank** (never "Auto").
- Per-card manual override; CSV exports the numeric override or derived value, or
  blank when unavailable.

## UI/UX

- **Layout (locked via visual companion):** gallery-forward split — editable
  gallery on the left, a slimmer live **Export** panel on the right on wide
  screens; a **Gallery ⇄ Compact** view toggle. Responsive rules:
  - **Phone (~390 px):** single column; one card per row — image left, large
    controls right; sticky "N selected" bar; Export as a bottom sheet.
  - **Tablet (~768 portrait / ~1024 landscape):** 3–5 columns; Export as a
    slide-over drawer; bulk bar stays on one line (abbreviates in portrait).
  - **Desktop (~1280 px):** ~5 columns + side-by-side Export panel (~480 px).
  - **Ultrawide (≥1920 px):** ~7 columns + wider Export panel (~580 px); content
    width capped so export lines don't stretch endlessly.
- **Card tile:** real `border_crop` image (portrait), a slim control strip
  **above** the image (select checkbox + remove — never covering the card name),
  and a **symmetric control footer**: row 1 Qty stepper + Price; row 2 full-width
  Finish; row 3 Condition | Language; row 4 Alter | Proxy. Full words where space
  allows.
- **Theme:** "Twilight Purple" — purple/indigo-tinted surfaces with a brighter
  violet accent and a subtle purple gradient header bar; full dark and light
  palettes. Defaults to OS preference; manual ◐/☀ toggle persisted.
- **Card imagery:** desktop hover enlarges the card (`large`/`png`); mobile tap
  opens a lightbox; double-faced cards get a flip control. `art_crop` is never
  used.
- **Tooltips** on every icon-only or abbreviated control.
- **Accessibility:** keyboard navigable, managed focus (modals/drawers/sheets),
  ARIA roles/labels, WCAG-AA contrast in both themes.
- **Favicon:** replace with a simple purple card-stack SVG icon.
- **Default query options:** a single freeform field (applied to every search),
  with a link to the Scryfall syntax guide (https://scryfall.com/docs/syntax);
  the same link appears by the main search field.

## Editing & bulk actions

- Inline per-card editing of count, finish, condition, language, price, alter,
  proxy in **both** gallery and compact views.
- **Selection model** (scoped to the results region; never hijacks typing or
  normal browser shortcuts):
  - Click — toggle one
  - Shift+Click — range select
  - Ctrl/⌘+Click — add/remove from selection
  - Ctrl/⌘+A — select all (only when results are focused)
  - Esc — clear selection
- **Bulk action bar** (single line, never wraps; abbreviates when constrained):
  set Quantity, Finish, Condition, Language, Price, Alter, Proxy, or Remove for
  the selection. A per-column "apply to all" path is also available.
- Bulk operations **respect card constraints** (e.g., "set Foil" only affects
  cards whose `finishes` include foil; others are left unchanged, with a brief
  note of how many were skipped).
- Remove single card or remove selected.

## Export

Single edited source of truth → two outputs, each with a **live preview** plus
**Copy** and **Download**:

- **Bulk Edit text:** `count Name (SET) collector_number [*F*|*E*]` per line.
- **Moxfield CSV** columns, in order:
  `Count, Name, Edition, Collector Number, Condition, Language, Foil, Alter,
  Proxy, Price, Scryfall ID`.
  - `Edition` is the uppercased set code; `Foil` is `foil`/`etched`/blank;
    `Alter`/`Proxy` are `Yes`/blank; `Price` is the resolved/override value or
    blank; `Scryfall ID` is the card `id` (Moxfield ignores it today but will use
    it later). RFC-4180 quoting for names.

## Persistence (localStorage)

- Theme choice, default query options, price source, view mode (gallery/compact).
- Search history: deduped, most-recent-first, capped (~15), with remove/clear.
- **Working set:** the current normalized card list **and the user's edits**, so a
  reload resumes the session. A visible "results may be stale — Refresh"
  affordance lets the user refetch (which also refreshes prices, max daily).

## Testing & CI

- vitest unit tests on `lib/` (node env, as today):
  - `requestQueue` spacing and FIFO ordering (fake timers, injected `sleep`).
  - 429 backoff: `Retry-After` honored; exponential fallback; retry cap; no
    request flood (injected `fetch`).
  - `cache` read/write/TTL expiry and query-key normalization.
  - `normalizeCard`: single vs multi-face imagery, finish defaults, language
    default from `lang`, price object passthrough.
  - `prices`: every `(source, finish)` combination, including `null` handling.
  - `finishes`: default selection and constraint guard.
  - `export`: `buildBulkText` markers/trimming; `buildCsv` column order, quoting,
    Scryfall ID, blank price.
- Component tests where they add value (optional, jsdom): selection keyboard
  shortcuts, bulk-apply constraint skipping.
- Keep existing CI green: `prettier`, `eslint`, `svelte-check`, `vitest`, `build`.

## Rollout

All work lands on `feat/ui-overhaul` and ships as a single PR once complete and
green, deploying via the existing GitHub Pages workflow.
