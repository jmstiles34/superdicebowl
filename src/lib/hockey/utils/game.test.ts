import { describe, expect, it } from 'vitest';
import type { HockeyDiceRoll } from '$lib/hockey/types';
import { classifyOutcome, isGameOver, isSaveSuccessful } from './game';

function roll(overrides: Partial<HockeyDiceRoll>): HockeyDiceRoll {
	return {
		id: 0,
		description: ['test'],
		...overrides
	};
}

describe('classifyOutcome', () => {
	it('goal — isGoal takes priority', () => {
		expect(classifyOutcome(roll({ isGoal: true }), false)).toBe('goal');
	});

	it('penalty — isPenalty', () => {
		expect(classifyOutcome(roll({ isPenalty: true, isTurnover: true }), false)).toBe('penalty');
	});

	it('turnover — isTurnover', () => {
		expect(classifyOutcome(roll({ isTurnover: true }), false)).toBe('turnover');
	});

	it('shot_on_goal — isShot', () => {
		expect(classifyOutcome(roll({ isShot: true }), false)).toBe('shot_on_goal');
	});

	it('shot_on_goal — isPowerPlayShot when on power play', () => {
		expect(classifyOutcome(roll({ isPowerPlayShot: true }), true)).toBe('shot_on_goal');
	});

	it('pass — isPowerPlayShot when NOT on power play', () => {
		expect(classifyOutcome(roll({ isPowerPlayShot: true }), false)).toBe('pass');
	});

	it('pass — no flags set', () => {
		expect(classifyOutcome(roll({}), false)).toBe('pass');
	});
});

describe('isSaveSuccessful', () => {
	it('1 = goal (not saved)', () => {
		expect(isSaveSuccessful(1)).toBe(false);
	});

	it('2 = goal', () => {
		expect(isSaveSuccessful(2)).toBe(false);
	});

	it('3 = goal (boundary)', () => {
		expect(isSaveSuccessful(3)).toBe(false);
	});

	it('4 = save (boundary)', () => {
		expect(isSaveSuccessful(4)).toBe(true);
	});

	it('5 = save', () => {
		expect(isSaveSuccessful(5)).toBe(true);
	});

	it('6 = save', () => {
		expect(isSaveSuccessful(6)).toBe(true);
	});
});

describe('isGameOver', () => {
	it('returns false when neither team at win score', () => {
		expect(isGameOver(2, 3, 5)).toEqual({ over: false });
	});

	it('away wins at win score', () => {
		expect(isGameOver(5, 3, 5)).toEqual({ over: true, winner: 'Away' });
	});

	it('home wins at win score', () => {
		expect(isGameOver(2, 5, 5)).toEqual({ over: true, winner: 'Home' });
	});

	it('away checked first when both at win score', () => {
		expect(isGameOver(5, 5, 5)).toEqual({ over: true, winner: 'Away' });
	});
});
