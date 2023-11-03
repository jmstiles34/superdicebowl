<script lang="ts">
    import { game } from '$lib/stores/Game'
    import { settings } from '$lib/stores/Settings'
    import { elasticInOut } from "svelte/easing";
    import { nonZeroRandomNumber, sfx, sleep } from '$lib/utils/common'
	import { isRollAction } from '$lib/utils/game';
	import { GAME_MODE, TEAM } from '$lib/constants/constants';
	import { tick } from 'svelte';
    
    export let dieColor:string;
    export let pipColor:string;
    export let pipCount:number = 6;
    export let rollDelay:number = 1000;
    
    let dice:number[][] = [Array(1).fill(0), Array(1).fill(0)];
    let canRoll:boolean = true;

    function diceTransition(e:HTMLDivElement) {
        return {
            css: (t:number) => {
                return `
                transform: scale(${t});
                `;
            },
            easing: elasticInOut,
            duration: 1000,
        };
    };

    function handleKeyPress(e:KeyboardEvent){
        if(e.code === "Space"){
            handleRollDice();
        }
    }

    $: if(
        $settings.mode === GAME_MODE.SOLO && 
        $game.possession === TEAM.AWAY && 
        isRollAction($game.action) &&
        canRoll
        ){
        if($game.ballIndex > 0 || $game.currentDown > 0){
            tick();
            sleep(2000).then(() => {
                handleRollDice();
            }
        );
        } 
    }

    async function handleRollDice() {
        if(!canRoll) return;

        game.restrictDice(true);
        sfx('flick');
        canRoll = false;
        let die1:number = nonZeroRandomNumber(pipCount);
        let die2:number = nonZeroRandomNumber(pipCount);
        let diceId = Math.min(parseInt(`${die1}${die2}`), parseInt(`${die2}${die1}`),)
        
        dice = [];
        await sleep(rollDelay);
        dice = [Array(die1).fill(0), Array(die2).fill(0)];
        await sleep(rollDelay);
        canRoll = true;
        game.handleDiceRoll($game.action, diceId);
    };
</script>

<button class="dice-button" on:click={handleRollDice} on:keypress={handleKeyPress}>
    {#each dice as die}   
        <div 
            class="face" 
            style={`background-color: ${dieColor};`} 
            in:diceTransition
            out:diceTransition
        >
            {#each die as pip}
                <span class="pip" style={`background-color: ${pipColor};`} />
            {/each}          
        </div>
    {/each}
</button>

<style>
    .dice-button {
        display: flex;
        background: transparent;
        cursor: pointer;
        border-radius: .625rem;
        padding: .25rem;
        gap: .3rem;
        margin: 0;
    }
    .dice-button:hover {
        background-color: var(--steelblue);
    }
    .face {
        display: grid;
        grid-template-areas:
            "a . c"
            "e g f"
            "d . b";
        padding: .5rem;
        min-height: 3rem;
        min-width: 3rem;
        background-color: var(--ivory);
        box-shadow: inset 0 4px var(--white), inset 0 -4px #bbb, inset 4px 0 #d7d7d7,
            inset -4px 0 #d7d7d7;
        border-radius: 10%;
        cursor: pointer;
    }

    .pip {
        display: block;
        align-self: center;
        justify-self: center;
        min-width: 0.6rem;
        min-height: 0.6rem;
        border-radius: 50%;
        background-color: var(--pip);
        box-shadow: inset 0 2px #111, inset 0 -2px #555;
    }

    .pip:nth-child(2) {
        grid-area: b;
    }
    .pip:nth-child(3) {
        grid-area: c;
    }
    .pip:nth-child(4) {
        grid-area: d;
    }
    .pip:nth-child(5) {
        grid-area: e;
    }
    .pip:nth-child(6) {
        grid-area: f;
    }
    /* This selects the last pip of odd-valued dice (1, 3, 5) and positions the pip in the center */
    .pip:nth-child(odd):last-child {
        grid-area: g;
    }
    @media (max-width: 40rem) {
        .face {
            padding: .25rem;
            min-height: 2rem;
            min-width: 2rem;
            box-shadow: inset 0 3px var(--white), inset 0 -3px #bbb, inset 3px 0 #d7d7d7,
                inset -3px 0 #d7d7d7;
        }

        .pip {
            min-width: 0.4rem;
            min-height: 0.4rem;
            box-shadow: inset 0 2px #111, inset 0 -2px #555;
        }
	}
</style>