<script lang="ts">
    import { onMount } from 'svelte';
    import { settings } from '$lib/stores/Settings'
    import { game } from '$lib/stores/Game'
    import { goto } from '$app/navigation';
    import { GAME_MODE, TEAM } from '$lib/constants/constants';
    import TeamSelect from '$lib/components/TeamSelect.svelte';
	import { beginDisabled } from '$lib/utils/game';
	import { sleep } from '$lib/utils/common';
    import { sound, Sound } from "svelte-sound";
    import tackle from '$lib/assets/sfx/tackle.mp3'
    import tap from '$lib/assets/sfx/tap.mp3'
    import gust from '$lib/assets/sfx/gust.mp3'

    onMount(() => {
        settings.reset();
        game.reset();
    })
    let winScore = $settings.winScore;
    $: settings.updateScore(winScore);

    function beginGame () { 
        sleep(1000).then(() => goto('/game'));
    }
    
    const gustSfx = new Sound(gust);
</script>

<main>
    <div class="mode-row">
        <button 
            class="mode-button"
            class:mode-selected={$settings.mode === GAME_MODE.SOLO}
            use:sound={{src: tap, events: ["click"]}}
            on:click={() => {settings.updateMode(GAME_MODE.SOLO)}}
        >
            Solo Play
        </button>
        <button 
            class="mode-button"    
            class:mode-selected={$settings.mode === GAME_MODE.HEAD_TO_HEAD}
            use:sound={{src: tap, events: ["click"]}}
            on:click={() => {settings.updateMode(GAME_MODE.HEAD_TO_HEAD)}}
        >   
            Head-to-Head
        </button>
    </div>

    <div class="team-select">      
        <TeamSelect 
            opponentId={$settings.awayTeam.id}
            saveTeam={(team) => {gustSfx.play(); settings.updateHomeTeam(team)}}
            team={$settings.homeTeam}  
            teamType={TEAM.HOME}
        />
        <div class="vs">VS.</div>
        <TeamSelect 
            opponentId={$settings.homeTeam.id}
            saveTeam={(team) => {gustSfx.play(); settings.updateAwayTeam(team)}}
            team={$settings.awayTeam}  
            teamType={TEAM.AWAY}
        />
    </div>

    <div class="begin-row">
        <div class="score-select">
            <label class="score-label" for="winScore">Win Score:</label>
            <select id="winScore" class="win-score" bind:value={winScore}>
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
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 1em;
        padding: 2rem;
    }

    .begin-row {
        display: flex;
        gap: .5em;
    }

    .mode-row {
        display: flex;
        gap: 2em;
    }
    .mode-button {
        min-width: 8.75rem;
    }
    .mode-selected, .mode-selected:hover {
        background-color: var(--steelblue);
        color: var(--ivory);
        cursor: default;
    }
    .score-label {
        color: var(--ivory);
        margin: auto 0;
        padding-right: 0.4rem;
        white-space: nowrap;
    }

    .score-select {
        display: flex;
    }
    .team-select {
        display: flex;
        gap: 1em;
    }
    .vs {
        color: var(--ivory);
        font-size: 1.75rem;
        margin: auto 0;
    }
    .win-score {
        font-family: inherit;
        font-size: inherit;
        background-color: var(--ltblue);
        border: none;
        border-radius: var(--border-radius);
        color: var(--black);
        margin: 0 0.5em 0.5em 0;
        padding: 0.2em 0.5em;
    }
    @media (max-width: 40rem) {
		.team-select {
			flex-direction: column;
            align-items: center;
		}
	}
</style>