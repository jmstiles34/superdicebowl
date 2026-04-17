import { GAME_ACTION, MAX_OUTS } from '$lib/baseball/constants';
import type { BaseballDiceRoll, BaseName, Half } from '$lib/baseball/types';
import {
	advanceRunners,
	isGameOver,
	isInningOver,
	lookupDiceResult,
	pickDescription,
	processDoublePlay,
	processSacrifice,
	processWalk
} from '$lib/baseball/utils/game';
import type { BaseballGameStateSnapshot } from '$lib/db/database';
import type { SportEngine } from '$lib/shared/types';
import { settings } from '$lib/state/settings.svelte';
import { sleep } from '$lib/utils/common';

export { INN_ORD } from '$lib/baseball/constants';

export interface BaseballPlay {
	inning: number;
	half: Half;
	team: 'vis' | 'hom';
	diceId: number;
	description: string;
	runsScored: number;
	isHit: boolean;
	isOut: boolean;
}

class CancelledError extends Error {
	constructor() {
		super('cancelled');
		this.name = 'CancelledError';
	}
}

class BaseballGameState {
	// ── SportEngine reactive state ───────────────────────────
	action = $state(GAME_ACTION.PITCH);
	lastPlay = $state('');
	modalContent: string | null = $state(null);
	paused = $state(false);
	playLog: BaseballPlay[] = $state([]);
	possession = $state('Away');
	restrictDice = $state(false);
	diceId = $state(0);

	// ── Persistence / lifecycle ──────────────────────────────
	activeGameId: number | null = $state(null);
	_saveGame: (() => Promise<void>) | null = null;
	private cancelExitAction = '';
	private sequenceId = 0;
	private _resumeResolve: (() => void) | null = null;

	// ── Baseball-specific state ──────────────────────────────
	inning = $state(1);
	half: Half = $state('top');
	outs = $state(0);
	balls = $state(0);
	strikes = $state(0);

	bases = $state<Record<BaseName, boolean>>({
		first: false,
		second: false,
		third: false
	});

	scores = $state({
		vis: Array<number | null>(9).fill(null) as (number | null)[],
		hom: Array<number | null>(9).fill(null) as (number | null)[]
	});

	totals = $state({
		vis: { r: 0, h: 0, e: 0 },
		hom: { r: 0, h: 0, e: 0 }
	});

	// ── Derived helpers ──────────────────────────────────────
	get battingTeam(): 'vis' | 'hom' {
		return this.half === 'top' ? 'vis' : 'hom';
	}

	// ── Animation sequencing (mirrors football pattern) ──────

	private delay = async (ms: number, seqId: number): Promise<void> => {
		await this.waitForResume();
		await sleep(ms * settings.speed);
		await this.waitForResume();
		if (this.sequenceId !== seqId) {
			throw new CancelledError();
		}
	};

	private waitForResume = (): Promise<void> => {
		if (!this.paused) return Promise.resolve();
		return new Promise((resolve) => {
			this._resumeResolve = resolve;
		});
	};

	private runChain = (fn: () => Promise<void>) => {
		fn().catch((e) => {
			if (!(e instanceof CancelledError)) throw e;
		});
	};

	private save = async () => {
		await this._saveGame?.();
	};

	// ── SportEngine methods ──────────────────────────────────

	setSaveGame = (fn: () => Promise<void>) => {
		this._saveGame = fn;
	};

	snapshotState = (): BaseballGameStateSnapshot =>
		$state.snapshot({
			sport: 'baseball' as const,
			action: this.action,
			lastPlay: this.lastPlay,
			modalContent: this.modalContent,
			possession: this.possession,
			restrictDice: this.restrictDice,
			playLog: this.playLog,
			inning: this.inning,
			half: this.half,
			outs: this.outs,
			balls: this.balls,
			strikes: this.strikes,
			bases: [this.bases.first, this.bases.second, this.bases.third] as [boolean, boolean, boolean],
			scores: this.scores,
			totals: this.totals
		});

	loadSnapshot = (snapshot: BaseballGameStateSnapshot) => {
		this.action = snapshot.action;
		this.lastPlay = snapshot.lastPlay;
		this.modalContent = snapshot.modalContent;
		this.possession = snapshot.possession;
		this.restrictDice = snapshot.restrictDice;
		this.playLog = snapshot.playLog as BaseballPlay[];
		this.inning = snapshot.inning;
		this.half = snapshot.half;
		this.outs = snapshot.outs;
		this.balls = snapshot.balls;
		this.strikes = snapshot.strikes;
		this.bases.first = snapshot.bases[0];
		this.bases.second = snapshot.bases[1];
		this.bases.third = snapshot.bases[2];
		this.scores = snapshot.scores;
		this.totals = snapshot.totals;
	};

	resetGame = () => {
		this.sequenceId++;
		this.action = GAME_ACTION.PITCH;
		this.lastPlay = '';
		this.modalContent = null;
		this.paused = false;
		this.playLog = [];
		this.possession = 'Away';
		this.restrictDice = false;
		this.diceId = 0;
		this.activeGameId = null;
		this.inning = 1;
		this.half = 'top';
		this.outs = 0;
		this.balls = 0;
		this.strikes = 0;
		this.bases.first = false;
		this.bases.second = false;
		this.bases.third = false;
		this.scores = {
			vis: Array<number | null>(9).fill(null) as (number | null)[],
			hom: Array<number | null>(9).fill(null) as (number | null)[]
		};
		this.totals = {
			vis: { r: 0, h: 0, e: 0 },
			hom: { r: 0, h: 0, e: 0 }
		};
	};

	handleDiceRoll = (_action: string, diceId: number) => {
		this.diceId = diceId;
		const result = lookupDiceResult(diceId);
		if (!result) return;

		const description = pickDescription(result.description);

		if (result.isHit) {
			this.processHit(result, description);
		} else if (result.isOut) {
			this.processOut(result, description);
		} else if (result.batterAdvancement === 1) {
			// Walk (no isHit, no isOut, batter to 1st)
			this.processWalkResult(description);
		}
	};

	continueAfterAction = () => {
		this.sequenceId++;
		const seqId = this.sequenceId;

		this.runChain(async () => {
			if (this.action === GAME_ACTION.GAME_OVER) return;

			// Check game over after each play
			const gameOver = isGameOver(
				this.inning,
				this.half,
				this.outs,
				this.totals.vis.r,
				this.totals.hom.r
			);

			if (gameOver.over && gameOver.winner) {
				await this.delay(1500, seqId);
				const winner = gameOver.winner === 'hom' ? 'Home' : 'Away';
				this.gameComplete(winner);
				return;
			}

			// Check if half-inning is over
			if (isInningOver(this.outs)) {
				await this.delay(1500, seqId);
				this.endHalfInning();

				// After half-inning change, check if game is over
				// (e.g. home leads after top of 9th — skip bottom)
				const postChange = isGameOver(
					this.inning,
					this.half,
					0,
					this.totals.vis.r,
					this.totals.hom.r
				);
				if (postChange.over && postChange.winner) {
					await this.delay(1000, seqId);
					const winner = postChange.winner === 'hom' ? 'Home' : 'Away';
					this.gameComplete(winner);
					return;
				}
			}

			this.restrictDice = false;
			await this.save();
		});
	};

	gameComplete = (winner: string) => {
		this.action = GAME_ACTION.GAME_OVER;
		this.lastPlay = `${winner} Wins!`;
		this.restrictDice = true;
	};

	handleExitClick = () => {
		this.cancelExitAction = this.action;
		this.action = GAME_ACTION.EXIT;
	};

	cancelExit = () => {
		this.action = this.cancelExitAction;
	};

	pause = () => {
		this.paused = true;
	};

	resume = () => {
		this.paused = false;
		this._resumeResolve?.();
		this._resumeResolve = null;
	};

	// ── Dice result processing (private) ─────────────────────

	private applyBases = (newBases: Record<BaseName, boolean>) => {
		this.bases.first = newBases.first;
		this.bases.second = newBases.second;
		this.bases.third = newBases.third;
	};

	private processHit = (result: BaseballDiceRoll, description: string) => {
		const batterAdv = result.batterAdvancement ?? 1;
		const runnerAdv = result.runnerAdvancement ?? batterAdv;

		const { bases, runsScored } = advanceRunners(this.bases, batterAdv, runnerAdv);
		this.applyBases(bases);

		// Record the hit
		this.totals[this.battingTeam].h++;

		// Record runs
		for (let i = 0; i < runsScored; i++) {
			this.recordRun();
		}

		this.balls = 0;
		this.strikes = 0;
		this.lastPlay =
			runsScored > 0
				? `${description} (${runsScored} run${runsScored > 1 ? 's' : ''})`
				: description;

		this.addPlay(description, runsScored, true, false);
	};

	private processOut = (result: BaseballDiceRoll, description: string) => {
		const outCount = result.outCount ?? 1;

		if (outCount >= 2) {
			// Double play
			const { bases, outsRecorded } = processDoublePlay(this.bases);
			this.applyBases(bases);
			const actualOuts = Math.min(outsRecorded, MAX_OUTS - this.outs);
			this.outs += actualOuts;
		} else if (result.isSacrifice && result.runnerAdvancement) {
			// Sacrifice fly — batter out, runners advance
			this.outs++;
			const { bases, runsScored } = processSacrifice(this.bases, result.runnerAdvancement);
			this.applyBases(bases);
			for (let i = 0; i < runsScored; i++) {
				this.recordRun();
			}
			this.lastPlay =
				runsScored > 0
					? `${description} - Sacrifice (${runsScored} run${runsScored > 1 ? 's' : ''})`
					: `${description} - Sacrifice`;
			this.balls = 0;
			this.strikes = 0;
			this.addPlay(description, runsScored, false, true);
			return;
		} else {
			// Simple out (strikeout, groundout, flyout, popout)
			this.outs++;
		}

		this.balls = 0;
		this.strikes = 0;
		this.lastPlay = description;

		this.addPlay(description, 0, false, true);
	};

	private processWalkResult = (description: string) => {
		const { bases, runsScored } = processWalk(this.bases);
		this.applyBases(bases);

		for (let i = 0; i < runsScored; i++) {
			this.recordRun();
		}

		this.balls = 0;
		this.strikes = 0;
		this.lastPlay =
			runsScored > 0
				? `${description} (${runsScored} run${runsScored > 1 ? 's' : ''})`
				: description;

		this.addPlay(description, runsScored, false, false);
	};

	// ── Baseball business logic ──────────────────────────────

	private addPlay = (description: string, runsScored: number, isHit: boolean, isOut: boolean) => {
		const play: BaseballPlay = {
			inning: this.inning,
			half: this.half,
			team: this.battingTeam,
			diceId: this.diceId,
			description,
			runsScored,
			isHit,
			isOut
		};
		this.playLog = [...this.playLog, play];
	};

	recordRun = () => {
		const team = this.battingTeam;
		const idx = this.inning - 1;
		this.totals[team].r++;
		this.scores[team][idx] = (this.scores[team][idx] ?? 0) + 1;
	};

	recordHit = () => {
		const team = this.battingTeam;
		this.totals[team].h++;
		this.balls = 0;
		this.strikes = 0;
	};

	endHalfInning = () => {
		const idx = this.inning - 1;
		if (this.half === 'top') {
			if (this.scores.vis[idx] === null) this.scores.vis[idx] = 0;
			this.half = 'bottom';
			this.possession = 'Home';
		} else {
			if (this.scores.hom[idx] === null) this.scores.hom[idx] = 0;
			if (this.inning < 9) {
				this.inning++;
				this.half = 'top';
				this.possession = 'Away';
			}
		}
		this.outs = 0;
		this.balls = 0;
		this.strikes = 0;
		this.bases.first = false;
		this.bases.second = false;
		this.bases.third = false;
		this.lastPlay = '';
	};

	addBall = () => {
		this.balls = (this.balls + 1) % 5;
	};

	addStrike = () => {
		this.strikes = (this.strikes + 1) % 4;
	};

	addOut = (): boolean => {
		if (this.outs >= 3) return false;
		this.outs++;
		return this.outs === 3;
	};
}

export const game = new BaseballGameState();

// Compile-time check: BaseballGameState satisfies SportEngine
null as unknown as BaseballGameState satisfies SportEngine;
