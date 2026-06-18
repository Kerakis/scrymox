import { test, expect } from 'vitest';
import { CONDITIONS, LANGUAGES, FINISH_LABELS } from './constants.js';

test('constants expose expected keys', () => {
	expect(CONDITIONS.NM).toBe('Near Mint');
	expect(LANGUAGES.EN).toBe('English');
	expect(FINISH_LABELS.foil).toBe('Foil');
	expect(FINISH_LABELS['']).toBe('Nonfoil');
});
