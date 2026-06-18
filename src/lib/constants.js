/** Shared option maps for the editable card attributes. */

/** @type {Record<string, string>} */
export const CONDITIONS = {
	M: 'Mint',
	NM: 'Near Mint',
	LP: 'Lightly Played',
	MP: 'Played',
	HP: 'Heavily Played',
	DM: 'Damaged'
};

/** @type {Record<string, string>} */
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

/** @type {Record<string, string>} */
export const FINISH_LABELS = { '': 'Nonfoil', foil: 'Foil', etched: 'Etched' };
