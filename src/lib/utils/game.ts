import type { DiceRoll, Team } from '$lib/types';
import { BALL_FIELD_GOAL, EMPTY_TEAM, FIELD_GOAL_YARDS, GAME_ACTION, NEW_GAME, TEAM } from '$lib/constants/constants';
import { buildTextString, randomNumber } from '$lib/utils/common'
import * as R from 'ramda';

export function initialState() {
    return {...NEW_GAME}
};

export function ballPosition(ballIndex:number, possession:string, yards:number, isPenalty: boolean) {
    if(yards === 0) return ballIndex;

    const newBallPosition = isHomeBall(possession) ? 
        R.add(ballIndex, Math.min(yards/5, 21)) : 
        R.subtract(ballIndex, yards/5);

    if(isPenalty && newBallPosition < 1) return 1;
    if(isPenalty && newBallPosition > 19) return 19;

    return newBallPosition;         
}

export function descExtraPoint(total:number) {
    return madeExtraPoint(total) ? 'Extra Point Is Good!' : 'Extra Point Is Missed';
}

export function descFieldGoal(success:boolean, distance:number) {
    return `${distance+FIELD_GOAL_YARDS} Yard Field Goal Is ${success ? 'Good!' : 'NO Good'}`;
}

export function descKickoff(diceId:number) {
    if(diceId === 66) return "TOUCHDOWN!!!";
    if(diceId === 11) return "50 Yard Return";

    return "Touchback - Start at 25 Yard Line";
}

export function descPenalty(isPenalty:boolean) {
    return isPenalty ? 'PENALTY:' : ''
};

export function descPlay(plays:string[], isTouchback:boolean) {
    if(plays.length === 0) return '';
    if(isTouchback) return plays[0] + ' (Touchback)'
    return plays[randomNumber(plays.length)];
}

export function descPunt(isTouchback:boolean, distance:number) {
    return `${distance} Yard Punt${descTouchback(isTouchback)}`;
}

export function descSafety() {
    return 'Safety!'
};

function descTouchback(isTouchback:boolean) {
    return isTouchback ? ' - Touchback' : '';
}

export function descTurnover(isTurnover:boolean){
    return isTurnover ? 'TURNOVER:' : '';
}

export function descTwoPoint(total:number) {
    return total >= 8 ? 'Two Point Conversion Successful!' : 'Two Point Conversion Failed';
}

export function descYardage(yards:number, isTouchback:boolean) {
    if(yards === 0 || isTouchback) return '';
    return yards > 0  ? `- ${yards} Yard Gain ` : `- ${yards*-1} Yard Loss`;
}

export function distance(index:number) {
    return index*5;
}

export function showDownDistance(action:string){
    return [GAME_ACTION.OFFENSE, GAME_ACTION.PUNT].includes(action);
}

export function getFieldGoalRange(pos:string, ballIndex:number) {
    return isHomeBall(pos) ? ballIndex >= BALL_FIELD_GOAL[pos] : ballIndex <= BALL_FIELD_GOAL[pos]
}

export function inFieldGoalRange(action:string, possession:string, ballIndex:number){
    return [GAME_ACTION.FIELD_GOAL, GAME_ACTION.OFFENSE].includes(action) && getFieldGoalRange(possession, ballIndex)
}

export function isFourthDown(down:number) {
    return down === 4 
}

export function isHomeBall(pos:string) {
    return pos === TEAM.HOME 
}

export function isTouchback(index:number):boolean {
    return index < 1 || index > 19;
}

export function isTouchdown(possession: string, ballIndex:number, yards:number, isPenalty:boolean) {
    if(yards <= 0 || isPenalty) return false;

    const yardsIndex = yards / 5;
    return (isHomeBall(possession) && ballIndex + yardsIndex > 19) ||
    (possession === TEAM.AWAY && ballIndex - yardsIndex < 1)
}

export function lastPlay(possession: string, ballIndex: number, diceRoll:DiceRoll, isTouchback = false) {
    const {description, isPenalty=false, isTurnover=false, yards} = diceRoll;
    if(yards === 100 || isTouchdown(possession, ballIndex, yards, isPenalty)){
        return 'TOUCHDOWN!!!';
    } else {
        const lastPlay = [
            () => descPenalty(isPenalty),
            () => descTurnover(isTurnover),
            () => descPlay(description, isTouchback),
            () => descYardage(yards, isTouchback)
        ]
        return buildTextString(lastPlay);  
    }
}

export function setFirstDownMarker(ballIndex:number, pos:string) {
    if(isHomeBall(pos) && ballIndex >=18) return -1;
    if(!isHomeBall(pos) && ballIndex <=2) return -1;
    
    return isHomeBall(pos) ? ballIndex + 1 : ballIndex - 3;
}

export function isFirstDown(possession: string, ballIndex:number, firstDownIndex:number, autoFirstDown:boolean) {
    if(autoFirstDown) return true;
    if(isHomeBall(possession)){
        if(firstDownIndex !== -1 && ballIndex-1 >= firstDownIndex){
            return true;
        }
        return false;
    } 

    if(firstDownIndex !== -1 && ballIndex-1 <= firstDownIndex){
        return true;
    }
    
    return false;
}

export function madeExtraPoint(total:number) {
    return total >= 4
}

export function teamById(teams:Team[]) {
    return function getTeam(id:number) {
        return teams.find((team) => team.id == id) || EMPTY_TEAM;
    }
}

export function togglePossession(pos:string) {
    return isHomeBall(pos) ? TEAM.AWAY : TEAM.HOME
}

export function yardsToGo(ballIndex:number, pos:string, firstDownIndex:number) {
    if(firstDownIndex === -1) return 'Goal'
    
    let distance
    if(isHomeBall(pos)){
        distance = (firstDownIndex+1) - ballIndex
    } else {
        distance = ballIndex - (firstDownIndex+1)
    }
    return distance * 5
}