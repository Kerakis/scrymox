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
 * The slice of `fetch` this queue needs — loose enough that a test stub can be
 * injected, while the real `fetch` still satisfies it.
 * @typedef {(
 *   url: string,
 *   init?: any
 * ) => Promise<{
 *   status: number;
 *   headers?: { get?: (name: string) => string | null };
 *   json: () => Promise<any>;
 * }>} FetchLike
 */

/**
 * @param {{
 *   fetchImpl?: FetchLike,
 *   sleep?: (ms: number) => Promise<void>,
 *   now?: () => number,
 *   minIntervalMs?: number,
 *   backoffMs?: number,
 *   maxRetries?: number
 * }} [options]
 */
export const createRequestQueue = ({
	fetchImpl = /** @type {FetchLike} */ (fetch),
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
	 * @param {any} [init]
	 * @returns {ReturnType<FetchLike>}
	 */
	const enqueue = (url, init) => {
		const result = chain.then(() => runOne(url, init));
		// Keep the chain alive even if a request rejects.
		chain = result.then(
			() => undefined,
			() => undefined
		);
		return result;
	};

	return { enqueue };
};

/** App-wide singleton used by scryfall.js. */
export const requestQueue = createRequestQueue();
