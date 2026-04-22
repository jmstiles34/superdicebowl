import {
	BONUS_FREE_THROWS,
	DEFAULT_BASKETBALL_GAME,
	GAME_ACTION,
	MAX_TEAM_FOULS
} from '$lib/basketball/constants';
import type { BasketballPlay } from '$lib/basketball/types';
import {
	classifyOutcome,
	defenseKey,
	isGameOver,
	lookupDiceResult,
	pickDescription,
	teamKey
} from '$lib/basketball/utils/game';
import type { BasketballGameStateSnapshot } from '$lib/db/database';
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

class BasketballGameState {
	// ── SportEngine reactive state ───────────────────────────
	action = $state(DEFAULT_BASKETBALL_GAME.action);
	lastPlay = $state(DEFAULT_BASKETBALL_GAME.lastPlay);
	modalContent: string | null = $state(DEFAULT_BASKETBALL_GAME.modalContent);
	paused = $state(DEFAULT_BASKETBALL_GAME.paused);
	playLog: BasketballPlay[] = $state(DEFAULT_BASKETBALL_GAME.playLog as BasketballPlay[]);
	possession = $state(DEFAULT_BASKETBALL_GAME.possession);
	restrictDice = $state(DEFAULT_BASKETBALL_GAME.restrictDice);
	diceId = $state(DEFAULT_BASKETBALL_GAME.diceId);

	// ── Persistence / lifecycle ──────────────────────────────
	activeGameId: number | null = $state(null);
	_saveGame: (() => Promise<void>) | null = null;
	private cancelExitAction = '';
	private sequenceId = 0;
	private _resumeResolve: (() => void) | null = null;

	// ── Basketball-specific state ────────────────────────────
	scores = $state({ ...DEFAULT_BASKETBALL_GAME.scores });
	fouls = $state({ ...DEFAULT_BASKETBALL_GAME.fouls });
	freeThrowsRemaining = $state(DEFAULT_BASKETBALL_GAME.freeThrowsRemaining);
	freeThrowsScored = $state(DEFAULT_BASKETBALL_GAME.freeThrowsScored);

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

	snapshotState = (): BasketballGameStateSnapshot =>
		$state.snapshot({
			sport: 'basketball' as const,
			action: this.action,
			lastPlay: this.lastPlay,
			modalContent: this.modalContent,
			possession: this.possession,
			restrictDice: this.restrictDice,
			playLog: this.playLog,
			diceId: this.diceId,
			scores: this.scores,
			fouls: this.fouls,
			freeThrowsRemaining: this.freeThrowsRemaining,
			freeThrowsScored: this.freeThrowsScored
		});

	loadSnapshot = (snapshot: BasketballGameStateSnapshot) => {
		this.action = snapshot.action;
		this.lastPlay = snapshot.lastPlay;
		this.modalContent = snapshot.modalContent;
		this.possession = snapshot.possession;
		this.restrictDice = snapshot.restrictDice;
		this.playLog = snapshot.playLog as BasketballPlay[];
		this.diceId = snapshot.diceId;
		this.scores = snapshot.scores;
		this.fouls = snapshot.fouls;
		this.freeThrowsRemaining = snapshot.freeThrowsRemaining;
		this.freeThrowsScored = snapshot.freeThrowsScored;
	};

	resetGame = () => {
		this.sequenceId++;
		this.action = DEFAULT_BASKETBALL_GAME.action;
		this.lastPlay = DEFAULT_BASKETBALL_GAME.lastPlay;
		this.modalContent = DEFAULT_BASKETBALL_GAME.modalContent;
		this.paused = false;
		this.playLog = [];
		this.possession = DEFAULT_BASKETBALL_GAME.possession;
		this.restrictDice = false;
		this.diceId = 0;
		this.activeGameId = null;
		this.scores = { away: 0, home: 0 };
		this.fouls = { away: 0, home: 0 };
		this.freeThrowsRemaining = 0;
		this.freeThrowsScored = 0;
	};

	// ── Coin toss ───────────────────────────────────────────

	saveCoinToss = (winner: string) => {
		this.action = GAME_ACTION.OFFENSE;
		this.possession = winner;
		this.modalContent = null;
	};

	// ── Dice roll dispatch ──────────────────────────────────

	handleDiceRoll = (_action: string, diceId: number) => {
		this.diceId = diceId;
		const roll = lookupDiceResult(diceId);
		if (!roll) return;

		const description = pickDescription(roll.description);
		const outcome = classifyOutcome(roll);

		switch (outcome) {
			case 'scoring':
				this.processScoring(roll.points, description);
				break;
			case 'scoring_and_one':
				this.processScoringAndOne(roll.points, roll.freeThrows ?? 1, description);
				break;
			case 'shooting_foul':
				this.processShootingFoul(roll.freeThrows ?? 2, description);
				break;
			case 'defensive_non_shooting_foul':
				this.processDefensiveNonShootingFoul(description);
				break;
			case 'offensive_foul':
				this.processOffensiveFoul(description);
				break;
			case 'turnover':
				this.processTurnover(description);
				break;
			case 'missed_shot':
				this.processMissedShot(description);
				break;
		}
	};

	continueAfterAction = () => {
		this.sequenceId++;
		const seqId = this.sequenceId;

		this.runChain(async () => {
			if (this.action === GAME_ACTION.GAME_OVER) return;

			// Check game over
			const result = isGameOver(this.scores.away, this.scores.home, settings.winScore);
			if (result.over && result.winner) {
				await this.delay(1500, seqId);
				this.gameComplete(result.winner);
				return;
			}

			// If entering free throw mode, don't unrestrict dice (modal handles input)
			if (this.action === GAME_ACTION.FREE_THROW) {
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

	// ── Free throw handling ─────────────────────────────────

	handleFreeThrow = (dieValue: number) => {
		const offense = this.offenseKey;
		if (dieValue % 2 === 0) {
			this.scores[offense]++;
			this.freeThrowsScored++;
		}
		this.freeThrowsRemaining--;

		this.lastPlay =
			dieValue % 2 === 0 ? `Free throw good! (${this.freeThrowsScored} made)` : 'Free throw missed';

		if (this.freeThrowsRemaining <= 0) {
			this.switchPossession();
			this.action = GAME_ACTION.OFFENSE;
		}
	};

	// ── Outcome handlers (private) ──────────────────────────

	private processScoring = (points: number, description: string) => {
		this.scores[this.offenseKey] += points;
		this.lastPlay = description;
		this.switchPossession();
		this.addPlay(description, points, false, false);
	};

	private processScoringAndOne = (points: number, freeThrows: number, description: string) => {
		this.scores[this.offenseKey] += points;
		this.fouls[this.defKey]++;
		this.freeThrowsRemaining = freeThrows;
		this.freeThrowsScored = 0;
		this.lastPlay = `${description} — And one!`;
		this.action = GAME_ACTION.FREE_THROW;
		this.addPlay(description, points, true, false);
	};

	private processShootingFoul = (freeThrows: number, description: string) => {
		this.fouls[this.defKey]++;
		this.freeThrowsRemaining = freeThrows;
		this.freeThrowsScored = 0;
		this.lastPlay = description;
		this.action = GAME_ACTION.FREE_THROW;
		this.addPlay(description, 0, true, false);
	};

	private processDefensiveNonShootingFoul = (description: string) => {
		this.fouls[this.defKey]++;

		if (this.fouls[this.defKey] >= MAX_TEAM_FOULS) {
			this.fouls[this.defKey] = 0;
			this.freeThrowsRemaining = BONUS_FREE_THROWS;
			this.freeThrowsScored = 0;
			this.action = GAME_ACTION.FREE_THROW;
			this.lastPlay = `${description} — Bonus!`;
		} else {
			this.lastPlay = description;
			// Action stays OFFENSE, same team rolls again
		}

		this.addPlay(description, 0, true, false);
	};

	private processOffensiveFoul = (description: string) => {
		this.fouls[this.offenseKey]++;

		if (this.fouls[this.offenseKey] >= MAX_TEAM_FOULS) {
			this.fouls[this.offenseKey] = 0;
			this.switchPossession();
			// New offense (former defense) shoots bonus FTs
			this.freeThrowsRemaining = BONUS_FREE_THROWS;
			this.freeThrowsScored = 0;
			this.action = GAME_ACTION.FREE_THROW;
			this.lastPlay = `${description} — Bonus free throws!`;
		} else {
			this.switchPossession();
			this.lastPlay = description;
		}

		this.addPlay(description, 0, true, true);
	};

	private processTurnover = (description: string) => {
		this.switchPossession();
		this.lastPlay = description;
		this.addPlay(description, 0, false, true);
	};

	private processMissedShot = (description: string) => {
		this.switchPossession();
		this.lastPlay = description;
		this.addPlay(description, 0, false, false);
	};

	// ── Helpers (private) ───────────────────────────────────

	private switchPossession = () => {
		this.possession = OPPOSITE_TEAM[this.possession];
	};

	private addPlay = (
		description: string,
		pointsScored: number,
		isFoul: boolean,
		isTurnover: boolean
	) => {
		const play: BasketballPlay = {
			team: this.possession,
			diceId: this.diceId,
			description,
			pointsScored,
			isFoul,
			isTurnover
		};
		this.playLog = [...this.playLog, play];
	};
}

export const game = new BasketballGameState();

// Compile-time check: BasketballGameState satisfies SportEngine
null as unknown as BasketballGameState satisfies SportEngine;
