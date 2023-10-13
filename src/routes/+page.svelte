<script lang="ts">
    import { onMount } from 'svelte';
    import { settings } from '$lib/stores/Settings'
    import { game } from '$lib/stores/Game'
    import { goto } from '$app/navigation';
    import { GAME_MODE, TEAM } from '$lib/constants/constants';
    import TeamSelect from '$lib/components/TeamSelect.svelte';
	import { beginDisabled } from '$lib/utils/game';
	import { sfx, sleep } from '$lib/utils/common';

    onMount(() => {
        settings.reset();
        game.reset();
    })
    let winScore = $settings.winScore;
    $: settings.updateScore(winScore);

    function beginGame () {
        sfx('tackle');  
        sleep(1000).then(() => goto('/game'));
    }
</script>

<main>
    <div class="mode-row">
        <button 
            class="mode-button"
            class:mode-selected={$settings.mode === GAME_MODE.SOLO}
            on:click={() => {sfx('bass2'); settings.updateMode(GAME_MODE.SOLO)}}
        >
            Solo Play
        </button>
        <button 
            class="mode-button"    
            class:mode-selected={$settings.mode === GAME_MODE.HEAD_TO_HEAD}
            on:click={() => {sfx('bass2'); settings.updateMode(GAME_MODE.HEAD_TO_HEAD)}}
        >   
            Head-to-Head
        </button>
    </div>

    <div class="team-select">      
        <TeamSelect 
            opponentId={$settings.awayTeam.id}
            saveTeam={(team) => {sfx('team'); settings.updateHomeTeam(team)}}
            team={$settings.homeTeam}  
            teamType={TEAM.HOME}
        />
        <div class="vs">VS.</div>
        <TeamSelect 
            opponentId={$settings.homeTeam.id}
            saveTeam={(team) => {sfx('team'); settings.updateAwayTeam(team)}}
            team={$settings.awayTeam}  
            teamType={TEAM.AWAY}
            useRandomizer={$settings.mode === GAME_MODE.SOLO}
        />
    </div>

    <div class="begin-row">
        <div class="score-select">
            <label class="score-label" for="winScore">Win Score:</label>
            <select id="winScore" class="winScore" bind:value={winScore}>
                {#each Array(99) as _, i}
                    <option value={i+1}>{i+1}</option>
                {/each}
            </select>
        </div>
        <button 
            class="begin-button"    
            disabled={beginDisabled([$settings.awayTeam.id, $settings.homeTeam.id])}
            on:click={beginGame}
        >
            Let's Roll!
        </button>
    </div>
</main>

<style>
    main {
        padding: 1rem;
    }
    .mode-row {
        display: flex;
        justify-content: center;
        margin: 0 auto;
        gap: 5%;
    }
    .mode-button {
        min-width: 140px;
        cursor: pointer;
        font-family: var(--mono);
        white-space: nowrap;
    }
    .mode-selected, .mode-selected:hover {
        background-color: var(--steelblue);
        color: var(--white);
        cursor: default;
    }
    .score-label {
        color: var(--white);
        margin: auto 0;
        padding-right: 5px;
        white-space: nowrap;
    }
    .begin-button {
        white-space: nowrap;
    }
    .begin-row {
        display: flex;
        justify-content: center;
        vertical-align: middle;
        margin: 0 auto;
        gap: 2%;
    }

    .score-select {
        display: flex;
        vertical-align: middle;

    }
    .team-select {
        display: flex;
        margin: 20px 0;
        justify-content: center;
        gap: 2%;
    }
    .vs {
        color: var(--white);
        font-size: 28px;
        margin: auto 0;
    }
    .winScore {
        font-family: var(--mono);
        font-size: inherit;
        background-color: var(--ltblue);
        border: none;
        border-radius: var(--border-radius);
        color: var(--black);
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