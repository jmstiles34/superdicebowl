import { SAVE_GOAL_THRESHOLD } from '$lib/hockey/constants';
import { diceData } from '$lib/hockey/data/data.json';
import type { HockeyDiceRoll } from '$lib/hockey/types';
import { randomNumber } from '$lib/utils/common';

// ── Dice lookup ──────────────────────────────────────────────

export function lookupDiceResult(diceId: number): HockeyDiceRoll | undefined {
	return (diceData as HockeyDiceRoll[]).find((d) => d.id === diceId);
}

export function pickDescription(descriptions: string[]): string {
	return descriptions[randomNumber(descriptions.length)];
}

// ── Outcome classification ───────────────────────────────────

export type OutcomeType = 'goal' | 'penalty' | 'turnover' | 'shot_on_goal' | 'pass';

export function classifyOutcome(roll: HockeyDiceRoll, powerPlay: boolean): OutcomeType {
	if (roll.isGoal) return 'goal';
	if (roll.isPenalty) return 'penalty';
	if (roll.isTurnover) return 'turnover';
	if (roll.isShot) return 'shot_on_goal';
	if (roll.isPowerPlayShot && powerPlay) return 'shot_on_goal';
	return 'pass';
}

// ── Save mechanics ───────────────────────────────────────────

export function isSaveSuccessful(dieValue: number): boolean {
	return dieValue > SAVE_GOAL_THRESHOLD;
}

// ── Game state helpers ───────────────────────────────────────

export function isGameOver(
	awayScore: number,
	homeScore: number,
	winScore: number
): { over: boolean; winner?: string } {
	if (awayScore >= winScore) return { over: true, winner: 'Away' };
	if (homeScore >= winScore) return { over: true, winner: 'Home' };
	return { over: false };
}

export function beginDisabled(ids: string[]): boolean {
	return ids.filter((id) => id !== '').length < 2;
}

export function teamKey(possession: string): 'away' | 'home' {
	return possession === 'Away' ? 'away' : 'home';
}

export function defenseKey(possession: string): 'away' | 'home' {
	return possession === 'Away' ? 'home' : 'away';
}
