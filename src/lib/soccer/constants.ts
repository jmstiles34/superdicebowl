import { OPPOSITE_TEAM, TEAM } from '$lib/shared/constants';

// ── Dice symbols ─────────────────────────────────────────────
// Each die has 6 faces: 3× Ball, 1× Kick (cleat), 1× Penalty (whistle),
// 1× Red Card. So Ball is rolled with probability 1/2, the rest 1/6 each.

export const SOCCER_SYMBOL = {
	BALL: 'ball',
	KICK: 'kick',
	PENALTY: 'penalty',
	RED_CARD: 'redCard'
} as const;

export const DIE_FACES: string[] = [
	SOCCER_SYMBOL.BALL,
	SOCCER_SYMBOL.BALL,
	SOCCER_SYMBOL.BALL,
	SOCCER_SYMBOL.KICK,
	SOCCER_SYMBOL.PENALTY,
	SOCCER_SYMBOL.RED_CARD
];

// Intra-team tie-break: when a team's 6 dice tie between two symbols, the
// "best play" is selected. Lower index = better. (Rules only specify
// Kick > Ball; the rest is our chosen ordering — Penalty is the strongest
// offensive outcome, Ball the weakest.)
export const PLAY_PRIORITY: string[] = [
	SOCCER_SYMBOL.PENALTY,
	SOCCER_SYMBOL.KICK,
	SOCCER_SYMBOL.RED_CARD,
	SOCCER_SYMBOL.BALL
];

// ── Dice counts ──────────────────────────────────────────────

export const DICE_PER_TEAM = 6;
export const RED_CARD_DICE_PENALTY = 1;
export const MIN_DICE = 1;

// ── Ball Move thresholds ─────────────────────────────────────
// A Ball play advances 1 section at 4 balls, 2 sections at 5, and is an
// instant goal at 6. Fewer than 4 matching balls moves the ball 0 sections.
export const BALL_MOVE_ONE = 4;
export const BALL_MOVE_TWO = 5;
export const BALL_MOVE_GOAL = 6;

// ── Field geometry ───────────────────────────────────────────
// The pitch is 8 sections, indexed 0..7 left→right. Sections 0..3 are
// Home's half (Home defends the index-0 goal, attacks toward index 7);
// sections 4..7 are Away's half (Away defends the index-7 goal, attacks
// toward index 0). The midline sits between sections 3 and 4.

export const SECTION_COUNT = 8;
export const LAST_SECTION = SECTION_COUNT - 1;
export const HOME_HALF_MAX = 3; // highest section index still in Home's half

// Direction each team advances the ball when it moves in their favour.
export const ATTACK_DIR: Record<string, number> = {
	[TEAM.HOME]: 1,
	[TEAM.AWAY]: -1
};

// The section a team occupies the instant it crosses the midline onto the
// attack (offense). Home enters Away's half at 4; Away enters Home's half at 3.
export const MIDLINE_ENTRY: Record<string, number> = {
	[TEAM.HOME]: 4,
	[TEAM.AWAY]: 3
};

// ── Pitch geometry ───────────────────────────────────────────
// The pitch uses the coordinate system -212..212 × -145..145 (a 424×290 board);
// the grass playing surface spans x = -190..190 (width 380). These let us place
// the ball marker as a percentage of the rendered pitch. Pitch.svelte draws the
// field from the same geometry, so the markings and the ball share one frame.
export const FIELD_VIEWBOX_MIN_X = -212;
export const FIELD_VIEWBOX_WIDTH = 424;
export const FIELD_PLAY_MIN_X = -190;
export const FIELD_PLAY_WIDTH = 380;
export const FIELD_SECTION_WIDTH = FIELD_PLAY_WIDTH / SECTION_COUNT;
export const FIELD_MIDLINE_PERCENT = 50;
export const FIELD_VERTICAL_CENTER_PERCENT = 50;

// ── Ball marker roll ─────────────────────────────────────────
// The ball marker renders at this fraction of the pitch width (must match the
// `.ball` width in Field.svelte). A rolling ball turns a full 360° for every
// circumference (π · diameter) it travels, so spinning it this many degrees
// per 1% of pitch width crossed gives a physically-grounded roll.
export const BALL_WIDTH_PERCENT = 6;
export const BALL_ROLL_DEGREES_PER_PERCENT = 360 / (Math.PI * BALL_WIDTH_PERCENT);

// ── Ball skins ───────────────────────────────────────────────
// Selectable on-field ball designs live in $lib/images/balls (enumerated by
// lib/soccer/ballDesigns.ts). Clicking the ball cycles through them and the
// choice persists as a user preference. Keyed by filename without extension.
// Kept here (asset-free) so the preferences layer can reference the default
// without pulling the image glob into every sport's bundle.
export const DEFAULT_BALL_DESIGN = 'soccer-ball-02';

// ── Actions ──────────────────────────────────────────────────

export const GAME_ACTION = {
	COIN_TOSS: 'Coin Toss',
	ROLL_OFF: 'Roll Off',
	POWER_CHIP_TIE: 'Power Chip',
	SHOT_ON_GOAL: 'Shot on Goal',
	PENALTY_SHOT: 'Penalty Shot',
	FREE_KICK: 'Free Kick',
	GOAL: 'Goal',
	GAME_OVER: 'Game Over',
	EXIT: 'Exit Game'
};

// How long the ball-into-the-net celebration animation holds before the ball
// is reset to the kickoff position and the next round opens.
export const GOAL_CELEBRATION_MS = 1300;

// The starting defender's ball section (first section past midline on the
// defender's own half). Derived from MIDLINE_ENTRY of the opponent.
export function startSection(defender: string): number {
	return MIDLINE_ENTRY[OPPOSITE_TEAM[defender]];
}

// ── Default game state ───────────────────────────────────────

export const DEFAULT_SOCCER_GAME = {
	sport: 'soccer' as const,
	action: GAME_ACTION.COIN_TOSS,
	lastPlay: '',
	modalContent: null as string | null,
	paused: false,
	playLog: [] as unknown[],
	possession: TEAM.AWAY,
	restrictDice: false,
	ballSection: MIDLINE_ENTRY[TEAM.AWAY],
	scores: {
		away: 0,
		home: 0
	},
	powerChipHolder: TEAM.HOME,
	diceReduction: {
		away: 0,
		home: 0
	},
	pendingShot: null as 'shot' | 'freeKick' | 'penalty' | null
};
