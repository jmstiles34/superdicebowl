<script lang="ts">
    import { game } from '$lib/stores/Game'
    import { settings } from '$lib/stores/Settings'
    import * as R from 'ramda';
    import { fieldData } from '$lib/data/data.json'
	import { POSITION, TEAM } from "$lib/constants/constants";
    import EndZone from '$lib/components/Endzone.svelte'
	import { randomNumber } from '$lib/utils/common';
	import { inFieldGoalRange } from '$lib/utils/game';

    let missDirection:string|undefined;
    $: if($game.missedKick){
        missDirection = ['left', 'right'][randomNumber()];
    }
</script>

<div class="field-wrapper">
    <EndZone 
        hasBall={R.equals($game.possession, TEAM.AWAY)}
        inFieldGoalRange={inFieldGoalRange($game.action, $game.possession, $game.ballIndex)}
        position={POSITION.LEFT} 
        team={$settings.homeTeam}
        on:toggleFieldGoal 
    />

    <div class="field">
        <div class="fieldLogo">
            <img 
                alt={`${$settings.homeTeam.city} ${$settings.homeTeam.name} Logo`} 
                src={`/logos/${$settings.homeTeam.name}.png`}/>
        </div>
        {#each fieldData as block, i}
            <div class="fiveYards" class:firstDown={R.equals(i, $game.firstDownIndex)}>
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
            class={`football`}
            class:center={!$game.missedKick}
            class:missLeft={$game.missedKick && missDirection === 'left'} 
            class:missRight={$game.missedKick && missDirection === 'right'} 
            style={`left: ${$game.ballIndex*5}%`}
        >
            <img 
                alt="Football" 
                src={`/images/football.png`}/>
        </div>
    </div>

    <EndZone 
        hasBall={R.equals($game.possession, TEAM.HOME)}
        inFieldGoalRange={inFieldGoalRange($game.action, $game.possession, $game.ballIndex)}
        position={POSITION.RIGHT} 
        team={$settings.awayTeam}
        on:toggleFieldGoal 
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
        transition: all 0.3s ease-out;
    }
    .football img {
        width: 100%;
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