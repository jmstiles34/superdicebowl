import { diceData } from '$lib/basketball/data/data.json';
import type { BasketballDiceRoll } from '$lib/basketball/types';
import { randomNumber } from '$lib/utils/common';

// ── Dice lookup ──────────────────────────────────────────────

export function lookupDiceResult(diceId: number): BasketballDiceRoll | undefined {
	return (diceData as BasketballDiceRoll[]).find((d) => d.id === diceId);
}

export function pickDescription(descriptions: string[]): string {
	return descriptions[randomNumber(descriptions.length)];
}

// ── Outcome classification ───────────────────────────────────

export type OutcomeType =
	| 'scoring'
	| 'scoring_and_one'
	| 'shooting_foul'
	| 'defensive_non_shooting_foul'
	| 'offensive_foul'
	| 'turnover'
	| 'missed_shot';

export function classifyOutcome(roll: BasketballDiceRoll): OutcomeType {
	if (roll.points > 0 && roll.isFoul && roll.freeThrows) return 'scoring_and_one';
	if (roll.points > 0) return 'scoring';
	if (roll.isFoul && roll.freeThrows) return 'shooting_foul';
	if (roll.isFoul && roll.isTurnover) return 'offensive_foul';
	if (roll.isFoul) return 'defensive_non_shooting_foul';
	if (roll.isTurnover) return 'turnover';
	return 'missed_shot';
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
