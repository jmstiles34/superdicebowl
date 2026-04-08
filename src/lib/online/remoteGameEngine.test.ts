import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME, GAME_ACTION, TEAM } from '$lib/constants/constants';
import type { GameStateSnapshot } from '$lib/db/database';
import { deriveTurn, isActionableState } from './remoteGameEngine';

function snapshot(overrides: Partial<GameStateSnapshot> = {}): GameStateSnapshot {
	return { ...DEFAULT_GAME, ...overrides };
}

// ─── isActionableState ────────────────────────────────────
describe('isActionableState', () => {
	// Every action that requires the active player to roll dice.
	const rollActions = [
		GAME_ACTION.OFFENSE,
		GAME_ACTION.KICKOFF,
		GAME_ACTION.PUNT,
		GAME_ACTION.FIELD_GOAL,
		GAME_ACTION.EXTRA_POINT,
		GAME_ACTION.TWO_POINT
	];

	// Every action that requires the active player to pick a modal option.
	const modalActions = [GAME_ACTION.FOURTH_DOWN_OPTIONS, GAME_ACTION.POINT_OPTION];

	// Intermediate / auto-resolving states that must NOT be actionable.
	const nonActionable = [
		GAME_ACTION.COIN_TOSS,
		GAME_ACTION.KICKOFF_KICK,
		GAME_ACTION.KICKOFF_RETURN,
		GAME_ACTION.KICKOFF_ONSIDE,
		GAME_ACTION.KICKOFF_TOUCHDOWN,
		GAME_ACTION.PLACE_KICKOFF,
		GAME_ACTION.FOURTH_DOWN,
		GAME_ACTION.TOUCHDOWN,
		GAME_ACTION.FIELD_GOAL_MADE,
		GAME_ACTION.FIELD_GOAL_MISS,
		GAME_ACTION.EXTRA_POINT_MADE,
		GAME_ACTION.EXTRA_POINT_MISS,
		GAME_ACTION.TWO_POINT_MADE,
		GAME_ACTION.TWO_POINT_MISS,
		GAME_ACTION.SAFETY,
		GAME_ACTION.TURNOVER,
		GAME_ACTION.GAME_OVER,
		GAME_ACTION.EXIT
	];

	it.each(rollActions)('is true for roll-requiring action %s', (action) => {
		expect(isActionableState(action)).toBe(true);
	});

	it.each(modalActions)('is true for modal-decision action %s', (action) => {
		expect(isActionableState(action)).toBe(true);
	});

	it.each(nonActionable)('is false for non-actionable intermediate state %s', (action) => {
		expect(isActionableState(action)).toBe(false);
	});

	it('is false for unknown action strings', () => {
		expect(isActionableState('Not A Real Action')).toBe(false);
		expect(isActionableState('')).toBe(false);
	});
});

// ─── deriveTurn ───────────────────────────────────────────
describe('deriveTurn', () => {
	it('returns the possession team for a normal offensive action', () => {
		expect(deriveTurn(snapshot({ action: GAME_ACTION.OFFENSE, possession: TEAM.HOME }))).toBe(
			'home'
		);
		expect(deriveTurn(snapshot({ action: GAME_ACTION.OFFENSE, possession: TEAM.AWAY }))).toBe(
			'away'
		);
	});

	it('inverts on KICKOFF because the receiving team has possession but the kicker rolls', () => {
		// Home is receiving → Away kicks → away rolls → turn = 'away'
		expect(deriveTurn(snapshot({ action: GAME_ACTION.KICKOFF, possession: TEAM.HOME }))).toBe(
			'away'
		);
		// Away is receiving → Home kicks → turn = 'home'
		expect(deriveTurn(snapshot({ action: GAME_ACTION.KICKOFF, possession: TEAM.AWAY }))).toBe(
			'home'
		);
	});

	it('returns the possession team for punts, field goals, and conversions', () => {
		for (const action of [
			GAME_ACTION.PUNT,
			GAME_ACTION.FIELD_GOAL,
			GAME_ACTION.EXTRA_POINT,
			GAME_ACTION.TWO_POINT
		]) {
			expect(deriveTurn(snapshot({ action, possession: TEAM.HOME }))).toBe('home');
			expect(deriveTurn(snapshot({ action, possession: TEAM.AWAY }))).toBe('away');
		}
	});

	it('returns the possession team for modal-decision states', () => {
		for (const action of [GAME_ACTION.FOURTH_DOWN_OPTIONS, GAME_ACTION.POINT_OPTION]) {
			expect(deriveTurn(snapshot({ action, possession: TEAM.HOME }))).toBe('home');
			expect(deriveTurn(snapshot({ action, possession: TEAM.AWAY }))).toBe('away');
		}
	});

	it('only inverts for the exact KICKOFF action — not for KICKOFF_KICK or KICKOFF_RETURN', () => {
		// These intermediate states shouldn't hit deriveTurn in practice (they're not
		// actionable), but if they do, the logic should *not* apply the kickoff inversion.
		expect(deriveTurn(snapshot({ action: GAME_ACTION.KICKOFF_KICK, possession: TEAM.HOME }))).toBe(
			'home'
		);
		expect(
			deriveTurn(snapshot({ action: GAME_ACTION.KICKOFF_RETURN, possession: TEAM.HOME }))
		).toBe('home');
	});
});
