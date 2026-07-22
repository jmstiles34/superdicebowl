import type { SoccerGameStateSnapshot } from '$lib/db/database';
import { OPPOSITE_TEAM, TEAM } from '$lib/shared/constants';
import type { SportEngine } from '$lib/shared/types';
import {
	DEFAULT_SOCCER_GAME,
	GAME_ACTION,
	GOAL_CELEBRATION_MS,
	MIN_DICE,
	RED_CARD_DICE_PENALTY,
	SOCCER_SYMBOL,
	startSection
} from '$lib/soccer/constants';
import type { SoccerPlay, SoccerRoll, TeamPlay } from '$lib/soccer/types';
import {
	applyReroll,
	bestPlay,
	clearToMidline,
	compareCounts,
	countSymbols,
	effectiveDiceCount,
	isGameOver,
	justPastMidline,
	offenseTeam,
	redCardAdvance,
	resolveBallMove,
	resolveShot,
	rollDice,
	teamKey
} from '$lib/soccer/utils/game';
import { settings } from '$lib/state/settings.svelte';
import { sleep } from '$lib/utils/common';

class CancelledError extends Error {
	constructor() {
		super('cancelled');
		this.name = 'CancelledError';
	}
}

type TieKind = 'round' | 'shot';

class SoccerGameState {
	// ── SportEngine reactive state ───────────────────────────
	action = $state(DEFAULT_SOCCER_GAME.action);
	lastPlay = $state(DEFAULT_SOCCER_GAME.lastPlay);
	modalContent: string | null = $state(DEFAULT_SOCCER_GAME.modalContent);
	paused = $state(DEFAULT_SOCCER_GAME.paused);
	playLog: SoccerPlay[] = $state(DEFAULT_SOCCER_GAME.playLog as SoccerPlay[]);
	possession = $state(DEFAULT_SOCCER_GAME.possession);
	restrictDice = $state(DEFAULT_SOCCER_GAME.restrictDice);

	// ── Soccer-specific persisted state ──────────────────────
	ballSection = $state(DEFAULT_SOCCER_GAME.ballSection);
	scores = $state({ ...DEFAULT_SOCCER_GAME.scores });
	powerChipHolder = $state(DEFAULT_SOCCER_GAME.powerChipHolder);
	diceReduction = $state({ ...DEFAULT_SOCCER_GAME.diceReduction });
	pendingShot: 'shot' | 'freeKick' | 'penalty' | null = $state(DEFAULT_SOCCER_GAME.pendingShot);

	// ── Transient round state (not persisted) ────────────────
	awayRoll: SoccerRoll | null = $state(null);
	homeRoll: SoccerRoll | null = $state(null);
	chipRerollUsed = $state(false);
	// The team a goal was just scored by while the net celebration plays, else
	// null. Drives the Field ball-into-net animation; not persisted.
	goalScorer: string | null = $state(null);
	private tieKind: TieKind = 'round';

	// ── Persistence / lifecycle ──────────────────────────────
	activeGameId: number | null = $state(null);
	_saveGame: (() => Promise<void>) | null = null;
	private cancelExitAction = '';
	private sequenceId = 0;
	private _resumeResolve: (() => void) | null = null;

	// ── Derived helpers ──────────────────────────────────────
	get offenseTeamName(): string {
		return this.possession;
	}

	get defenseTeamName(): string {
		return OPPOSITE_TEAM[this.possession];
	}

	get chipHolderIsOffense(): boolean {
		return this.powerChipHolder === this.possession;
	}

	// The team whose dice we're waiting on: offense rolls first, then defense.
	get nextRoller(): string | null {
		if (this.rollFor(this.offenseTeamName) == null) return this.offenseTeamName;
		if (this.rollFor(this.defenseTeamName) == null) return this.defenseTeamName;
		return null;
	}

	get bothRolled(): boolean {
		return this.awayRoll != null && this.homeRoll != null;
	}

	private rollFor(team: string): SoccerRoll | null {
		return teamKey(team) === 'away' ? this.awayRoll : this.homeRoll;
	}

	private setRoll(team: string, roll: SoccerRoll) {
		if (teamKey(team) === 'away') this.awayRoll = roll;
		else this.homeRoll = roll;
	}

	// The ball position is the single source of truth for who is attacking.
	private setBall(section: number) {
		this.ballSection = section;
		this.possession = offenseTeam(section);
	}

	// The user-facing name for a side (the nation), used in play descriptions.
	private displayName = (team: string): string => {
		const info = team === TEAM.AWAY ? settings.awayTeam : settings.homeTeam;
		return info.city || team;
	};

	// ── Animation sequencing (mirrors hockey) ────────────────

	private delay = async (ms: number, seqId: number): Promise<void> => {
		await this.waitForResume();
		await sleep(ms * settings.speed);
		await this.waitForResume();
		if (this.sequenceId !== seqId) throw new CancelledError();
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

	snapshotState = (): SoccerGameStateSnapshot =>
		$state.snapshot({
			sport: 'soccer' as const,
			action: this.action,
			lastPlay: this.lastPlay,
			modalContent: this.modalContent,
			possession: this.possession,
			restrictDice: this.restrictDice,
			playLog: this.playLog,
			ballSection: this.ballSection,
			scores: this.scores,
			powerChipHolder: this.powerChipHolder,
			diceReduction: this.diceReduction,
			pendingShot: this.pendingShot
		});

	loadSnapshot = (snapshot: SoccerGameStateSnapshot) => {
		this.action = this.resumableAction(snapshot.action);
		this.lastPlay = snapshot.lastPlay;
		this.modalContent = snapshot.modalContent;
		this.possession = snapshot.possession;
		this.restrictDice = snapshot.restrictDice;
		this.playLog = snapshot.playLog as SoccerPlay[];
		this.ballSection = snapshot.ballSection;
		this.scores = snapshot.scores;
		this.powerChipHolder = snapshot.powerChipHolder;
		this.diceReduction = snapshot.diceReduction;
		this.pendingShot = null;
		this.goalScorer = null;
		this.clearRolls();
	};

	// A mid-round decision state can't be resumed cleanly — restart the round.
	private resumableAction(action: string): string {
		const resumable: string[] = [
			GAME_ACTION.COIN_TOSS,
			GAME_ACTION.ROLL_OFF,
			GAME_ACTION.GAME_OVER
		];
		return resumable.includes(action) ? action : GAME_ACTION.ROLL_OFF;
	}

	resetGame = () => {
		this.sequenceId++;
		this.action = DEFAULT_SOCCER_GAME.action;
		this.lastPlay = DEFAULT_SOCCER_GAME.lastPlay;
		this.modalContent = DEFAULT_SOCCER_GAME.modalContent;
		this.paused = false;
		this.playLog = [];
		this.possession = DEFAULT_SOCCER_GAME.possession;
		this.restrictDice = false;
		this.ballSection = DEFAULT_SOCCER_GAME.ballSection;
		this.scores = { ...DEFAULT_SOCCER_GAME.scores };
		this.powerChipHolder = DEFAULT_SOCCER_GAME.powerChipHolder;
		this.diceReduction = { ...DEFAULT_SOCCER_GAME.diceReduction };
		this.pendingShot = null;
		this.goalScorer = null;
		this.activeGameId = null;
		this.clearRolls();
	};

	// ── Coin toss ────────────────────────────────────────────
	// `winner` starts on offense; the opponent defends, holds the power chip,
	// and the ball starts one section into their half.

	saveCoinToss = (winner: string) => {
		const defender = OPPOSITE_TEAM[winner];
		this.powerChipHolder = defender;
		this.setBall(startSection(defender));
		this.action = GAME_ACTION.ROLL_OFF;
		this.modalContent = null;
	};

	// ── Rolling ──────────────────────────────────────────────

	// Rolls the given team's dice for the current phase (main round or shot).
	// A free kick gives the defense one fewer die; red cards reduce dice too.
	rollForTeam = (team: string) => {
		const roll = rollDice(this.diceCountFor(team));
		this.setRoll(team, roll);
		if (this.bothRolled) this.restrictDice = true;
	};

	private diceCountFor(team: string): number {
		let count = effectiveDiceCount(this.diceReduction[teamKey(team)]);
		if (this.action === GAME_ACTION.FREE_KICK && team === this.defenseTeamName) {
			count = Math.max(MIN_DICE, count - 1);
		}
		return count;
	}

	// SportEngine contract: soccer generates its own dice, so `diceId` is
	// unused — this simply rolls for whichever team is next.
	handleDiceRoll = (_action: string, _diceId: number) => {
		const roller = this.nextRoller;
		if (roller) this.rollForTeam(roller);
	};

	// ── Power chip: optional re-roll before resolving ────────

	rerollWithChip = (indices: number[]) => {
		const holder = this.powerChipHolder;
		const roll = this.rollFor(holder);
		if (!roll || indices.length === 0) return;
		this.setRoll(holder, applyReroll(roll, indices));
		this.transferChip();
		this.chipRerollUsed = true;
	};

	// Called when both teams have rolled and any re-roll decision is done.
	resolveResult = () => {
		if (this.pendingShot) this.resolveShotRoll();
		else this.resolveRound();
	};

	// ── Main round resolution ────────────────────────────────

	private resolveRound = () => {
		const offPlay = bestPlay(this.rollFor(this.offenseTeamName) as SoccerRoll);
		const defPlay = bestPlay(this.rollFor(this.defenseTeamName) as SoccerRoll);
		const winner = compareCounts(offPlay, defPlay);

		if (winner === 'tie') {
			this.tieKind = 'round';
			this.action = GAME_ACTION.POWER_CHIP_TIE;
			return;
		}

		const team = winner === 'offense' ? this.offenseTeamName : this.defenseTeamName;
		const play = winner === 'offense' ? offPlay : defPlay;
		this.applyPlay(team, winner === 'offense', play, false);
	};

	// ── Power chip: tie break ────────────────────────────────

	resolveTie = (useChip: boolean) => {
		const holder = this.powerChipHolder;
		const winnerTeam = useChip ? holder : OPPOSITE_TEAM[holder];
		if (useChip) this.transferChip();

		const winnerIsOffense = winnerTeam === this.offenseTeamName;

		if (this.tieKind === 'shot') {
			this.resolveShotOutcome(winnerIsOffense ? 'goal' : 'save', useChip);
			return;
		}

		const play = bestPlay(this.rollFor(winnerTeam) as SoccerRoll);
		this.applyPlay(winnerTeam, winnerIsOffense, play, useChip);
	};

	// Back out of the tie prompt without deciding, restoring the roll phase the
	// tie surfaced from so the holder can review the dice (or re-roll) before
	// committing. `pendingShot` discriminates a shot tie from a round tie —
	// mirrors the action mapping in `startShot`.
	cancelTie = () => {
		if (this.action !== GAME_ACTION.POWER_CHIP_TIE) return;
		this.action =
			this.pendingShot === 'shot'
				? GAME_ACTION.SHOT_ON_GOAL
				: this.pendingShot === 'freeKick'
					? GAME_ACTION.FREE_KICK
					: this.pendingShot === 'penalty'
						? GAME_ACTION.PENALTY_SHOT
						: GAME_ACTION.ROLL_OFF;
	};

	private transferChip() {
		this.powerChipHolder = OPPOSITE_TEAM[this.powerChipHolder];
	}

	// ── Applying a winning play ──────────────────────────────

	private applyPlay = (team: string, isOffense: boolean, play: TeamPlay, usedChip: boolean) => {
		switch (play.symbol) {
			case SOCCER_SYMBOL.BALL: {
				const result = resolveBallMove(this.ballSection, play.count, team);
				if (result.goal) this.scoreGoal(team, play, usedChip, 'ball');
				else this.settleMove(team, play, usedChip, result.section);
				break;
			}
			case SOCCER_SYMBOL.KICK: {
				if (isOffense) this.startShot('shot', team, play, usedChip);
				else this.defensiveClear(team, play, usedChip, 'clears with a big kick');
				break;
			}
			case SOCCER_SYMBOL.PENALTY: {
				if (isOffense) this.startShot('freeKick', team, play, usedChip);
				else this.defensiveClear(team, play, usedChip, 'is awarded a free kick to clear');
				break;
			}
			case SOCCER_SYMBOL.RED_CARD: {
				this.diceReduction[teamKey(OPPOSITE_TEAM[team])] = RED_CARD_DICE_PENALTY;
				if (isOffense) {
					const result = redCardAdvance(this.ballSection, team);
					// From the final section the advance would cross the goal line: treat
					// it as a foul in the box and award a penalty shot instead of a goal.
					// The red-card dice penalty (set above) leaves the defense a die short
					// for the penalty, then clears when the shot resolves.
					if (result.goal) this.startShot('penalty', team, play, usedChip);
					else this.settleMove(team, play, usedChip, result.section, true);
				} else {
					this.defensiveClear(team, play, usedChip, 'clears after the red card', true);
				}
				break;
			}
		}
	};

	private settleMove = (
		team: string,
		play: TeamPlay,
		usedChip: boolean,
		section: number,
		isRedCard = false
	) => {
		this.setBall(section);
		this.lastPlay = `${this.displayName(team)} ${isRedCard ? 'gets a red card and moves' : 'moves'} the ball`;
		this.addPlay(team, this.lastPlay, play, 0, false, isRedCard, usedChip);
		this.endRound();
	};

	private defensiveClear = (
		team: string,
		play: TeamPlay,
		usedChip: boolean,
		verb: string,
		isRedCard = false
	) => {
		if (isRedCard) this.diceReduction[teamKey(OPPOSITE_TEAM[team])] = RED_CARD_DICE_PENALTY;
		this.setBall(clearToMidline(team));
		this.lastPlay = `${this.displayName(team)} ${verb} — now on the attack!`;
		this.addPlay(team, this.lastPlay, play, 0, false, isRedCard, usedChip);
		this.endRound();
	};

	// ── Shots (Shot on Goal / Free Kick) ─────────────────────

	private startShot = (
		type: 'shot' | 'freeKick' | 'penalty',
		team: string,
		play: TeamPlay,
		usedChip: boolean
	) => {
		this.pendingShot = type;
		this.action =
			type === 'shot'
				? GAME_ACTION.SHOT_ON_GOAL
				: type === 'freeKick'
					? GAME_ACTION.FREE_KICK
					: GAME_ACTION.PENALTY_SHOT;
		const label =
			type === 'shot'
				? 'takes a shot on goal'
				: type === 'freeKick'
					? 'lines up a free kick'
					: 'is awarded a penalty shot after the red card';
		this.lastPlay = `${this.displayName(team)} ${label}!`;
		this.addPlay(team, this.lastPlay, play, 0, true, false, usedChip);
		this.clearRolls();
	};

	private resolveShotRoll = () => {
		const offBalls = countSymbols(this.rollFor(this.offenseTeamName) as SoccerRoll).ball;
		const defBalls = countSymbols(this.rollFor(this.defenseTeamName) as SoccerRoll).ball;
		const result = resolveShot(offBalls, defBalls);

		if (result === 'tie') {
			this.tieKind = 'shot';
			this.action = GAME_ACTION.POWER_CHIP_TIE;
			return;
		}
		this.resolveShotOutcome(result, false);
	};

	private resolveShotOutcome = (result: 'goal' | 'save', usedChip: boolean) => {
		const shooter = this.offenseTeamName;
		const defender = this.defenseTeamName;

		// A goal attempt clears any red-card dice penalties.
		this.diceReduction = { away: 0, home: 0 };
		this.pendingShot = null;

		if (result === 'goal') {
			this.scores[teamKey(shooter)]++;
			this.lastPlay = `GOAL! ${this.displayName(shooter)} finds the back of the net!`;
			this.addPlayFor(shooter, this.lastPlay, 1, true, usedChip);
			// The defending team restarts on offense just past the midline.
			this.celebrateGoal(shooter, justPastMidline(defender));
		} else {
			this.lastPlay = `Save! ${this.displayName(defender)} keeps it out!`;
			this.addPlayFor(defender, this.lastPlay, 0, true, usedChip);
			this.setBall(justPastMidline(defender));
			this.endRound();
		}
	};

	// ── Goals from open play (ball move / red card) ──────────

	private scoreGoal = (
		team: string,
		play: TeamPlay,
		usedChip: boolean,
		kind: 'ball' | 'redCard'
	) => {
		this.scores[teamKey(team)]++;
		const conceder = OPPOSITE_TEAM[team];
		this.diceReduction = { away: 0, home: 0 };
		this.pendingShot = null;
		this.lastPlay =
			kind === 'ball'
				? `GOAL! ${this.displayName(team)} rolls it home for a strike!`
				: `GOAL! ${this.displayName(team)} scores off the red card chaos!`;
		this.addPlay(team, this.lastPlay, play, 1, false, kind === 'redCard', usedChip);
		this.celebrateGoal(team, justPastMidline(conceder));
	};

	// A goal freezes the round on GAME_ACTION.GOAL (blocking rolls) while the
	// Field plays the ball-into-net animation. `continueAfterAction` ends the
	// round and resets the ball once the celebration delay elapses. The ball is
	// moved to its restart section now, hidden under the celebration overlay.
	private celebrateGoal = (scorer: string, restartSection: number) => {
		this.goalScorer = scorer;
		this.setBall(restartSection);
		this.action = GAME_ACTION.GOAL;
		this.clearRolls();
		this.chipRerollUsed = false;
	};

	// ── Round lifecycle ──────────────────────────────────────

	private endRound = () => {
		this.clearRolls();
		this.chipRerollUsed = false;
		if (this.action !== GAME_ACTION.GAME_OVER) this.action = GAME_ACTION.ROLL_OFF;
	};

	private clearRolls = () => {
		this.awayRoll = null;
		this.homeRoll = null;
	};

	continueAfterAction = () => {
		this.sequenceId++;
		const seqId = this.sequenceId;

		this.runChain(async () => {
			if (this.action === GAME_ACTION.GAME_OVER) return;

			// Hold on the goal celebration, then reset the ball and open the round.
			if (this.goalScorer) {
				await this.delay(GOAL_CELEBRATION_MS, seqId);
				this.goalScorer = null;
				this.endRound();
			}

			const result = isGameOver(this.scores.away, this.scores.home, settings.winScore);
			if (result.over && result.winner) {
				await this.delay(1500, seqId);
				this.gameComplete(result.winner);
				return;
			}

			this.restrictDice = false;
			await this.save();
		});
	};

	gameComplete = (winner: string) => {
		this.action = GAME_ACTION.GAME_OVER;
		this.lastPlay = `${this.displayName(winner)} Wins!`;
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

	// ── Play log helpers ─────────────────────────────────────

	private addPlay = (
		team: string,
		description: string,
		play: TeamPlay,
		goalsScored: number,
		isShot: boolean,
		isRedCard: boolean,
		usedPowerChip: boolean
	) => {
		const entry: SoccerPlay = {
			team,
			description,
			symbol: play.symbol,
			count: play.count,
			goalsScored,
			isShot,
			isRedCard,
			usedPowerChip
		};
		this.playLog = [...this.playLog, entry];
	};

	private addPlayFor = (
		team: string,
		description: string,
		goalsScored: number,
		isShot: boolean,
		usedPowerChip: boolean
	) => {
		const play = bestPlay(this.rollFor(team) ?? [SOCCER_SYMBOL.BALL]);
		this.addPlay(team, description, play, goalsScored, isShot, false, usedPowerChip);
	};
}

export const game = new SoccerGameState();

// Compile-time check: SoccerGameState satisfies SportEngine
null as unknown as SoccerGameState satisfies SportEngine;
