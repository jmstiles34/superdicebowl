import { writable } from "svelte/store";
import { BALL_ENDZONE, BALL_EXTRA_POINT, BALL_KICKOFF, BALL_KICK_GOOD, BALL_ONSIDE_KICK, BALL_PUNT, BALL_SAFETY, BALL_TOUCHBACK, BALL_TWO_POINT, DEFAULT_GAME, EXTRA_POINT_SUCCESS, FIELD_GOAL_ROLL, FIELD_GOAL_YARDS, GAME_ACTION, INTERCEPTION_ROLLS, KICKOFF_RETURN_ACTION, KICKOFF_RETURN_YARDS, OPPOSITE_TEAM, POINTS_EXTRA_POINT, POINTS_FIELD_GOAL, POINTS_TOUCHDOWN, POINTS_TWO_POINT, TURNOVER_ONSIDE_KICK } from '$lib/constants/constants';
import { ballPosition, calcYardsToGo, descExtraPoint, descFieldGoal, descKickoff, descPunt, descSafety, descTwoPoint, fieldGoalYardsFns, forwardFns, indexToYards, isFourthDown, isOnsideKick, isTouchback, isTouchdown, kickOffIndexFns, lastPlayDesc, madeFirstDown, setFirstDownMarker, turnoverOnDowns, twoPointSuccess } from "$lib/utils/game";
import { equals, gt, gte, isArray, lt, pickRandom, sfx, sleep, sumArrays, sumDigits } from "$lib/utils/common";
import { diceData } from '$lib/data/data.json'

export interface gStore {
    type: 
        'clearModal'    
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
        | null,
    action: string,
    ballIndex: number,
    currentDown: number,
    diceId: number | null,
    firstDownIndex: number,
    lastPlay: string,
    missedKick: boolean,
    modalContent: string | null,
    onsideKick: boolean,
    possession: string,
    restrictDice: boolean,
    score: number[],
    yardsToGo: number | string;
};

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
            return {type: null, ...DEFAULT_GAME};
        })
    },
    clearModal: () => {
        _game.update((self: gStore) => {
            self.type = 'clearModal';
            self.modalContent = null;
            return self;
        })
    },
    doKickoff: (diceId:number) => {
        const isOnside = isOnsideKick(diceId);
        _game.update((self: gStore) => {
            self.type = 'doKickoff';
            self.action = KICKOFF_RETURN_ACTION[diceId as keyof typeof KICKOFF_RETURN_ACTION] || GAME_ACTION.KICKOFF_RETURN;
            self.ballIndex = isOnside ? self.ballIndex : BALL_ENDZONE[OPPOSITE_TEAM[self.possession]];
            self.diceId = diceId;
            isOnside ? sfx('whiz') : sfx('kick');
            return self;
        })
    },
    doOffensivePlay: (diceId:number) => {
        _game.update((self: gStore) => {
            const diceRoll = diceData.find(d => d.id === diceId );
            if(diceRoll){
                const {ballIndex, currentDown, firstDownIndex, possession} = self;
                const {autoFirstDown, isPenalty, isTurnover, yards = 0} = diceRoll;
                const playYards:number = isArray(yards as number[]) ? pickRandom(yards as number[]) as number: yards as number;
                const playIndex:number = ballPosition(self.ballIndex, self.possession, playYards, isPenalty);
                const isTD = equals(yards, 100) || isTouchdown(possession, ballIndex, playYards, isPenalty, isTurnover);
                const isFirstDown = madeFirstDown(possession, playIndex, self.firstDownIndex, autoFirstDown);
                const isTurnoverOnDowns = turnoverOnDowns(currentDown, isFirstDown, isPenalty);

                if(isTurnover || isTurnoverOnDowns){
                    const isInterception = INTERCEPTION_ROLLS.includes(diceId);
                    const playIndex = ballPosition(ballIndex, possession, playYards);
                    const label = isInterception ? 'Interception' : 'Fumble';
                    const description = isTurnoverOnDowns ? 'TURNOVER: On downs' : `TURNOVER: ${label} ${playYards} yards downfield`;
                    sfx('shake');
                    if(isTouchback(playIndex)){
                        const newPos = OPPOSITE_TEAM[self.possession];
                        self.action = GAME_ACTION.OFFENSE;
                        self.ballIndex = BALL_PUNT[newPos];
                        self.currentDown = 1;
                        self.firstDownIndex = setFirstDownMarker(BALL_PUNT[newPos], newPos);
                        self.lastPlay = 'TURNOVER: Interception in the endzone (Touchback)'
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
                        self.yardsToGo = calcYardsToGo(newFirstDown, newFirstDown-playIndex);
                    }
                } else {
                    if(isTD){
                        sfx('touchdown');
                        self.action = GAME_ACTION.TOUCHDOWN;
                        self.ballIndex = BALL_ENDZONE[self.possession];
                        self.firstDownIndex = -1;
                        self.lastPlay = 'TOUCHDOWN!!!';
                        self.score = sumArrays([self.score, POINTS_TOUCHDOWN[self.possession]]);
                    } else {
                        sfx('offense');
                        let isSafety = false;
                        if( lt(playYards, 0) && (lt(playIndex, 1) || gt(playIndex, 19))){
                            isSafety = true;
                        }

                        if(isSafety){
                            self.action = GAME_ACTION.PLACE_KICKOFF;
                            self.ballIndex = BALL_SAFETY[self.possession];
                            self.currentDown = 1;
                            self.firstDownIndex = -1;
                            self.lastPlay = descSafety();
                            self.score = sumArrays([self.score, POINTS_TWO_POINT[OPPOSITE_TEAM[self.possession]]]);
                            self.yardsToGo = 10;
                        } else {
                            self.ballIndex = playIndex;
                            self.currentDown = isPenalty ? currentDown : currentDown+1;
                            self.yardsToGo = calcYardsToGo(firstDownIndex, firstDownIndex-playIndex);

                            if(isFirstDown){
                                const newFirstDown = setFirstDownMarker(playIndex, possession);
                                self.currentDown = 1;
                                self.firstDownIndex = newFirstDown;
                                self.yardsToGo = calcYardsToGo(newFirstDown, newFirstDown-playIndex);
                            }
                        }
                        self.lastPlay = lastPlayDesc(possession, playIndex, {...diceRoll, yards: playYards});
                    }
                    if(!isTD && isFourthDown(self.currentDown)) {
                        self.action = GAME_ACTION.FOURTH_DOWN;
                    } else {
                        self.restrictDice = false;
                    }
                }
            }
            
            return self;
        })
    },
    doTwoPointPlay: (diceId:number) => {
        const success = twoPointSuccess(sumDigits(diceId))
        _game.update((self: gStore) => {
            self.type = 'doTwoPointPlay';
            self.action = GAME_ACTION.PLACE_KICKOFF;
            self.ballIndex = success ? BALL_ENDZONE[self.possession] : self.ballIndex;
            self.lastPlay = descTwoPoint(success);
            self.score = success ? sumArrays([self.score, POINTS_TWO_POINT[self.possession]]) : self.score;
            return self;
        })
    },
    gameComplete: (winner:string) => {
        _game.update((self: gStore) => {
            self.type = 'gameComplete';
            self.action = GAME_ACTION.GAME_OVER;
            self.lastPlay = `${winner} Wins!!!`;
            self.restrictDice = true;
            return self;
        })
    },
    handleDiceRoll: (action:string, diceId:number) => {
        const executeFns = {
            [GAME_ACTION.EXTRA_POINT]: game.kickExtraPoint,
            [GAME_ACTION.FIELD_GOAL]: game.kickFieldGoal,
            [GAME_ACTION.KICKOFF]: game.doKickoff,
            [GAME_ACTION.OFFENSE]: game.doOffensivePlay,
            [GAME_ACTION.PUNT]: game.savePunt,
            [GAME_ACTION.TWO_POINT]: game.doTwoPointPlay,
        }
        executeFns[action](diceId);
    },
    handleNextAction: (action:string, ballIndex:number) => {
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
            case GAME_ACTION.KICKOFF_RETURN:
                sleep(1000).then(() => game.saveKickoff());    
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
    },
    kickExtraPoint: (diceId:number) => {
        const success = gte(sumDigits(diceId), EXTRA_POINT_SUCCESS);
        _game.update((self: gStore) => {
            self.type = 'kickExtraPoint';
            self.action = GAME_ACTION.PLACE_KICKOFF;
            self.ballIndex = BALL_KICK_GOOD[self.possession];
            self.missedKick = !success;
            self.lastPlay = descExtraPoint(success);
            self.score = success ? sumArrays([self.score, POINTS_EXTRA_POINT[self.possession]]) : self.score;
            success ? sfx('kick') : sfx('miss');
            return self;
        })
    },
    kickFieldGoal: (diceId:number) => {
        _game.update((self: gStore) => {
            const distanceRequired = fieldGoalYardsFns[self.possession](self.ballIndex);
            const success = gte(sumDigits(diceId), FIELD_GOAL_ROLL[distanceRequired]);
            self.type = 'kickFieldGoal';
            self.action = success ? GAME_ACTION.FIELD_GOAL_MADE : GAME_ACTION.FIELD_GOAL_MISS;
            self.ballIndex = success ? BALL_KICK_GOOD[self.possession] : self.ballIndex;
            self.missedKick = !success;
            self.lastPlay = descFieldGoal(success, distanceRequired);
            self.score = success ? sumArrays([self.score, POINTS_FIELD_GOAL[self.possession]]) : self.score;
            success ? sfx('kick') : sfx('miss');
            return self;
        })
    },
    prepareKickoff: () => {
        _game.update((self: gStore) => {
            if(self.action === GAME_ACTION.GAME_OVER) return self;
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
            sfx('whoosh');
            return self;
        })
    },
    preparePointOption: (action:string) => {
        const ballPlacement = {
            [GAME_ACTION.EXTRA_POINT]: BALL_EXTRA_POINT,
            [GAME_ACTION.TWO_POINT]: BALL_TWO_POINT,
        }
        
        _game.update((self: gStore) => {
            self.type = 'preparePointOption';
            self.action = action;
            self.ballIndex = ballPlacement[action][self.possession];
            self.firstDownIndex = -1;
            self.lastPlay = `Must Roll ${action === GAME_ACTION.TWO_POINT ? 8 : 4}+ to Convert`
            self.modalContent = null;
            self.restrictDice = false;
            return self;
        })
    },
    restrictDice: (isRestricted = false) => {
        _game.update((self: gStore) => {
            self.type = 'restrictDice';
            self.restrictDice = isRestricted;
            return self;
        })
    },
    saveCoinToss: (team:string) => {
        _game.update((self: gStore) => {
            self.type = 'saveCoinToss';
            self.action = GAME_ACTION.KICKOFF;
            self.ballIndex = BALL_KICKOFF[team];
            self.modalContent = null;
            self.possession = team;
            return self;
        })
    },
    saveFourthDown: (action:string) => {
        _game.update((self: gStore) => {
            self.type = 'saveFourthDown';
            self.action = action;
            self.modalContent = null;
            self.restrictDice = false;
            return self;
        })
    },
    saveKickoff: () => {
        _game.update((self: gStore) => {
            const isTouchback = ![22,33,44,55].includes(self.diceId || 0);
            const ballIndex = isTouchback ? 
                BALL_TOUCHBACK[self.possession] :
                kickOffIndexFns[self.possession](pickRandom(KICKOFF_RETURN_YARDS) as number);
            self.type = 'saveKickoff';
            self.action = GAME_ACTION.OFFENSE;
            self.ballIndex = ballIndex;
            self.firstDownIndex = setFirstDownMarker(ballIndex, self.possession),
            self.lastPlay = descKickoff(isTouchback, kickOffIndexFns[self.possession](ballIndex));
            self.restrictDice = false;
            sfx('whoosh');
            return self;
        })
    },
    saveKickoffOnside: () => {
        _game.update((self: gStore) => {
            const newPos = OPPOSITE_TEAM[self.possession];
            self.type = 'turnover';
            self.action = GAME_ACTION.OFFENSE;
            self.ballIndex = BALL_ONSIDE_KICK[self.possession]
            self.currentDown = 1;
            self.firstDownIndex = setFirstDownMarker(self.ballIndex, newPos);
            self.lastPlay = TURNOVER_ONSIDE_KICK;
            self.missedKick = false;
            self.onsideKick = true;
            self.possession = newPos;
            self.restrictDice = false;
            self.yardsToGo = 10;
            return self;
        })
    },
    savePunt: (diceId:number) => {
        _game.update((self: gStore) => {
            const distanceIndex = sumDigits(diceId);
            const puntIndex = forwardFns[self.possession](self.ballIndex, distanceIndex);
            const newPos = OPPOSITE_TEAM[self.possession];
            const newBallIndex = isTouchback(puntIndex) ? BALL_PUNT[newPos] : puntIndex
            self.type = 'savePunt';
            self.action = GAME_ACTION.OFFENSE;
            self.ballIndex = newBallIndex;
            self.currentDown = 1;
            self.firstDownIndex = setFirstDownMarker(puntIndex, newPos),
            self.possession = newPos;
            self.lastPlay = descPunt(isTouchback(puntIndex), indexToYards(distanceIndex));
            self.restrictDice = false;
            self.yardsToGo = 10;
            return self;
        })
    },
    saveSafety: () => {
        _game.update((self: gStore) => {
            self.type = 'saveSafety';
            self.action = GAME_ACTION.PLACE_KICKOFF;
            self.ballIndex = BALL_SAFETY[self.possession];
            self.currentDown = 1;
            self.firstDownIndex = -1;
            self.lastPlay = descSafety();
            self.score = sumArrays([self.score, POINTS_TWO_POINT[OPPOSITE_TEAM[self.possession]]]);
            self.yardsToGo = 10;
            return self;
        })
    },
    saveTouchdown: () => {
        sfx('touchdown');
        _game.update((self: gStore) => {
            self.type = 'saveTouchdown';
            self.action = GAME_ACTION.TOUCHDOWN;
            self.ballIndex = BALL_ENDZONE[self.possession];
            self.firstDownIndex = -1;
            self.lastPlay = 'TOUCHDOWN!!!';
            self.score = sumArrays([self.score, POINTS_TOUCHDOWN[self.possession]]);
            return self;
        })
    },
    setAction: (action:string) => {
        _game.update((self: gStore) => {
            self.type = 'setAction';
            self.action = action;
            return self;
        })
    },
    toggleFieldGoal: () => {
        _game.update((self: gStore) => {
            const distanceRequired = fieldGoalYardsFns[self.possession](self.ballIndex);
            const diceTotal:number = FIELD_GOAL_ROLL[distanceRequired];
            const isOffense = [GAME_ACTION.OFFENSE, GAME_ACTION.FOURTH_DOWN_OPTIONS].includes(self.action)
            const newAction = isOffense ? GAME_ACTION.FIELD_GOAL : GAME_ACTION.OFFENSE;
            self.type = 'toggleFieldGoal';
            self.action = newAction;
            self.lastPlay = newAction === GAME_ACTION.FIELD_GOAL ? `${distanceRequired+FIELD_GOAL_YARDS} Yard Field Goal Attempt (${diceTotal}+)` : '';
            self.modalContent = null;
            self.restrictDice = false;
            sfx('chime');
            return self;
        })
    },
    turnover: (ballIndex:number, desc = '') => {
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
        })
    },
    turnoverTouchback: () => {
        _game.update((self: gStore) => {
            const newPos = OPPOSITE_TEAM[self.possession];
            self.type = 'turnoverTouchback';
            self.action = GAME_ACTION.OFFENSE;
            self.ballIndex = BALL_PUNT[newPos];
            self.currentDown = 1;
            self.firstDownIndex = setFirstDownMarker(BALL_PUNT[newPos], newPos);
            self.lastPlay = 'TURNOVER: Interception in the endzone (Touchback)'
            self.possession = newPos;
            self.yardsToGo = 10;
            return self;
        })
    },
    updateExtraPoint: (team:string) => {
        _game.update((self: gStore) => {
            self.type = 'updateExtraPoint';
            self.possession = team;
            self.ballIndex = BALL_KICKOFF[team];
            return self;
        })
    },
    updateGame: (props:Record<string, unknown>) => {
        _game.update((self: gStore) => {
            self.type = 'updateGame';
            return {...self, ...props};
        })
    },
};