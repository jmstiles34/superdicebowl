import {
	BALL_ENDZONE,
	BALL_EXTRA_POINT,
	BALL_KICK_GOOD,
	BALL_KICKOFF,
	BALL_ONSIDE_KICK,
	BALL_PUNT,
	BALL_SAFETY,
	BALL_TOUCHBACK,
	BALL_TWO_POINT,
	DEFAULT_PLAY,
	EXTRA_POINT_SUCCESS,
	FIELD_GOAL_ROLL,
	GAME_ACTION,
	INTERCEPTION_ROLLS,
	KICKOFF_RETURN_ACTION,
	KICKOFF_RETURN_YARDS,
	OPPOSITE_TEAM,
	POINTS,
	TEAM,
	TURNOVER_ONSIDE_KICK
} from '$lib/constants/constants';
import { diceData } from '$lib/data/data.json';
import type { Play } from '$lib/types';
import { equals, gt, gte, isArray, lt, pickRandom, sumDigits } from '$lib/utils/common';
import {
	ballPosition,
	compareFns,
	fieldGoalYardsFns,
	forwardFns,
	getScoreByTeam,
	isFourthDown,
	isGameComplete,
	isOnsideKick,
	isTouchback,
	isTouchdown,
	kickOffIndexFns,
	madeFirstDown,
	makeFourthDownChoice,
	makePointChoice,
	setFirstDownMarker,
	turnoverOnDowns,
	twoPointSuccess,
	yardsToEndzone
} from '$lib/utils/game';

const MAX_ITERATIONS = 5000;

interface GameState {
	action: string;
	ballIndex: number;
	currentDown: number;
	firstDownIndex: number;
	possession: string;
	playLog: Play[];
}

function rollDice(): number {
	const die1 = Math.floor(Math.random() * 6) + 1;
	const die2 = Math.floor(Math.random() * 6) + 1;
	return Math.min(die1 * 10 + die2, die2 * 10 + die1);
}

export function simulateInstantGame(winScore: number): { homeScore: number; awayScore: number } {
	const startPossession = Math.random() < 0.5 ? TEAM.HOME : TEAM.AWAY;

	const state: GameState = {
		action: GAME_ACTION.KICKOFF,
		ballIndex: BALL_KICKOFF[startPossession],
		currentDown: 1,
		firstDownIndex: -1,
		possession: startPossession,
		playLog: []
	};

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const homeScore = getScoreByTeam(TEAM.HOME, state.playLog);
		const awayScore = getScoreByTeam(TEAM.AWAY, state.playLog);

		if (isGameComplete(awayScore, homeScore, winScore)) {
			return { homeScore, awayScore };
		}

		switch (state.action) {
			case GAME_ACTION.KICKOFF:
				doKickoff(state);
				break;
			case GAME_ACTION.KICKOFF_KICK:
				doKickoffReturn(state);
				break;
			case GAME_ACTION.KICKOFF_ONSIDE:
				doKickoffOnside(state);
				break;
			case GAME_ACTION.KICKOFF_TOUCHDOWN:
				doKickoffTouchdown(state);
				break;
			case GAME_ACTION.KICKOFF_RETURN:
				state.action = GAME_ACTION.OFFENSE;
				break;
			case GAME_ACTION.OFFENSE:
				doOffense(state);
				break;
			case GAME_ACTION.FOURTH_DOWN: {
				const myScore = getScoreByTeam(state.possession, state.playLog);
				const oppScore = getScoreByTeam(OPPOSITE_TEAM[state.possession], state.playLog);
				const choice = makeFourthDownChoice(myScore, oppScore, state.ballIndex, state.possession);
				if (choice === GAME_ACTION.FIELD_GOAL) {
					state.action = GAME_ACTION.FIELD_GOAL;
				} else if (choice === GAME_ACTION.PUNT) {
					state.action = GAME_ACTION.PUNT;
				} else {
					state.action = GAME_ACTION.OFFENSE;
				}
				break;
			}
			case GAME_ACTION.FIELD_GOAL:
				doFieldGoal(state);
				break;
			case GAME_ACTION.FIELD_GOAL_MADE:
			case GAME_ACTION.FIELD_GOAL_MISS:
				if (state.action === GAME_ACTION.FIELD_GOAL_MADE) {
					state.action = GAME_ACTION.PLACE_KICKOFF;
				} else {
					doTurnover(state, state.ballIndex);
				}
				break;
			case GAME_ACTION.PUNT:
				doPunt(state);
				break;
			case GAME_ACTION.TOUCHDOWN: {
				const myScore = getScoreByTeam(state.possession, state.playLog);
				const oppScore = getScoreByTeam(OPPOSITE_TEAM[state.possession], state.playLog);
				const pointChoice = makePointChoice(myScore, oppScore, winScore);
				if (pointChoice === GAME_ACTION.TWO_POINT) {
					state.ballIndex = BALL_TWO_POINT[state.possession];
					state.action = GAME_ACTION.TWO_POINT;
				} else {
					state.ballIndex = BALL_EXTRA_POINT[state.possession];
					state.action = GAME_ACTION.EXTRA_POINT;
				}
				state.firstDownIndex = -1;
				break;
			}
			case GAME_ACTION.EXTRA_POINT:
				doExtraPoint(state);
				break;
			case GAME_ACTION.TWO_POINT:
				doTwoPoint(state);
				break;
			case GAME_ACTION.PLACE_KICKOFF:
				doPrepareKickoff(state);
				break;
			default:
				// Safety: force to offense to avoid stuck states
				state.action = GAME_ACTION.OFFENSE;
				break;
		}
	}

	// If we hit max iterations, return current scores
	return {
		homeScore: getScoreByTeam(TEAM.HOME, state.playLog),
		awayScore: getScoreByTeam(TEAM.AWAY, state.playLog)
	};
}

function addPlay(state: GameState, play: Play) {
	state.playLog = [...state.playLog, play];
}

function doKickoff(state: GameState) {
	const diceId = rollDice();
	const isOnside = isOnsideKick(diceId);
	state.action =
		KICKOFF_RETURN_ACTION[diceId as keyof typeof KICKOFF_RETURN_ACTION] || GAME_ACTION.KICKOFF_KICK;
	state.ballIndex = isOnside ? state.ballIndex : BALL_ENDZONE[OPPOSITE_TEAM[state.possession]];
}

function doKickoffReturn(state: GameState) {
	const isTb = ![22, 33, 44, 55].includes(rollDice());
	const ballIndex = isTb
		? BALL_TOUCHBACK[state.possession]
		: kickOffIndexFns[state.possession](pickRandom(KICKOFF_RETURN_YARDS) as number);
	state.action = GAME_ACTION.KICKOFF_RETURN;
	state.ballIndex = ballIndex;
	state.firstDownIndex = setFirstDownMarker(ballIndex, state.possession);
	addPlay(state, {
		...DEFAULT_PLAY,
		team: state.possession,
		action: GAME_ACTION.KICKOFF_RETURN,
		description: isTb ? 'Touchback' : 'Kickoff return'
	});
}

function doKickoffOnside(state: GameState) {
	const newPos = OPPOSITE_TEAM[state.possession];
	addPlay(state, {
		...DEFAULT_PLAY,
		team: state.possession,
		action: GAME_ACTION.KICKOFF_ONSIDE,
		description: TURNOVER_ONSIDE_KICK
	});
	state.action = GAME_ACTION.OFFENSE;
	state.ballIndex = BALL_ONSIDE_KICK[state.possession];
	state.currentDown = 1;
	state.firstDownIndex = setFirstDownMarker(state.ballIndex, newPos);
	state.possession = newPos;
}

function doKickoffTouchdown(state: GameState) {
	addPlay(state, {
		...DEFAULT_PLAY,
		team: state.possession,
		action: GAME_ACTION.KICKOFF_TOUCHDOWN,
		description: 'Kickoff returned for touchdown',
		points: POINTS.TOUCHDOWN
	});
	state.action = GAME_ACTION.TOUCHDOWN;
	state.ballIndex = BALL_ENDZONE[state.possession];
	state.firstDownIndex = -1;
}

function doOffense(state: GameState) {
	const diceId = rollDice();
	const diceRoll = diceData.find((d) => d.id === diceId);
	if (!diceRoll) return;

	const { autoFirstDown, isPenalty, isTurnover, yards = 0 } = diceRoll;
	const playYards: number = isArray(yards as number[])
		? (pickRandom(yards as number[]) as number)
		: (yards as number);
	const playIndex = ballPosition(state.ballIndex, state.possession, playYards, isPenalty);
	const endzoneDistance = yardsToEndzone(state.possession, state.ballIndex);
	const isTD =
		equals(yards, 100) ||
		isTouchdown(state.possession, state.ballIndex, playYards, isPenalty, isTurnover);
	const isFirstDown = madeFirstDown(
		state.possession,
		playIndex,
		state.firstDownIndex,
		autoFirstDown
	);
	const isTurnoverOnDowns = turnoverOnDowns(state.currentDown, isFirstDown, isPenalty);

	const playResult: Play = {
		...DEFAULT_PLAY,
		team: state.possession,
		diceRoll: diceId,
		action: GAME_ACTION.OFFENSE,
		points: isTD ? POINTS.TOUCHDOWN : 0,
		yards: !isPenalty ? Math.min(playYards, endzoneDistance) : 0,
		penaltyYards: isPenalty ? playYards : 0
	};

	if (isTurnover || isTurnoverOnDowns) {
		const turnoverIndex = ballPosition(state.ballIndex, state.possession, playYards);
		if (isTouchback(turnoverIndex)) {
			const newPos = OPPOSITE_TEAM[state.possession];
			state.action = GAME_ACTION.OFFENSE;
			state.ballIndex = BALL_PUNT[newPos];
			state.currentDown = 1;
			state.firstDownIndex = setFirstDownMarker(BALL_PUNT[newPos], newPos);
			state.possession = newPos;
		} else {
			const newPos = OPPOSITE_TEAM[state.possession];
			const newFirstDown = setFirstDownMarker(turnoverIndex, newPos);
			state.action = GAME_ACTION.OFFENSE;
			state.ballIndex = turnoverIndex;
			state.currentDown = 1;
			state.firstDownIndex = newFirstDown;
			state.possession = newPos;
		}
		playResult.description = isTurnoverOnDowns ? 'Turnover on downs' : 'Turnover';
	} else if (isTD) {
		state.action = GAME_ACTION.TOUCHDOWN;
		state.ballIndex = BALL_ENDZONE[state.possession];
		state.firstDownIndex = -1;
		playResult.description = `${endzoneDistance} Yd touchdown`;
	} else {
		let isSafety = false;
		if (lt(playYards, 0) && (lt(playIndex, 1) || gt(playIndex, 19))) {
			isSafety = true;
		}

		if (isSafety) {
			state.action = GAME_ACTION.PLACE_KICKOFF;
			state.ballIndex = BALL_SAFETY[state.possession];
			state.currentDown = 1;
			state.firstDownIndex = -1;
			playResult.points = POINTS.SAFETY;
			playResult.description = 'Safety';
		} else {
			state.ballIndex = playIndex;
			state.currentDown = isPenalty ? state.currentDown : state.currentDown + 1;

			if (isFirstDown) {
				const newFirstDown = setFirstDownMarker(playIndex, state.possession);
				playResult.isFirstdown = true;
				state.currentDown = 1;
				state.firstDownIndex = newFirstDown;
			}
			playResult.description = 'Offensive play';
		}

		if (!isTD && !isSafety && isFourthDown(state.currentDown)) {
			state.action = GAME_ACTION.FOURTH_DOWN;
		}
	}

	addPlay(state, playResult);
}

function doFieldGoal(state: GameState) {
	const diceId = rollDice();
	const distanceRequired = fieldGoalYardsFns[state.possession](state.ballIndex);
	const success = gte(sumDigits(diceId), FIELD_GOAL_ROLL[distanceRequired]);
	state.action = success ? GAME_ACTION.FIELD_GOAL_MADE : GAME_ACTION.FIELD_GOAL_MISS;
	state.ballIndex = success ? BALL_KICK_GOOD[state.possession] : state.ballIndex;
	addPlay(state, {
		...DEFAULT_PLAY,
		team: state.possession,
		diceRoll: diceId,
		action: state.action,
		description: success ? 'Field goal made' : 'Field goal missed',
		points: success ? POINTS.FIELD_GOAL : 0
	});
}

function doPunt(state: GameState) {
	const diceId = rollDice();
	const puntingTeam = state.possession;
	const distanceIndex = sumDigits(diceId);
	const puntIndex = forwardFns[puntingTeam](state.ballIndex, distanceIndex);
	const newPos = OPPOSITE_TEAM[puntingTeam];
	const newBallIndex = isTouchback(puntIndex) ? BALL_PUNT[newPos] : puntIndex;
	state.action = GAME_ACTION.OFFENSE;
	state.ballIndex = newBallIndex;
	state.currentDown = 1;
	state.firstDownIndex = setFirstDownMarker(puntIndex, newPos);
	state.possession = newPos;
	addPlay(state, {
		...DEFAULT_PLAY,
		team: puntingTeam,
		diceRoll: diceId,
		action: GAME_ACTION.PUNT,
		description: 'Punt'
	});
}

function doExtraPoint(state: GameState) {
	const diceId = rollDice();
	const success = gte(sumDigits(diceId), EXTRA_POINT_SUCCESS);
	state.action = GAME_ACTION.PLACE_KICKOFF;
	state.ballIndex = BALL_KICK_GOOD[state.possession];
	addPlay(state, {
		...DEFAULT_PLAY,
		team: state.possession,
		diceRoll: diceId,
		action: success ? GAME_ACTION.EXTRA_POINT_MADE : GAME_ACTION.EXTRA_POINT_MISS,
		description: success ? 'Extra point made' : 'Extra point missed',
		points: success ? POINTS.EXTRA_POINT : 0
	});
}

function doTwoPoint(state: GameState) {
	const diceId = rollDice();
	const success = twoPointSuccess(sumDigits(diceId));
	state.action = GAME_ACTION.PLACE_KICKOFF;
	state.ballIndex = success ? BALL_ENDZONE[state.possession] : state.ballIndex;
	addPlay(state, {
		...DEFAULT_PLAY,
		team: state.possession,
		diceRoll: diceId,
		action: success ? GAME_ACTION.TWO_POINT_MADE : GAME_ACTION.TWO_POINT_MISS,
		description: success ? 'Two-point conversion successful' : 'Two-point conversion failed',
		points: success ? POINTS.TWO_POINT : 0
	});
}

function doPrepareKickoff(state: GameState) {
	const newPos = OPPOSITE_TEAM[state.possession];
	state.action = GAME_ACTION.KICKOFF;
	state.ballIndex = BALL_KICKOFF[newPos];
	state.currentDown = 1;
	state.firstDownIndex = -1;
	state.possession = newPos;
}

function doTurnover(state: GameState, ballIndex: number) {
	const newPos = OPPOSITE_TEAM[state.possession];
	state.action = GAME_ACTION.OFFENSE;
	state.ballIndex = ballIndex;
	state.currentDown = 1;
	state.firstDownIndex = setFirstDownMarker(ballIndex, newPos);
	state.possession = newPos;
}
