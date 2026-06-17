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
