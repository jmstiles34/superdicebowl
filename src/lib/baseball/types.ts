// ── Super Dice Bowl — shared types ───────────────────────────────────────────

export type Half = 'top' | 'bottom';
export type HitType = 'grounder' | 'liner' | 'flyball' | 'homerun';
export type SelectedHitType = HitType | 'random';
export type BatterHand = 'rh' | 'lh';
export type BaseName = 'first' | 'second' | 'third';
export type MowPattern =
	| ''
	| 'pat-wide-stripes'
	| 'pat-cross-cut'
	| 'pat-radial'
	| 'pat-diamond'
	| 'pat-fan';

export interface Zone {
	dx: number; // translate offset from home plate in #stadium space (left)
	dy: number; // translate offset from home plate in #stadium space (top, negative = outfield)
	label: string;
}

export interface GameCount {
	b: number; // balls  (0–4)
	s: number; // strikes (0–3)
	o: number; // outs   (0–3)
}

export interface TeamTotals {
	r: number; // runs
	h: number; // hits
	e: number; // errors
}

export interface GameState {
	inning: number; // 1–9
	half: Half; // 'top' = visitors batting, 'bottom' = home batting
	scores: {
		vis: (number | null)[]; // null = not yet played, number = runs scored
		hom: (number | null)[];
	};
	totals: {
		vis: TeamTotals;
		hom: TeamTotals;
	};
	count: GameCount;
}

export interface BaseballDiceRoll {
	id: number;
	isHit?: boolean;
	isOut?: boolean;
	outCount?: number;
	isSacrifice?: boolean;
	batterAdvancement?: number;
	runnerAdvancement?: number;
	description: string[];
}

/** A runner token in the reactive runners array. */
export interface RunnerToken {
	id: number;
	top: number; // position in #stadium local space
	left: number;
	scoring: boolean; // true while the score-flash CSS animation is running
}
