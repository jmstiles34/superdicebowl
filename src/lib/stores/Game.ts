import { writable } from 'svelte/store';
import { settings } from '$lib/stores/Settings';
import { get } from 'svelte/store';
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

export interface gStore {
	type:
		| 'clearModal'
		| 'doKickoff'
		| 'doOffensivePlay'
		| 'doTwoPointPlay'
		| 'gameComplete'
		| 'handleNextAction'
		| 'kickExtraPoint'
		| 'kickFieldGoal'
		| 'prepareKickoff'
		| 'preparePointOption'
		| 'reset'
		| 'restrictDice'
		| 'saveCoinToss'
		| 'saveDiceRoll'
		| 'saveFourthDown'
		| 'saveKickoff'
		| 'saveKickoffOnside'
		| 'savePunt'
		| 'saveSafety'
		| 'saveTouchdown'
		| 'setAction'
		| 'toggleFieldGoal'
		| 'turnover'
		| 'turnoverTouchback'
		| 'updateExtraPoint'
		| 'updateGame'
		| null;
	action: string;
	ballIndex: number;
	currentDown: number;
	diceId: number | null;
	firstDownIndex: number;
	lastPlay: string;
	missedKick: boolean;
	modalContent: string | null;
	onsideKick: boolean;
	playLog: Play[];
	possession: string;
	restrictDice: boolean;
	yardsToGo: number | string;
}

const _game = writable<gStore>({
	type: null,
	...DEFAULT_GAME
});

export const game = {
	subscribe: _game.subscribe,
	set: _game.set,
	update: _game.update,
	reset: () => {
		_game.update(() => {
			return { type: null, ...DEFAULT_GAME };
		});
	},
	clearModal: () => {
		_game.update((self: gStore) => {
			self.type = 'clearModal';
			self.modalContent = null;
			return self;
		});
	},
	doKickoff: (diceId: number) => {
		const isOnside = isOnsideKick(diceId);
		_game.update((self: gStore) => {
			self.type = 'doKickoff';
			self.action =
				KICKOFF_RETURN_ACTION[diceId as keyof typeof KICKOFF_RETURN_ACTION] ||
				GAME_ACTION.KICKOFF_KICK;
			self.ballIndex = isOnside ? self.ballIndex : BALL_ENDZONE[OPPOSITE_TEAM[self.possession]];
			self.diceId = diceId;
			isOnside
				? playSound(whizSfx, get(settings).volume)
				: playSound(kickSfx, get(settings).volume);
			return self;
		});
	},
	doOffensivePlay: (diceId: number) => {
		_game.update((self: gStore) => {
			const diceRoll = diceData.find((d) => d.id === diceId);

			if (diceRoll) {
				const { ballIndex, currentDown, firstDownIndex, possession } = self;
				const { autoFirstDown, isPenalty, isTurnover, yards = 0 } = diceRoll;
				const playYards: number = isArray(yards as number[])
					? (pickRandom(yards as number[]) as number)
					: (yards as number);
				const playIndex: number = ballPosition(
					self.ballIndex,
					self.possession,
					playYards,
					isPenalty
				);
				const endzoneDistance = yardsToEndzone(self.possession, self.ballIndex);
				const isTD =
					equals(yards, 100) ||
					isTouchdown(possession, ballIndex, playYards, isPenalty, isTurnover);
				const isFirstDown = madeFirstDown(
					possession,
					playIndex,
					self.firstDownIndex,
					autoFirstDown
				);
				const isTurnoverOnDowns = turnoverOnDowns(currentDown, isFirstDown, isPenalty);

				const playResult = {
					...DEFAULT_PLAY,
					team: self.possession,
					diceRoll: diceId,
					action: GAME_ACTION.OFFENSE,
					points: isTD ? POINTS.TOUCHDOWN : 0,
					yards: !isPenalty ? Math.min(playYards, endzoneDistance) : 0,
					penaltyYards: isPenalty ? playYards : 0
				};

				if (isTurnover || isTurnoverOnDowns) {
					const isInterception = INTERCEPTION_ROLLS.includes(diceId);
					const playIndex = ballPosition(ballIndex, possession, playYards);
					const label = isInterception ? 'Int' : 'Fumble';
					const description = isTurnoverOnDowns
						? 'TURNOVER: On downs'
						: `TURNOVER: ${label} ${playYards} Yds downfield`;
					playSound(shakeSfx, get(settings).volume);
					if (isTouchback(playIndex)) {
						const newPos = OPPOSITE_TEAM[self.possession];
						self.action = GAME_ACTION.OFFENSE;
						self.ballIndex = BALL_PUNT[newPos];
						self.currentDown = 1;
						self.firstDownIndex = setFirstDownMarker(BALL_PUNT[newPos], newPos);
						self.lastPlay = 'TURNOVER: Int in the endzone (Touchback)';
						self.possession = newPos;
						self.restrictDice = false;
						self.yardsToGo = 10;
					} else {
						const newPos = OPPOSITE_TEAM[self.possession];
						const newFirstDown = setFirstDownMarker(playIndex, newPos);
						self.action = GAME_ACTION.OFFENSE;
						self.ballIndex = playIndex;
						self.currentDown = 1;
						self.firstDownIndex = newFirstDown;
						self.lastPlay = description;
						self.missedKick = false;
						self.possession = newPos;
						self.restrictDice = false;
						self.yardsToGo = calcYardsToGo(newFirstDown, newFirstDown - playIndex);
					}
					playResult.description = self.lastPlay;
				} else {
					if (isTD) {
						playSound(touchdownSfx, get(settings).volume);
						self.action = GAME_ACTION.TOUCHDOWN;
						self.ballIndex = BALL_ENDZONE[self.possession];
						self.firstDownIndex = -1;
						self.lastPlay = 'TOUCHDOWN!!!';
						playResult.description = `${endzoneDistance} Yd play for touchdown.`;
					} else {
						playSound(offenseSfx, get(settings).volume);
						let isSafety = false;
						if (lt(playYards, 0) && (lt(playIndex, 1) || gt(playIndex, 19))) {
							isSafety = true;
						}

						if (isSafety) {
							self.action = GAME_ACTION.PLACE_KICKOFF;
							self.ballIndex = BALL_SAFETY[self.possession];
							self.currentDown = 1;
							self.firstDownIndex = -1;
							self.lastPlay = descSafety();
							self.yardsToGo = 10;
							playResult.points = POINTS.SAFETY;
						} else {
							self.ballIndex = playIndex;
							self.currentDown = isPenalty ? currentDown : currentDown + 1;
							self.yardsToGo = calcYardsToGo(firstDownIndex, firstDownIndex - playIndex);

							if (isFirstDown) {
								const newFirstDown = setFirstDownMarker(playIndex, possession);
								playResult.isFirstdown = true;
								self.currentDown = 1;
								self.firstDownIndex = newFirstDown;
								self.yardsToGo = calcYardsToGo(newFirstDown, newFirstDown - playIndex);
							}
							self.lastPlay = lastPlayDesc(possession, playIndex, {
								...diceRoll,
								yards: playYards
							});
						}

						playResult.description = self.lastPlay;
					}
					if (!isTD && isFourthDown(self.currentDown)) {
						self.action = GAME_ACTION.FOURTH_DOWN;
					} else {
						self.restrictDice = false;
					}
				}
				self.playLog = [...self.playLog, playResult];
			}

			return self;
		});
	},
	doTwoPointPlay: (diceId: number) => {
		const success = twoPointSuccess(sumDigits(diceId));
		_game.update((self: gStore) => {
			self.type = 'doTwoPointPlay';
			self.action = GAME_ACTION.PLACE_KICKOFF;
			self.ballIndex = success ? BALL_ENDZONE[self.possession] : self.ballIndex;
			self.lastPlay = descTwoPoint(success);
			const playResult: Play = {
				...DEFAULT_PLAY,
				team: self.possession,
				diceRoll: diceId || 0,
				action: success ? GAME_ACTION.TWO_POINT_MADE : GAME_ACTION.TWO_POINT_MISS,
				description: self.lastPlay,
				points: success ? POINTS.TWO_POINT : 0
			};
			self.playLog = [...self.playLog, playResult];
			success
				? playSound(hornsSfx, get(settings).volume)
				: playSound(miss1Sfx, get(settings).volume);
			return self;
		});
	},
	gameComplete: (winner: string) => {
		_game.update((self: gStore) => {
			self.type = 'gameComplete';
			self.action = GAME_ACTION.GAME_OVER;
			self.lastPlay = `${winner} Wins!!!`;
			self.restrictDice = true;
			return self;
		});
	},
	handleDiceRoll: (action: string, diceId: number) => {
		const executeFns = {
			[GAME_ACTION.EXTRA_POINT]: game.kickExtraPoint,
			[GAME_ACTION.FIELD_GOAL]: game.kickFieldGoal,
			[GAME_ACTION.KICKOFF]: game.doKickoff,
			[GAME_ACTION.OFFENSE]: game.doOffensivePlay,
			[GAME_ACTION.PUNT]: game.savePunt,
			[GAME_ACTION.TWO_POINT]: game.doTwoPointPlay
		};
		executeFns[action](diceId);
	},
	handleNextAction: (action: string, ballIndex: number, gameOver: boolean) => {
		if (gameOver) {
			sleep(1500).then(() => game.setAction(GAME_ACTION.GAME_OVER));
		} else {
			switch (action) {
				case GAME_ACTION.FIELD_GOAL_MADE:
					sleep(1500).then(() => game.setAction(GAME_ACTION.PLACE_KICKOFF));
					break;
				case GAME_ACTION.FIELD_GOAL_MISS:
					sleep(1500).then(() => game.turnover(ballIndex));
					break;
				case GAME_ACTION.FOURTH_DOWN:
					sleep(1500).then(() => game.setAction(GAME_ACTION.FOURTH_DOWN_OPTIONS));
					break;
				case GAME_ACTION.KICKOFF_ONSIDE:
					sleep(100).then(() => game.saveKickoffOnside());
					break;
				case GAME_ACTION.KICKOFF_KICK:
					sleep(1000).then(() => game.saveKickoff());
					break;
				case GAME_ACTION.KICKOFF_RETURN:
					sleep(1000).then(() => game.setAction(GAME_ACTION.OFFENSE));
					break;
				case GAME_ACTION.KICKOFF_TOUCHDOWN:
					sleep(1000).then(() => game.saveTouchdown());
					break;
				case GAME_ACTION.PLACE_KICKOFF:
					sleep(1500).then(() => game.prepareKickoff());
					break;
				case GAME_ACTION.TOUCHDOWN:
					sleep(2000).then(() => game.setAction(GAME_ACTION.POINT_OPTION));
					break;
				default:
					break;
			}
		}
	},
	kickExtraPoint: (diceId: number) => {
		const success = gte(sumDigits(diceId), EXTRA_POINT_SUCCESS);
		_game.update((self: gStore) => {
			self.type = 'kickExtraPoint';
			self.action = GAME_ACTION.PLACE_KICKOFF;
			self.ballIndex = BALL_KICK_GOOD[self.possession];
			self.missedKick = !success;
			self.lastPlay = descExtraPoint(success);
			const playResult: Play = {
				...DEFAULT_PLAY,
				team: self.possession,
				diceRoll: diceId || 0,
				action: success ? GAME_ACTION.EXTRA_POINT_MADE : GAME_ACTION.EXTRA_POINT_MISS,
				description: self.lastPlay,
				points: success ? POINTS.EXTRA_POINT : 0
			};
			self.playLog = [...self.playLog, playResult];
			success ? playSound(kickSfx, get(settings).volume) : playSound(missSfx, get(settings).volume);
			return self;
		});
	},
	kickFieldGoal: (diceId: number) => {
		_game.update((self: gStore) => {
			const distanceRequired = fieldGoalYardsFns[self.possession](self.ballIndex);
			const success = gte(sumDigits(diceId), FIELD_GOAL_ROLL[distanceRequired]);
			self.type = 'kickFieldGoal';
			self.action = success ? GAME_ACTION.FIELD_GOAL_MADE : GAME_ACTION.FIELD_GOAL_MISS;
			self.ballIndex = success ? BALL_KICK_GOOD[self.possession] : self.ballIndex;
			self.missedKick = !success;
			self.lastPlay = descFieldGoal(success, distanceRequired);
			const playResult: Play = {
				...DEFAULT_PLAY,
				team: self.possession,
				diceRoll: diceId || 0,
				action: success ? GAME_ACTION.FIELD_GOAL_MADE : GAME_ACTION.FIELD_GOAL_MISS,
				description: self.lastPlay,
				points: success ? POINTS.FIELD_GOAL : 0
			};
			self.playLog = [...self.playLog, playResult];
			success ? playSound(kickSfx, get(settings).volume) : playSound(missSfx, get(settings).volume);
			return self;
		});
	},
	prepareKickoff: () => {
		_game.update((self: gStore) => {
			if (self.action === GAME_ACTION.GAME_OVER) return self;
			const newPos = OPPOSITE_TEAM[self.possession];
			self.type = 'prepareKickoff';
			self.action = GAME_ACTION.KICKOFF;
			self.ballIndex = BALL_KICKOFF[newPos];
			self.currentDown = 1;
			self.firstDownIndex = -1;
			self.missedKick = false;
			self.onsideKick = false;
			self.possession = newPos;
			self.restrictDice = false;
			self.yardsToGo = 10;
			playSound(whooshSfx, get(settings).volume);
			return self;
		});
	},
	preparePointOption: (action: string) => {
		const ballPlacement = {
			[GAME_ACTION.EXTRA_POINT]: BALL_EXTRA_POINT,
			[GAME_ACTION.TWO_POINT]: BALL_TWO_POINT
		};

		_game.update((self: gStore) => {
			self.type = 'preparePointOption';
			self.action = action;
			self.ballIndex = ballPlacement[action][self.possession];
			self.firstDownIndex = -1;
			self.lastPlay = `Must Roll ${action === GAME_ACTION.TWO_POINT ? 8 : 4}+ to Convert`;
			self.modalContent = null;
			self.restrictDice = false;
			return self;
		});
	},
	restrictDice: (isRestricted = false) => {
		_game.update((self: gStore) => {
			self.type = 'restrictDice';
			self.restrictDice = isRestricted;
			return self;
		});
	},
	saveCoinToss: (team: string) => {
		_game.update((self: gStore) => {
			self.type = 'saveCoinToss';
			self.action = GAME_ACTION.KICKOFF;
			self.ballIndex = BALL_KICKOFF[team];
			self.modalContent = null;
			self.possession = team;
			return self;
		});
	},
	saveFourthDown: (action: string) => {
		_game.update((self: gStore) => {
			self.type = 'saveFourthDown';
			self.action = action;
			self.modalContent = null;
			self.restrictDice = false;
			return self;
		});
	},
	saveKickoff: () => {
		_game.update((self: gStore) => {
			const isTouchback = ![22, 33, 44, 55].includes(self.diceId || 0);
			const ballIndex = isTouchback
				? BALL_TOUCHBACK[self.possession]
				: kickOffIndexFns[self.possession](pickRandom(KICKOFF_RETURN_YARDS) as number);
			self.type = 'saveKickoff';
			self.action = GAME_ACTION.KICKOFF_RETURN;
			self.ballIndex = ballIndex;
			self.firstDownIndex = setFirstDownMarker(ballIndex, self.possession);
			self.lastPlay = descKickoff(isTouchback, kickOffIndexFns[self.possession](ballIndex));
			self.restrictDice = false;
			const playResult: Play = {
				...DEFAULT_PLAY,
				team: self.possession,
				diceRoll: self.diceId || 0,
				action: GAME_ACTION.KICKOFF_RETURN,
				description: self.lastPlay
			};
			self.playLog = [...self.playLog, playResult];
			playSound(whooshSfx, get(settings).volume);
			return self;
		});
	},
	saveKickoffOnside: () => {
		_game.update((self: gStore) => {
			const newPos = OPPOSITE_TEAM[self.possession];
			const playResult: Play = {
				...DEFAULT_PLAY,
				team: self.possession,
				diceRoll: self.diceId || 0,
				action: GAME_ACTION.KICKOFF_ONSIDE,
				description: TURNOVER_ONSIDE_KICK
			};
			self.type = 'turnover';
			self.action = GAME_ACTION.OFFENSE;
			self.ballIndex = BALL_ONSIDE_KICK[self.possession];
			self.currentDown = 1;
			self.firstDownIndex = setFirstDownMarker(self.ballIndex, newPos);
			self.lastPlay = TURNOVER_ONSIDE_KICK;
			self.missedKick = false;
			self.onsideKick = true;
			self.possession = newPos;
			self.restrictDice = false;
			self.yardsToGo = 10;
			self.playLog = [...self.playLog, playResult];
			return self;
		});
	},
	savePunt: (diceId: number) => {
		_game.update((self: gStore) => {
			const distanceIndex = sumDigits(diceId);
			const puntIndex = forwardFns[self.possession](self.ballIndex, distanceIndex);
			const newPos = OPPOSITE_TEAM[self.possession];
			const newBallIndex = isTouchback(puntIndex) ? BALL_PUNT[newPos] : puntIndex;
			self.type = 'savePunt';
			self.action = GAME_ACTION.OFFENSE;
			self.ballIndex = newBallIndex;
			self.currentDown = 1;
			(self.firstDownIndex = setFirstDownMarker(puntIndex, newPos)), (self.possession = newPos);
			self.lastPlay = descPunt(isTouchback(puntIndex), indexToYards(distanceIndex));
			self.restrictDice = false;
			self.yardsToGo = 10;
			const playResult: Play = {
				...DEFAULT_PLAY,
				team: OPPOSITE_TEAM[self.possession],
				diceRoll: diceId || 0,
				action: GAME_ACTION.PUNT,
				description: self.lastPlay
			};
			self.playLog = [...self.playLog, playResult];
			return self;
		});
	},
	saveSafety: () => {
		_game.update((self: gStore) => {
			self.type = 'saveSafety';
			self.action = GAME_ACTION.PLACE_KICKOFF;
			self.ballIndex = BALL_SAFETY[self.possession];
			self.currentDown = 1;
			self.firstDownIndex = -1;
			self.lastPlay = descSafety();
			self.yardsToGo = 10;
			const playResult: Play = {
				...DEFAULT_PLAY,
				team: OPPOSITE_TEAM[self.possession],
				diceRoll: 0,
				action: GAME_ACTION.SAFETY,
				description: self.lastPlay,
				points: POINTS.SAFETY
			};
			self.playLog = [...self.playLog, playResult];
			return self;
		});
	},
	saveTouchdown: () => {
		playSound(touchdownSfx, get(settings).volume);
		_game.update((self: gStore) => {
			const playResult: Play = {
				...DEFAULT_PLAY,
				team: self.possession,
				diceRoll: self.diceId || 0,
				action: self.action,
				description: '100 Yd kickoff for touchdown.',
				points: POINTS.TOUCHDOWN
			};
			self.type = 'saveTouchdown';
			self.action = GAME_ACTION.TOUCHDOWN;
			self.ballIndex = BALL_ENDZONE[self.possession];
			self.firstDownIndex = -1;
			self.lastPlay = 'TOUCHDOWN!!!';
			self.playLog = [...self.playLog, playResult];
			return self;
		});
	},
	setAction: (action: string) => {
		_game.update((self: gStore) => {
			self.type = 'setAction';
			self.action = action;
			return self;
		});
	},
	toggleFieldGoal: () => {
		_game.update((self: gStore) => {
			const distanceRequired = fieldGoalYardsFns[self.possession](self.ballIndex);
			const diceTotal: number = FIELD_GOAL_ROLL[distanceRequired];
			const isOffense = [GAME_ACTION.OFFENSE, GAME_ACTION.FOURTH_DOWN_OPTIONS].includes(
				self.action
			);
			const newAction = isOffense ? GAME_ACTION.FIELD_GOAL : GAME_ACTION.OFFENSE;
			self.type = 'toggleFieldGoal';
			self.action = newAction;
			self.lastPlay =
				newAction === GAME_ACTION.FIELD_GOAL
					? `${distanceRequired + FIELD_GOAL_YARDS} Yd Field Goal Attempt (${diceTotal}+)`
					: '';
			self.modalContent = null;
			self.restrictDice = false;
			playSound(chimeSfx, get(settings).volume);
			return self;
		});
	},
	turnover: (ballIndex: number, desc = '') => {
		_game.update((self: gStore) => {
			const isOnsideKick = self.action === GAME_ACTION.KICKOFF;
			const newPos = OPPOSITE_TEAM[self.possession];
			self.type = 'turnover';
			self.action = GAME_ACTION.OFFENSE;
			self.ballIndex = ballIndex;
			self.currentDown = 1;
			self.firstDownIndex = setFirstDownMarker(ballIndex, newPos);
			self.lastPlay = desc.length ? desc : self.lastPlay;
			self.missedKick = false;
			self.onsideKick = isOnsideKick;
			self.possession = newPos;
			self.restrictDice = false;
			self.yardsToGo = 10;
			return self;
		});
	},
	turnoverTouchback: () => {
		_game.update((self: gStore) => {
			const newPos = OPPOSITE_TEAM[self.possession];
			self.type = 'turnoverTouchback';
			self.action = GAME_ACTION.OFFENSE;
			self.ballIndex = BALL_PUNT[newPos];
			self.currentDown = 1;
			self.firstDownIndex = setFirstDownMarker(BALL_PUNT[newPos], newPos);
			self.lastPlay = 'TURNOVER: Int in the endzone (Touchback)';
			self.possession = newPos;
			self.yardsToGo = 10;
			return self;
		});
	},
	updateExtraPoint: (team: string) => {
		_game.update((self: gStore) => {
			self.type = 'updateExtraPoint';
			self.possession = team;
			self.ballIndex = BALL_KICKOFF[team];
			return self;
		});
	},
	updateGame: (props: Record<string, unknown>) => {
		_game.update((self: gStore) => {
			self.type = 'updateGame';
			return { ...self, ...props };
		});
	}
};
