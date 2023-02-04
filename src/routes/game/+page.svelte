<script lang="ts">
    import { onDestroy } from 'svelte';
    import { onMount } from 'svelte';
    import { game } from '$lib/stores/Game'
    import { settings } from '$lib/stores/Settings'
    import { goto } from '$app/navigation';
    import * as R from 'ramda';
    import { pickRandom, sleep, sumDigits } from '$lib/utils/common'
    import { 
        ballPosition,
        compareFns,
        descExtraPoint, 
        descFieldGoal, 
        descKickoff, 
        descPunt, 
        descSafety, 
        descTwoPoint, 
        forwardFns, 
        isFirstDown,
        isFourthDown,
        isHomeBall,
        isTouchback,
        isTouchdown,
        lastPlay,
        primaryColor,
        secondaryColor,
        setFirstDownMarker,
        showDownDistance, 
        twoPointSuccess,
        yardDistance,
        yardsToGo,
    } from '$lib/utils/game'
    import { diceData } from '$lib/data/data.json'
    import type { DiceRoll } from '$lib/types';
    import { 
        BALL_PUNT, DOWN, FOURTH_DOWN, GAME_ACTION, MODAL_CONTENT, POINTS, BALL_TOUCHDOWN, 
        BALL_TOUCHBACK, BALL_FIELD_GOAL, BALL_KICK_GOOD, BALL_SAFETY, FIELD_GOAL_ROLL, 
        FIELD_GOAL_YARDS, TRICK_PLAY_YARDS, YARD_INTERVAL, OPPOSITE_TEAM 
    } from '$lib/constants/constants';
    import Dice from '$lib/components/Dice.svelte';
    import Scores from '$lib/components/Scores.svelte';
    import Field from '$lib/components/Field.svelte';
    import GameModal from '$lib/components/GameModal.svelte';
    import CoinToss from '$lib/components/modal/CoinToss.svelte';
    import PointOption from '$lib/components/modal/PointOption.svelte';
	import FourthDown from '$lib/components/modal/FourthDown.svelte';

    onDestroy(() => {
        game.reset();
    })

    let diceRollData:DiceRoll[] = diceData;

    $: if(R.gte($game.awayScore, $settings.winScore) || R.gte($game.homeScore, $settings.winScore)){
        game.updateGame(
            {
                action: GAME_ACTION.GAME_OVER,
                lastPlay: `${R.gte($game.awayScore, $settings.winScore) ? 
                    $settings.awayTeam.city 
                    : $settings.homeTeam.city} Wins!!!`,
                restrictDice: true,
            }
        );
    }

    onMount(() => {
        const {awayTeam, homeTeam} = $settings;
        if(R.equals(awayTeam.id, 0) || R.equals(homeTeam.id, 0)){
            goto('/')
        } else {
            toggleModal();
        }
    });

    function toggleModal() {
        game.updateGame({showModal: !$game.showModal});
    };

    const executeFns = {
        [GAME_ACTION.EXTRA_POINT]: executeExtraPoint,
        [GAME_ACTION.FIELD_GOAL]: executeFieldGoal,
        [GAME_ACTION.KICKOFF]: executeKickOff,
        [GAME_ACTION.OFFENSE]: executeOffense,
        [GAME_ACTION.PUNT]: executePunt,
        [GAME_ACTION.TWO_POINT]: executeTwoPoint,
    }

    function handleDiceRoll(e:CustomEvent) {
        game.restrictDice(true);
        executeFns[$game.action](e.detail);
    }

    async function executeExtraPoint(diceId:number) {
        let homeScore = $game.homeScore;
        let awayScore = $game.awayScore;
        let success = R.gte(sumDigits(diceId), 4);
        if(success){
            if(isHomeBall($game.possession)){
                homeScore = R.add(homeScore, POINTS.EXTRA_POINT);
            } else {
                awayScore = R.add(awayScore, POINTS.EXTRA_POINT);
            }
        }
        game.updateGame({
            awayScore,
            homeScore,
            missedKick: !success,
            ballIndex: BALL_KICK_GOOD[$game.possession],
            lastPlay: descExtraPoint(sumDigits(diceId))
        });
        
        await sleep(1500);
        game.prepareKickoff();
    }

    async function executeFieldGoal(diceId:number) {
        let homeScore = $game.homeScore;
        let awayScore = $game.awayScore;
        let distanceRequired = isHomeBall($game.possession) ?
            (20 - $game.ballIndex)*5 : 
            ($game.ballIndex)*5;
        let success = R.gte(sumDigits(diceId), FIELD_GOAL_ROLL[distanceRequired]);
        let currentBallIndex = $game.ballIndex;
        
        if(success){
            if(isHomeBall($game.possession)){
                homeScore = R.add(homeScore, POINTS.FIELD_GOAL);
            } else {
                awayScore = R.add(awayScore, POINTS.FIELD_GOAL);
            }
        }

        game.updateGame({
            awayScore,
            homeScore,
            missedKick: !success,
            ballIndex: BALL_KICK_GOOD[$game.possession],
            lastPlay: descFieldGoal(success, distanceRequired)
        });
        
        await sleep(1500);
        if(success){
            game.prepareKickoff()
        } else {
            game.turnover(currentBallIndex)
        }  
    }

    async function executeKickOff(diceId:number) {
        game.updateGame({
            lastPlay: descKickoff(diceId),
        });
        if(diceId === 66){
            let playResult = applyTouchdown($game.awayScore, $game.homeScore, $game.possession);
            await sleep(2000);
            game.updateGame(playResult);

        } else if (diceId === 11){
            game.updateGame({
                ballIndex: 10,
                action: GAME_ACTION.OFFENSE,
                firstDownIndex: setFirstDownMarker(10, $game.possession),
                restrictDice: false
            });
        } else {
            let ballIndex = BALL_TOUCHBACK[$game.possession];
            game.updateGame({
                ballIndex,
                action: GAME_ACTION.OFFENSE,
                firstDownIndex: setFirstDownMarker(ballIndex, $game.possession),
                restrictDice: false
            });
        }
    }

    async function executePunt(diceId:number) {
        let distanceIndex = sumDigits(diceId);
        let ballIndex = forwardFns[$game.possession]($game.ballIndex, distanceIndex);
        let newPos = OPPOSITE_TEAM[$game.possession];

        game.updateGame({
            action: GAME_ACTION.OFFENSE,
            lastPlay: descPunt(isTouchback(ballIndex), yardDistance(distanceIndex)),
            possession: newPos,
            ballIndex: isTouchback(ballIndex) ? BALL_PUNT[newPos] : ballIndex,
            firstDownIndex: setFirstDownMarker(ballIndex, newPos),
            currentDown: 1,
            yardsToGo: 10,
            restrictDice: false,
        });
    }

    function applyTouchdown(awayScore:number, homeScore:number, pos:string) {
        game.updateGame({
            action: GAME_ACTION.TOUCHDOWN,
            ballIndex: BALL_TOUCHDOWN[pos],
            firstDownIndex: -1,
            awayScore: !isHomeBall(pos) ? R.add(awayScore, POINTS.TOUCHDOWN) : awayScore,
            homeScore: isHomeBall(pos) ? R.add(homeScore, POINTS.TOUCHDOWN) : homeScore,
            lastPlay: 'TOUCHDOWN!!!',
        });
        return {
            showModal: true,
            modalContent: MODAL_CONTENT.POINT_OPTION,
        }
    }

    async function executeOffense(diceId:number) {
        let diceRoll = diceRollData.find(d => d.id === diceId );

        if(diceRoll){
            let {
                autoFirstDown = false, 
                isPenalty = false, 
                isTurnover = false, 
                yards = 0
            } = diceRoll;
            let ballIndex = ballPosition($game.ballIndex, $game.possession, yards*-1, isPenalty);
            let playResults;
            let playYards = yards;
            let isTD = R.equals(yards, 100) || isTouchdown($game.possession, $game.ballIndex, playYards, isPenalty); 
            let turnoverTouchback = isTurnover &&  isTouchback(ballIndex);          

            if(isTurnover){
                let newBallIndex = turnoverTouchback ? BALL_PUNT[OPPOSITE_TEAM[$game.possession]] : ballIndex;
                game.turnover(newBallIndex)
            } else {
                if(isTD){
                    playResults = applyTouchdown($game.awayScore, $game.homeScore, $game.possession);
                    await sleep(2000);
                } else {
                    playYards = R.equals(diceId, 44) ? pickRandom(TRICK_PLAY_YARDS) as number : yards;
                    let ballIndex:number = ballPosition($game.ballIndex, $game.possession, playYards, isPenalty);
                    let isSafety = false;
                    if( R.lt(playYards, 0)  && (R.lt(ballIndex, 1) || R.gt(ballIndex, 19))){
                        isSafety = true;
                    }

                    if(isSafety){
                        let ballIndex = BALL_SAFETY[$game.possession];
                        let awayScore = $game.awayScore;
                        let homeScore = $game.homeScore;
                        if(isHomeBall($game.possession)){
                            awayScore = R.add(awayScore, POINTS.TWO_POINT);
                        } else {
                            homeScore = R.add(homeScore, POINTS.TWO_POINT);
                        }
                        game.updateGame({
                            lastPlay: descSafety(),
                            ballIndex,
                            firstDownIndex: -1,
                            currentDown: 1,
                            yardsToGo: 10,
                            awayScore,
                            homeScore,
                        });
                        
                        await sleep(1500);
                        game.prepareKickoff();
                    } else {
                        playResults = {
                            ballIndex,
                            currentDown: isPenalty ? $game.currentDown : $game.currentDown+1,
                            yardsToGo: yardsToGo($game.firstDownIndex, $game.firstDownIndex-ballIndex),
                        }

                        if(isFirstDown($game.possession, ballIndex, $game.firstDownIndex, autoFirstDown)){
                            let newFirstDown = setFirstDownMarker(ballIndex, $game.possession);
                            playResults = {
                                ...playResults,
                                currentDown: 1,
                                firstDownIndex: newFirstDown,
                                yardsToGo: yardsToGo(newFirstDown, newFirstDown-ballIndex),
                            }
                        } else if( R.equals($game.currentDown, 4) && !isPenalty){
                            game.turnover(ballIndex)
                        }
                    }
                }
            }
            game.updateGame({
                lastPlay: lastPlay($game.possession, ballIndex, {...diceRoll, yards: playYards}, turnoverTouchback),
                ...playResults
            });
            if(!isTD && isFourthDown($game.currentDown)) {
                await sleep(1500)
                game.updateGame({
                    showModal: true,
                    modalContent: MODAL_CONTENT.FOURTH_DOWN
                });
            }
        }
        await sleep(1500);
        game.restrictDice(false);
    }

    async function executeTwoPoint(diceId:number) {
        let awayScore = $game.awayScore;
        let homeScore = $game.homeScore;
        let success = twoPointSuccess(sumDigits(diceId))
        if(success){
            if(isHomeBall($game.possession)){
                homeScore = R.add(homeScore, POINTS.TWO_POINT) 
            } else {
                awayScore = R.add(awayScore, POINTS.TWO_POINT) 
            }
        }
        game.updateGame({
            lastPlay: descTwoPoint(success),
            ballIndex: BALL_TOUCHDOWN[$game.possession],
            awayScore,
            homeScore,
        });
        
        await sleep(1500);
        game.prepareKickoff();
    } 

    function toggleFieldGoal(){
        let distanceRequired = isHomeBall($game.possession) ?
            (20 - $game.ballIndex)*YARD_INTERVAL : 
            ($game.ballIndex)*YARD_INTERVAL;
        let diceTotal:number = FIELD_GOAL_ROLL[distanceRequired];
        game.updateGame({
            action: $game.action === GAME_ACTION.OFFENSE ? GAME_ACTION.FIELD_GOAL : GAME_ACTION.OFFENSE,
            lastPlay: $game.action === GAME_ACTION.OFFENSE ? `${distanceRequired+FIELD_GOAL_YARDS} Yard Field Goal Attempt (${diceTotal}+)` : '',
            restrictDice: false,
            showModal: false,
        });
    }

    function setFourthDownChoice(choice:string) {
        let action = GAME_ACTION.OFFENSE;
        let lastPlay = $game.lastPlay;  
        if(R.equals(choice, FOURTH_DOWN.PUNT)){
            action = GAME_ACTION.PUNT
        }
        if(R.equals(choice, GAME_ACTION.FIELD_GOAL)){
            toggleFieldGoal();
        } else {
            game.updateGame({
                action,
                lastPlay,
                restrictDice: false,
                showModal: false,
            });
        }
    }
</script>

<main>
    <div class="game">
        <div class="controls">
            <div class="dice-container">
                <div class="action">{$game.action}</div>
                <Dice 
                    on:diceRoll={handleDiceRoll}
                    dieColor={primaryColor($settings, $game.possession)} 
                    pipColor={secondaryColor($settings, $game.possession)} 
                />
                {#if $game.restrictDice}
                    <div class="dice-block" />
                {/if}
            </div>
            <div class="scoreboard">
                <Scores />
                {#if showDownDistance($game.action)}
                    <div class="down-to-go">
                        {DOWN[$game.currentDown]} & {$game.yardsToGo}
                    </div>
                {/if}
                <div class="last-play">
                    {$game.lastPlay}
                </div>
            </div>
        </div>

        <Field on:toggleFieldGoal={toggleFieldGoal} />
    </div>

    <GameModal showModal={$game.showModal} on:click={toggleModal}>
        <div class="model-content">
            {#if R.equals($game.modalContent, MODAL_CONTENT.COIN_TOSS)}
                <CoinToss />
            {/if}
            {#if R.equals($game.modalContent, MODAL_CONTENT.POINT_OPTION)}
                <PointOption />
            {/if}
            {#if R.equals($game.modalContent, MODAL_CONTENT.FOURTH_DOWN)}
                <FourthDown 
                    {setFourthDownChoice} 
                    inFieldGoalRange={compareFns[$game.possession]($game.ballIndex, BALL_FIELD_GOAL[$game.possession])} 
                />
            {/if}
        </div>
    </GameModal>
</main>
<div class="exit-button">
    <button on:click={() => goto('/')}>RETURN TO SETTINGS</button>
</div>

<style>
    main {
        position: relative;
        padding: 20px;
	}
    .game{
        max-width: 850px;
        min-width: 600px;
        margin: 0 auto;
    }
    .controls {
        display: flex;
        background-color: var(--smoke);
        padding: 1%;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
    }
    .dice-container {
        display: flex;
        flex-direction: column;
        width: 176px;
        height: 116px;
    }
    .action {
        color: var(--white);
        font-family: var(--mono);
        line-height: 1.5rem;
        font-size: 18px;
        white-space: nowrap;
    }
    .dice-block {
        position: absolute;
        top: 0;
        height: 100%;
        width: 100%;
        background-color: var(--black);
        opacity: .2; 
    }
    .scoreboard {
        display: flex;
        flex-direction: column;
        width: 100%;
    }
    .down-to-go {
        text-align: center;
        font-size: 24px;
        font-family: var(--mono);
        color: var(--white);
    }
    .last-play {
        text-align: center;
        font-size: 20px;
        font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
        color: gold;
    }
    .exit-button {
        margin-top: 10px;
    }

    @media (min-width: 850px) {
        .controls {
            min-height: 132px;
        }
    }
</style>