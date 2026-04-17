import { describe, expect, it } from 'vitest';
import {
	advanceRunners,
	isGameOver,
	lookupDiceResult,
	processDoublePlay,
	processSacrifice,
	processWalk
} from './game';

const empty = () => ({ first: false, second: false, third: false });

// ── lookupDiceResult ─────────────────────────────────────────

describe('lookupDiceResult', () => {
	it('finds a known dice id', () => {
		const result = lookupDiceResult(11);
		expect(result).toBeDefined();
		expect(result?.id).toBe(11);
		expect(result?.batterAdvancement).toBe(4); // home run
	});

	it('returns undefined for an unknown id', () => {
		expect(lookupDiceResult(99)).toBeUndefined();
	});

	it('finds all 21 dice combinations', () => {
		const ids = [
			11, 12, 13, 14, 15, 16, 22, 23, 24, 25, 26, 33, 34, 35, 36, 44, 45, 46, 55, 56, 66
		];
		for (const id of ids) {
			expect(lookupDiceResult(id)).toBeDefined();
		}
	});
});

// ── advanceRunners ───────────────────────────────────────────

describe('advanceRunners', () => {
	it('places batter on first for a single (empty bases)', () => {
		const result = advanceRunners(empty(), 1, 2);
		expect(result.bases.first).toBe(true);
		expect(result.bases.second).toBe(false);
		expect(result.bases.third).toBe(false);
		expect(result.runsScored).toBe(0);
	});

	it('single with runner on first: runner advances 2, batter to 1st', () => {
		const result = advanceRunners({ first: true, second: false, third: false }, 1, 2);
		expect(result.bases.first).toBe(true); // batter
		expect(result.bases.third).toBe(true); // runner from 1st +2
		expect(result.runsScored).toBe(0);
	});

	it('double with runner on second: runner scores, batter on 2nd', () => {
		const result = advanceRunners({ first: false, second: true, third: false }, 2, 2);
		expect(result.bases.second).toBe(true); // batter
		expect(result.runsScored).toBe(1); // runner from 2nd +2 = home
	});

	it('home run clears bases and scores everyone', () => {
		const bases = { first: true, second: true, third: true };
		const result = advanceRunners(bases, 4, 4);
		expect(result.bases).toEqual(empty());
		expect(result.runsScored).toBe(4); // 3 runners + batter
	});

	it('home run with empty bases scores 1', () => {
		const result = advanceRunners(empty(), 4, 4);
		expect(result.runsScored).toBe(1);
		expect(result.bases).toEqual(empty());
	});

	it('triple with runner on first: runner scores, batter on 3rd', () => {
		const result = advanceRunners({ first: true, second: false, third: false }, 3, 3);
		expect(result.bases.third).toBe(true); // batter
		expect(result.runsScored).toBe(1); // runner from 1st +3 = home
	});

	it('single with bases loaded: runner on 3rd scores, chain pushes others', () => {
		const bases = { first: true, second: true, third: true };
		const result = advanceRunners(bases, 1, 2);
		// Runner on 3rd: +2 = 5 → scores
		// Runner on 2nd: +2 = 4 → scores
		// Runner on 1st: +2 = 3rd
		// Batter: 1st
		expect(result.runsScored).toBe(2);
		expect(result.bases.first).toBe(true);
		expect(result.bases.third).toBe(true);
	});

	it('handles collision displacement', () => {
		// Runner on 1st, single with runnerAdv=1
		// Runner moves 1st→2nd, batter to 1st
		const result = advanceRunners({ first: true, second: false, third: false }, 1, 1);
		expect(result.bases.first).toBe(true); // batter
		expect(result.bases.second).toBe(true); // runner pushed
		expect(result.runsScored).toBe(0);
	});
});

// ── processWalk ──────────────────────────────────────────────

describe('processWalk', () => {
	it('batter to first, empty bases', () => {
		const result = processWalk(empty());
		expect(result.bases.first).toBe(true);
		expect(result.bases.second).toBe(false);
		expect(result.bases.third).toBe(false);
		expect(result.runsScored).toBe(0);
	});

	it('forces runner on first to second', () => {
		const result = processWalk({ first: true, second: false, third: false });
		expect(result.bases.first).toBe(true); // batter
		expect(result.bases.second).toBe(true); // forced
		expect(result.runsScored).toBe(0);
	});

	it('bases loaded: runner on third scores', () => {
		const result = processWalk({ first: true, second: true, third: true });
		expect(result.bases).toEqual({ first: true, second: true, third: true });
		expect(result.runsScored).toBe(1);
	});

	it('runner on second not forced if first is empty', () => {
		const result = processWalk({ first: false, second: true, third: false });
		expect(result.bases.first).toBe(true); // batter
		expect(result.bases.second).toBe(true); // stays
		expect(result.bases.third).toBe(false);
		expect(result.runsScored).toBe(0);
	});

	it('runners on first and third: first forced to second, third stays', () => {
		const result = processWalk({ first: true, second: false, third: true });
		expect(result.bases.first).toBe(true); // batter
		expect(result.bases.second).toBe(true); // forced from 1st
		expect(result.bases.third).toBe(true); // stays (not forced)
		expect(result.runsScored).toBe(0);
	});
});

// ── processDoublePlay ────────────────────────────────────────

describe('processDoublePlay', () => {
	it('no runners: only batter is out', () => {
		const result = processDoublePlay(empty());
		expect(result.outsRecorded).toBe(1);
		expect(result.bases).toEqual(empty());
	});

	it('runner on third: removes lead runner', () => {
		const result = processDoublePlay({ first: false, second: false, third: true });
		expect(result.outsRecorded).toBe(2);
		expect(result.bases.third).toBe(false);
	});

	it('runners on first and third: removes third (lead runner)', () => {
		const result = processDoublePlay({ first: true, second: false, third: true });
		expect(result.outsRecorded).toBe(2);
		expect(result.bases.first).toBe(true); // stays
		expect(result.bases.third).toBe(false); // removed
	});

	it('runner on first only: removes first', () => {
		const result = processDoublePlay({ first: true, second: false, third: false });
		expect(result.outsRecorded).toBe(2);
		expect(result.bases.first).toBe(false);
	});
});

// ── processSacrifice ─────────────────────────────────────────

describe('processSacrifice', () => {
	it('runner on third scores on sac fly', () => {
		const result = processSacrifice({ first: false, second: false, third: true }, 1);
		expect(result.runsScored).toBe(1);
		expect(result.bases).toEqual(empty());
	});

	it('runner on second advances to third', () => {
		const result = processSacrifice({ first: false, second: true, third: false }, 1);
		expect(result.runsScored).toBe(0);
		expect(result.bases.third).toBe(true);
		expect(result.bases.second).toBe(false);
	});

	it('no runners: no effect', () => {
		const result = processSacrifice(empty(), 1);
		expect(result.runsScored).toBe(0);
		expect(result.bases).toEqual(empty());
	});
});

// ── isGameOver ───────────────────────────────────────────────

describe('isGameOver', () => {
	it('not over in early innings', () => {
		expect(isGameOver(5, 'top', 3, 3, 2).over).toBe(false);
	});

	it('home wins after bottom of 9th', () => {
		const result = isGameOver(9, 'bottom', 3, 2, 5);
		expect(result.over).toBe(true);
		expect(result.winner).toBe('hom');
	});

	it('visitor wins after bottom of 9th', () => {
		const result = isGameOver(9, 'bottom', 3, 5, 2);
		expect(result.over).toBe(true);
		expect(result.winner).toBe('vis');
	});

	it('home wins after top of 9th if already leading', () => {
		const result = isGameOver(9, 'top', 3, 2, 5);
		expect(result.over).toBe(true);
		expect(result.winner).toBe('hom');
	});

	it('walk-off: home takes lead in bottom of 9th', () => {
		const result = isGameOver(9, 'bottom', 1, 3, 4);
		expect(result.over).toBe(true);
		expect(result.winner).toBe('hom');
	});

	it('not over if tied after top of 9th', () => {
		expect(isGameOver(9, 'top', 3, 3, 3).over).toBe(false);
	});
});
