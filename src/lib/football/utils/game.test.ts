import { describe, expect, it } from 'vitest';
import {
	BALL_FIELD_GOAL,
	DEFAULT_TEAM,
	GAME_ACTION,
	GAME_MODE,
	TEAM
} from '$lib/constants/constants';
import type { Play, Team } from '$lib/types';
import {
	backFns,
	ballPosition,
	beginDisabled,
	calcYardsToGo,
	compareFns,
	descExtraPoint,
	descFieldGoal,
	descKickoff,
	descPenalty,
	descPunt,
	descSafety,
	descTwoPoint,
	descYardage,
	fieldGoalYardsFns,
	forwardFns,
	getScoreByTeam,
	indexToYards,
	inFieldGoalRange,
	isAutoPlay,
	isAwayBall,
	isFourthDown,
	isGameComplete,
	isHomeBall,
	isModalChoice,
	isOnsideKick,
	isRollAction,
	isTouchback,
	isTouchdown,
	isTouchdownFns,
	kickOffIndexFns,
	madeExtraPoint,
	madeFirstDown,
	makeFourthDownChoice,
	makePointChoice,
	primaryColor,
	secondaryColor,
	setFirstDownMarker,
	showDownDistance,
	teamById,
	teamByUUId,
	togglePossession,
	turnoverOnDowns,
	twoPointSuccess,
	yardsToEndzone,
	yardsToIndex
} from './game';

// ─── Fixtures ──────────────────────────────────────────────
function makeTeam(overrides: Partial<Team> = {}): Team {
	return {
		...DEFAULT_TEAM,
		id: 'fixture-id',
		city: 'Test',
		cityKey: 'TST',
		name: 'Testers',
		fieldLogo: 'logo',
		logo: 'logo',
		colors: { primary: '#112233', secondary: '#445566' },
		...overrides
	};
}

function play(overrides: Partial<Play> = {}): Play {
	return {
		team: TEAM.HOME,
		diceRoll: 0,
		action: GAME_ACTION.OFFENSE,
		description: '',
		points: 0,
		yards: 0,
		penaltyYards: 0,
		isFirstdown: false,
		...overrides
	};
}

// ─── Direction / team fns ──────────────────────────────────
describe('direction helpers', () => {
	it("forwardFns advances in each team's attacking direction", () => {
		expect(forwardFns[TEAM.HOME](10, 2)).toBe(12);
		expect(forwardFns[TEAM.AWAY](10, 2)).toBe(8);
	});

	it("backFns retreats in each team's defensive direction", () => {
		expect(backFns[TEAM.HOME](10, 2)).toBe(8);
		expect(backFns[TEAM.AWAY](10, 2)).toBe(12);
	});

	it('compareFns uses gte for home and lte for away', () => {
		expect(compareFns[TEAM.HOME](12, 11)).toBe(true);
		expect(compareFns[TEAM.HOME](10, 11)).toBe(false);
		expect(compareFns[TEAM.AWAY](8, 9)).toBe(true);
		expect(compareFns[TEAM.AWAY](10, 9)).toBe(false);
	});

	it('isHomeBall / isAwayBall are mutually exclusive', () => {
		expect(isHomeBall(TEAM.HOME)).toBe(true);
		expect(isHomeBall(TEAM.AWAY)).toBe(false);
		expect(isAwayBall(TEAM.AWAY)).toBe(true);
		expect(isAwayBall(TEAM.HOME)).toBe(false);
	});

	it('togglePossession flips the team', () => {
		expect(togglePossession(TEAM.HOME)).toBe(TEAM.AWAY);
		expect(togglePossession(TEAM.AWAY)).toBe(TEAM.HOME);
	});
});

// ─── Position / distance math ──────────────────────────────
describe('ballPosition', () => {
	it('returns the same index when yards is zero', () => {
		expect(ballPosition(10, TEAM.HOME, 0)).toBe(10);
		expect(ballPosition(10, TEAM.AWAY, 0)).toBe(10);
	});

	it('advances home (positive yards) and away (negative of direction)', () => {
		expect(ballPosition(10, TEAM.HOME, 10)).toBe(12); // +2 index
		expect(ballPosition(10, TEAM.AWAY, 10)).toBe(8); // -2 index
	});

	it('handles loss of yards', () => {
		expect(ballPosition(10, TEAM.HOME, -5)).toBe(9);
		expect(ballPosition(10, TEAM.AWAY, -5)).toBe(11);
	});

	it('clamps penalty result into the legal 1..19 field range', () => {
		// Home near own goal line, 15-yard penalty backward (loss) would go below 1.
		expect(ballPosition(2, TEAM.HOME, -15, true)).toBe(1);
		// Home near opponent goal line, 15-yard penalty forward would go above 19.
		expect(ballPosition(18, TEAM.HOME, 15, true)).toBe(19);
		// Away mirrored
		expect(ballPosition(18, TEAM.AWAY, -15, true)).toBe(19);
		expect(ballPosition(2, TEAM.AWAY, 15, true)).toBe(1);
	});

	it('does not clamp on non-penalty plays (turnovers can cross goal lines)', () => {
		expect(ballPosition(2, TEAM.HOME, -20, false)).toBe(-2);
	});
});

describe('yard/index conversion', () => {
	it('indexToYards multiplies by 5', () => {
		expect(indexToYards(0)).toBe(0);
		expect(indexToYards(1)).toBe(5);
		expect(indexToYards(20)).toBe(100);
	});

	it('yardsToIndex divides by 5', () => {
		expect(yardsToIndex(0)).toBe(0);
		expect(yardsToIndex(5)).toBe(1);
		expect(yardsToIndex(100)).toBe(20);
	});

	it('yardsToEndzone reports yards remaining for the attacker', () => {
		// Home at midfield: 100 - 50 = 50
		expect(yardsToEndzone(TEAM.HOME, 10)).toBe(50);
		// Home at own 5-yard line (index 1): 95 to go
		expect(yardsToEndzone(TEAM.HOME, 1)).toBe(95);
		// Away at midfield: 50 to go
		expect(yardsToEndzone(TEAM.AWAY, 10)).toBe(50);
		// Away at opponent 5-yard line (index 1): 5 to go
		expect(yardsToEndzone(TEAM.AWAY, 1)).toBe(5);
	});
});

// ─── Touchback / touchdown detection ───────────────────────
describe('isTouchback', () => {
	it('returns true outside 1..19 and false inside', () => {
		expect(isTouchback(0)).toBe(true);
		expect(isTouchback(20)).toBe(true);
		expect(isTouchback(-1)).toBe(true);
		expect(isTouchback(21)).toBe(true);
		expect(isTouchback(1)).toBe(false);
		expect(isTouchback(19)).toBe(false);
		expect(isTouchback(10)).toBe(false);
	});
});

describe('isTouchdown + isTouchdownFns', () => {
	it('short-circuits on zero/negative yards, penalties, and turnovers', () => {
		expect(isTouchdown(TEAM.HOME, 18, 0)).toBe(false);
		expect(isTouchdown(TEAM.HOME, 18, -5)).toBe(false);
		expect(isTouchdown(TEAM.HOME, 18, 100, true)).toBe(false); // penalty
		expect(isTouchdown(TEAM.HOME, 18, 100, false, true)).toBe(false); // turnover
	});

	it('home scores when ballIndex + yardsIndex > 19', () => {
		expect(isTouchdownFns[TEAM.HOME](17, 3)).toBe(true); // 20 > 19
		expect(isTouchdownFns[TEAM.HOME](17, 2)).toBe(false); // 19 not > 19
		expect(isTouchdown(TEAM.HOME, 17, 15)).toBe(true); // 17 + 3 = 20
		expect(isTouchdown(TEAM.HOME, 17, 10)).toBe(false);
	});

	it('away scores when ballIndex - yardsIndex < 1', () => {
		expect(isTouchdownFns[TEAM.AWAY](2, 2)).toBe(true); // 0 < 1
		expect(isTouchdownFns[TEAM.AWAY](2, 1)).toBe(false); // 1 not < 1
		expect(isTouchdown(TEAM.AWAY, 2, 10)).toBe(true);
		expect(isTouchdown(TEAM.AWAY, 2, 5)).toBe(false);
	});
});

// ─── First down logic ──────────────────────────────────────
describe('setFirstDownMarker', () => {
	it('returns -1 (goal to go) when home is at/past the opponent 10', () => {
		expect(setFirstDownMarker(18, TEAM.HOME)).toBe(-1);
		expect(setFirstDownMarker(19, TEAM.HOME)).toBe(-1);
	});

	it('returns -1 (goal to go) when away is at/past the opponent 10', () => {
		expect(setFirstDownMarker(2, TEAM.AWAY)).toBe(-1);
		expect(setFirstDownMarker(1, TEAM.AWAY)).toBe(-1);
	});

	it('places the marker 10 yards downfield otherwise', () => {
		// Home: ballIndex + 1 (so ballIndex-1 must reach marker = ballIndex)
		expect(setFirstDownMarker(10, TEAM.HOME)).toBe(11);
		expect(setFirstDownMarker(17, TEAM.HOME)).toBe(18);
		// Away: ballIndex - 3 (so ballIndex-1 <= marker means moving 2 indexes)
		expect(setFirstDownMarker(10, TEAM.AWAY)).toBe(7);
		expect(setFirstDownMarker(5, TEAM.AWAY)).toBe(2);
	});
});

describe('madeFirstDown', () => {
	it('returns true when autoFirstDown is set, regardless of position', () => {
		expect(madeFirstDown(TEAM.HOME, 0, -1, true)).toBe(true);
		expect(madeFirstDown(TEAM.AWAY, 19, 10, true)).toBe(true);
	});

	it('returns false when firstDownIndex is -1 (goal to go)', () => {
		expect(madeFirstDown(TEAM.HOME, 19, -1)).toBe(false);
		expect(madeFirstDown(TEAM.AWAY, 1, -1)).toBe(false);
	});

	it('home must reach marker + 1 (two index steps from starting position)', () => {
		// Start at 10, marker = 11. First down when ballIndex reaches 12.
		expect(madeFirstDown(TEAM.HOME, 11, 11)).toBe(false); // at marker
		expect(madeFirstDown(TEAM.HOME, 12, 11)).toBe(true); // past marker
	});

	it('away must reach marker + 1 in their direction', () => {
		// Start at 10, marker = 7. First down when ballIndex reaches 8.
		expect(madeFirstDown(TEAM.AWAY, 9, 7)).toBe(false);
		expect(madeFirstDown(TEAM.AWAY, 8, 7)).toBe(true);
	});
});

describe('turnoverOnDowns', () => {
	it('is true only on 4th down with no conversion and no penalty', () => {
		expect(turnoverOnDowns(4, false)).toBe(true);
		expect(turnoverOnDowns(4, true)).toBe(false);
		expect(turnoverOnDowns(4, false, true)).toBe(false); // penalty replays down
		expect(turnoverOnDowns(3, false)).toBe(false);
		expect(turnoverOnDowns(1, false)).toBe(false);
	});
});

describe('calcYardsToGo', () => {
	it('returns the string "Goal" when firstDownIndex is -1', () => {
		expect(calcYardsToGo(-1, 0)).toBe('Goal');
		expect(calcYardsToGo(-1, 5)).toBe('Goal');
	});

	it('returns |diff + 1| * 5 otherwise', () => {
		expect(calcYardsToGo(11, 1)).toBe(10); // |1+1|*5
		expect(calcYardsToGo(11, 0)).toBe(5); // |0+1|*5
		expect(calcYardsToGo(11, -1)).toBe(0); // |-1+1|*5
	});
});

// ─── Kicking ───────────────────────────────────────────────
describe('fieldGoalYardsFns', () => {
	it('home distance is (20 - ballIndex) * 5', () => {
		expect(fieldGoalYardsFns[TEAM.HOME](15)).toBe(25);
		expect(fieldGoalYardsFns[TEAM.HOME](11)).toBe(45);
	});

	it('away distance is ballIndex * 5', () => {
		expect(fieldGoalYardsFns[TEAM.AWAY](5)).toBe(25);
		expect(fieldGoalYardsFns[TEAM.AWAY](9)).toBe(45);
	});
});

describe('isOnsideKick', () => {
	it('only the diceId 11 is an onside recovery', () => {
		expect(isOnsideKick(11)).toBe(true);
		expect(isOnsideKick(22)).toBe(false);
		expect(isOnsideKick(66)).toBe(false);
	});
});

describe('kickOffIndexFns', () => {
	it('home is identity, away is mirrored', () => {
		expect(kickOffIndexFns[TEAM.HOME](5)).toBe(5);
		expect(kickOffIndexFns[TEAM.AWAY](5)).toBe(15);
	});

	it('mirror is self-inverse for away', () => {
		const x = 7;
		expect(kickOffIndexFns[TEAM.AWAY](kickOffIndexFns[TEAM.AWAY](x))).toBe(x);
	});
});

describe('inFieldGoalRange', () => {
	it('is true during an offensive or field goal action when in range', () => {
		// Home in range at index >= 11
		expect(inFieldGoalRange(GAME_ACTION.OFFENSE, TEAM.HOME, 11)).toBe(true);
		expect(inFieldGoalRange(GAME_ACTION.OFFENSE, TEAM.HOME, 10)).toBe(false);
		// Away in range at index <= 9
		expect(inFieldGoalRange(GAME_ACTION.OFFENSE, TEAM.AWAY, 9)).toBe(true);
		expect(inFieldGoalRange(GAME_ACTION.OFFENSE, TEAM.AWAY, 10)).toBe(false);
	});

	it('is false during non-offensive actions', () => {
		expect(inFieldGoalRange(GAME_ACTION.KICKOFF, TEAM.HOME, 15)).toBe(false);
	});
});

// ─── Conversions ───────────────────────────────────────────
describe('madeExtraPoint / twoPointSuccess', () => {
	it('extra point succeeds on a sum of 4+', () => {
		expect(madeExtraPoint(3)).toBe(false);
		expect(madeExtraPoint(4)).toBe(true);
		expect(madeExtraPoint(12)).toBe(true);
	});

	it('two-point conversion succeeds on a sum of 8+', () => {
		expect(twoPointSuccess(7)).toBe(false);
		expect(twoPointSuccess(8)).toBe(true);
	});
});

// ─── Scoring ───────────────────────────────────────────────
describe('getScoreByTeam', () => {
	it("sums only the specified team's positive-point plays", () => {
		const log: Play[] = [
			play({ team: TEAM.HOME, points: 6, description: 'TD' }),
			play({ team: TEAM.HOME, points: 1, description: 'XP' }),
			play({ team: TEAM.AWAY, points: 3, description: 'FG' })
		];
		expect(getScoreByTeam(TEAM.HOME, log)).toBe(7);
		expect(getScoreByTeam(TEAM.AWAY, log)).toBe(3);
	});

	it('credits a safety only to the defending team, not the team that got tackled', () => {
		// A safety is recorded with team = possession (the team that got tackled in their own
		// endzone), points = 2, description contains 'Safety'. Only the opposing team should be
		// credited.
		const log: Play[] = [
			play({ team: TEAM.HOME, points: 2, description: 'Tackled in Endzone for Safety.' })
		];
		expect(getScoreByTeam(TEAM.AWAY, log)).toBe(2);
		expect(getScoreByTeam(TEAM.HOME, log)).toBe(0);
	});

	it('correctly sums a mixed log containing a safety', () => {
		const log: Play[] = [
			play({ team: TEAM.HOME, points: 6, description: 'TD' }),
			play({ team: TEAM.HOME, points: 1, description: 'Extra Point Made' }),
			play({ team: TEAM.HOME, points: 2, description: 'Tackled in Endzone for Safety.' }),
			play({ team: TEAM.AWAY, points: 3, description: '42 Yd Field Goal Made' })
		];
		// Home: TD + XP = 7 (safety does NOT count for home)
		expect(getScoreByTeam(TEAM.HOME, log)).toBe(7);
		// Away: FG + safety = 5
		expect(getScoreByTeam(TEAM.AWAY, log)).toBe(5);
	});

	it('ignores plays with zero points', () => {
		const log: Play[] = [
			play({ team: TEAM.HOME, points: 0, description: '5 Yd Gain' }),
			play({ team: TEAM.HOME, points: 0, description: 'Incomplete' })
		];
		expect(getScoreByTeam(TEAM.HOME, log)).toBe(0);
	});
});

describe('isGameComplete', () => {
	it('is true when either team meets or exceeds winScore', () => {
		expect(isGameComplete(0, 30, 30)).toBe(true);
		expect(isGameComplete(31, 14, 30)).toBe(true);
		expect(isGameComplete(29, 29, 30)).toBe(false);
	});
});

// ─── AI decisions ──────────────────────────────────────────
describe('makePointChoice', () => {
	it('goes for two when within 2 points of winning', () => {
		expect(makePointChoice(28, 0, 30)).toBe(GAME_ACTION.TWO_POINT);
		expect(makePointChoice(29, 0, 30)).toBe(GAME_ACTION.TWO_POINT);
	});

	it('goes for two when trailing by 10 or more', () => {
		expect(makePointChoice(6, 16, 30)).toBe(GAME_ACTION.TWO_POINT);
		expect(makePointChoice(0, 10, 30)).toBe(GAME_ACTION.TWO_POINT);
	});

	it('kicks the extra point otherwise', () => {
		expect(makePointChoice(14, 14, 30)).toBe(GAME_ACTION.EXTRA_POINT);
		expect(makePointChoice(6, 9, 30)).toBe(GAME_ACTION.EXTRA_POINT);
	});
});

describe('makeFourthDownChoice', () => {
	it('kicks a field goal when in range and within 16 points', () => {
		// Home in FG range (ballIndex >= 11)
		expect(makeFourthDownChoice(10, 10, 11, TEAM.HOME)).toBe(GAME_ACTION.FIELD_GOAL);
		// Away in FG range (ballIndex <= 9)
		expect(makeFourthDownChoice(10, 10, 9, TEAM.AWAY)).toBe(GAME_ACTION.FIELD_GOAL);
	});

	it('punts when out of range and within 16 points', () => {
		expect(makeFourthDownChoice(10, 10, 5, TEAM.HOME)).toBe(GAME_ACTION.PUNT);
		expect(makeFourthDownChoice(10, 10, 15, TEAM.AWAY)).toBe(GAME_ACTION.PUNT);
	});

	it('goes for it when trailing by more than 16', () => {
		expect(makeFourthDownChoice(0, 17, 5, TEAM.HOME)).toBe(GAME_ACTION.OFFENSE);
		expect(makeFourthDownChoice(0, 17, 15, TEAM.AWAY)).toBe(GAME_ACTION.OFFENSE);
	});

	it('BALL_FIELD_GOAL boundary is inclusive', () => {
		expect(makeFourthDownChoice(10, 10, BALL_FIELD_GOAL[TEAM.HOME], TEAM.HOME)).toBe(
			GAME_ACTION.FIELD_GOAL
		);
		expect(makeFourthDownChoice(10, 10, BALL_FIELD_GOAL[TEAM.AWAY], TEAM.AWAY)).toBe(
			GAME_ACTION.FIELD_GOAL
		);
	});
});

// ─── Mode / auto-play / modal choice ───────────────────────
describe('isAutoPlay', () => {
	it('is always true in Simulation mode', () => {
		expect(isAutoPlay(GAME_MODE.SIMULATION, TEAM.HOME, TEAM.HOME)).toBe(true);
		expect(isAutoPlay(GAME_MODE.SIMULATION, TEAM.AWAY, TEAM.HOME)).toBe(true);
	});

	it('is true in Solo mode only when the AI has possession', () => {
		expect(isAutoPlay(GAME_MODE.SOLO, TEAM.HOME, TEAM.HOME)).toBe(false);
		expect(isAutoPlay(GAME_MODE.SOLO, TEAM.AWAY, TEAM.HOME)).toBe(true);
	});

	it('is always false in Head-to-Head mode', () => {
		expect(isAutoPlay(GAME_MODE.HEAD_TO_HEAD, TEAM.HOME, TEAM.HOME)).toBe(false);
		expect(isAutoPlay(GAME_MODE.HEAD_TO_HEAD, TEAM.AWAY, TEAM.HOME)).toBe(false);
	});

	it('defaults userTeam to Home when omitted', () => {
		expect(isAutoPlay(GAME_MODE.SOLO, TEAM.AWAY)).toBe(true);
		expect(isAutoPlay(GAME_MODE.SOLO, TEAM.HOME)).toBe(false);
	});
});

describe('isModalChoice', () => {
	it('is true only for modal-decision actions during auto-play', () => {
		expect(
			isModalChoice(GAME_MODE.SIMULATION, TEAM.HOME, GAME_ACTION.POINT_OPTION, TEAM.HOME)
		).toBe(true);
		expect(
			isModalChoice(GAME_MODE.SIMULATION, TEAM.HOME, GAME_ACTION.FOURTH_DOWN_OPTIONS, TEAM.HOME)
		).toBe(true);
	});

	it('is false for non-modal actions even during auto-play', () => {
		expect(isModalChoice(GAME_MODE.SIMULATION, TEAM.HOME, GAME_ACTION.OFFENSE, TEAM.HOME)).toBe(
			false
		);
	});

	it('is false when the user controls the active team', () => {
		expect(isModalChoice(GAME_MODE.SOLO, TEAM.HOME, GAME_ACTION.POINT_OPTION, TEAM.HOME)).toBe(
			false
		);
	});
});

describe('isRollAction', () => {
	const rollActions = [
		GAME_ACTION.EXTRA_POINT,
		GAME_ACTION.FIELD_GOAL,
		GAME_ACTION.KICKOFF,
		GAME_ACTION.OFFENSE,
		GAME_ACTION.PUNT,
		GAME_ACTION.TWO_POINT
	];

	it('recognizes every roll-requiring action', () => {
		for (const action of rollActions) {
			expect(isRollAction(action)).toBe(true);
		}
	});

	it('rejects non-roll actions', () => {
		expect(isRollAction(GAME_ACTION.COIN_TOSS)).toBe(false);
		expect(isRollAction(GAME_ACTION.TOUCHDOWN)).toBe(false);
		expect(isRollAction(GAME_ACTION.GAME_OVER)).toBe(false);
	});
});

describe('isFourthDown', () => {
	it('is true only for down 4', () => {
		expect(isFourthDown(4)).toBe(true);
		expect(isFourthDown(3)).toBe(false);
		expect(isFourthDown(1)).toBe(false);
	});
});

describe('showDownDistance', () => {
	it('is visible during offense and punt', () => {
		expect(showDownDistance(GAME_ACTION.OFFENSE)).toBe(true);
		expect(showDownDistance(GAME_ACTION.PUNT)).toBe(true);
	});

	it('is hidden during kicks and other states', () => {
		expect(showDownDistance(GAME_ACTION.KICKOFF)).toBe(false);
		expect(showDownDistance(GAME_ACTION.FIELD_GOAL)).toBe(false);
		expect(showDownDistance(GAME_ACTION.TOUCHDOWN)).toBe(false);
	});
});

// ─── Description helpers (pin current phrasing) ────────────
describe('description helpers', () => {
	it('descExtraPoint / descFieldGoal / descKickoff / descPunt / descSafety / descTwoPoint / descPenalty / descYardage', () => {
		expect(descExtraPoint(true)).toBe('Extra Point Made');
		expect(descExtraPoint(false)).toBe('Extra Point Missed');

		expect(descFieldGoal(true, 25)).toBe('42 Yd Field Goal Made'); // 25 + FIELD_GOAL_YARDS(17)
		expect(descFieldGoal(false, 45)).toBe('62 Yd Field Goal Missed');

		expect(descKickoff(true, 0)).toBe('Touchback - Start at 25 Yd Line');
		expect(descKickoff(false, 7)).toBe('Kickoff returned for 35 Yds');

		expect(descPunt(false, 40)).toBe('40 Yd Punt');
		expect(descPunt(true, 40)).toBe('40 Yd Punt - Touchback');

		expect(descSafety()).toBe('Tackled in Endzone for Safety.');

		expect(descTwoPoint(true)).toBe('Two Point Conversion Successful!');
		expect(descTwoPoint(false)).toBe('Two Point Conversion Failed');

		expect(descPenalty(true)).toBe('PENALTY:');
		expect(descPenalty(false)).toBe('');

		expect(descYardage(0)).toBe('');
		expect(descYardage(7)).toBe('- 7 Yd Gain');
		expect(descYardage(-4)).toBe('- 4 Yd Loss');
	});
});

// ─── Team helpers / color / begin gating ───────────────────
describe('teamById / teamByUUId', () => {
	const teamA = makeTeam({ id: 'aaa' });
	const teamB = makeTeam({ id: 'bbb' });
	const teams = [teamA, teamB];

	it('teamById uses a numeric index string', () => {
		expect(teamById(teams)('0')).toBe(teamA);
		expect(teamById(teams)('1')).toBe(teamB);
	});

	it('teamById returns DEFAULT_TEAM when the index is out of range', () => {
		expect(teamById(teams)('5')).toBe(DEFAULT_TEAM);
	});

	it('teamByUUId finds a team by id', () => {
		expect(teamByUUId(teams)('aaa')).toBe(teamA);
		expect(teamByUUId(teams)('bbb')).toBe(teamB);
	});

	it('teamByUUId returns DEFAULT_TEAM when not found', () => {
		expect(teamByUUId(teams)('missing')).toBe(DEFAULT_TEAM);
	});
});

describe('primaryColor / secondaryColor', () => {
	const home = makeTeam({ colors: { primary: '#111111', secondary: '#222222' } });
	const away = makeTeam({ colors: { primary: '#aaaaaa', secondary: '#bbbbbb' } });
	// Build a minimal settings-like object — primaryColor only reads homeTeam/awayTeam.
	const settings = {
		homeTeam: home,
		awayTeam: away,
		mode: GAME_MODE.HEAD_TO_HEAD,
		winScore: 30,
		volume: 75,
		theme: 'dark' as const
	};

	it('primaryColor picks the right team', () => {
		expect(primaryColor(settings, 'home')).toBe('#111111');
		expect(primaryColor(settings, 'away')).toBe('#aaaaaa');
		expect(primaryColor(settings)).toBe('#111111'); // defaults to home
	});

	it('secondaryColor picks the right team', () => {
		expect(secondaryColor(settings, 'home')).toBe('#222222');
		expect(secondaryColor(settings, 'away')).toBe('#bbbbbb');
	});
});

describe('beginDisabled', () => {
	it('is disabled when fewer than two teams are selected', () => {
		expect(beginDisabled(['', ''])).toBe(true);
		expect(beginDisabled(['a', ''])).toBe(true);
	});

	it('is enabled when both teams are selected', () => {
		expect(beginDisabled(['a', 'b'])).toBe(false);
	});
});
