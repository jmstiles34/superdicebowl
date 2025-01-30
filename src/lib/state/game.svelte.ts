import {
	BALL_ENDZONE,
	BALL_EXTRA_POINT,
	BALL_KICKOFF,
	BALL_KICK_GOOD,
	BALL_ONSIDE_KICK,
	BALL_PUNT,
	BALL_SAFETY,
	BALL_TOUCHBACK,
	BALL_TWO_POINT,
	DEFAULT_GAME,
	DEFAULT_PLAY,
	EXTRA_POINT_SUCCESS,
	FIELD_GOAL_ROLL,
	FIELD_GOAL_YARDS,
	GAME_ACTION,
	INTERCEPTION_ROLLS,
	KICKOFF_RETURN_ACTION,
	KICKOFF_RETURN_YARDS,
	OPPOSITE_TEAM,
	POINTS,
	TEAM,
	TURNOVER_ONSIDE_KICK
} from '$lib/constants/constants';
import {
	ballPosition,
	calcYardsToGo,
	descExtraPoint,
	descFieldGoal,
	descKickoff,
	descPunt,
	descSafety,
	descTwoPoint,
	fieldGoalYardsFns,
	forwardFns,
	indexToYards,
	isFourthDown,
	isOnsideKick,
	isTouchback,
	isTouchdown,
	kickOffIndexFns,
	lastPlayDesc,
	madeFirstDown,
	setFirstDownMarker,
	turnoverOnDowns,
	twoPointSuccess,
	yardsToEndzone
} from '$lib/utils/game';
import { equals, gt, gte, isArray, lt, pickRandom, sleep, sumDigits } from '$lib/utils/common';
import type { Howl } from 'howler';
import { createSound, playSound } from '$lib/utils/sound';
import { diceData } from '$lib/data/data.json';
import chime from '$lib/assets/sfx/chime.mp3';
import horns from '$lib/assets/sfx/horns.mp3';
import kick from '$lib/assets/sfx/kick.mp3';
import miss from '$lib/assets/sfx/miss.mp3';
import miss1 from '$lib/assets/sfx/miss1.mp3';
import offense from '$lib/assets/sfx/offense.mp3';
import shake from '$lib/assets/sfx/shake.mp3';
import touchdown from '$lib/assets/sfx/touchdown.mp3';
import whiz from '$lib/assets/sfx/whiz.mp3';
import whoosh from '$lib/assets/sfx/whoosh.mp3';
import type { Play } from '$lib/types';
import { settings } from '$lib/state/settings.svelte';

const chimeSfx: Howl = createSound(chime);
const hornsSfx: Howl = createSound(horns);
const kickSfx: Howl = createSound(kick);
const missSfx: Howl = createSound(miss);
const miss1Sfx: Howl = createSound(miss1);
const offenseSfx: Howl = createSound(offense);
const shakeSfx: Howl = createSound(shake);
const touchdownSfx: Howl = createSound(touchdown);
const whizSfx: Howl = createSound(whiz);
const whooshSfx: Howl = createSound(whoosh);

export type Game = {
	action: string;
	ballIndex: number;
	currentDown: number;
	diceId: number;
	firstDownIndex: number;
	lastPlay: string;
	missedKick: boolean;
	modalContent: string | null;
	onsideKick: boolean;
	playLog: Play[];
	possession: string;
	restrictDice: boolean;
	yardsToGo: number | string;
};

class GameState {
	action = $state(DEFAULT_GAME.action);
	ballIndex = $state(DEFAULT_GAME.ballIndex);
	currentDown = $state(DEFAULT_GAME.currentDown);
	diceId = $state(DEFAULT_GAME.diceId);
	firstDownIndex = $state(DEFAULT_GAME.firstDownIndex);
	lastPlay = $state(DEFAULT_GAME.lastPlay);
	missedKick = $state(DEFAULT_GAME.missedKick);
	modalContent = $state(DEFAULT_GAME.modalContent);
	onsideKick = $state(DEFAULT_GAME.onsideKick);
	playLog: Play[] = $state(DEFAULT_GAME.playLog);
	possession = $state(DEFAULT_GAME.possession);
	restrictDice = $state(DEFAULT_GAME.restrictDice);
	yardsToGo: number | string = $state(DEFAULT_GAME.yardsToGo);

	doKickoff = (diceId: number) => {
		const isOnside = isOnsideKick(diceId);
		game.action =
			KICKOFF_RETURN_ACTION[diceId as keyof typeof KICKOFF_RETURN_ACTION] ||
			GAME_ACTION.KICKOFF_KICK;
		game.ballIndex = isOnside ? game.ballIndex : BALL_ENDZONE[OPPOSITE_TEAM[game.possession]];
		game.diceId = diceId;
		isOnside ? playSound(whizSfx, settings.volume) : playSound(kickSfx, settings.volume);
	};

	doOffensivePlay = (diceId: number) => {
		const diceRoll = diceData.find((d) => d.id === diceId);
		if (diceRoll) {
			const { autoFirstDown, isPenalty, isTurnover, yards = 0 } = diceRoll;
			const playYards: number = isArray(yards as number[])
				? (pickRandom(yards as number[]) as number)
				: (yards as number);
			const playIndex: number = ballPosition(this.ballIndex, this.possession, playYards, isPenalty);
			const endzoneDistance = yardsToEndzone(this.possession, this.ballIndex);
			const isTD =
				equals(yards, 100) ||
				isTouchdown(this.possession, this.ballIndex, playYards, isPenalty, isTurnover);
			const isFirstDown = madeFirstDown(
				this.possession,
				playIndex,
				this.firstDownIndex,
				autoFirstDown
			);
			const isTurnoverOnDowns = turnoverOnDowns(this.currentDown, isFirstDown, isPenalty);

			const playResult = {
				...DEFAULT_PLAY,
				team: this.possession,
				diceRoll: diceId,
				action: GAME_ACTION.OFFENSE,
				points: isTD ? POINTS.TOUCHDOWN : 0,
				yards: !isPenalty ? Math.min(playYards, endzoneDistance) : 0,
				penaltyYards: isPenalty ? playYards : 0
			};

			if (isTurnover || isTurnoverOnDowns) {
				const isInterception = INTERCEPTION_ROLLS.includes(diceId);
				const playIndex = ballPosition(this.ballIndex, this.possession, playYards);
				const label = isInterception ? 'Int' : 'Fumble';
				const description = isTurnoverOnDowns
					? 'TURNOVER: On downs'
					: `TURNOVER: ${label} ${playYards} Yds downfield`;
				playSound(shakeSfx, settings.volume);
				if (isTouchback(playIndex)) {
					const newPos = OPPOSITE_TEAM[this.possession];
					this.action = GAME_ACTION.OFFENSE;
					this.ballIndex = BALL_PUNT[newPos];
					this.currentDown = 1;
					this.firstDownIndex = setFirstDownMarker(BALL_PUNT[newPos], newPos);
					this.lastPlay = 'TURNOVER: Int in the endzone (Touchback)';
					this.possession = newPos;
					this.restrictDice = false;
					this.yardsToGo = 10;
				} else {
					const newPos = OPPOSITE_TEAM[this.possession];
					const newFirstDown = setFirstDownMarker(playIndex, newPos);
					this.action = GAME_ACTION.OFFENSE;
					this.ballIndex = playIndex;
					this.currentDown = 1;
					this.firstDownIndex = newFirstDown;
					this.lastPlay = description;
					this.missedKick = false;
					this.possession = newPos;
					this.restrictDice = false;
					this.yardsToGo = calcYardsToGo(newFirstDown, newFirstDown - playIndex);
				}
				playResult.description = this.lastPlay;
			} else {
				if (isTD) {
					playSound(touchdownSfx, settings.volume);
					this.action = GAME_ACTION.TOUCHDOWN;
					this.ballIndex = BALL_ENDZONE[this.possession];
					this.firstDownIndex = -1;
					this.lastPlay = 'TOUCHDOWN!!!';
					playResult.description = `${endzoneDistance} Yd play for touchdown.`;
				} else {
					playSound(offenseSfx, settings.volume);
					let isSafety = false;
					if (lt(playYards, 0) && (lt(playIndex, 1) || gt(playIndex, 19))) {
						isSafety = true;
					}

					if (isSafety) {
						this.action = GAME_ACTION.PLACE_KICKOFF;
						this.ballIndex = BALL_SAFETY[this.possession];
						this.currentDown = 1;
						this.firstDownIndex = -1;
						this.lastPlay = descSafety();
						this.yardsToGo = 10;
						playResult.points = POINTS.SAFETY;
					} else {
						this.ballIndex = playIndex;
						this.currentDown = isPenalty ? this.currentDown : this.currentDown + 1;
						this.yardsToGo = calcYardsToGo(this.firstDownIndex, this.firstDownIndex - playIndex);

						if (isFirstDown) {
							const newFirstDown = setFirstDownMarker(playIndex, this.possession);
							playResult.isFirstdown = true;
							this.currentDown = 1;
							this.firstDownIndex = newFirstDown;
							this.yardsToGo = calcYardsToGo(newFirstDown, newFirstDown - playIndex);
						}
						this.lastPlay = lastPlayDesc(this.possession, playIndex, {
							...diceRoll,
							yards: playYards
						});
					}

					playResult.description = this.lastPlay;
				}
				if (!isTD && isFourthDown(this.currentDown)) {
					this.action = GAME_ACTION.FOURTH_DOWN;
				} else {
					this.restrictDice = false;
				}
			}
			this.playLog = [...this.playLog, playResult];
		}
	};

	doTwoPointPlay = (diceId: number) => {
		const success = twoPointSuccess(sumDigits(diceId));
		this.action = GAME_ACTION.PLACE_KICKOFF;
		this.ballIndex = success ? BALL_ENDZONE[this.possession] : this.ballIndex;
		this.lastPlay = descTwoPoint(success);
		const playResult: Play = {
			...DEFAULT_PLAY,
			team: this.possession,
			diceRoll: diceId || 0,
			action: success ? GAME_ACTION.TWO_POINT_MADE : GAME_ACTION.TWO_POINT_MISS,
			description: this.lastPlay,
			points: success ? POINTS.TWO_POINT : 0
		};
		this.playLog = [...this.playLog, playResult];
		success ? playSound(hornsSfx, settings.volume) : playSound(miss1Sfx, settings.volume);
	};

	gameComplete = (winner: string) => {
		this.action = GAME_ACTION.GAME_OVER;
		this.lastPlay = `${winner} Wins!!!`;
		this.restrictDice = true;
	};

	kickExtraPoint = (diceId: number) => {
		const success = gte(sumDigits(diceId), EXTRA_POINT_SUCCESS);
		this.action = GAME_ACTION.PLACE_KICKOFF;
		this.ballIndex = BALL_KICK_GOOD[this.possession];
		this.missedKick = !success;
		this.lastPlay = descExtraPoint(success);
		const playResult: Play = {
			...DEFAULT_PLAY,
			team: this.possession,
			diceRoll: diceId || 0,
			action: success ? GAME_ACTION.EXTRA_POINT_MADE : GAME_ACTION.EXTRA_POINT_MISS,
			description: this.lastPlay,
			points: success ? POINTS.EXTRA_POINT : 0
		};
		this.playLog = [...this.playLog, playResult];
		success ? playSound(kickSfx, settings.volume) : playSound(missSfx, settings.volume);
	};

	kickFieldGoal = (diceId: number) => {
		const distanceRequired = fieldGoalYardsFns[this.possession](this.ballIndex);
		const success = gte(sumDigits(diceId), FIELD_GOAL_ROLL[distanceRequired]);
		this.action = success ? GAME_ACTION.FIELD_GOAL_MADE : GAME_ACTION.FIELD_GOAL_MISS;
		this.ballIndex = success ? BALL_KICK_GOOD[this.possession] : this.ballIndex;
		this.missedKick = !success;
		this.lastPlay = descFieldGoal(success, distanceRequired);
		const playResult: Play = {
			...DEFAULT_PLAY,
			team: this.possession,
			diceRoll: diceId || 0,
			action: success ? GAME_ACTION.FIELD_GOAL_MADE : GAME_ACTION.FIELD_GOAL_MISS,
			description: this.lastPlay,
			points: success ? POINTS.FIELD_GOAL : 0
		};
		this.playLog = [...this.playLog, playResult];
		success ? playSound(kickSfx, settings.volume) : playSound(missSfx, settings.volume);
	};

	handleDiceRoll = (action: string, diceId: number) => {
		const executeFns = {
			[GAME_ACTION.EXTRA_POINT]: this.kickExtraPoint,
			[GAME_ACTION.FIELD_GOAL]: this.kickFieldGoal,
			[GAME_ACTION.KICKOFF]: this.doKickoff,
			[GAME_ACTION.OFFENSE]: this.doOffensivePlay,
			[GAME_ACTION.PUNT]: this.savePunt,
			[GAME_ACTION.TWO_POINT]: this.doTwoPointPlay
		};
		executeFns[action](diceId);
	};

	handleNextAction = (action: string, ballIndex: number, gameOver: boolean) => {
		if (gameOver) {
			sleep(1500).then(() => (this.action = GAME_ACTION.GAME_OVER));
		} else {
			switch (action) {
				case GAME_ACTION.FIELD_GOAL_MADE:
					sleep(1500).then(() => (this.action = GAME_ACTION.PLACE_KICKOFF));
					break;
				case GAME_ACTION.FIELD_GOAL_MISS:
					sleep(1500).then(() => this.turnover(ballIndex));
					break;
				case GAME_ACTION.FOURTH_DOWN:
					sleep(1500).then(() => (this.action = GAME_ACTION.FOURTH_DOWN_OPTIONS));
					break;
				case GAME_ACTION.KICKOFF_ONSIDE:
					sleep(100).then(() => this.saveKickoffOnside());
					break;
				case GAME_ACTION.KICKOFF_KICK:
					sleep(1000).then(() => this.saveKickoff());
					break;
				case GAME_ACTION.KICKOFF_RETURN:
					sleep(1000).then(() => (this.action = GAME_ACTION.OFFENSE));
					break;
				case GAME_ACTION.KICKOFF_TOUCHDOWN:
					sleep(1000).then(() => this.saveTouchdown());
					break;
				case GAME_ACTION.PLACE_KICKOFF:
					sleep(1500).then(() => this.prepareKickoff());
					break;
				case GAME_ACTION.TOUCHDOWN:
					sleep(2000).then(() => (this.action = GAME_ACTION.POINT_OPTION));
					break;
				default:
					break;
			}
		}
	};

	prepareKickoff = () => {
		if (this.action !== GAME_ACTION.GAME_OVER) {
			const newPos = OPPOSITE_TEAM[this.possession];
			this.action = GAME_ACTION.KICKOFF;
			this.ballIndex = BALL_KICKOFF[newPos];
			this.currentDown = 1;
			this.firstDownIndex = -1;
			this.missedKick = false;
			this.onsideKick = false;
			this.possession = newPos;
			this.restrictDice = false;
			this.yardsToGo = 10;
			playSound(whooshSfx, settings.volume);
		}
	};

	preparePointOption = (action: string) => {
		const ballPlacement = {
			[GAME_ACTION.EXTRA_POINT]: BALL_EXTRA_POINT,
			[GAME_ACTION.TWO_POINT]: BALL_TWO_POINT
		};

		this.action = action;
		this.ballIndex = ballPlacement[action][this.possession];
		this.firstDownIndex = -1;
		this.lastPlay = `Must Roll ${action === GAME_ACTION.TWO_POINT ? 8 : 4}+ to Convert`;
		this.modalContent = null;
		this.restrictDice = false;
	};

	resetGame = () => {
		this.action = DEFAULT_GAME.action;
		this.ballIndex = DEFAULT_GAME.ballIndex;
		this.currentDown = DEFAULT_GAME.currentDown;
		this.diceId = DEFAULT_GAME.diceId;
		this.firstDownIndex = DEFAULT_GAME.firstDownIndex;
		this.lastPlay = DEFAULT_GAME.lastPlay;
		this.missedKick = DEFAULT_GAME.missedKick;
		this.modalContent = DEFAULT_GAME.modalContent;
		this.onsideKick = DEFAULT_GAME.onsideKick;
		this.playLog = DEFAULT_GAME.playLog;
		this.possession = DEFAULT_GAME.possession;
		this.restrictDice = DEFAULT_GAME.restrictDice;
		this.yardsToGo = DEFAULT_GAME.yardsToGo;
	};

	saveCoinToss = (team: string) => {
		this.action = GAME_ACTION.KICKOFF;
		this.ballIndex = BALL_KICKOFF[team];
		this.modalContent = null;
		this.possession = team;
	};

	saveFourthDown = (action: string) => {
		this.action = action;
		this.modalContent = null;
		this.restrictDice = false;
	};

	saveKickoff = () => {
		const isTouchback = ![22, 33, 44, 55].includes(this.diceId || 0);
		const ballIndex = isTouchback
			? BALL_TOUCHBACK[this.possession]
			: kickOffIndexFns[this.possession](pickRandom(KICKOFF_RETURN_YARDS) as number);
		this.action = GAME_ACTION.KICKOFF_RETURN;
		this.ballIndex = ballIndex;
		this.firstDownIndex = setFirstDownMarker(ballIndex, this.possession);
		this.lastPlay = descKickoff(isTouchback, kickOffIndexFns[this.possession](ballIndex));
		this.restrictDice = false;
		const playResult: Play = {
			...DEFAULT_PLAY,
			team: this.possession,
			diceRoll: this.diceId || 0,
			action: GAME_ACTION.KICKOFF_RETURN,
			description: this.lastPlay
		};
		this.playLog = [...this.playLog, playResult];
		playSound(whooshSfx, settings.volume);
	};

	saveKickoffOnside = () => {
		const newPos = OPPOSITE_TEAM[this.possession];
		const playResult: Play = {
			...DEFAULT_PLAY,
			team: this.possession,
			diceRoll: this.diceId || 0,
			action: GAME_ACTION.KICKOFF_ONSIDE,
			description: TURNOVER_ONSIDE_KICK
		};
		this.action = GAME_ACTION.OFFENSE;
		this.ballIndex = BALL_ONSIDE_KICK[this.possession];
		this.currentDown = 1;
		this.firstDownIndex = setFirstDownMarker(this.ballIndex, newPos);
		this.lastPlay = TURNOVER_ONSIDE_KICK;
		this.missedKick = false;
		this.onsideKick = true;
		this.possession = newPos;
		this.restrictDice = false;
		this.yardsToGo = 10;
		this.playLog = [...this.playLog, playResult];
	};

	savePunt = (diceId: number) => {
		const distanceIndex = sumDigits(diceId);
		const puntIndex = forwardFns[this.possession](this.ballIndex, distanceIndex);
		const newPos = OPPOSITE_TEAM[this.possession];
		const newBallIndex = isTouchback(puntIndex) ? BALL_PUNT[newPos] : puntIndex;
		this.action = GAME_ACTION.OFFENSE;
		this.ballIndex = newBallIndex;
		this.currentDown = 1;
		(this.firstDownIndex = setFirstDownMarker(puntIndex, newPos)), (this.possession = newPos);
		this.lastPlay = descPunt(isTouchback(puntIndex), indexToYards(distanceIndex));
		this.restrictDice = false;
		this.yardsToGo = 10;
		const playResult: Play = {
			...DEFAULT_PLAY,
			team: OPPOSITE_TEAM[this.possession],
			diceRoll: diceId || 0,
			action: GAME_ACTION.PUNT,
			description: this.lastPlay
		};
		this.playLog = [...this.playLog, playResult];
	};

	saveSafety = () => {
		this.action = GAME_ACTION.PLACE_KICKOFF;
		this.ballIndex = BALL_SAFETY[this.possession];
		this.currentDown = 1;
		this.firstDownIndex = -1;
		this.lastPlay = descSafety();
		this.yardsToGo = 10;
		const playResult: Play = {
			...DEFAULT_PLAY,
			team: OPPOSITE_TEAM[this.possession],
			diceRoll: 0,
			action: GAME_ACTION.SAFETY,
			description: this.lastPlay,
			points: POINTS.SAFETY
		};
		this.playLog = [...this.playLog, playResult];
	};

	saveTouchdown = () => {
		playSound(touchdownSfx, settings.volume);
		const playResult: Play = {
			...DEFAULT_PLAY,
			team: this.possession,
			diceRoll: this.diceId || 0,
			action: this.action,
			description: '100 Yd kickoff for touchdown.',
			points: POINTS.TOUCHDOWN
		};
		this.action = GAME_ACTION.TOUCHDOWN;
		this.ballIndex = BALL_ENDZONE[this.possession];
		this.firstDownIndex = -1;
		this.lastPlay = 'TOUCHDOWN!!!';
		this.playLog = [...this.playLog, playResult];
	};

	toggleFieldGoal = () => {
		const distanceRequired = fieldGoalYardsFns[this.possession](this.ballIndex);
		const diceTotal: number = FIELD_GOAL_ROLL[distanceRequired];
		const isOffense = [GAME_ACTION.OFFENSE, GAME_ACTION.FOURTH_DOWN_OPTIONS].includes(this.action);
		const newAction = isOffense ? GAME_ACTION.FIELD_GOAL : GAME_ACTION.OFFENSE;

		this.action = newAction;
		this.lastPlay =
			newAction === GAME_ACTION.FIELD_GOAL
				? `${distanceRequired + FIELD_GOAL_YARDS} Yd Field Goal Attempt (${diceTotal}+)`
				: '';
		this.modalContent = null;
		this.restrictDice = false;
		playSound(chimeSfx, settings.volume);
	};

	turnover = (ballIndex: number, desc = '') => {
		const isOnsideKick = this.action === GAME_ACTION.KICKOFF;
		const newPos = OPPOSITE_TEAM[this.possession];
		this.action = GAME_ACTION.OFFENSE;
		this.ballIndex = ballIndex;
		this.currentDown = 1;
		this.firstDownIndex = setFirstDownMarker(ballIndex, newPos);
		this.lastPlay = desc.length ? desc : this.lastPlay;
		this.missedKick = false;
		this.onsideKick = isOnsideKick;
		this.possession = newPos;
		this.restrictDice = false;
		this.yardsToGo = 10;
	};

	turnoverTouchback = () => {
		const newPos = OPPOSITE_TEAM[this.possession];
		this.action = GAME_ACTION.OFFENSE;
		this.ballIndex = BALL_PUNT[newPos];
		this.currentDown = 1;
		this.firstDownIndex = setFirstDownMarker(BALL_PUNT[newPos], newPos);
		this.lastPlay = 'TURNOVER: Int in the endzone (Touchback)';
		this.possession = newPos;
		this.yardsToGo = 10;
	};

	updateExtraPoint = (team: string) => {
		this.possession = team;
		this.ballIndex = BALL_KICKOFF[team];
	};

	updateGameState = (updates: Object) => {
		for (const [key, value] of Object.entries(updates)) {
			this[key as keyof typeof updates] = value;
		}
	};
}

export const game = new GameState();
