export const GAME_ACTION = {
	COIN_TOSS: 'Coin Toss',
	OFFENSE: 'Offense',
	SAVE_ATTEMPT: 'Save Attempt',
	GAME_OVER: 'Game Over',
	EXIT: 'Exit Game'
};

export const SAVE_GOAL_THRESHOLD = 3;

export const DEFAULT_HOCKEY_GAME = {
	sport: 'hockey' as const,
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
	shotsOnGoal: {
		away: 0,
		home: 0
	},
	powerPlay: false
};
