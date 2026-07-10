import { afterEach, describe, expect, it, vi } from 'vitest';
import { SOCCER_SYMBOL } from '$lib/soccer/constants';
import type { SoccerRoll } from '$lib/soccer/types';
import {
	aiRerollIndices,
	aiShouldReroll,
	aiShouldUseChip,
	applyReroll,
	beginDisabled,
	bestPlay,
	clearToMidline,
	compareCounts,
	countSymbols,
	defenseTeam,
	effectiveDiceCount,
	isGameOver,
	justPastMidline,
	offenseTeam,
	reachedGoal,
	redCardAdvance,
	resolveBallMove,
	resolveShot,
	rollDice,
	sectionCenterPercent,
	teamKey
} from './game';

const { BALL, KICK, PENALTY, RED_CARD } = SOCCER_SYMBOL;

// Build a 6-symbol roll from a compact spec, e.g. { ball: 4, kick: 2 }.
function makeRoll(spec: Partial<Record<string, number>>): SoccerRoll {
	const roll: string[] = [];
	for (const [symbol, n] of Object.entries(spec)) {
		for (let i = 0; i < (n ?? 0); i++) roll.push(symbol);
	}
	return roll as SoccerRoll;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('countSymbols', () => {
	it('tallies each face', () => {
		expect(countSymbols(makeRoll({ ball: 3, kick: 1, penalty: 1, redCard: 1 }))).toEqual({
			ball: 3,
			kick: 1,
			penalty: 1,
			redCard: 1
		});
	});
});

describe('bestPlay', () => {
	it('picks the most frequent symbol', () => {
		expect(bestPlay(makeRoll({ ball: 4, kick: 2 }))).toEqual({ symbol: BALL, count: 4 });
	});

	it('breaks intra-team ties by priority: Penalty > Kick > Red Card > Ball', () => {
		expect(bestPlay(makeRoll({ ball: 3, kick: 3 }))).toEqual({ symbol: KICK, count: 3 });
		expect(bestPlay(makeRoll({ penalty: 2, kick: 2, ball: 2 }))).toEqual({
			symbol: PENALTY,
			count: 2
		});
		expect(bestPlay(makeRoll({ redCard: 2, ball: 2 }))).toEqual({ symbol: RED_CARD, count: 2 });
	});

	it('all-ball roll', () => {
		expect(bestPlay(makeRoll({ ball: 6 }))).toEqual({ symbol: BALL, count: 6 });
	});
});

describe('compareCounts', () => {
	it('higher count wins', () => {
		expect(compareCounts({ symbol: BALL, count: 5 }, { symbol: BALL, count: 3 })).toBe('offense');
		expect(compareCounts({ symbol: BALL, count: 2 }, { symbol: KICK, count: 4 })).toBe('defense');
	});

	it('equal counts tie regardless of symbol', () => {
		expect(compareCounts({ symbol: KICK, count: 3 }, { symbol: BALL, count: 3 })).toBe('tie');
	});
});

describe('roles from ball section', () => {
	it('Home defends the low half (0..3), Away the high half (4..7)', () => {
		expect(defenseTeam(0)).toBe('Home');
		expect(defenseTeam(3)).toBe('Home');
		expect(defenseTeam(4)).toBe('Away');
		expect(defenseTeam(7)).toBe('Away');
	});

	it('offense is the defender opposite', () => {
		expect(offenseTeam(2)).toBe('Away');
		expect(offenseTeam(5)).toBe('Home');
	});
});

describe('justPastMidline', () => {
	it('Home enters attack at section 4, Away at 3', () => {
		expect(justPastMidline('Home')).toBe(4);
		expect(justPastMidline('Away')).toBe(3);
	});

	it('a team going on offense lands in the opponent half', () => {
		expect(defenseTeam(justPastMidline('Home'))).toBe('Away');
		expect(defenseTeam(justPastMidline('Away'))).toBe('Home');
	});
});

describe('reachedGoal', () => {
	it('Home scores past section 7, Away past section 0', () => {
		expect(reachedGoal(8, 'Home')).toBe(true);
		expect(reachedGoal(7, 'Home')).toBe(false);
		expect(reachedGoal(-1, 'Away')).toBe(true);
		expect(reachedGoal(0, 'Away')).toBe(false);
	});
});

describe('resolveBallMove', () => {
	it('4 balls advances 1 section in attack direction', () => {
		expect(resolveBallMove(4, 4, 'Home')).toEqual({ goal: false, section: 5 });
		expect(resolveBallMove(3, 4, 'Away')).toEqual({ goal: false, section: 2 });
	});

	it('5 balls advances 2 sections', () => {
		expect(resolveBallMove(4, 5, 'Home')).toEqual({ goal: false, section: 6 });
		expect(resolveBallMove(3, 5, 'Away')).toEqual({ goal: false, section: 1 });
	});

	it('6 balls is an instant goal from anywhere', () => {
		expect(resolveBallMove(4, 6, 'Home').goal).toBe(true);
		expect(resolveBallMove(4, 6, 'Away').goal).toBe(true);
	});

	it('fewer than 4 balls does not move the ball', () => {
		expect(resolveBallMove(4, 3, 'Home')).toEqual({ goal: false, section: 4 });
		expect(resolveBallMove(4, 1, 'Away')).toEqual({ goal: false, section: 4 });
	});

	it('advancing into the goal scores', () => {
		expect(resolveBallMove(7, 4, 'Home').goal).toBe(true);
		expect(resolveBallMove(0, 4, 'Away').goal).toBe(true);
		expect(resolveBallMove(6, 5, 'Home').goal).toBe(true);
	});

	it('defense clearing moves toward its own attack direction (over midline)', () => {
		// Home defending at section 3 wins Ball Move by 5 → pushes to 5 (Away half)
		expect(resolveBallMove(3, 5, 'Home')).toEqual({ goal: false, section: 5 });
	});
});

describe('redCardAdvance', () => {
	it('advances exactly one section', () => {
		expect(redCardAdvance(4, 'Home')).toEqual({ goal: false, section: 5 });
		expect(redCardAdvance(3, 'Away')).toEqual({ goal: false, section: 2 });
	});

	it('scores when it crosses the goal line', () => {
		expect(redCardAdvance(7, 'Home').goal).toBe(true);
		expect(redCardAdvance(0, 'Away').goal).toBe(true);
	});
});

describe('clearToMidline', () => {
	it('defender clears to just past midline and becomes offense', () => {
		expect(clearToMidline('Home')).toBe(4);
		expect(clearToMidline('Away')).toBe(3);
		expect(offenseTeam(clearToMidline('Home'))).toBe('Home');
		expect(offenseTeam(clearToMidline('Away'))).toBe('Away');
	});
});

describe('sectionCenterPercent', () => {
	it('midline sits at the field centre (between sections 3 and 4)', () => {
		expect((sectionCenterPercent(3) + sectionCenterPercent(4)) / 2).toBeCloseTo(50);
	});

	it('sections run left to right within the pitch', () => {
		expect(sectionCenterPercent(0)).toBeCloseTo(10.79, 2);
		expect(sectionCenterPercent(7)).toBeCloseTo(89.21, 2);
	});

	it('is monotonic increasing', () => {
		for (let i = 1; i < 8; i++) {
			expect(sectionCenterPercent(i)).toBeGreaterThan(sectionCenterPercent(i - 1));
		}
	});
});

describe('resolveShot', () => {
	it('offense more balls = goal', () => {
		expect(resolveShot(4, 2)).toBe('goal');
	});
	it('defense more balls = save', () => {
		expect(resolveShot(1, 3)).toBe('save');
	});
	it('equal = tie', () => {
		expect(resolveShot(3, 3)).toBe('tie');
	});
});

describe('effectiveDiceCount', () => {
	it('full set without a reduction', () => {
		expect(effectiveDiceCount(0)).toBe(6);
	});
	it('drops a die under a red card', () => {
		expect(effectiveDiceCount(1)).toBe(5);
	});
	it('never below one die', () => {
		expect(effectiveDiceCount(10)).toBe(1);
	});
});

describe('isGameOver', () => {
	it('false below win score', () => {
		expect(isGameOver(1, 2, 3)).toEqual({ over: false });
	});
	it('away reaches win score', () => {
		expect(isGameOver(3, 1, 3)).toEqual({ over: true, winner: 'Away' });
	});
	it('home reaches win score', () => {
		expect(isGameOver(1, 3, 3)).toEqual({ over: true, winner: 'Home' });
	});
});

describe('teamKey / beginDisabled', () => {
	it('maps team to lowercase key', () => {
		expect(teamKey('Away')).toBe('away');
		expect(teamKey('Home')).toBe('home');
	});
	it('needs two chosen teams to begin', () => {
		expect(beginDisabled(['', ''])).toBe(true);
		expect(beginDisabled(['a', ''])).toBe(true);
		expect(beginDisabled(['a', 'b'])).toBe(false);
	});
});

describe('AI heuristics', () => {
	it('uses the chip when a goal is at stake or when attacking', () => {
		expect(aiShouldUseChip(true, false)).toBe(true);
		expect(aiShouldUseChip(false, true)).toBe(true);
		expect(aiShouldUseChip(false, false)).toBe(false);
	});

	it('re-rolls the dice outside the best play', () => {
		expect(aiRerollIndices(makeRoll({ ball: 4, kick: 1, penalty: 1 }))).toEqual([4, 5]);
	});

	it('re-rolls only weak ball plays on offense', () => {
		expect(aiShouldReroll({ symbol: BALL, count: 3 }, true)).toBe(true);
		expect(aiShouldReroll({ symbol: BALL, count: 4 }, true)).toBe(false);
		expect(aiShouldReroll({ symbol: BALL, count: 3 }, false)).toBe(false);
		expect(aiShouldReroll({ symbol: KICK, count: 2 }, true)).toBe(false);
	});
});

describe('rollDice / applyReroll (seeded)', () => {
	it('rolls the requested number of dice', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		expect(rollDice(6)).toHaveLength(6);
		expect(rollDice(5)).toHaveLength(5);
	});

	it('rolls at least one die', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		expect(rollDice(0)).toHaveLength(1);
	});

	it('only re-rolls the selected indices', () => {
		// Math.random → 0 always maps to DIE_FACES[0] === 'ball'
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const roll = makeRoll({ kick: 2, penalty: 2, redCard: 2 });
		const next = applyReroll(roll, [0, 2]);
		expect(next[0]).toBe(BALL);
		expect(next[2]).toBe(BALL);
		expect(next[1]).toBe(roll[1]);
		expect(next[3]).toBe(roll[3]);
	});
});
