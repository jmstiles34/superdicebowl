export const GAME_ACTION = {
	COIN_TOSS: 'Coin Toss',
	OFFENSE: 'Offense',
	FREE_THROW: 'Free Throw',
	GAME_OVER: 'Game Over',
	EXIT: 'Exit Game'
};

export const MAX_TEAM_FOULS = 5;
export const BONUS_FREE_THROWS = 2;

export const DEFAULT_BASKETBALL_GAME = {
	sport: 'basketball' as const,
	action: GAME_ACTION.COIN_TOSS,
	lastPlay: '',
	modalContent: null as string | null,
	paused: false,
	playLog: [] as unknown[],
	possession: 'Away',
	restrictDice: false,
	diceId: 0,
	scores: {
		away: 0,
		home: 0
	},
	fouls: {
		away: 0,
		home: 0
	},
	freeThrowsRemaining: 0,
	freeThrowsScored: 0
};
