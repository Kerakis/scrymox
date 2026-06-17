# ScryMox Overhaul — Plan 01: Foundation & Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the fully unit-tested, framework-agnostic engine for ScryMox — Scryfall request throttling/backoff, query caching, card normalization, pricing, finishes, export, selection, bulk edits — plus the theme system, types, and favicon, without changing the current UI.

**Architecture:** Pure logic lives in `src/lib/*.js` modules with injectable dependencies (fetch/sleep/clock/store) so everything is testable under Vitest's node environment. The existing components keep working throughout (changes are additive/backward-compatible); Plan 02 rewires the UI onto these modules and removes the transitional shims.

**Tech Stack:** Svelte 5 (runes), Vite 8, Tailwind CSS 4, Vitest 4. No new runtime dependencies.

## Global Constraints

- Client-only static SPA; no backend. Talk to Scryfall directly from the browser.
- `/cards/search` requests must be spaced **≥ 500 ms** apart (Scryfall hard limit 2/sec).
- **Never set a `User-Agent` header** from browser fetch; send `Accept: application/json;q=0.9,*/*;q=0.8`.
- On HTTP **429**: honor `Retry-After` if present, else exponential backoff seeded at **30000 ms**; cap retries; never ignore a 429.
- Cache query results for **24 h** (`86400000 ms`); prices update at most daily.
- Price sources: TCGplayer → `usd`/`usd_foil`/`usd_etched`; Cardmarket → `eur`/`eur_foil`/`eur_etched`; Cardhoarder → `tix` (finish-agnostic).
- Finish default order: `nonfoil` → `foil` → `etched`; a finish is only valid if present in the card's `finishes`. Markers: `foil` → `*F*`, `etched` → `*E*`.
- Condition default **NM**; language defaults to the card's `lang`, uppercased.
- CSV columns, in order: `Count, Name, Edition, Collector Number, Condition, Language, Foil, Alter, Proxy, Price, Scryfall ID`.
- Tests live in `src/**/*.test.js` and run under the node environment (see `vite.config.js`). Run a single file with `npx vitest run <path>`.
- Commit messages end with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## File Structure

- `src/lib/storage.js` — **modify**: add `removeKey`. (typed localStorage wrappers)
- `src/lib/prices.js` — **create**: price-source mapping + `getPrice`.
- `src/lib/finishes.js` — **modify**: add `isFinishAllowed`; keep existing exports.
- `src/lib/cache.js` — **create**: 24 h localStorage query cache.
- `src/lib/requestQueue.js` — **create**: shared throttle + 429 backoff.
- `src/lib/scryfall.js` — **modify**: extend `normalizeCard`; route `searchAllPages` through the queue with the correct headers.
- `src/lib/export.js` — **modify**: add Scryfall ID column + source-aware price.
- `src/lib/selection.js` — **create**: pure selection-set ops.
- `src/lib/bulk.js` — **create**: constraint-aware bulk apply.
- `src/lib/theme.js` — **create**: theme resolution + persistence.
- `src/types.d.ts` — **modify**: extend `Card`, add `PriceSource`/`Theme`.
- `src/app.css` — **modify**: Twilight Purple tokens + class-based dark variant.
- `public/favicon.svg` — **create**; `index.html` — **modify**: reference it + meta.

Each `*.test.js` sits beside its module (e.g. `src/lib/prices.test.js`).

---

### Task 1: storage.js — add `removeKey`

**Files:**
- Modify: `src/lib/storage.js`
- Test: `src/lib/storage.test.js`

**Interfaces:**
- Consumes: existing `KeyValueStore` typedef.
- Produces: `removeKey(key: string, store?) => void`.

- [ ] **Step 1: Write the failing test** — append to `src/lib/storage.test.js`:

```js
import { removeKey, readString } from './storage.js';

test('removeKey deletes a stored value', () => {
	const map = new Map([['k', 'v']]);
	const store = {
		getItem: (k) => (map.has(k) ? map.get(k) : null),
		setItem: (k, v) => map.set(k, v),
		removeItem: (k) => map.delete(k)
	};
	removeKey('k', store);
	expect(readString('k', 'fallback', store)).toBe('fallback');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/storage.test.js`
Expected: FAIL — `removeKey is not a function`.

- [ ] **Step 3: Add the implementation** — append to `src/lib/storage.js`:

```js
/**
 * Removes a stored value.
 * @param {string} key
 * @param {(KeyValueStore & { removeItem?: (key: string) => void }) | undefined} [store]
 */
export const removeKey = (key, store = defaultStore) => {
	/** @type {{ removeItem?: (key: string) => void }} */ (store)?.removeItem?.(key);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/storage.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.js src/lib/storage.test.js
git commit -m "feat: add removeKey to storage helpers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: prices.js — source/finish price selection

**Files:**
- Create: `src/lib/prices.js`
- Test: `src/lib/prices.test.js`

**Interfaces:**
- Consumes: `CardPrices` from `types.d.ts`.
- Produces: `PRICE_SOURCES` (record), `priceKey(source, finish) => keyof CardPrices`, `getPrice(prices, source, finish) => string | null`. `PriceSource = 'tcgplayer' | 'cardmarket' | 'cardhoarder'`.

- [ ] **Step 1: Write the failing test** — create `src/lib/prices.test.js`:

```js
import { test, expect } from 'vitest';
import { priceKey, getPrice, PRICE_SOURCES } from './prices.js';

test('priceKey maps source + finish to the Scryfall key', () => {
	expect(priceKey('tcgplayer', '')).toBe('usd');
	expect(priceKey('tcgplayer', 'foil')).toBe('usd_foil');
	expect(priceKey('tcgplayer', 'etched')).toBe('usd_etched');
	expect(priceKey('cardmarket', 'foil')).toBe('eur_foil');
	expect(priceKey('cardmarket', 'etched')).toBe('eur_etched');
	expect(priceKey('cardhoarder', 'foil')).toBe('tix');
});

test('getPrice returns the value or null when missing', () => {
	const prices = { usd: '3.41', usd_foil: null, tix: '0.02' };
	expect(getPrice(prices, 'tcgplayer', '')).toBe('3.41');
	expect(getPrice(prices, 'tcgplayer', 'foil')).toBeNull();
	expect(getPrice(prices, 'cardhoarder', '')).toBe('0.02');
	expect(getPrice(undefined, 'tcgplayer', '')).toBeNull();
});

test('PRICE_SOURCES lists the three affiliates', () => {
	expect(Object.keys(PRICE_SOURCES)).toEqual(['tcgplayer', 'cardmarket', 'cardhoarder']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/prices.test.js`
Expected: FAIL — cannot find module `./prices.js`.

- [ ] **Step 3: Write the implementation** — create `src/lib/prices.js`:

```js
/**
 * Price selection. Maps a price source + finish to the correct Scryfall price
 * key and resolves the value (or null when unavailable).
 *
 * @typedef {import('../types').CardPrices} CardPrices
 * @typedef {'tcgplayer' | 'cardmarket' | 'cardhoarder'} PriceSource
 */

/** Selectable price sources, in display order. */
export const PRICE_SOURCES = {
	tcgplayer: { label: 'TCGplayer', currency: 'USD' },
	cardmarket: { label: 'Cardmarket', currency: 'EUR' },
	cardhoarder: { label: 'Cardhoarder', currency: 'TIX' }
};

/**
 * @param {PriceSource} source
 * @param {string | null} finish '' | 'foil' | 'etched' | null
 * @returns {keyof CardPrices}
 */
export const priceKey = (source, finish) => {
	if (source === 'cardhoarder') return 'tix';
	const base = source === 'cardmarket' ? 'eur' : 'usd';
	if (finish === 'foil') return /** @type {keyof CardPrices} */ (`${base}_foil`);
	if (finish === 'etched') return /** @type {keyof CardPrices} */ (`${base}_etched`);
	return /** @type {keyof CardPrices} */ (base);
};

/**
 * @param {CardPrices | undefined} prices
 * @param {PriceSource} source
 * @param {string | null} finish
 * @returns {string | null}
 */
export const getPrice = (prices, source, finish) => {
	if (!prices) return null;
	return prices[priceKey(source, finish)] ?? null;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/prices.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/prices.js src/lib/prices.test.js
git commit -m "feat: add source/finish price selection

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: finishes.js — `isFinishAllowed`

**Files:**
- Modify: `src/lib/finishes.js`
- Test: `src/lib/finishes.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `isFinishAllowed(finishes: string[], finish: string | null) => boolean`. Existing `getDefaultFinish`, `getDisplayFinish`, `getFinishPrice` are unchanged.

- [ ] **Step 1: Write the failing test** — append to `src/lib/finishes.test.js`:

```js
import { isFinishAllowed } from './finishes.js';

test('isFinishAllowed checks the card finishes array', () => {
	expect(isFinishAllowed(['nonfoil', 'foil'], '')).toBe(true);
	expect(isFinishAllowed(['nonfoil', 'foil'], 'foil')).toBe(true);
	expect(isFinishAllowed(['nonfoil', 'foil'], 'etched')).toBe(false);
	expect(isFinishAllowed(['foil'], '')).toBe(false);
	expect(isFinishAllowed(['etched'], 'etched')).toBe(true);
	expect(isFinishAllowed([], 'foil')).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/finishes.test.js`
Expected: FAIL — `isFinishAllowed is not a function`.

- [ ] **Step 3: Add the implementation** — append to `src/lib/finishes.js`:

```js
/**
 * True when `finish` is offered by the card's `finishes`. '' maps to 'nonfoil'.
 * @param {string[]} finishes
 * @param {string | null} finish
 * @returns {boolean}
 */
export const isFinishAllowed = (finishes, finish) => {
	if (finish === '') return finishes.includes('nonfoil');
	if (finish === 'foil') return finishes.includes('foil');
	if (finish === 'etched') return finishes.includes('etched');
	return false;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/finishes.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/finishes.js src/lib/finishes.test.js
git commit -m "feat: add isFinishAllowed finish constraint guard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: cache.js — 24 h query cache

**Files:**
- Create: `src/lib/cache.js`
- Test: `src/lib/cache.test.js`

**Interfaces:**
- Consumes: `readJSON`, `writeJSON`, `removeKey` from `storage.js`.
- Produces: `CACHE_TTL_MS`, `normalizeQueryKey(query) => string`, `readCache(query, { now?, store? }) => { cards, totalCards } | null`, `writeCache(query, cards, totalCards, { now?, store? }) => void`, `invalidateCache(query, { store? }) => void`.

- [ ] **Step 1: Write the failing test** — create `src/lib/cache.test.js`:

```js
import { test, expect } from 'vitest';
import { readCache, writeCache, invalidateCache, normalizeQueryKey, CACHE_TTL_MS } from './cache.js';

const makeStore = () => {
	const map = new Map();
	return {
		map,
		getItem: (k) => (map.has(k) ? map.get(k) : null),
		setItem: (k, v) => map.set(k, v),
		removeItem: (k) => map.delete(k)
	};
};

test('normalizeQueryKey collapses whitespace and case', () => {
	expect(normalizeQueryKey('  Set:DSK   Type:Legendary ')).toBe('set:dsk type:legendary');
});

test('writeCache then readCache returns the entry within TTL', () => {
	const store = makeStore();
	writeCache('set:dsk', [{ id: 'a' }], 1, { now: () => 1000, store });
	expect(readCache('SET:DSK', { now: () => 1000 + CACHE_TTL_MS - 1, store })).toEqual({
		cards: [{ id: 'a' }],
		totalCards: 1
	});
});

test('readCache returns null once the entry is older than the TTL', () => {
	const store = makeStore();
	writeCache('q', [{ id: 'a' }], 1, { now: () => 0, store });
	expect(readCache('q', { now: () => CACHE_TTL_MS + 1, store })).toBeNull();
});

test('invalidateCache removes the entry', () => {
	const store = makeStore();
	writeCache('q', [{ id: 'a' }], 1, { now: () => 0, store });
	invalidateCache('q', { store });
	expect(readCache('q', { now: () => 0, store })).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/cache.test.js`
Expected: FAIL — cannot find module `./cache.js`.

- [ ] **Step 3: Write the implementation** — create `src/lib/cache.js`:

```js
/**
 * localStorage-backed Scryfall query cache. Entries are keyed by the normalized
 * query string and expire after 24h (Scryfall updates prices at most daily), so
 * repeat searches do not hit the API.
 */
import { readJSON, writeJSON, removeKey } from './storage.js';

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const KEY_PREFIX = 'scrymox:cache:';

/** @param {string} query */
export const normalizeQueryKey = (query) => query.trim().replace(/\s+/g, ' ').toLowerCase();

const keyFor = (/** @type {string} */ query) => KEY_PREFIX + normalizeQueryKey(query);

/**
 * @param {string} query
 * @param {{ now?: () => number, store?: any }} [opts]
 * @returns {{ cards: any[], totalCards: number } | null}
 */
export const readCache = (query, { now = Date.now, store } = {}) => {
	const entry = readJSON(keyFor(query), null, store);
	if (!entry || typeof entry.savedAt !== 'number') return null;
	if (now() - entry.savedAt > CACHE_TTL_MS) return null;
	return { cards: entry.cards, totalCards: entry.totalCards };
};

/**
 * @param {string} query
 * @param {any[]} cards
 * @param {number} totalCards
 * @param {{ now?: () => number, store?: any }} [opts]
 */
export const writeCache = (query, cards, totalCards, { now = Date.now, store } = {}) => {
	writeJSON(keyFor(query), { savedAt: now(), cards, totalCards }, store);
};

/**
 * @param {string} query
 * @param {{ store?: any }} [opts]
 */
export const invalidateCache = (query, { store } = {}) => {
	removeKey(keyFor(query), store);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/cache.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cache.js src/lib/cache.test.js
git commit -m "feat: add 24h localStorage query cache

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: requestQueue.js — shared throttle + 429 backoff

**Files:**
- Create: `src/lib/requestQueue.js`
- Test: `src/lib/requestQueue.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `createRequestQueue({ fetchImpl?, sleep?, now?, minIntervalMs?, backoffMs?, maxRetries? }) => { enqueue(url, init) => Promise<Response> }`; `requestQueue` (singleton); constants `DEFAULT_MIN_INTERVAL_MS = 500`, `DEFAULT_BACKOFF_MS = 30000`, `MAX_RETRIES = 3`.

- [ ] **Step 1: Write the failing test** — create `src/lib/requestQueue.test.js`:

```js
import { test, expect } from 'vitest';
import { createRequestQueue } from './requestQueue.js';

/** Virtual clock: now() reads `clock`; sleep advances it and records the wait. */
const makeClock = () => {
	let clock = 0;
	const sleeps = [];
	return {
		now: () => clock,
		sleep: async (ms) => {
			sleeps.push(ms);
			clock += ms;
		},
		advance: (ms) => {
			clock += ms;
		},
		sleeps
	};
};

const ok = (body = { object: 'list' }) => ({
	status: 200,
	headers: { get: () => null },
	json: async () => body
});

test('spaces successive requests by minIntervalMs', async () => {
	const c = makeClock();
	const calls = [];
	const q = createRequestQueue({
		now: c.now,
		sleep: c.sleep,
		minIntervalMs: 500,
		fetchImpl: async (url) => {
			calls.push({ url, at: c.now() });
			return ok();
		}
	});
	await q.enqueue('a');
	await q.enqueue('b');
	expect(calls[0].at).toBe(0);
	expect(calls[1].at).toBe(500); // waited one interval
});

test('processes requests in FIFO order', async () => {
	const c = makeClock();
	const order = [];
	const q = createRequestQueue({
		now: c.now,
		sleep: c.sleep,
		fetchImpl: async (url) => {
			order.push(url);
			return ok();
		}
	});
	await Promise.all([q.enqueue('1'), q.enqueue('2'), q.enqueue('3')]);
	expect(order).toEqual(['1', '2', '3']);
});

test('retries after 429 honoring Retry-After, then succeeds', async () => {
	const c = makeClock();
	let n = 0;
	const q = createRequestQueue({
		now: c.now,
		sleep: c.sleep,
		minIntervalMs: 0,
		fetchImpl: async () => {
			n += 1;
			if (n === 1) return { status: 429, headers: { get: (h) => (h === 'Retry-After' ? '2' : null) }, json: async () => ({}) };
			return ok();
		}
	});
	const res = await q.enqueue('x');
	expect(res.status).toBe(200);
	expect(c.sleeps).toContain(2000); // 2s from Retry-After
});

test('gives up after maxRetries and returns the 429', async () => {
	const c = makeClock();
	const q = createRequestQueue({
		now: c.now,
		sleep: c.sleep,
		minIntervalMs: 0,
		backoffMs: 1000,
		maxRetries: 2,
		fetchImpl: async () => ({ status: 429, headers: { get: () => null }, json: async () => ({}) })
	});
	const res = await q.enqueue('x');
	expect(res.status).toBe(429);
	// exponential fallback: 1000, 2000
	expect(c.sleeps).toEqual(expect.arrayContaining([1000, 2000]));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/requestQueue.test.js`
Expected: FAIL — cannot find module `./requestQueue.js`.

- [ ] **Step 3: Write the implementation** — create `src/lib/requestQueue.js`:

```js
/**
 * Shared request queue for Scryfall API calls. Serializes every request,
 * enforces a minimum spacing between them, and backs off on HTTP 429 (which
 * limits access for ~30s). `fetch`/`sleep`/`now` are injectable for tests.
 */

export const DEFAULT_MIN_INTERVAL_MS = 500; // /cards/search = 2 req/sec
export const DEFAULT_BACKOFF_MS = 30_000; // documented 429 lockout
export const MAX_RETRIES = 3;

const realSleep = (/** @type {number} */ ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   sleep?: (ms: number) => Promise<void>,
 *   now?: () => number,
 *   minIntervalMs?: number,
 *   backoffMs?: number,
 *   maxRetries?: number
 * }} [options]
 */
export const createRequestQueue = ({
	fetchImpl = fetch,
	sleep = realSleep,
	now = Date.now,
	minIntervalMs = DEFAULT_MIN_INTERVAL_MS,
	backoffMs = DEFAULT_BACKOFF_MS,
	maxRetries = MAX_RETRIES
} = {}) => {
	/** @type {Promise<unknown>} */
	let chain = Promise.resolve();
	let lastStart = -Infinity;

	const runOne = async (/** @type {string} */ url, /** @type {RequestInit=} */ init) => {
		const wait = minIntervalMs - (now() - lastStart);
		if (wait > 0) await sleep(wait);
		lastStart = now();

		for (let attempt = 0; ; attempt += 1) {
			const response = await fetchImpl(url, init);
			if (response.status !== 429) return response;
			if (attempt >= maxRetries) return response; // surface the 429 to the caller

			const retryAfter = Number(response.headers?.get?.('Retry-After'));
			const delay =
				Number.isFinite(retryAfter) && retryAfter > 0
					? retryAfter * 1000
					: backoffMs * 2 ** attempt;
			await sleep(delay);
			lastStart = now();
		}
	};

	/**
	 * @param {string} url
	 * @param {RequestInit} [init]
	 * @returns {Promise<Response>}
	 */
	const enqueue = (url, init) => {
		const result = chain.then(() => runOne(url, init));
		// Keep the chain alive even if a request rejects.
		chain = result.then(
			() => undefined,
			() => undefined
		);
		return /** @type {Promise<Response>} */ (result);
	};

	return { enqueue };
};

/** App-wide singleton used by scryfall.js. */
export const requestQueue = createRequestQueue();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/requestQueue.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/requestQueue.js src/lib/requestQueue.test.js
git commit -m "feat: add shared request queue with 429 backoff

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: scryfall.js — extend normalize + route through the queue

**Files:**
- Modify: `src/lib/scryfall.js`
- Test: `src/lib/scryfall.test.js`

**Interfaces:**
- Consumes: `getDefaultFinish`, `getDisplayFinish`, `getFinishPrice` (finishes.js); `getPrice` (prices.js); `requestQueue` (requestQueue.js).
- Produces: `buildSearchUrl(query, defaultOptions)` (unchanged signature); `normalizeCard(scryfallCard, source = 'tcgplayer') => Card` (now also sets `oracle_id`, `set_name`, `language`, `games`, `layout`); `searchAllPages(url, { onPage, source?, enqueue? }) => Promise<{ error?: string }>`.

- [ ] **Step 1: Write the failing tests** — add to `src/lib/scryfall.test.js`:

```js
import { normalizeCard, searchAllPages } from './scryfall.js';

const rawCard = {
	id: 'abc',
	oracle_id: 'orc',
	name: 'Abrade',
	set: 'soc',
	set_name: 'Spider-Man Commander',
	collector_number: '234',
	lang: 'en',
	layout: 'normal',
	finishes: ['nonfoil', 'foil'],
	image_uris: { border_crop: 'front.jpg', large: 'large.jpg' },
	games: ['paper', 'mtgo'],
	prices: { usd: '0.05', usd_foil: '0.30' }
};

test('normalizeCard carries identity, defaults, and language from lang', () => {
	const card = normalizeCard(rawCard);
	expect(card.id).toBe('abc');
	expect(card.oracle_id).toBe('orc');
	expect(card.set_name).toBe('Spider-Man Commander');
	expect(card.language).toBe('EN');
	expect(card.condition).toBe('NM');
	expect(card.count).toBe(1);
	expect(card.selectedFinish).toBe('');
	expect(card.games).toEqual(['paper', 'mtgo']);
	expect(card.layout).toBe('normal');
});

test('searchAllPages paginates via injected enqueue and normalizes pages', async () => {
	const pages = {
		'url1': { object: 'list', total_cards: 2, has_more: true, next_page: 'url2', data: [rawCard] },
		'url2': { object: 'list', total_cards: 2, has_more: false, data: [rawCard] }
	};
	const enqueue = async (url) => ({ status: 200, json: async () => pages[url] });
	const seen = [];
	const result = await searchAllPages('url1', { onPage: (cards, total) => seen.push([cards.length, total]), enqueue });
	expect(result).toEqual({});
	expect(seen).toEqual([[1, 2], [1, 2]]);
});

test('searchAllPages surfaces Scryfall errors', async () => {
	const enqueue = async () => ({ status: 404, json: async () => ({ object: 'error', details: 'No cards found.' }) });
	const result = await searchAllPages('u', { onPage: () => {}, enqueue });
	expect(result.error).toContain('No cards found.');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/scryfall.test.js`
Expected: FAIL — new assertions fail (e.g. `card.language` undefined; `enqueue` option ignored).

- [ ] **Step 3: Replace the implementation** — overwrite `src/lib/scryfall.js`:

```js
import { getDefaultFinish, getDisplayFinish, getFinishPrice } from './finishes.js';
import { requestQueue } from './requestQueue.js';

const SEARCH_ENDPOINT = 'https://api.scryfall.com/cards/search';
const ACCEPT = 'application/json;q=0.9,*/*;q=0.8';

/**
 * Builds a Scryfall `/cards/search` URL from the user's query plus any saved
 * default options.
 * @param {string} query
 * @param {string} defaultOptions
 * @returns {string}
 */
export const buildSearchUrl = (query, defaultOptions) => {
	const combined = [query, defaultOptions]
		.map((part) => part.trim())
		.filter(Boolean)
		.join(' ');
	return `${SEARCH_ENDPOINT}?q=${encodeURIComponent(combined)}`;
};

/**
 * Converts a raw Scryfall card into ScryMox's editable {@link Card} model.
 * @param {import('../types').ScryfallCard} scryfallCard
 * @param {import('./prices').PriceSource} [source]
 * @returns {import('../types').Card}
 */
export const normalizeCard = (scryfallCard, source = 'tcgplayer') => {
	const selectedFinish = getDefaultFinish(scryfallCard.finishes);
	const faces = scryfallCard.card_faces;

	/** @type {import('../types').Card['image_uris']} */
	let image_uris;
	let name = scryfallCard.name;

	if (!faces) {
		image_uris = scryfallCard.image_uris;
	} else if (scryfallCard.layout !== 'split' && scryfallCard.layout !== 'flip') {
		image_uris = [faces[0]?.image_uris, faces[1]?.image_uris];
		if (scryfallCard.layout === 'reversible_card' && faces.length) {
			name = faces[0].name;
		}
	} else {
		image_uris = scryfallCard.image_uris ?? faces[0]?.image_uris;
	}

	return {
		id: scryfallCard.id,
		oracle_id: scryfallCard.oracle_id,
		collector_number: scryfallCard.collector_number,
		set: scryfallCard.set,
		set_name: scryfallCard.set_name,
		layout: scryfallCard.layout,
		games: scryfallCard.games ?? [],
		image_uris,
		name,
		finishes: scryfallCard.finishes,
		selectedFinish,
		displayFinish: getDisplayFinish(selectedFinish),
		count: 1,
		condition: 'NM',
		language: (scryfallCard.lang ?? 'en').toUpperCase(),
		alter: false,
		proxy: false,
		prices: scryfallCard.prices,
		// Transitional: kept so existing components keep rendering until Plan 02
		// switches them to live getPrice(prices, source, finish).
		displayedPrice: getFinishPrice(scryfallCard.prices, selectedFinish),
		priceManuallySet: false
	};
};

/**
 * Fetches every page of a Scryfall search, normalizing and reporting each page
 * as it arrives. All requests go through the shared queue (throttle + 429
 * backoff).
 *
 * @param {string} url
 * @param {{
 *   onPage: (cards: import('../types').Card[], totalCards: number) => void;
 *   source?: import('./prices').PriceSource;
 *   enqueue?: (url: string, init?: RequestInit) => Promise<{ json: () => Promise<any> }>;
 * }} options
 * @returns {Promise<{ error?: string }>}
 */
export const searchAllPages = async (
	url,
	{ onPage, source = 'tcgplayer', enqueue = requestQueue.enqueue }
) => {
	/** @type {string | null} */
	let next = url;

	while (next) {
		const response = await enqueue(next, { headers: { Accept: ACCEPT } });
		const data = /** @type {import('../types').ScryfallSearchResponse} */ (await response.json());

		if (data.object === 'error' || data.warnings) {
			let error = data.details ?? '';
			if (data.warnings) error += (error ? ' ' : '') + data.warnings.join(' ');
			return { error };
		}

		onPage(
			data.data.map((card) => normalizeCard(card, source)),
			data.total_cards
		);
		next = data.has_more ? data.next_page : null;
	}

	return {};
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/scryfall.test.js`
Expected: PASS (existing + new tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/scryfall.js src/lib/scryfall.test.js
git commit -m "feat: extend card normalization and route search through the queue

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: export.js — Scryfall ID column + source-aware price

**Files:**
- Modify: `src/lib/export.js`
- Test: `src/lib/export.test.js`

**Interfaces:**
- Consumes: `getPrice` from `prices.js`.
- Produces: `buildBulkText(cards) => string` (unchanged); `buildCsv(cards, source = 'tcgplayer') => string` (adds `Scryfall ID` column; price resolved from override or source/finish).

- [ ] **Step 1: Write/Update the failing test** — add to `src/lib/export.test.js`:

```js
import { buildCsv } from './export.js';

const card = (over = {}) => ({
	id: 'sid-1',
	name: 'Abrade',
	set: 'soc',
	collector_number: '234',
	condition: 'NM',
	language: 'EN',
	selectedFinish: '',
	alter: false,
	proxy: false,
	count: 1,
	prices: { usd: '0.05', usd_foil: '0.30', eur: '0.04' },
	priceManuallySet: false,
	...over
});

test('buildCsv header ends with Scryfall ID', () => {
	const header = buildCsv([card()]).split('\n')[0];
	expect(header).toBe('Count,Name,Edition,Collector Number,Condition,Language,Foil,Alter,Proxy,Price,Scryfall ID');
});

test('buildCsv uses the selected source + finish for price and appends the id', () => {
	const row = buildCsv([card({ selectedFinish: 'foil' })], 'tcgplayer').split('\n')[1];
	expect(row).toBe('1,"Abrade",SOC,234,NM,EN,foil,,,0.30,sid-1');
});

test('buildCsv honors a manual price override and blanks missing prices', () => {
	expect(buildCsv([card({ priceManuallySet: true, price: 9.99 })]).split('\n')[1]).toContain(',9.99,sid-1');
	expect(buildCsv([card({ selectedFinish: 'etched' })]).split('\n')[1]).toContain(',,sid-1'); // no usd_etched -> blank
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export.test.js`
Expected: FAIL — header lacks `Scryfall ID`; rows lack id.

- [ ] **Step 3: Update the implementation** — overwrite `src/lib/export.js`:

```js
/**
 * Builders that turn the card list into the text/CSV payloads ScryMox exports.
 * Pure string functions — the download/clipboard side effects live in the
 * components.
 */
import { getPrice } from './prices.js';

/** @typedef {import('../types').Card} Card */

/**
 * Builds the Moxfield bulk-edit text: one `count name (set) number marker` line
 * per card.
 * @param {Card[]} cards
 * @returns {string}
 */
export const buildBulkText = (cards) =>
	cards
		.map((card) =>
			`${card.count} ${card.name} (${card.set}) ${card.collector_number} ${card.displayFinish}`.trimEnd()
		)
		.join('\n');

const CSV_HEADER = [
	'Count',
	'Name',
	'Edition',
	'Collector Number',
	'Condition',
	'Language',
	'Foil',
	'Alter',
	'Proxy',
	'Price',
	'Scryfall ID'
];

/** Wraps a value in quotes and escapes embedded quotes per RFC 4180. */
const csvQuote = (/** @type {string} */ value) => `"${value.replace(/"/g, '""')}"`;

/**
 * Price to export: the manual override when set, otherwise the value for the
 * chosen source + finish; blank when unavailable.
 * @param {Card} card
 * @param {import('./prices').PriceSource} source
 * @returns {string}
 */
const exportPrice = (card, source) => {
	const value = card.priceManuallySet ? card.price : getPrice(card.prices, source, card.selectedFinish);
	return value == null ? '' : String(value);
};

/**
 * Builds a Moxfield-compatible CSV string for the card list.
 * @param {Card[]} cards
 * @param {import('./prices').PriceSource} [source]
 * @returns {string}
 */
export const buildCsv = (cards, source = 'tcgplayer') => {
	const rows = cards.map((card) =>
		[
			card.count,
			csvQuote(card.name),
			card.set.toUpperCase(),
			card.collector_number,
			card.condition,
			card.language,
			card.selectedFinish === 'foil' || card.selectedFinish === 'etched' ? card.selectedFinish : '',
			card.alter ? 'Yes' : '',
			card.proxy ? 'Yes' : '',
			exportPrice(card, source),
			card.id
		].join(',')
	);
	return [CSV_HEADER.join(','), ...rows].join('\n');
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/export.test.js`
Expected: PASS (existing bulk-text tests + new CSV tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/export.js src/lib/export.test.js
git commit -m "feat: add Scryfall ID column and source-aware CSV price

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: selection.js — pure selection-set ops

**Files:**
- Create: `src/lib/selection.js`
- Test: `src/lib/selection.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `toggle(selected: Set<string>, id) => Set<string>`; `selectRange(selected, ids: string[], anchorId, targetId) => Set<string>`; `selectAll(ids) => Set<string>`; `clear() => Set<string>`.

- [ ] **Step 1: Write the failing test** — create `src/lib/selection.test.js`:

```js
import { test, expect } from 'vitest';
import { toggle, selectRange, selectAll, clear } from './selection.js';

test('toggle adds then removes an id', () => {
	expect([...toggle(new Set(), 'a')]).toEqual(['a']);
	expect([...toggle(new Set(['a']), 'a')]).toEqual([]);
});

test('selectRange selects the inclusive range regardless of direction', () => {
	const ids = ['a', 'b', 'c', 'd'];
	expect(new Set(selectRange(new Set(), ids, 'b', 'd'))).toEqual(new Set(['b', 'c', 'd']));
	expect(new Set(selectRange(new Set(), ids, 'd', 'b'))).toEqual(new Set(['b', 'c', 'd']));
});

test('selectAll and clear', () => {
	expect(new Set(selectAll(['a', 'b']))).toEqual(new Set(['a', 'b']));
	expect([...clear()]).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/selection.test.js`
Expected: FAIL — cannot find module `./selection.js`.

- [ ] **Step 3: Write the implementation** — create `src/lib/selection.js`:

```js
/**
 * Selection helpers over an ordered list of card ids and a Set of selected ids.
 * Pure — the component owns the actual reactive state.
 */

/** @param {Set<string>} selected @param {string} id */
export const toggle = (selected, id) => {
	const next = new Set(selected);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	return next;
};

/** @param {Set<string>} selected @param {string[]} ids @param {string} anchorId @param {string} targetId */
export const selectRange = (selected, ids, anchorId, targetId) => {
	const a = ids.indexOf(anchorId);
	const b = ids.indexOf(targetId);
	if (a === -1 || b === -1) return new Set(selected);
	const [lo, hi] = a < b ? [a, b] : [b, a];
	const next = new Set(selected);
	for (let i = lo; i <= hi; i += 1) next.add(ids[i]);
	return next;
};

/** @param {string[]} ids */
export const selectAll = (ids) => new Set(ids);

export const clear = () => new Set();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/selection.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/selection.js src/lib/selection.test.js
git commit -m "feat: add pure selection-set helpers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: bulk.js — constraint-aware bulk apply

**Files:**
- Create: `src/lib/bulk.js`
- Test: `src/lib/bulk.test.js`

**Interfaces:**
- Consumes: `getDisplayFinish`, `isFinishAllowed` (finishes.js).
- Produces: `applyBulk(cards: Card[], selectedIds: Set<string>, patch: Partial<Card>) => { cards: Card[], skipped: number }`. A `patch` containing `selectedFinish` is applied only to cards that support it (others counted in `skipped`) and refreshes `displayFinish`.

- [ ] **Step 1: Write the failing test** — create `src/lib/bulk.test.js`:

```js
import { test, expect } from 'vitest';
import { applyBulk } from './bulk.js';

const cards = [
	{ id: 'a', finishes: ['nonfoil', 'foil'], selectedFinish: '', displayFinish: '', count: 1, condition: 'NM' },
	{ id: 'b', finishes: ['nonfoil'], selectedFinish: '', displayFinish: '', count: 1, condition: 'NM' }
];

test('applyBulk only touches selected cards', () => {
	const { cards: next } = applyBulk(cards, new Set(['a']), { count: 4 });
	expect(next[0].count).toBe(4);
	expect(next[1].count).toBe(1);
});

test('applyBulk skips cards that do not support the requested finish', () => {
	const { cards: next, skipped } = applyBulk(cards, new Set(['a', 'b']), { selectedFinish: 'foil' });
	expect(next[0].selectedFinish).toBe('foil');
	expect(next[0].displayFinish).toBe('*F*');
	expect(next[1].selectedFinish).toBe(''); // unchanged: no foil printing
	expect(skipped).toBe(1);
});

test('applyBulk sets non-finish fields without constraint', () => {
	const { cards: next, skipped } = applyBulk(cards, new Set(['a', 'b']), { condition: 'LP' });
	expect(next.every((c) => c.condition === 'LP')).toBe(true);
	expect(skipped).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/bulk.test.js`
Expected: FAIL — cannot find module `./bulk.js`.

- [ ] **Step 3: Write the implementation** — create `src/lib/bulk.js`:

```js
/**
 * Applies a bulk attribute change to the selected cards, honoring card-data
 * constraints. Returns the new card list plus a count of cards skipped because
 * they could not accept the change (e.g. a finish the card does not offer).
 */
import { getDisplayFinish, isFinishAllowed } from './finishes.js';

/**
 * @param {import('../types').Card[]} cards
 * @param {Set<string>} selectedIds
 * @param {Partial<import('../types').Card>} patch
 * @returns {{ cards: import('../types').Card[], skipped: number }}
 */
export const applyBulk = (cards, selectedIds, patch) => {
	let skipped = 0;
	const next = cards.map((card) => {
		if (!selectedIds.has(card.id)) return card;

		if ('selectedFinish' in patch) {
			const finish = /** @type {string} */ (patch.selectedFinish);
			if (!isFinishAllowed(card.finishes, finish)) {
				skipped += 1;
				return card;
			}
			return { ...card, selectedFinish: finish, displayFinish: getDisplayFinish(finish) };
		}

		return { ...card, ...patch };
	});
	return { cards: next, skipped };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/bulk.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bulk.js src/lib/bulk.test.js
git commit -m "feat: add constraint-aware bulk apply

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: theme.js — theme resolution + persistence

**Files:**
- Create: `src/lib/theme.js`
- Test: `src/lib/theme.test.js`

**Interfaces:**
- Consumes: `readString`, `writeString` (storage.js).
- Produces: `THEME_KEY`; `getStoredTheme(store?) => Theme`; `setStoredTheme(theme, store?) => void`; `resolveTheme(theme, prefersDark) => 'light' | 'dark'`; `applyTheme(resolved, doc?) => void`. `Theme = 'light' | 'dark' | 'system'`.

- [ ] **Step 1: Write the failing test** — create `src/lib/theme.test.js`:

```js
import { test, expect } from 'vitest';
import { getStoredTheme, setStoredTheme, resolveTheme, applyTheme } from './theme.js';

const makeStore = () => {
	const map = new Map();
	return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, v) };
};

test('defaults to system and round-trips a stored choice', () => {
	const store = makeStore();
	expect(getStoredTheme(store)).toBe('system');
	setStoredTheme('dark', store);
	expect(getStoredTheme(store)).toBe('dark');
});

test('resolveTheme follows OS only when system', () => {
	expect(resolveTheme('system', true)).toBe('dark');
	expect(resolveTheme('system', false)).toBe('light');
	expect(resolveTheme('light', true)).toBe('light');
	expect(resolveTheme('dark', false)).toBe('dark');
});

test('applyTheme toggles the .dark class on the root element', () => {
	const root = { classList: { _set: new Set(), toggle(c, on) { on ? this._set.add(c) : this._set.delete(c); } } };
	applyTheme('dark', { documentElement: root });
	expect(root.classList._set.has('dark')).toBe(true);
	applyTheme('light', { documentElement: root });
	expect(root.classList._set.has('dark')).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/theme.test.js`
Expected: FAIL — cannot find module `./theme.js`.

- [ ] **Step 3: Write the implementation** — create `src/lib/theme.js`:

```js
/**
 * Theme resolution and persistence. Theme is 'light' | 'dark' | 'system'; the
 * resolved theme follows the OS only when 'system'. Dark mode is class-based
 * (a `.dark` class on <html>).
 *
 * @typedef {'light' | 'dark' | 'system'} Theme
 */
import { readString, writeString } from './storage.js';

export const THEME_KEY = 'scrymox:theme';

/** @param {any} [store] @returns {Theme} */
export const getStoredTheme = (store) =>
	/** @type {Theme} */ (readString(THEME_KEY, 'system', store));

/** @param {Theme} theme @param {any} [store] */
export const setStoredTheme = (theme, store) => writeString(THEME_KEY, theme, store);

/** @param {Theme} theme @param {boolean} prefersDark @returns {'light' | 'dark'} */
export const resolveTheme = (theme, prefersDark) =>
	theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;

/** @param {'light' | 'dark'} resolved @param {{ documentElement: { classList: { toggle: (c: string, on: boolean) => void } } }} [doc] */
export const applyTheme = (resolved, doc = document) => {
	doc.documentElement.classList.toggle('dark', resolved === 'dark');
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/theme.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.js src/lib/theme.test.js
git commit -m "feat: add theme resolution and persistence

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: types.d.ts — extend the Card model

**Files:**
- Modify: `src/types.d.ts`

**Interfaces:**
- Produces: extended `Card` (`oracle_id`, `set_name`, `language`, `games`, `layout`); `ScryfallCard` gains `oracle_id`, `set_name`, `lang`, `games`; re-export `PriceSource`/`Theme` references. `displayedPrice` retained (transitional).

- [ ] **Step 1: Update `ScryfallCard`** — in `src/types.d.ts`, replace the `ScryfallCard` interface body to add the new fields:

```ts
/** The subset of the Scryfall card object that ScryMox consumes. */
export interface ScryfallCard {
	id: string;
	oracle_id?: string;
	name: string;
	set: string;
	set_name?: string;
	collector_number: string;
	lang?: string;
	layout: string;
	finishes: string[];
	games?: string[];
	image_uris?: CardImageUris;
	card_faces?: ScryfallCardFace[];
	prices: CardPrices;
}
```

- [ ] **Step 2: Update `Card`** — replace the `Card` interface body:

```ts
/** ScryMox's internal, user-editable representation of a card. */
export interface Card {
	id: string;
	oracle_id?: string;
	name: string;
	set: string;
	set_name?: string;
	collector_number: string;
	layout: string;
	games: string[];
	finishes: string[];
	/** Single image URIs, or `[front, back]` for multi-faced cards. */
	image_uris?: CardImageUris | (CardImageUris | undefined)[];
	/** '' (nonfoil), 'foil', 'etched', or null when no finish applies. */
	selectedFinish: string | null;
	/** Moxfield finish marker shown in exports: '', '*F*', or '*E*'. */
	displayFinish: string;
	count: number;
	condition: string;
	language: string;
	alter: boolean;
	proxy: boolean;
	prices: CardPrices;
	/** User-entered price override. */
	price?: number;
	/** Transitional auto price (removed in Plan 02 once UI computes it live). */
	displayedPrice?: string | null;
	/** True once the user has typed a price manually. */
	priceManuallySet?: boolean;
}
```

- [ ] **Step 3: Verify types and tests still pass**

Run: `npm run check:types && npx vitest run`
Expected: PASS — no type errors; all lib tests green.

- [ ] **Step 4: Commit**

```bash
git add src/types.d.ts
git commit -m "feat: extend Card and ScryfallCard types

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: app.css — Twilight Purple tokens + dark variant

**Files:**
- Modify: `src/app.css`

**Interfaces:**
- Produces: CSS custom properties for the Twilight Purple palette (light defaults + `.dark` overrides) and a class-based Tailwind `dark` variant, consumed by Plan 02 components via `var(--...)` / `dark:` utilities.

- [ ] **Step 1: Replace `src/app.css`** with the theme tokens:

```css
@import 'tailwindcss';

/* Class-based dark mode: components use `dark:` utilities; .dark on <html>. */
@custom-variant dark (&:where(.dark, .dark *));

/* Twilight Purple palette — light defaults, overridden under .dark. */
:root {
	--bg: #f5f1fc;
	--surface: #ffffff;
	--surface-2: #faf7ff;
	--border: #e7def5;
	--text: #1d1730;
	--muted: #6f6488;
	--accent: #7e22ce;
	--accent-strong: #6b21a8;
	--accent-contrast: #ffffff;
	--bar-from: #7e22ce;
	--bar-to: #a855f7;
}

.dark {
	--bg: #120f1c;
	--surface: #1d1730;
	--surface-2: #171127;
	--border: #352b50;
	--text: #ece8f7;
	--muted: #a99ccb;
	--accent: #a855f7;
	--accent-strong: #9333ea;
	--accent-contrast: #ffffff;
	--bar-from: #6d28d9;
	--bar-to: #a855f7;
}

@theme {
	--color-bg: var(--bg);
	--color-surface: var(--surface);
	--color-surface-2: var(--surface-2);
	--color-border: var(--border);
	--color-text: var(--text);
	--color-muted: var(--muted);
	--color-accent: var(--accent);
	--color-accent-strong: var(--accent-strong);
	--color-accent-contrast: var(--accent-contrast);
}

@layer base {
	html {
		background-color: var(--bg);
		color: var(--text);
		color-scheme: light;
	}
	html.dark {
		color-scheme: dark;
	}
	/* Strip number-input spinners (kept from the original app). */
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button,
	input[type='number'] {
		-webkit-appearance: none;
		margin: 0;
		-moz-appearance: textfield !important;
		appearance: textfield !important;
	}
}
```

- [ ] **Step 2: Verify the build compiles the CSS**

Run: `npm run build`
Expected: PASS — Vite builds with no Tailwind/PostCSS errors.

- [ ] **Step 3: Commit**

```bash
git add src/app.css
git commit -m "feat: add Twilight Purple theme tokens and dark variant

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 13: favicon + index.html metadata

**Files:**
- Create: `public/favicon.svg`
- Modify: `index.html`

**Interfaces:**
- Produces: a purple card-stack SVG favicon and updated document metadata (title, description, theme-color). No JS interface.

- [ ] **Step 1: Create `public/favicon.svg`**:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="ScryMox">
	<rect width="64" height="64" rx="14" fill="#1d1730"/>
	<rect x="16" y="14" width="26" height="36" rx="4" fill="#6d28d9" transform="rotate(-12 29 32)"/>
	<rect x="22" y="14" width="26" height="36" rx="4" fill="#a855f7" transform="rotate(6 35 32)"/>
	<rect x="20" y="16" width="24" height="34" rx="4" fill="#ede9fe"/>
	<circle cx="32" cy="33" r="7" fill="#7e22ce"/>
</svg>
```

- [ ] **Step 2: Update `index.html`** — replace the file contents:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta name="color-scheme" content="light dark" />
		<meta name="theme-color" content="#7e22ce" media="(prefers-color-scheme: light)" />
		<meta name="theme-color" content="#120f1c" media="(prefers-color-scheme: dark)" />
		<meta
			name="description"
			content="Turn a Scryfall search into an importable Moxfield card list — edit in bulk and export CSV or bulk text."
		/>
		<title>ScryMox</title>
	</head>
	<body>
		<div id="app"></div>
		<script type="module" src="/src/main.js"></script>
	</body>
</html>
```

- [ ] **Step 3: Verify the build includes the favicon**

Run: `npm run build`
Expected: PASS — `dist/favicon.svg` is emitted and `index.html` references it.

- [ ] **Step 4: Commit**

```bash
git add public/favicon.svg index.html
git commit -m "feat: replace favicon with purple card-stack icon and add metadata

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 14: Engine gate — full check green

**Files:** none (verification only).

- [ ] **Step 1: Run the full project check**

Run: `npm run check`
Expected: PASS — `prettier --check`, `eslint`, `svelte-check`, `vitest run`, and `vite build` all succeed. (The original app still renders using the transitional `displayedPrice`.)

- [ ] **Step 2: If prettier flags formatting, fix and re-run**

Run: `npm run format && npm run check`
Expected: PASS.

- [ ] **Step 3: Commit any formatting fixes**

```bash
git add -A
git commit -m "chore: formatting after engine modules

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (engine portion):**
- Rate-limit spacing + 429 backoff → Task 5. ✓
- No `User-Agent`, correct `Accept` → Task 6. ✓
- 24 h cache → Task 4. ✓
- Source/finish pricing, blank when missing → Tasks 2, 7. ✓
- Finish constraints → Tasks 3, 9. ✓
- Card normalization (oracle_id, set_name, lang, games, faces) → Task 6. ✓
- CSV + Scryfall ID, bulk text → Task 7. ✓
- Selection model logic → Task 8. ✓
- Bulk apply with constraints → Task 9. ✓
- Theme resolution/persistence + tokens → Tasks 10, 12. ✓
- Types → Task 11. ✓
- Favicon → Task 13. ✓
- UI/layout/components/persistence-of-working-set/keyboard-shortcuts/tooltips/image-zoom → **deferred to Plan 02** (consume these modules).

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** `PriceSource` defined in `prices.js` and referenced by `scryfall.js`/`export.js`; `getPrice(prices, source, finish)` signature consistent across Tasks 2/6/7; `applyBulk` returns `{ cards, skipped }` matching its test; `Card` fields used in export/bulk exist in the Task 11 type.

**Note on greenness:** `displayedPrice` is intentionally retained through Plan 01 so the existing components keep compiling/rendering; Plan 02 removes it once the UI computes prices live from `getPrice`.
