<script lang="ts">
    import { fieldData } from '$lib/data/data.json'
	import { BALL_KICK_GOOD, POSITION, TEAM, YARD_INTERVAL } from "$lib/constants/constants";
    import EndZone from '$lib/components/Endzone.svelte'
	import { randomNumber } from '$lib/utils/common';
	import type { Team, Void } from '$lib/types';

    export let awayTeam:Team;
    export let ballIndex:number;
    export let firstDownIndex:number;
    export let homeTeam:Team;
    export let inFieldGoalRange:boolean;
    export let missedKick:boolean;
    export let onsideKick:boolean;
    export let possession:string;
    export let toggleFieldGoal:Void;

    $: ballPosition = (missedKick ? BALL_KICK_GOOD[possession] : ballIndex)*YARD_INTERVAL;
    let missDirection:string|undefined;
    $: if(missedKick){
        missDirection = ['left', 'right'][randomNumber()];
    }
</script>

<div class="field-wrapper">
    <EndZone 
        hasBall={possession === TEAM.AWAY}
        {inFieldGoalRange}
        position={POSITION.LEFT} 
        team={homeTeam}
        {toggleFieldGoal}
    />

    <div class="field">
        <div class="fieldLogo">
            <img 
                alt={`${homeTeam.city} ${homeTeam.name} Logo`} 
                src={`/logos/${homeTeam.name}.png`}/>
        </div>
        {#each fieldData as block, i}
            <div class="fiveYards" class:firstDown={i === firstDownIndex}>
                <div class="hashes"></div>
                <div class={`upper fieldNumber flipV ${i % 2 ? 'number' : 'zero' }`}>
                    {block.upperNumber}
                </div>
                <div class="first-mid hashes"></div>
                <div class="second-mid hashes"></div>
                <div class={`lower fieldNumber ${i % 2 ? 'number' : 'zero' }`}>
                    {block.lowerNumber}
                </div>
                <div class="lower hashes"></div>
            </div>
        {/each}   

        <div 
            class="football"
            class:center={!missedKick}
            class:missLeft={missedKick && missDirection === 'left'} 
            class:missRight={missedKick && missDirection === 'right'}
            style:left={`${ballPosition}%`}
            style:rotate={onsideKick ? '3turn' : 'initial'}
            style:transition={onsideKick ? 
                'left 0.5s ease-in-out, top 0.5s ease-in-out, rotate 0.5s ease-in-out' 
                : 'left 0.5s ease-in-out, top 0.5s ease-in-out, rotate 0s ease-in-out'
            }
        >
            <img alt="Football" src={`/images/football.png`}/>
        </div>
    </div>

    <EndZone 
        hasBall={possession === TEAM.HOME}
        {inFieldGoalRange}
        position={POSITION.RIGHT} 
        team={awayTeam}
        {toggleFieldGoal}
    />
</div>

<style>
    .field-wrapper {
        display: flex;
        width: 100%;
        min-height: 372px;
        background-color: var(--field);
    }
    .field {
        display: flex;
        width: 80%;
        
    }
    .field div.fiveYards:first-child {
        border-left: 1px solid var(--white);
    }
    .fieldLogo {
        position: absolute;
        top: 50%;
        left: 50%;
        max-width: 20%;
        transform: translate(-50%, -50%);
    }
    .fieldLogo img {
        width: 100%;
        opacity: .8;
    }
    .fieldNumber {
        position: absolute;
        color:  var(--white);
        font-size: 28px;
        font-family: var(--mono);
    }
    .upper.fieldNumber {
        top: 60px;
    }
    .lower.fieldNumber {
        bottom: 60px;
    }
    .number {
        right: 1px;
    }
    .center {
        top: 50%;
    }
    .missRight {
        top: 30%;
    }
    .missLeft {
        top: 70%;
    }
    .zero {
        left: 1px
    }
    .flipV {
        transform: scale(-1, -1);
        -moz-transform: scale(-1, -1);
        -webkit-transform: scale(-1, -1);
        -o-transform: scale(-1 -1);
        -ms-transform: scale(-1, -1);
    }
    .football {
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 10;
        width: 4.5%;
    }
    .football img {
        width: 100%;
        transition: all 0.5s ease-in-out;
    }
    .fiveYards {
        width: 5%;
        border-top: 2px solid var(--white);
        border-bottom: 2px solid var(--white);
        border-right: 1px solid var(--white);
    }
    .firstDown {
        border-right: 2px solid var(--yellow);
    }
    .hashes {
        position: absolute;
        left: 15%;
        right: 0;
        height: 3%;
        background: -webkit-linear-gradient(left, var(--white) 25%, transparent 25%);
        background-size: 25% 100%;
    }
    .first-mid.hashes {
        top: 39.25%;
    }
    .second-mid.hashes {
        top: 59.25%;
    }
    .lower.hashes {
        bottom: 0;
    }
</style>