import type { Period } from '$lib/hockey/types';

export const GAME_ACTION = {
	FACE_OFF: 'Face Off',
	OFFENSE: 'Offense',
	POWER_PLAY: 'Power Play',
	PENALTY_KILL: 'Penalty Kill',
	GAME_OVER: 'Game Over',
	EXIT: 'Exit Game'
};

export const MAX_PERIODS = 3;

export const PERIOD_ORD = ['1ST', '2ND', '3RD'] as const;

export const DEFAULT_HOCKEY_GAME = {
	sport: 'hockey' as const,
	action: GAME_ACTION.FACE_OFF,
	lastPlay: '',
	modalContent: null as string | null,
	paused: false,
	playLog: [] as unknown[],
	possession: 'Away',
	restrictDice: false,
	period: 1 as Period,
	scores: {
		away: [0, 0, 0] as number[],
		home: [0, 0, 0] as number[]
	},
	shotsOnGoal: {
		away: 0,
		home: 0
	},
	penaltyMinutes: {
		away: 0,
		home: 0
	},
	powerPlay: false
};
