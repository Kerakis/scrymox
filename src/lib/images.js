/**
 * Helpers for reading a normalized card's face image URIs. A card's
 * `image_uris` is either a single object (one-image layouts) or a
 * `[front, back]` array (true double-faced layouts — see scryfall.js).
 *
 * @typedef {{ border_crop?: string; normal?: string; large?: string; png?: string }} FaceUris
 */

/**
 * @param {import('../types').Card} card
 * @returns {(FaceUris | undefined)[]}
 */
export const getFaces = (card) =>
	Array.isArray(card.image_uris) ? card.image_uris : [card.image_uris];

/**
 * True when the card has a distinct second face image (flippable).
 * @param {import('../types').Card} card
 */
export const isDoubleFaced = (card) => {
	const faces = getFaces(card);
	return faces.length > 1 && !!faces[1];
};

/** Small inline image (tiles/preview). @param {FaceUris | undefined} face */
export const inlineImage = (face) => face?.border_crop ?? face?.normal ?? '';

/**
 * Large image for zoom/preview. Prefer `png`: it has transparent, consistently
 * rounded corners across all cards (the `large` JPEG's corner treatment varies).
 * @param {FaceUris | undefined} face
 */
export const zoomImage = (face) => face?.png ?? face?.large ?? face?.normal ?? inlineImage(face);
