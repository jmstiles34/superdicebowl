import type { BaseName, Half } from '$lib/baseball/types';

export const GAME_ACTION = {
	PITCH: 'Pitch',
	GAME_OVER: 'Game Over',
	EXIT: 'Exit Game'
};

export const MAX_INNINGS = 9;
export const MAX_OUTS = 3;
export const MAX_BALLS = 4;
export const MAX_STRIKES = 3;

export const INN_ORD = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH'] as const;

export const BASE_ORDER: BaseName[] = ['first', 'second', 'third'];

export const DEFAULT_BASES: Record<BaseName, boolean> = {
	first: false,
	second: false,
	third: false
};

export const DEFAULT_BASEBALL_GAME = {
	sport: 'baseball' as const,
	action: GAME_ACTION.PITCH,
	lastPlay: '',
	modalContent: null as string | null,
	paused: false,
	playLog: [] as unknown[],
	possession: 'Away',
	restrictDice: false,
	inning: 1,
	half: 'top' as Half,
	outs: 0,
	balls: 0,
	strikes: 0,
	bases: { ...DEFAULT_BASES },
	scores: {
		vis: Array<number | null>(9).fill(null) as (number | null)[],
		hom: Array<number | null>(9).fill(null) as (number | null)[]
	},
	totals: {
		vis: { r: 0, h: 0, e: 0 },
		hom: { r: 0, h: 0, e: 0 }
	}
};
