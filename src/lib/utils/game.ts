import type { DiceRoll, Play, Team } from '$lib/types';
import { BALL_FIELD_GOAL, DEFAULT_TEAM, FIELD_GOAL_YARDS, GAME_ACTION, GAME_MODE, OPPOSITE_TEAM, TEAM, YARD_INTERVAL } from '$lib/constants/constants';
import { 
    add, 
    buildTextString, 
    equals, 
    gte, 
    lte,
    randomNumber, 
    subtract 
} from '$lib/utils/common'
import type { sStore } from '$lib/stores/Settings';

export const backFns = {
    [TEAM.AWAY]: add,
    [TEAM.HOME]: subtract,
}

export const compareFns = {
    [TEAM.AWAY]: lte,
    [TEAM.HOME]: gte,
}

export const forwardFns = {
    [TEAM.AWAY]: subtract,
    [TEAM.HOME]: add,
}

export const fieldGoalYardsFns = {
    [TEAM.AWAY]: (a:number) => a*YARD_INTERVAL,
    [TEAM.HOME]: (a:number) => (20 - a)*YARD_INTERVAL,
}

export const isTouchdownFns = {
    [TEAM.AWAY]: (a:number, b:number) => a - b < 1,
    [TEAM.HOME]: (a:number, b:number) => a + b > 19,
}

export const kickOffIndexFns = {
    [TEAM.AWAY]: (a:number) => (20 - a),
    [TEAM.HOME]: (a:number) => a,
}

export function ballPosition(ballIndex:number, possession:string, yards:number, isPenalty = false) {
    if(yards === 0) return ballIndex;

    const newBallPosition = isHomeBall(possession) ? 
        add(ballIndex, Math.min(yards/5, 21)) : 
        subtract(ballIndex, yards/5);

    if(isPenalty && newBallPosition < 1) return 1;
    if(isPenalty && newBallPosition > 19) return 19;
    return newBallPosition;         
}

export function beginDisabled(ids:string[]) {
    return ids.filter(id => id !== "").length < 2;
}

export function calcYardsToGo(firstDownIndex:number, diffIndex:number){
    if(firstDownIndex === -1) return 'Goal'
    return indexToYards(forcePositive(add(diffIndex, 1)));
}

export function descExtraPoint(success:boolean) {
    return success ? 'Extra Point Made' : 'Extra Point Missed';
}

export function descFieldGoal(success:boolean, distance:number) {
    return `${distance+FIELD_GOAL_YARDS} Yd Field Goal ${success ? 'Made' : 'Missed'}`;
}

export function descKickoff(isTouchback:boolean, ballIndex:number) {
    if(isTouchback) return "Touchback - Start at 25 Yd Line";
    return `Kickoff returned for ${ballIndex*YARD_INTERVAL} Yds`;
}

export function descPenalty(isPenalty:boolean) {
    return isPenalty ? 'PENALTY:' : ''
};

export function descPlay(plays:string[]) {
    if(plays.length === 0) return '';
    return plays[randomNumber(plays.length)];
}

export function descPunt(isTouchback:boolean, distance:number) {
    return `${distance} Yd Punt${descTouchback(isTouchback)}`;
}

export function descSafety() {
    return 'Tackled in Endzone for Safety.'
};

function descTouchback(isTouchback:boolean) {
    return isTouchback ? ' - Touchback' : '';
}

export function descTwoPoint(success:boolean) {
    return `Two Point Conversion ${success ? 'Successful!' : 'Failed'}`;
}

export function descYardage(yards:number) {
    if(yards === 0) return '';
    return yards > 0  ? `- ${yards} Yd Gain ` : `- ${yards*-1} Yd Loss`;
}

function forcePositive(index:number){
    return index >= 0 ? index : index*-1;
}

export function getScoreByTeam(teamType:string, playLog:Play[]){
    return playLog
        .filter(({description, points, team }) => 
            (points > 0 && team === teamType) ||
            (points === 2 && team === OPPOSITE_TEAM[teamType] && description.includes('Safety'))
        )
        .reduce((total, play) => total + play.points, 0)
}

export function indexToYards(yards:number){
    return yards*YARD_INTERVAL;
}

export function inFieldGoalRange(action:string, possession:string, ballIndex:number){
    return showFieldGoalPulse(action) && compareFns[possession](ballIndex, BALL_FIELD_GOAL[possession]);
}

export function isAwayBall(pos:string) {
    return !isHomeBall(pos);
}

export function isHomeBall(pos:string) {
    return pos === TEAM.HOME;
}

export function isFourthDown(down:number) {
    return down === 4 
}

export function isGameComplete(homeScore:number, awayScore:number, winScore:number){
    return gte(awayScore, winScore) || gte(homeScore, winScore);
}

export function isOnsideKick(index:number) {
    return index === 11 
}

export function isModalChoice(mode:string, possession:string, action:string) {
    return mode === GAME_MODE.SOLO && possession === TEAM.AWAY && [
        GAME_ACTION.FOURTH_DOWN_OPTIONS,
        GAME_ACTION.POINT_OPTION
    ].includes(action) 
}

export function isRollAction(action:string) {
    return [
        GAME_ACTION.EXTRA_POINT, 
        GAME_ACTION.FIELD_GOAL, 
        GAME_ACTION.KICKOFF,
        GAME_ACTION.OFFENSE, 
        GAME_ACTION.PUNT, 
        GAME_ACTION.TWO_POINT
    ].includes(action);
}

export function isTouchback(index:number):boolean {
    return index < 1 || index > 19;
}

export function isTouchdown(possession: string, ballIndex:number, yards:number, isPenalty = false, isTurnover = false) {
    if(yards <= 0 || isPenalty || isTurnover) return false;
    return isTouchdownFns[possession](ballIndex, yardsToIndex(yards));
}

export function lastPlayDesc(possession: string, ballIndex: number, diceRoll:DiceRoll) {
    const {description, isPenalty=false, yards} = diceRoll;
    if(yards === 100 || isTouchdown(possession, ballIndex, 0, isPenalty)){
        return 'TOUCHDOWN!!!';
    } else {
        const lastPlay = [
            () => descPenalty(isPenalty),
            () => descPlay(description),
            () => descYardage(yards as number)
        ]
        return buildTextString(lastPlay);  
    }
}

export function madeExtraPoint(total:number) {
    return total >= 4
}

export function madeFirstDown(pos: string, ballIndex:number, firstDownIndex:number, autoFirstDown = false) {
    return autoFirstDown 
        || (!equals(firstDownIndex, -1) && compareFns[pos](ballIndex-1, firstDownIndex))
}

//TODO: Use winScore and factor in how close opponent is to winning
export function makeFourthDownChoice(awayScore:number, homeScore:number, ballIndex:number) {
    if(ballIndex >= 10 && homeScore - awayScore <= 16) return GAME_ACTION.PUNT;
    if(ballIndex <= 9 && homeScore - awayScore <= 16) return GAME_ACTION.FIELD_GOAL;

    return GAME_ACTION.OFFENSE;
}

export function makePointChoice(awayScore:number, homeScore:number, winScore:number) {
    if(winScore - awayScore <= 2) return GAME_ACTION.TWO_POINT
    if(homeScore - awayScore >= 10) return GAME_ACTION.TWO_POINT
    return GAME_ACTION.EXTRA_POINT
}

export function setFirstDownMarker(ballIndex:number, pos:string) {
    const yardIndex = isHomeBall(pos) ? 18 : 2;
    if(compareFns[pos](ballIndex, yardIndex)) return -1;
    
    const modifier = isHomeBall(pos) ? 1 : -3;
    return add(ballIndex, modifier);
}

export function primaryColor(settings:sStore, team = 'home'){
    const teamTyped = `${team.toLowerCase()}Team` as keyof typeof settings;
    return (settings[teamTyped] as Team).colors.primary
}

export function secondaryColor(settings:sStore, team = 'home'){
    const teamTyped = `${team.toLowerCase()}Team` as keyof typeof settings;
    return (settings[teamTyped] as Team).colors.secondary
}

export function setRandomTeam(teams:Team[], opponentId:string, saveFn:(a:Team)=>void){
    const {id} = teamById(teams)(randomNumber(teams.length-1).toString())
    equals(id, opponentId) ? setRandomTeam(teams, opponentId, saveFn) : saveFn(teamByUUId(teams)(id));  
}

export function showDownDistance(action:string){
    return [GAME_ACTION.OFFENSE, GAME_ACTION.PUNT].includes(action);
}

function showFieldGoalPulse(action:string){
    return [GAME_ACTION.FIELD_GOAL, GAME_ACTION.OFFENSE].includes(action);
}

export function teamById(teams:Team[]) {
    return function getTeam(id:string) {
        return teams[parseInt(id)] || DEFAULT_TEAM;
    }
}

export function teamByUUId(teams:Team[]) {
    return function getTeam(id:string) {
        return teams.find(t => t.id === id) || DEFAULT_TEAM;
    }
}

export function togglePossession(pos:string) {
    return isHomeBall(pos) ? TEAM.AWAY : TEAM.HOME
}

export function turnoverOnDowns(down: number, isFirstDown:boolean, isPenalty = false) {
    return isFourthDown(down) && !isFirstDown && !isPenalty;
}

export function twoPointSuccess(total:number){
    return total >= 8;
}

export function yardsToEndzone(pos:string, ballIndex:number){
    const yards = ballIndex*YARD_INTERVAL;
    return isHomeBall(pos) ? 100 - yards : yards;
}

export function yardsToIndex(yards:number){
    return yards/YARD_INTERVAL;
}
