<script lang="ts">
    import { onMount } from 'svelte';
    import { settings } from '$lib/stores/Settings'
    import { goto } from '$app/navigation';
    import { GAME_MODE, TEAM } from '$lib/constants/constants';
    import TeamSelect from '$lib/components/TeamSelect.svelte';
	import { beginDisabled } from '$lib/utils/game';
	import { sfx, sleep } from '$lib/utils/common';

    onMount(() => {
        settings.reset();
    })
    let winScore = $settings.winScore;
    $: settings.updateScore(winScore);

    function beginGame () {
        sfx('tackle');  
        sleep(1000).then(() => goto('/game'));
    }
</script>

<main>
    <div>
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

    <div class="score-select">
        <label class="scoreLabel" for="winScore">Score to win:</label>
        <select id="winScore" class="winScore" bind:value={winScore}>
            {#each Array(100) as _, i}
                <option value={i+1}>{i+1}</option>
            {/each}
        </select>
        <button 
            class="beginButton"    
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
        white-space: nowrap;
    }
    .score-select {
        display: flex;
        justify-content: center;
        vertical-align: middle;
        gap: 1%;
        margin: 0 auto;
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
        .score-select {
            gap: 15%;
        }
	}
</style>