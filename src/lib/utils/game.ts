import type { DiceRoll, Team } from '$lib/types';
import { BALL_FIELD_GOAL, EMPTY_TEAM, FIELD_GOAL_YARDS, GAME_ACTION, TEAM, YARD_INTERVAL } from '$lib/constants/constants';
import { buildTextString, nonZeroRandomNumber, randomNumber } from '$lib/utils/common'
import * as R from 'ramda';
import type { sStore } from '$lib/stores/Settings';

export const backFns = {
    [TEAM.AWAY]: R.add,
    [TEAM.HOME]: R.subtract,
}

export const compareFns = {
    [TEAM.AWAY]: R.lte,
    [TEAM.HOME]: R.gte,
}

export const forwardFns = {
    [TEAM.AWAY]: R.subtract,
    [TEAM.HOME]: R.add,
}

export function beginDisabled(ids:number[]) {
    return R.includes(0, ids);
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

export function descTwoPoint(success:boolean) {
    return `Two Point Conversion ${success ? 'Successful!' : 'Failed'}`;
}

export function descYardage(yards:number, isTouchback:boolean) {
    if(yards === 0 || isTouchback) return '';
    return yards > 0  ? `- ${yards} Yard Gain ` : `- ${yards*-1} Yard Loss`;
}

export function yardDistance(index:number) {
    return index*YARD_INTERVAL;
}

export function showDownDistance(action:string){
    return [GAME_ACTION.OFFENSE, GAME_ACTION.PUNT].includes(action);
}

function showFieldGoalPulse(action:string){
    return [GAME_ACTION.FIELD_GOAL, GAME_ACTION.OFFENSE].includes(action);
}

export function inFieldGoalRange(action:string, possession:string, ballIndex:number){
    return showFieldGoalPulse(action) && compareFns[possession](ballIndex, BALL_FIELD_GOAL[possession]);
}

export function isFourthDown(down:number) {
    return down === 4 
}

export function isTouchback(index:number):boolean {
    return index < 1 || index > 19;
}

export function ballPosition(ballIndex:number, possession:string, yards:number, isPenalty: boolean) {
    if(yards === 0) return ballIndex;

    const newBallPosition = isHomeBall(possession) ? 
        R.add(ballIndex, Math.min(yards/5, 21)) : 
        R.subtract(ballIndex, yards/5);

    if(isPenalty && newBallPosition < 1) return 1;
    if(isPenalty && newBallPosition > 19) return 19;
    return newBallPosition;         
}

export function isTouchdown(possession: string, ballIndex:number, yards:number, isPenalty:boolean) {
    if(yards <= 0 || isPenalty) return false;

    const yardsIndex = yards / 5;
    return (isHomeBall(possession) && ballIndex + yardsIndex > 19) ||
    (isAwayBall(possession) && ballIndex - yardsIndex < 1)
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
    const yardIndex = isHomeBall(pos) ? 18 : 2;
    if(compareFns[pos](ballIndex, yardIndex)) return -1;
    
    const modifier = isHomeBall(pos) ? 1 : -3;
    return R.add(ballIndex, modifier);
}

export function isFirstDown(pos: string, ballIndex:number, firstDownIndex:number, autoFirstDown:boolean) {
    return autoFirstDown 
        || (!R.equals(firstDownIndex, -1) && compareFns[pos](ballIndex-1, firstDownIndex))
}

export function madeExtraPoint(total:number) {
    return total >= 4
}

export function primaryColor(settings:sStore, team = 'home'){
    const teamTyped = `${team.toLowerCase()}Team` as keyof typeof settings;
    return (settings[teamTyped] as Team).primaryColor
}

export function secondaryColor(settings:sStore, team = 'home'){
    const teamTyped = `${team.toLowerCase()}Team` as keyof typeof settings;
    return (settings[teamTyped] as Team).secondaryColor
}

export function setRandomTeam(teams:Team[], opponentId:number, saveFn:(a:Team)=>void){
    const id = nonZeroRandomNumber(32)
    R.equals(id, opponentId) ? setRandomTeam(teams, opponentId, saveFn) : saveFn(teamById(teams)(id));  
}

export function teamById(teams:Team[]) {
    return function getTeam(id:number) {
        return teams.find((team) => team.id == id) || EMPTY_TEAM;
    }
}

export function togglePossession(pos:string) {
    return isHomeBall(pos) ? TEAM.AWAY : TEAM.HOME
}

export function isAwayBall(pos:string) {
    return !isHomeBall(pos);
}

export function isHomeBall(pos:string) {
    return pos === TEAM.HOME;
}

export function twoPointSuccess(total:number){
    return total >= 8;
}

function addOne(index:number){
    return index+1
}

function forcePositive(index:number){
    return index >= 0 ? index : index*-1;
}

export function yardsToGo(firstDownIndex:number, diffIndex:number){
    if(firstDownIndex === -1) return 'Goal'
    return yardDistance(forcePositive(addOne(diffIndex)));
}
