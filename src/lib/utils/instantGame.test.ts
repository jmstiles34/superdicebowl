import { afterEach, describe, expect, it, vi } from 'vitest';
import { simulateInstantGame } from './instantGame';

/**
 * Mulberry32 — tiny deterministic PRNG. Given the same seed it produces the
 * same sequence of floats in [0, 1). We swap Math.random with it so every
 * simulation is reproducible.
 */
function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function seedRandom(seed: number): void {
	vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed));
}

afterEach(() => {
	vi.restoreAllMocks();
});

// ─── Termination & winner ──────────────────────────────────
describe('simulateInstantGame — termination', () => {
	it.each([
		1, 2, 7, 42, 123, 999, 31337, 8675309
	])('terminates with a valid winner for seed %i (winScore=30)', (seed) => {
		seedRandom(seed);
		const { homeScore, awayScore } = simulateInstantGame(30);

		// A finished game always has at least one team reaching winScore.
		// If MAX_ITERATIONS were hit, both scores would usually be below threshold.
		expect(homeScore >= 30 || awayScore >= 30).toBe(true);
	});

	it('produces non-negative integer scores for many seeds', () => {
		for (let seed = 1; seed <= 50; seed++) {
			seedRandom(seed);
			const { homeScore, awayScore } = simulateInstantGame(30);
			expect(homeScore).toBeGreaterThanOrEqual(0);
			expect(awayScore).toBeGreaterThanOrEqual(0);
			expect(Number.isInteger(homeScore)).toBe(true);
			expect(Number.isInteger(awayScore)).toBe(true);
			vi.restoreAllMocks();
		}
	});

	it('is deterministic for a given seed', () => {
		seedRandom(12345);
		const first = simulateInstantGame(30);
		vi.restoreAllMocks();

		seedRandom(12345);
		const second = simulateInstantGame(30);

		expect(second).toEqual(first);
	});

	it('different seeds generally produce different outcomes', () => {
		const outcomes = new Set<string>();
		for (let seed = 1; seed <= 25; seed++) {
			seedRandom(seed);
			const { homeScore, awayScore } = simulateInstantGame(30);
			outcomes.add(`${homeScore}-${awayScore}`);
			vi.restoreAllMocks();
		}
		// Not every seed needs to be unique, but 25 distinct seeds should produce many distinct outcomes.
		expect(outcomes.size).toBeGreaterThan(5);
	});
});

// ─── Win score scaling ────────────────────────────────────
describe('simulateInstantGame — win score behavior', () => {
	it('winner always meets or exceeds winScore', () => {
		for (const winScore of [10, 20, 30, 50, 70]) {
			for (let seed = 1; seed <= 10; seed++) {
				seedRandom(seed);
				const { homeScore, awayScore } = simulateInstantGame(winScore);
				const winnerScore = Math.max(homeScore, awayScore);
				expect(winnerScore).toBeGreaterThanOrEqual(winScore);
				vi.restoreAllMocks();
			}
		}
	});

	it('loser score is strictly less than winner score', () => {
		for (let seed = 1; seed <= 20; seed++) {
			seedRandom(seed);
			const { homeScore, awayScore } = simulateInstantGame(30);
			// There are no ties in this game — the first team to reach winScore wins,
			// and since the other hasn't reached it they must be strictly lower.
			expect(homeScore).not.toBe(awayScore);
			vi.restoreAllMocks();
		}
	});

	it('average winner score scales roughly with winScore', () => {
		const averages: number[] = [];
		for (const winScore of [10, 30, 60]) {
			let total = 0;
			const trials = 20;
			for (let seed = 1; seed <= trials; seed++) {
				seedRandom(seed);
				const { homeScore, awayScore } = simulateInstantGame(winScore);
				total += Math.max(homeScore, awayScore);
				vi.restoreAllMocks();
			}
			averages.push(total / trials);
		}
		// Monotonic: winScore=10 < winScore=30 < winScore=60
		expect(averages[0]).toBeLessThan(averages[1]);
		expect(averages[1]).toBeLessThan(averages[2]);
	});
});

// ─── Plausible score distribution ─────────────────────────
describe('simulateInstantGame — score plausibility', () => {
	it('winner score stays within a reasonable envelope of winScore', () => {
		// The winner can overshoot winScore (e.g. score a TD + XP from 28 → 35), but
		// should almost never overshoot by more than a couple of TDs. Pin a generous
		// upper bound so pathological divergence is caught.
		for (let seed = 1; seed <= 30; seed++) {
			seedRandom(seed);
			const { homeScore, awayScore } = simulateInstantGame(30);
			const winnerScore = Math.max(homeScore, awayScore);
			expect(winnerScore).toBeLessThan(30 + 15); // <= 44
			vi.restoreAllMocks();
		}
	});
});
