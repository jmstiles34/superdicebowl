<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { GAME_MODE, TEAM } from '$lib/constants/constants';
    import type { GameSettings } from '$lib/types';
    import * as R from 'ramda';
    import TeamSelect from '$lib/components/TeamSelect.svelte';
    const dispatch = createEventDispatcher();

    export let gameSettings:GameSettings;

    let winScore = gameSettings.winScore;
    $: dispatch('setWinScore', winScore);

    function beginDisabled(gameSettings:GameSettings) {
        let {awayTeam, homeTeam} = gameSettings;
        return R.equals(homeTeam.id, 0) || R.equals(awayTeam.id, 0);
    }
</script>

<main>
    <div>
        <button 
            class="mode-button"
            class:mode-selected={R.equals(gameSettings.mode, GAME_MODE.SOLO)}
            on:click={() => dispatch('setMode', GAME_MODE.SOLO)}
        >
            Solo Play
        </button>
        <button 
            class="mode-button"    
            class:mode-selected={R.equals(gameSettings.mode, GAME_MODE.HEAD_TO_HEAD)}
            on:click={() => dispatch('setMode', GAME_MODE.HEAD_TO_HEAD)}
        >   
            Head-to-Head
        </button>
    </div>

    <div class="team-select">      
        <TeamSelect 
            mode={gameSettings.mode} 
            opponentId={gameSettings.awayTeam.id}
            saveTeam={(team) => dispatch('setTeam', {team, type:TEAM.HOME})}
            team={gameSettings.homeTeam}  
            teamType={TEAM.HOME}
        />
        <div class="vs">VS.</div>
        <TeamSelect 
            mode={gameSettings.mode} 
            opponentId={gameSettings.homeTeam.id}
            saveTeam={(team) => dispatch('setTeam', {team, type: TEAM.AWAY})}
            team={gameSettings.awayTeam}  
            teamType={TEAM.AWAY}
        />
    </div>

    <div class="score-select">
        <label class="scoreLabel" for="winScore">Score to win:</label>
        <select id="winScore" class="winScore" bind:value={winScore}>
            {#each Array(100) as _, i}
                <option value={i+1}>{i+1}</option>
            {/each}
        </select>
        <button 
            disabled={beginDisabled(gameSettings)}
            on:click={() => dispatch('begin')}
        >
            Let's Roll!
        </button>
    </div>
</main>

<style>
    .mode-button {
        margin: 0 15px;
        min-width: 150px;
        cursor: pointer;
        font-family: var(--mono);
    }
    .mode-selected, .mode-selected:hover {
        background-color: var(--steelblue);
        color: var(--white);
        cursor: default;
    }
    .scoreLabel {
        margin: auto 0;
    }
    .score-select {
        display: flex;
        justify-content: center;
        vertical-align: middle;
        gap: 1%;
    }
    .team-select {
        display: flex;
        margin: 20px 0;
        justify-content: center;
        gap: 2%;
    }
    .vs {
        font-size: 28px;
        margin: auto 0;
    }
    .winScore {
        font-family: var(--mono);
        font-size: inherit;
        background-color: var(--ltblue);
        border: none;
        border-radius: var(--border-radius);
        margin: 0 0.5em 0.5em 0;
        padding: 0.2em 0.5em;
    }
    @media (max-width: 640px) {
		.team-select {
			max-width: 100%;
			flex-direction: column;
		}
	}
</style>