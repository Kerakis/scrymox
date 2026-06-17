import { test, expect } from 'vitest';
import { createRequestQueue } from './requestQueue.js';

/** Virtual clock: now() reads `clock`; sleep advances it and records the wait. */
const makeClock = () => {
	let clock = 0;
	/** @type {number[]} */
	const sleeps = [];
	return {
		now: () => clock,
		sleep: async (/** @type {number} */ ms) => {
			sleeps.push(ms);
			clock += ms;
		},
		advance: (/** @type {number} */ ms) => {
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
	/** @type {{ url: string, at: number }[]} */
	const calls = [];
	const q = createRequestQueue({
		now: c.now,
		sleep: c.sleep,
		minIntervalMs: 500,
		fetchImpl: async (/** @type {string} */ url) => {
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
	/** @type {string[]} */
	const order = [];
	const q = createRequestQueue({
		now: c.now,
		sleep: c.sleep,
		fetchImpl: async (/** @type {string} */ url) => {
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
			if (n === 1)
				return {
					status: 429,
					headers: { get: (/** @type {string} */ h) => (h === 'Retry-After' ? '2' : null) },
					json: async () => ({})
				};
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
