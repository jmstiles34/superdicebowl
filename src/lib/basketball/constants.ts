import type { Quarter } from '$lib/basketball/types';

export const GAME_ACTION = {
	TIP_OFF: 'Tip Off',
	OFFENSE: 'Offense',
	FREE_THROW: 'Free Throw',
	GAME_OVER: 'Game Over',
	EXIT: 'Exit Game'
};

export const MAX_QUARTERS = 4;

export const QUARTER_ORD = ['1ST', '2ND', '3RD', '4TH'] as const;

export const DEFAULT_BASKETBALL_GAME = {
	sport: 'basketball' as const,
	action: GAME_ACTION.TIP_OFF,
	lastPlay: '',
	modalContent: null as string | null,
	paused: false,
	playLog: [] as unknown[],
	possession: 'Away',
	restrictDice: false,
	quarter: 1 as Quarter,
	scores: {
		away: [0, 0, 0, 0] as number[],
		home: [0, 0, 0, 0] as number[]
	},
	fouls: {
		away: 0,
		home: 0
	},
	turnovers: {
		away: 0,
		home: 0
	},
	shotClock: false
};
