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
