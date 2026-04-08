import { describe, expect, it } from 'vitest';
import type { Team } from '$lib/types';
import { diceData, teamsData } from './data.json';

// The 21 legal dice id values: every ordered pair of dice where upper <= lower
// (see rollDice in instantGame.ts which normalizes to the smaller of d1d2/d2d1).
const LEGAL_DICE_IDS = new Set([
	11, 12, 13, 14, 15, 16, 22, 23, 24, 25, 26, 33, 34, 35, 36, 44, 45, 46, 55, 56, 66
]);

// ─── diceData integrity ───────────────────────────────────
describe('diceData integrity', () => {
	it('contains exactly 21 entries (one per unique two-dice combination)', () => {
		expect(diceData).toHaveLength(21);
	});

	it('every id is in the legal set and unique', () => {
		const seen = new Set<number>();
		for (const d of diceData) {
			expect(LEGAL_DICE_IDS.has(d.id)).toBe(true);
			expect(seen.has(d.id)).toBe(false);
			seen.add(d.id);
		}
		expect(seen.size).toBe(LEGAL_DICE_IDS.size);
	});

	it('every legal dice id has a matching entry', () => {
		const present = new Set(diceData.map((d) => d.id));
		for (const id of LEGAL_DICE_IDS) {
			expect(present.has(id)).toBe(true);
		}
	});

	it('every entry has a non-empty description array of strings', () => {
		for (const d of diceData) {
			expect(Array.isArray(d.description)).toBe(true);
			expect(d.description.length).toBeGreaterThan(0);
			for (const s of d.description) {
				expect(typeof s).toBe('string');
				expect(s.length).toBeGreaterThan(0);
			}
		}
	});

	it('yards is either a finite number or a non-empty array of finite numbers', () => {
		for (const d of diceData) {
			const y = (d as { yards: number | number[] }).yards;
			if (Array.isArray(y)) {
				expect(y.length).toBeGreaterThan(0);
				for (const n of y) {
					expect(typeof n).toBe('number');
					expect(Number.isFinite(n)).toBe(true);
				}
			} else {
				expect(typeof y).toBe('number');
				expect(Number.isFinite(y)).toBe(true);
			}
		}
	});

	it('optional flags (isPenalty, isTurnover, autoFirstDown) are booleans when present', () => {
		for (const d of diceData) {
			const entry = d as {
				isPenalty?: unknown;
				isTurnover?: unknown;
				autoFirstDown?: unknown;
			};
			if (entry.isPenalty !== undefined) expect(typeof entry.isPenalty).toBe('boolean');
			if (entry.isTurnover !== undefined) expect(typeof entry.isTurnover).toBe('boolean');
			if (entry.autoFirstDown !== undefined) expect(typeof entry.autoFirstDown).toBe('boolean');
		}
	});

	it('a play cannot be both a penalty and a turnover', () => {
		for (const d of diceData) {
			const entry = d as { isPenalty?: boolean; isTurnover?: boolean };
			expect(entry.isPenalty && entry.isTurnover).toBeFalsy();
		}
	});

	it('includes the known touchdown outcomes (11 and 66) with yards === 100', () => {
		const td11 = diceData.find((d) => d.id === 11);
		const td66 = diceData.find((d) => d.id === 66);
		expect(td11).toBeDefined();
		expect(td66).toBeDefined();
		expect((td11 as { yards: number }).yards).toBe(100);
		expect((td66 as { yards: number }).yards).toBe(100);
	});
});

// ─── teamsData integrity ──────────────────────────────────
describe('teamsData integrity', () => {
	const teams = teamsData as Team[];

	it('contains at least 32 teams', () => {
		expect(teams.length).toBeGreaterThanOrEqual(32);
	});

	it('every team has a unique id', () => {
		const seen = new Set<string>();
		for (const t of teams) {
			expect(typeof t.id).toBe('string');
			expect(t.id.length).toBeGreaterThan(0);
			expect(seen.has(t.id)).toBe(false);
			seen.add(t.id);
		}
	});

	it('every team has a unique cityKey', () => {
		const seen = new Set<string>();
		for (const t of teams) {
			expect(typeof t.cityKey).toBe('string');
			expect(t.cityKey.length).toBeGreaterThan(0);
			expect(seen.has(t.cityKey)).toBe(false);
			seen.add(t.cityKey);
		}
	});

	it('every team has non-empty city, name, logo, and fieldLogo', () => {
		for (const t of teams) {
			expect(t.city).toBeTruthy();
			expect(t.name).toBeTruthy();
			expect(t.logo).toBeTruthy();
			expect(t.fieldLogo).toBeTruthy();
		}
	});

	it('every team has primary and secondary colors (oklch strings)', () => {
		for (const t of teams) {
			expect(t.colors).toBeDefined();
			expect(typeof t.colors.primary).toBe('string');
			expect(typeof t.colors.secondary).toBe('string');
			expect(t.colors.primary.length).toBeGreaterThan(0);
			// Built-in teams use oklch(...) color strings.
			expect(t.colors.primary.startsWith('oklch(')).toBe(true);
		}
	});

	it('logo position overrides, when present, are finite numbers', () => {
		for (const t of teams) {
			for (const key of ['logoX', 'logoY', 'logoWidth', 'logoHeight', 'logoRotation'] as const) {
				const v = t[key];
				if (v !== undefined) {
					expect(typeof v).toBe('number');
					expect(Number.isFinite(v)).toBe(true);
				}
			}
		}
	});
});
