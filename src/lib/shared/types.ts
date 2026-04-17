export type SportType = 'football' | 'baseball';

interface Colors {
	primary: string;
	secondary: string;
	faceMask?: string;
	helmet?: string;
	stripe?: string;
	tertiary?: string;
	trim?: string;
}

export interface Team {
	id: string;
	city: string;
	cityKey: string;
	colors: Colors;
	isCustom?: boolean;
	fieldLogo?: string;
	logo: string;
	logoFixed?: boolean;
	logoHeight?: number;
	logoLeft?: string;
	logoRotation?: number;
	logoWidth?: number;
	logoX?: number;
	logoY?: number;
	name: string;
}

export interface Logo {
	name: string;
	file: string;
}

export type Modal = (value: string) => void;

export type SaveTeam = (a: Team) => void;

export type Void = () => void;

/**
 * Structural contract that every sport's game engine must satisfy.
 *
 * Routes and shared components program against this shape so they work
 * with any sport. Each sport's `game.svelte.ts` class implements it
 * naturally — no `implements` clause needed, TypeScript checks structurally.
 *
 * Sport-specific fields (e.g. `ballIndex`, `currentDown` for football;
 * `inning`, `outs` for baseball) live on the concrete class and are
 * accessed only by sport-specific routes and components.
 */
export interface SportEngine {
	// ── Reactive state consumed by shared UI ──────────────────
	action: string;
	lastPlay: string;
	modalContent: string | null;
	paused: boolean;
	playLog: unknown[];
	possession: string;
	restrictDice: boolean;

	// ── Persistence / lifecycle ───────────────────────────────
	activeGameId: number | null;
	setSaveGame(fn: () => Promise<void>): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	snapshotState(): any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	loadSnapshot(snapshot: any): void;
	resetGame(): void;

	// ── Dice / turn ──────────────────────────────────────────
	handleDiceRoll(action: string, diceId: number): void;
	continueAfterAction(): void;

	// ── Game flow ────────────────────────────────────────────
	gameComplete(winner: string): void;
	handleExitClick(): void;
	cancelExit(): void;
	pause(): void;
	resume(): void;
}
