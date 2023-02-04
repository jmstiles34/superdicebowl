<script lang="ts">
    import { onMount } from 'svelte';
    import { settings } from '$lib/stores/Settings'
    import { goto } from '$app/navigation';
    import { GAME_MODE, TEAM } from '$lib/constants/constants';
    import * as R from 'ramda';
    import TeamSelect from '$lib/components/TeamSelect.svelte';
	import { beginDisabled } from '$lib/utils/game';

    onMount(() => {
        settings.reset();
    })
    let winScore = $settings.winScore;
    $: settings.updateScore(winScore);
</script>

<main>
    <div>
        <button 
            class="mode-button"
            class:mode-selected={R.equals($settings.mode, GAME_MODE.SOLO)}
            on:click={() => settings.updateMode(GAME_MODE.SOLO)}
        >
            Solo Play
        </button>
        <button 
            class="mode-button"    
            class:mode-selected={R.equals($settings.mode, GAME_MODE.HEAD_TO_HEAD)}
            on:click={() => settings.updateMode(GAME_MODE.HEAD_TO_HEAD)}
        >   
            Head-to-Head
        </button>
    </div>

    <div class="team-select">      
        <TeamSelect 
            opponentId={$settings.awayTeam.id}
            saveTeam={(team) => settings.updateHomeTeam(team)}
            team={$settings.homeTeam}  
            teamType={TEAM.HOME}
        />
        <div class="vs">VS.</div>
        <TeamSelect 
            opponentId={$settings.homeTeam.id}
            saveTeam={(team) => settings.updateAwayTeam(team)}
            team={$settings.awayTeam}  
            teamType={TEAM.AWAY}
            useRandomizer={R.equals($settings.mode, GAME_MODE.SOLO)}
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
            disabled={beginDisabled([$settings.awayTeam.id, $settings.homeTeam.id])}
            on:click={() => goto('/game')}
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