<script lang="ts">
    import { createEventDispatcher, tick } from 'svelte';
    import { onMount } from 'svelte';
    import * as R from 'ramda';
    import { pickRandom, sleep, sumDigits } from '$lib/utils/common'
    import { 
        ballPosition,
        descExtraPoint, 
        descFieldGoal, 
        descKickoff, 
        descPunt, 
        descSafety, 
        descTwoPoint, 
        distance,
        getFieldGoalRange,
        inFieldGoalRange, 
        initialState,
        isFirstDown,
        isFourthDown,
        isHomeBall,
        isTouchback,
        isTouchdown,
        lastPlay,
        setFirstDownMarker,
        showDownDistance, 
        togglePossession,
        yardsToGo,
    } from '$lib/utils/game'
    import { diceData } from '$lib/data/data.json'
    import type { DiceRoll, Game, GameSettings, Modal } from '$lib/types';
    import { 
        BALL_TWO_POINT, BALL_EXTRA_POINT, BALL_KICKOFF, BALL_PUNT, CONVERSION, DOWN, FOURTH_DOWN, 
        GAME_ACTION, MODAL_CONTENT, POINTS, TEAM, BALL_TOUCHDOWN, BALL_TOUCHBACK, BALL_FIELD_GOAL, 
        BALL_KICK_GOOD, BALL_SAFETY, FIELD_GOAL_ROLL, FIELD_GOAL_YARDS, TRICK_PLAY_YARDS 
    } from '$lib/constants/constants';
    import Dice from '$lib/components/Dice.svelte';
    import Scores from '$lib/components/Scores.svelte';
    import Field from '$lib/components/Field.svelte';
    import GameModal from '$lib/components/GameModal.svelte';
    import CoinToss from '$lib/components/modal/CoinToss.svelte';
    import PointOption from '$lib/components/modal/PointOption.svelte';
	import FourthDown from '$lib/components/modal/FourthDown.svelte';
    const dispatch = createEventDispatcher();

    export let gameSettings:GameSettings; 

    let game:Game = initialState();
    let diceRollData:DiceRoll[] = diceData;

    $: if(R.gte(game.awayScore, gameSettings.winScore) || R.gte(game.homeScore, gameSettings.winScore)){
        game = {
            ...game,
            action: GAME_ACTION.GAME_OVER,
            lastPlay: `${R.gte(game.awayScore, gameSettings.winScore) ? 
                gameSettings.awayTeam.city 
                : gameSettings.homeTeam.city} Wins!!!`,
            restrictDice: true,
        }
    }

    onMount(() => {
        toggleModal();
    });

    function toggleModal() {
        game.showModal = !game.showModal;
    };

    function handleDiceRoll(e:CustomEvent) {
        const {detail} = e;
        game.restrictDice = true;
        if( R.equals(game.action, GAME_ACTION.KICKOFF) ){
            executeKickOff(detail.diceId)
        } else if ( R.equals(game.action, GAME_ACTION.OFFENSE) ){
            executeOffense(detail.diceId)
        } else if ( R.equals(game.action, GAME_ACTION.PUNT) ){
            executePunt(detail.diceId)
        } else if ( R.equals(game.action, GAME_ACTION.EXTRA_POINT) ){
            executeExtraPoint(detail.diceId)
        } else if ( R.equals(game.action, GAME_ACTION.TWO_POINT) ){
            executeTwoPoint(detail.diceId)
        } else if ( R.equals(game.action, GAME_ACTION.FIELD_GOAL) ){
            executeFieldGoal(detail.diceId)
        }
    }

    async function executeExtraPoint(diceId:number) {
        let homeScore = game.homeScore;
        let awayScore = game.awayScore;
        let success = R.gte(sumDigits(diceId), 4);
        game = {
            ...game,
            missedKick: !success,
            ballIndex: BALL_KICK_GOOD[game.possession],
            lastPlay: descExtraPoint(sumDigits(diceId))
        }
        if(success){
            if(isHomeBall(game.possession)){
                homeScore = R.add(homeScore, POINTS.EXTRA_POINT);
            } else {
                awayScore = R.add(awayScore, POINTS.EXTRA_POINT);
            }
        }
        await sleep(1500);
        let newPos = isHomeBall(game.possession) ? TEAM.AWAY : TEAM.HOME
        game = {
            ...game,
            awayScore,
            homeScore,
            missedKick: false,
            possession: newPos,
            currentDown: 1,
            yardsToGo: 10,
            ballIndex: BALL_KICKOFF[newPos],
            action: GAME_ACTION.KICKOFF,
            restrictDice: false,
        }
    }

    async function executeFieldGoal(diceId:number) {
        let homeScore = game.homeScore;
        let awayScore = game.awayScore;
        let distanceRequired = isHomeBall(game.possession) ?
            (20 - game.ballIndex)*5 : 
            (game.ballIndex)*5;
        let success = R.gte(sumDigits(diceId), FIELD_GOAL_ROLL[distanceRequired]) ;
        let currentBallIndex = game.ballIndex;

        game = {
            ...game,
            missedKick: !success,
            ballIndex: BALL_KICK_GOOD[game.possession],
            lastPlay: descFieldGoal(success, distanceRequired)
        }
        if(success){
            if(isHomeBall(game.possession)){
                homeScore = R.add(homeScore, POINTS.FIELD_GOAL);
            } else {
                awayScore = R.add(awayScore, POINTS.FIELD_GOAL);
            }
        }
        await sleep(1500);
        let newPos = isHomeBall(game.possession) ? TEAM.AWAY : TEAM.HOME
        game = {
            ...game,
            awayScore,
            homeScore,
            missedKick: false,
            currentDown: 1,
            firstDownIndex: success ? -1 : setFirstDownMarker(currentBallIndex, newPos),
            yardsToGo: 10,
            possession: newPos,
            ballIndex: success ? BALL_KICKOFF[newPos] : currentBallIndex,
            action: success ? GAME_ACTION.KICKOFF : GAME_ACTION.OFFENSE,
            restrictDice: false,
        }
    }

    async function executeKickOff(diceId:number) {
        game = {
            ...game,
            lastPlay: descKickoff(diceId),
        }
        if(diceId === 66){
            let awayScore = game.awayScore;
            let homeScore = game.homeScore;
            game = {
                ...game,
                ballIndex: BALL_TOUCHDOWN[game.possession],
                action: GAME_ACTION.TOUCHDOWN,
                awayScore: !isHomeBall(game.possession) ? R.add(awayScore, POINTS.TOUCHDOWN) : awayScore,
                homeScore: isHomeBall(game.possession) ? R.add(homeScore, POINTS.TOUCHDOWN) : homeScore,
            }
            await sleep(2000);
            game = {
                ...game,
                showModal: true,
                modalContent: MODAL_CONTENT.POINT_OPTION,
            }

        } else if (diceId === 11){
            game = {
                ...game,
                ballIndex: 10,
                action: GAME_ACTION.OFFENSE,
                firstDownIndex: setFirstDownMarker(10, game.possession),
                restrictDice: false
            }
        } else {
            let ballIndex = BALL_TOUCHBACK[game.possession];
            game = {
                ...game,
                ballIndex,
                action: GAME_ACTION.OFFENSE,
                firstDownIndex: setFirstDownMarker(ballIndex, game.possession),
                restrictDice: false
            }
        }
    }

    async function executePunt(diceId:number) {
        let distanceIndex = sumDigits(diceId);
        let ballIndex = isHomeBall(game.possession)
            ? R.add(game.ballIndex, distanceIndex)
            : R.subtract(game.ballIndex, distanceIndex);
        let newPos = togglePossession(game.possession);

        game = {
            ...game,
            action: GAME_ACTION.OFFENSE,
            lastPlay: descPunt(isTouchback(ballIndex), distance(distanceIndex)),
            possession: newPos,
            ballIndex: isTouchback(ballIndex) ? BALL_PUNT[newPos] : ballIndex,
            firstDownIndex: setFirstDownMarker(ballIndex, newPos),
            currentDown: 1,
            yardsToGo: 10,
            restrictDice: false,
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
            let ballIndex = ballPosition(game.ballIndex, game.possession, yards*-1, isPenalty);
            let playResults;
            let playYards = yards;
            let isTD = R.equals(yards, 100) || isTouchdown(game.possession, ballIndex, playYards, isPenalty); 
            let turnoverTouchback = isTurnover &&  isTouchback(ballIndex);          
            
            if(isTurnover){
                let newPos = togglePossession(game.possession);
                ballIndex = turnoverTouchback ? BALL_PUNT[newPos] : ballIndex;
                playResults = {
                    ballIndex,
                    currentDown: 1,
                    possession: newPos,
                    firstDownIndex: setFirstDownMarker(ballIndex, newPos),
                    yardsToGo: 10,
                }
            } else {
                if(isTD){
                    let awayScore = game.awayScore;
                    let homeScore = game.homeScore;
                    game = {
                        ...game,
                        ballIndex: BALL_TOUCHDOWN[game.possession],
                        firstDownIndex: -1,
                        awayScore: !isHomeBall(game.possession) ? R.add(awayScore, POINTS.TOUCHDOWN) : awayScore,
                        homeScore: isHomeBall(game.possession) ? R.add(homeScore, POINTS.TOUCHDOWN) : homeScore,
                        lastPlay: 'TOUCHDOWN!!!',
                    }
                    await sleep(2000);
                    await tick();
                    playResults = {
                        showModal: true,
                        modalContent: MODAL_CONTENT.POINT_OPTION,
                    }
                } else {
                    playYards = R.equals(diceId, 44) ? pickRandom(TRICK_PLAY_YARDS) as number : yards;
                    let ballIndex:number = ballPosition(game.ballIndex, game.possession, playYards, isPenalty);
                    let isSafety = false;
                    if( R.lt(playYards, 0)  && (R.lt(ballIndex, 1) || R.gt(ballIndex, 19))){
                        isSafety = true;
                    }

                    if(isSafety){
                        let ballIndex = BALL_SAFETY[game.possession];
                        let awayScore = game.awayScore;
                        let homeScore = game.homeScore;
                        if(isHomeBall(game.possession)){
                            awayScore = R.add(awayScore, POINTS.TWO_POINT);
                        } else {
                            homeScore = R.add(homeScore, POINTS.TWO_POINT);
                        }
                        game = {
                            ...game,
                            lastPlay: descSafety(),
                            ballIndex,
                            firstDownIndex: -1,
                            currentDown: 1,
                            yardsToGo: 10,
                            awayScore,
                            homeScore,
                        };
                        
                        await sleep(1500);
                        let newPos = togglePossession(game.possession);
                        game = {
                            ...game,
                            possession: newPos,
                            currentDown: 1,
                            yardsToGo: 10,
                            ballIndex: BALL_KICKOFF[newPos],
                            action: GAME_ACTION.KICKOFF,
                            restrictDice: false,
                        };
                    } else {
                        playResults = {
                            ballIndex,
                            currentDown: isPenalty ? game.currentDown : game.currentDown+1,
                            yardsToGo: yardsToGo(ballIndex, game.possession, game.firstDownIndex),
                        }
                        if(isFirstDown(game.possession, ballIndex, game.firstDownIndex, autoFirstDown)){
                            let newFirstDown = setFirstDownMarker(ballIndex, game.possession);
                            playResults = {
                                ...playResults,
                                currentDown: 1,
                                firstDownIndex: newFirstDown,
                                yardsToGo: yardsToGo(ballIndex, game.possession, newFirstDown),
                            }
                        } else if( R.equals(game.currentDown, 4) && !isPenalty){
                            let newPos = togglePossession(game.possession);
                            playResults = {
                                ...playResults,
                                currentDown: 1,
                                possession: newPos,
                                firstDownIndex: setFirstDownMarker(ballIndex, newPos),
                                yardsToGo: 10,
                            }
                        }
                    }
                }
            }
            game = {
                ...game,
                lastPlay: lastPlay(game.possession, ballIndex, {...diceRoll, yards: playYards}, turnoverTouchback),
                ...playResults
            }
            if(!isTD && isFourthDown(game.currentDown)) {
                await sleep(1500)
                game = {
                    ...game,
                    showModal: true,
                    modalContent: MODAL_CONTENT.FOURTH_DOWN
                }
            }
        }
        await sleep(2000);
        game = {
            ...game,
            restrictDice: false,
        }
    }

    async function executeTwoPoint(diceId:number) {
        let ballIndex = game.ballIndex;
        let awayScore = game.awayScore;
        let homeScore = game.homeScore;
        if(sumDigits(diceId) >= 8){
            if(isHomeBall(game.possession)){
                ballIndex = 21
                homeScore = R.add(homeScore, POINTS.TWO_POINT) 
            } else {
                ballIndex = -1
                awayScore = R.add(awayScore, POINTS.TWO_POINT) 
            }
        }
        game = {
            ...game,
            lastPlay: descTwoPoint(sumDigits(diceId)),
            ballIndex,
            awayScore,
            homeScore,
        };
        
        await sleep(1500);
        let newPos = togglePossession(game.possession);
        game = {
            ...game,
            possession: newPos,
            currentDown: 1,
            yardsToGo: 10,
            ballIndex: BALL_KICKOFF[newPos],
            action: GAME_ACTION.KICKOFF,
            restrictDice: false,
        };
    } 

    function toggleFieldGoal(){
        let distanceRequired = isHomeBall(game.possession) ?
            (20 - game.ballIndex)*5 : 
            (game.ballIndex)*5;
        let diceTotal:number = FIELD_GOAL_ROLL[distanceRequired];
        game = {
            ...game,
            action: game.action === GAME_ACTION.OFFENSE ? GAME_ACTION.FIELD_GOAL : GAME_ACTION.OFFENSE,
            lastPlay: game.action === GAME_ACTION.OFFENSE ? `${distanceRequired+FIELD_GOAL_YARDS} Yard Field Goal Attempt (${diceTotal}+)` : '',
            restrictDice: false,
            showModal: false,
        };
    }

    function setFourthDownChoice(choice:string) {
        let action = GAME_ACTION.OFFENSE;
        let lastPlay = game.lastPlay;  
        if(R.equals(choice, FOURTH_DOWN.PUNT)){
            action = GAME_ACTION.PUNT
        }
        if(R.equals(choice, GAME_ACTION.FIELD_GOAL)){
            toggleFieldGoal();
        } else {
            game = {
                ...game,
                action,
                lastPlay,
                restrictDice: false,
                showModal: false,
            };
        }
    }
    function setPointOption(choice:string) {
        let pointOptions
        if(R.equals(choice, CONVERSION.EXTRA_POINT_ATTEMPT)){
            pointOptions = {
                ballIndex: BALL_EXTRA_POINT[game.possession],
                action: GAME_ACTION.EXTRA_POINT,
                lastPlay: 'Must Roll 4+ to Convert',
            }
        } else {
            pointOptions = {
                ballIndex: BALL_TWO_POINT[game.possession],
                action: GAME_ACTION.TWO_POINT,
                lastPlay: 'Must Roll 8+ to Convert',
            }
        }
        
        game = {
            ...game,
            firstDownIndex: -1,
            ...pointOptions,
            restrictDice: false,
            showModal: false,
        };
    }
    function setPossession(team:string) {
        game = {
            ...game,
            possession: team,
            ballIndex: BALL_KICKOFF[team],
            showModal: false,
        };
    }
</script>

<main>
    <div class="game">
        <div class="controls">
            <div class="dice-container">
                <div class="action">{game.action}</div>
                <Dice 
                    on:diceRoll={handleDiceRoll}
                    dieColor={isHomeBall(game.possession) ? gameSettings.homeTeam.primaryColor : gameSettings.awayTeam.primaryColor} 
                    pipColor={isHomeBall(game.possession) ? gameSettings.homeTeam.secondaryColor : gameSettings.awayTeam.secondaryColor} 
                />
                {#if game.restrictDice}
                    <div class="dice-block" />
                {/if}
            </div>
            <div class="scoreboard">
                <Scores 
                    awayScore={game.awayScore} 
                    awayTeam={gameSettings.awayTeam} 
                    homeScore={game.homeScore} 
                    homeTeam={gameSettings.homeTeam} 
                    possession={game.possession}
                />
                {#if showDownDistance(game.action)}
                    <div class="down-to-go">
                        {DOWN[game.currentDown]} & {game.yardsToGo}
                    </div>
                {/if}
                <div class="last-play">
                    {game.lastPlay}
                </div>
            </div>
        </div>

        <Field 
            homeTeam={gameSettings.homeTeam}
            awayTeam={gameSettings.awayTeam} 
            ballIndex={game.ballIndex} 
            firstDownIndex={game.firstDownIndex}
            inFieldGoalRange={inFieldGoalRange(game.action, game.possession, game.ballIndex)}
            missedKick={game.missedKick}
            possession={game.possession}
            on:toggleFieldGoal={toggleFieldGoal}
        />
    </div>

    <GameModal showModal={game.showModal} on:click={toggleModal}>
        <div class="model-content">
            {#if R.equals(game.modalContent, MODAL_CONTENT.COIN_TOSS)}
                <CoinToss homeTeam={gameSettings.homeTeam} awayTeam={gameSettings.awayTeam} {setPossession} />
            {/if}
            {#if R.equals(game.modalContent, MODAL_CONTENT.POINT_OPTION)}
                <PointOption {setPointOption} />
            {/if}
            {#if R.equals(game.modalContent, MODAL_CONTENT.FOURTH_DOWN)}
                <FourthDown {setFourthDownChoice} inFieldGoalRange={getFieldGoalRange(game.possession, game.ballIndex)} />
            {/if}
        </div>
    </GameModal>
</main>
<div class="exit-button">
    <button on:click={() => dispatch('reset')}>RETURN TO SETTINGS</button>
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