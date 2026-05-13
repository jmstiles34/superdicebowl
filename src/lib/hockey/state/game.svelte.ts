import type { HockeyGameStateSnapshot } from '$lib/db/database';
import { DEFAULT_HOCKEY_GAME, GAME_ACTION } from '$lib/hockey/constants';
import type { HockeyPlay } from '$lib/hockey/types';
import {
	classifyOutcome,
	defenseKey,
	isGameOver,
	isSaveSuccessful,
	lookupDiceResult,
	pickDescription,
	teamKey
} from '$lib/hockey/utils/game';
import { OPPOSITE_TEAM } from '$lib/shared/constants';
import type { SportEngine } from '$lib/shared/types';
import { settings } from '$lib/state/settings.svelte';
import { sleep } from '$lib/utils/common';

class CancelledError extends Error {
	constructor() {
		super('cancelled');
		this.name = 'CancelledError';
	}
}

class HockeyGameState {
	// ── SportEngine reactive state ───────────────────────────
	action = $state(DEFAULT_HOCKEY_GAME.action);
	lastPlay = $state(DEFAULT_HOCKEY_GAME.lastPlay);
	modalContent: string | null = $state(DEFAULT_HOCKEY_GAME.modalContent);
	paused = $state(DEFAULT_HOCKEY_GAME.paused);
	playLog: HockeyPlay[] = $state(DEFAULT_HOCKEY_GAME.playLog as HockeyPlay[]);
	possession = $state(DEFAULT_HOCKEY_GAME.possession);
	restrictDice = $state(DEFAULT_HOCKEY_GAME.restrictDice);
	diceId = $state(DEFAULT_HOCKEY_GAME.diceId);

	// ── Persistence / lifecycle ──────────────────────────────
	activeGameId: number | null = $state(null);
	_saveGame: (() => Promise<void>) | null = null;
	private cancelExitAction = '';
	private sequenceId = 0;
	private _resumeResolve: (() => void) | null = null;

	// ── Hockey-specific state ────────────────────────────────
	scores = $state({ ...DEFAULT_HOCKEY_GAME.scores });
	shotsOnGoal = $state({ ...DEFAULT_HOCKEY_GAME.shotsOnGoal });
	powerPlay = $state(DEFAULT_HOCKEY_GAME.powerPlay);

	// ── Derived helpers ─────────────────────────────────────
	get offenseKey(): 'away' | 'home' {
		return teamKey(this.possession);
	}

	get defKey(): 'away' | 'home' {
		return defenseKey(this.possession);
	}

	// ── Animation sequencing ────────────────────────────────

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

	// ── SportEngine methods ─────────────────────────────────

	setSaveGame = (fn: () => Promise<void>) => {
		this._saveGame = fn;
	};

	snapshotState = (): HockeyGameStateSnapshot =>
		$state.snapshot({
			sport: 'hockey' as const,
			action: this.action,
			lastPlay: this.lastPlay,
			modalContent: this.modalContent,
			possession: this.possession,
			restrictDice: this.restrictDice,
			playLog: this.playLog,
			diceId: this.diceId,
			scores: this.scores,
			shotsOnGoal: this.shotsOnGoal,
			powerPlay: this.powerPlay
		});

	loadSnapshot = (snapshot: HockeyGameStateSnapshot) => {
		this.action = snapshot.action;
		this.lastPlay = snapshot.lastPlay;
		this.modalContent = snapshot.modalContent;
		this.possession = snapshot.possession;
		this.restrictDice = snapshot.restrictDice;
		this.playLog = snapshot.playLog as HockeyPlay[];
		this.diceId = snapshot.diceId;
		this.scores = snapshot.scores;
		this.shotsOnGoal = snapshot.shotsOnGoal;
		this.powerPlay = snapshot.powerPlay;
	};

	resetGame = () => {
		this.sequenceId++;
		this.action = DEFAULT_HOCKEY_GAME.action;
		this.lastPlay = DEFAULT_HOCKEY_GAME.lastPlay;
		this.modalContent = DEFAULT_HOCKEY_GAME.modalContent;
		this.paused = false;
		this.playLog = [];
		this.possession = DEFAULT_HOCKEY_GAME.possession;
		this.restrictDice = false;
		this.diceId = 0;
		this.activeGameId = null;
		this.scores = { away: 0, home: 0 };
		this.shotsOnGoal = { away: 0, home: 0 };
		this.powerPlay = false;
	};

	// ── Coin toss ───────────────────────────────────────────

	saveCoinToss = (winner: string) => {
		this.action = GAME_ACTION.OFFENSE;
		this.possession = winner;
		this.modalContent = null;
	};

	// ── Dice roll dispatch (Phase 1: The Attack) ────────────

	handleDiceRoll = (_action: string, diceId: number) => {
		this.diceId = diceId;
		const roll = lookupDiceResult(diceId);
		if (!roll) return;

		const description = pickDescription(roll.description);
		const outcome = classifyOutcome(roll, this.powerPlay);

		switch (outcome) {
			case 'goal':
				this.processGoal(description);
				break;
			case 'penalty':
				this.processPenalty(description);
				break;
			case 'turnover':
				this.processTurnover(description);
				break;
			case 'shot_on_goal':
				this.processShotOnGoal(description);
				break;
			case 'pass':
				this.processPass(description);
				break;
		}
	};

	// ── Save roll (Phase 2: The Save) ───────────────────────

	handleSaveRoll = (dieValue: number, outcome?: 'save' | 'goal') => {
		const shootingTeam = this.offenseKey;
		this.shotsOnGoal[shootingTeam]++;

		const saved = outcome ? outcome === 'save' : isSaveSuccessful(dieValue);
		if (saved) {
			this.lastPlay = 'Save! Goalie makes the stop';
			this.addPlay('Save', 0, false, false, true);
		} else {
			this.scores[shootingTeam]++;
			this.lastPlay = 'Goal! Puck gets past the goalie!';
			this.addPlay('Goal (shot)', 1, false, false, true);
		}

		this.switchPossession();
		this.action = GAME_ACTION.OFFENSE;
	};

	continueAfterAction = () => {
		this.sequenceId++;
		const seqId = this.sequenceId;

		this.runChain(async () => {
			if (this.action === GAME_ACTION.GAME_OVER) return;

			const result = isGameOver(this.scores.away, this.scores.home, settings.winScore);
			if (result.over && result.winner) {
				await this.delay(1500, seqId);
				this.gameComplete(result.winner);
				return;
			}

			if (this.action === GAME_ACTION.SAVE_ATTEMPT) {
				await this.save();
				return;
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

	// ── Outcome handlers (private) ──────────────────────────

	private processGoal = (description: string) => {
		this.scores[this.offenseKey]++;
		this.lastPlay = description;
		this.switchPossession();
		this.addPlay(description, 1, false, false, false);
	};

	private processPenalty = (description: string) => {
		this.lastPlay = `${description} — Power play!`;
		this.switchPossession();
		this.powerPlay = true;
		this.addPlay(description, 0, true, false, false);
	};

	private processTurnover = (description: string) => {
		this.lastPlay = description;
		this.switchPossession();
		this.addPlay(description, 0, false, true, false);
	};

	private processShotOnGoal = (description: string) => {
		this.lastPlay = `${description} — Save attempt!`;
		this.action = GAME_ACTION.SAVE_ATTEMPT;
		this.addPlay(description, 0, false, false, true);
	};

	private processPass = (description: string) => {
		this.lastPlay = description;
		// Offense keeps possession, rolls again — action stays OFFENSE
		this.addPlay(description, 0, false, false, false);
	};

	// ── Helpers (private) ───────────────────────────────────

	private switchPossession = () => {
		this.possession = OPPOSITE_TEAM[this.possession];
		this.powerPlay = false;
	};

	private addPlay = (
		description: string,
		goalsScored: number,
		isPenalty: boolean,
		isTurnover: boolean,
		isShot: boolean
	) => {
		const play: HockeyPlay = {
			team: this.possession,
			diceId: this.diceId,
			description,
			goalsScored,
			isPenalty,
			isTurnover,
			isShot
		};
		this.playLog = [...this.playLog, play];
	};
}

export const game = new HockeyGameState();

// Compile-time check: HockeyGameState satisfies SportEngine
null as unknown as HockeyGameState satisfies SportEngine;
