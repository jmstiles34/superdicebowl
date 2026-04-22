import { describe, expect, it } from 'vitest';
import type { BasketballDiceRoll } from '$lib/basketball/types';
import { beginDisabled, classifyOutcome, defenseKey, isGameOver, teamKey } from './game';

function roll(overrides: Partial<BasketballDiceRoll>): BasketballDiceRoll {
	return {
		id: 0,
		points: 0,
		isFoul: false,
		isShot: false,
		isTurnover: false,
		description: ['test'],
		...overrides
	};
}

describe('classifyOutcome', () => {
	it('scoring — points, no foul', () => {
		expect(classifyOutcome(roll({ points: 2 }))).toBe('scoring');
	});

	it('scoring — 3 pointer', () => {
		expect(classifyOutcome(roll({ points: 3, isShot: true }))).toBe('scoring');
	});

	it('scoring_and_one — points + foul + free throws', () => {
		expect(classifyOutcome(roll({ points: 3, isFoul: true, freeThrows: 1 }))).toBe(
			'scoring_and_one'
		);
	});

	it('shooting_foul — 0 points, foul, free throws', () => {
		expect(classifyOutcome(roll({ isFoul: true, freeThrows: 2 }))).toBe('shooting_foul');
	});

	it('offensive_foul — foul + turnover', () => {
		expect(classifyOutcome(roll({ isFoul: true, isTurnover: true }))).toBe('offensive_foul');
	});

	it('defensive_non_shooting_foul — foul, no turnover, no FTs', () => {
		expect(classifyOutcome(roll({ isFoul: true }))).toBe('defensive_non_shooting_foul');
	});

	it('turnover — no foul, turnover', () => {
		expect(classifyOutcome(roll({ isTurnover: true }))).toBe('turnover');
	});

	it('missed_shot — 0 points, no foul, no turnover', () => {
		expect(classifyOutcome(roll({}))).toBe('missed_shot');
	});
});

describe('isGameOver', () => {
	it('returns false when neither team at win score', () => {
		expect(isGameOver(10, 15, 30)).toEqual({ over: false });
	});

	it('away wins when at win score', () => {
		expect(isGameOver(30, 15, 30)).toEqual({ over: true, winner: 'Away' });
	});

	it('home wins when at win score', () => {
		expect(isGameOver(10, 30, 30)).toEqual({ over: true, winner: 'Home' });
	});

	it('away wins when exceeding win score', () => {
		expect(isGameOver(35, 20, 30)).toEqual({ over: true, winner: 'Away' });
	});

	it('away wins when both at win score (checked first)', () => {
		expect(isGameOver(30, 30, 30)).toEqual({ over: true, winner: 'Away' });
	});
});

describe('beginDisabled', () => {
	it('disabled when no teams selected', () => {
		expect(beginDisabled(['', ''])).toBe(true);
	});

	it('disabled when one team selected', () => {
		expect(beginDisabled(['team-1', ''])).toBe(true);
	});

	it('enabled when both teams selected', () => {
		expect(beginDisabled(['team-1', 'team-2'])).toBe(false);
	});
});

describe('teamKey / defenseKey', () => {
	it('maps Away to away/home', () => {
		expect(teamKey('Away')).toBe('away');
		expect(defenseKey('Away')).toBe('home');
	});

	it('maps Home to home/away', () => {
		expect(teamKey('Home')).toBe('home');
		expect(defenseKey('Home')).toBe('away');
	});
});
