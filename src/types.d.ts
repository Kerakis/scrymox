/**
 * Shared type definitions for ScryMox.
 *
 * Two distinct shapes are modelled here:
 *  - `Scryfall*` types describe the (subset of the) raw JSON returned by the
 *    Scryfall `/cards/search` API.
 *  - `Card` is ScryMox's own editable representation, derived from a
 *    `ScryfallCard` in `App.svelte`'s `fetchCards`.
 */

/** Image URIs for a single card or card face. */
interface CardImageUris {
	small?: string;
	normal?: string;
	large?: string;
	png?: string;
	art_crop?: string;
	border_crop?: string;
}

/** Market prices for a card, as strings (or null when unavailable). */
export interface CardPrices {
	usd?: string | null;
	usd_foil?: string | null;
	usd_etched?: string | null;
	eur?: string | null;
	eur_foil?: string | null;
	eur_etched?: string | null;
	tix?: string | null;
}

/** A single face of a multi-faced Scryfall card. */
interface ScryfallCardFace {
	name: string;
	image_uris?: CardImageUris;
}

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

/** A single page of a successful Scryfall `/cards/search` response. */
export interface ScryfallSearchResponse {
	object: string;
	total_cards: number;
	has_more: boolean;
	next_page: string;
	data: ScryfallCard[];
	/** Present on error responses. */
	details?: string;
	/** Present when the query partially matched. */
	warnings?: string[];
}

/** ScryMox's internal, user-editable representation of a card. */
export interface Card {
	id: string;
	oracle_id?: string;
	name: string;
	set: string;
	set_name?: string;
	collector_number: string;
	/** Scryfall card layout (e.g. 'normal', 'transform', 'split'). */
	layout?: string;
	/** Game availability, e.g. ['paper', 'mtgo', 'arena']. */
	games?: string[];
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
	/** True once the user has typed a price manually. */
	priceManuallySet?: boolean;
}
