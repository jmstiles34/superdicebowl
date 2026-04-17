import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME, GAME_ACTION, TEAM } from '$lib/constants/constants';
import type { FootballGameStateSnapshot } from '$lib/db/database';
import { deriveTurn, isActionableState } from './remoteGameEngine';

function snapshot(overrides: Partial<FootballGameStateSnapshot> = {}): FootballGameStateSnapshot {
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

	it('gives KICKOFF turn to the receiving (possessing) team', () => {
		// Home is receiving → Home rolls the kickoff
		expect(deriveTurn(snapshot({ action: GAME_ACTION.KICKOFF, possession: TEAM.HOME }))).toBe(
			'home'
		);
		// Away is receiving → Away rolls the kickoff
		expect(deriveTurn(snapshot({ action: GAME_ACTION.KICKOFF, possession: TEAM.AWAY }))).toBe(
			'away'
		);
	});

	it('inverts for actions whose chains flip possession', () => {
		for (const action of [
			GAME_ACTION.PLACE_KICKOFF,
			GAME_ACTION.FIELD_GOAL_MADE,
			GAME_ACTION.FIELD_GOAL_MISS,
			GAME_ACTION.KICKOFF_ONSIDE
		]) {
			expect(deriveTurn(snapshot({ action, possession: TEAM.HOME }))).toBe('away');
			expect(deriveTurn(snapshot({ action, possession: TEAM.AWAY }))).toBe('home');
		}
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

// ─── Possession-change scenarios ─────────────────────────
// These tests simulate the snapshot state at the moment saveRemoteGame()
// fires (after handleDiceRoll, before continueAfterAction) and verify
// that deriveTurn returns the correct next player for each scenario.
describe('deriveTurn — possession-change scenarios', () => {
	it('after extra point: HOME scores, snapshot is PLACE_KICKOFF → turn goes to AWAY', () => {
		// kickExtraPoint sets action = PLACE_KICKOFF, possession stays with scorer
		const s = snapshot({ action: GAME_ACTION.PLACE_KICKOFF, possession: TEAM.HOME });
		expect(deriveTurn(s)).toBe('away');
	});

	it('after two-point attempt: AWAY scores, snapshot is PLACE_KICKOFF → turn goes to HOME', () => {
		// doTwoPointPlay sets action = PLACE_KICKOFF, possession stays with scorer
		const s = snapshot({ action: GAME_ACTION.PLACE_KICKOFF, possession: TEAM.AWAY });
		expect(deriveTurn(s)).toBe('home');
	});

	it('after field goal made: possession stays with kicker → turn goes to opponent', () => {
		const s = snapshot({ action: GAME_ACTION.FIELD_GOAL_MADE, possession: TEAM.HOME });
		expect(deriveTurn(s)).toBe('away');
	});

	it('after field goal miss: possession stays with kicker → turn goes to opponent', () => {
		const s = snapshot({ action: GAME_ACTION.FIELD_GOAL_MISS, possession: TEAM.AWAY });
		expect(deriveTurn(s)).toBe('home');
	});

	it('after interception: possession is already flipped → turn follows new possessor', () => {
		// doOffensivePlay flips possession before snapshot; action = INTERCEPTION
		const s = snapshot({ action: GAME_ACTION.INTERCEPTION, possession: TEAM.AWAY });
		expect(deriveTurn(s)).toBe('away');
	});

	it('after fumble: possession is already flipped → turn follows new possessor', () => {
		const s = snapshot({ action: GAME_ACTION.FUMBLE, possession: TEAM.HOME });
		expect(deriveTurn(s)).toBe('home');
	});

	it('after turnover on downs: possession is already flipped → turn follows new possessor', () => {
		const s = snapshot({ action: GAME_ACTION.TURNOVER, possession: TEAM.AWAY });
		expect(deriveTurn(s)).toBe('away');
	});

	it('after punt: possession is already flipped → turn follows new possessor', () => {
		const s = snapshot({ action: GAME_ACTION.PUNT_RESULT, possession: TEAM.HOME });
		expect(deriveTurn(s)).toBe('home');
	});

	it('after safety: action is PLACE_KICKOFF, possession stays with penalized team → turn flips', () => {
		// Safety sets action = PLACE_KICKOFF without flipping possession
		const s = snapshot({ action: GAME_ACTION.PLACE_KICKOFF, possession: TEAM.HOME });
		expect(deriveTurn(s)).toBe('away');
	});

	it('after onside kick: possession stays with kicker → turn flips to opponent', () => {
		const s = snapshot({ action: GAME_ACTION.KICKOFF_ONSIDE, possession: TEAM.HOME });
		expect(deriveTurn(s)).toBe('away');
	});

	it('regular kickoff kick: possession = receiver → turn stays with receiver', () => {
		// After prepareKickoff, possession = receiving team; they roll kickoff → KICKOFF_KICK
		const s = snapshot({ action: GAME_ACTION.KICKOFF_KICK, possession: TEAM.AWAY });
		expect(deriveTurn(s)).toBe('away');
	});

	it('game start: PLACE_KICKOFF with random possession → turn goes to the other team', () => {
		// acceptChallenge creates initial state with PLACE_KICKOFF
		const homeFirst = snapshot({ action: GAME_ACTION.PLACE_KICKOFF, possession: TEAM.HOME });
		const awayFirst = snapshot({ action: GAME_ACTION.PLACE_KICKOFF, possession: TEAM.AWAY });
		expect(deriveTurn(homeFirst)).toBe('away');
		expect(deriveTurn(awayFirst)).toBe('home');
	});
});
