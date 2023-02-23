<script lang="ts">
    import { DICE_COLORS } from '$lib/constants/constants';
    import { teamsData } from '$lib/data/data.json'
    import type { SaveTeam, Team } from '$lib/types';
	import { pickRandom } from '$lib/utils/common';
	import { setRandomTeam, teamById } from '$lib/utils/game';
    import { cubicInOut } from 'svelte/easing';
    import fadeScale from '$lib/transitions/fadeScale';
    
    export let opponentId:number;
    export let saveTeam:SaveTeam;
    export let team:Team;
    export let teamType:string;
    export let useRandomizer: boolean = false;
    
    let selected:number;
    $: if(selected) {saveTeam(teamById(teamsData)(selected))}

    const fadeArgs = {
		delay: 0,
		duration: 250,
		easing: cubicInOut,
		baseScale: 0.5
	} 
</script>

<div class="team-card">
    <div class="title">{teamType} Team</div>
    <div class="logo-image">
        {#if team.id > 0}
            {#each [team.id] as c (c)}
                <img 
                    in:fadeScale={fadeArgs} 
                    alt={`${team.city} ${team.name} Logo`} 
                    src={`/logos/${team.name}.png`}
                />
            {/each}
        {:else}
            <img 
                class="dice" 
                alt={`Team Placeholder`} 
                src={`/images/${pickRandom(DICE_COLORS)}_dice.png`}
            />
        {/if}
    </div>

    {#if useRandomizer }
        <button on:click={() => setRandomTeam(teamsData, opponentId, saveTeam)}>
            Team Randomizer
        </button>
    {:else}
        <select bind:value={selected} class="team-select">
            <option value="">Choose Your Team</option>
            {#each teamsData as team}
                {#if team.id !== opponentId}
                    <option value={team.id}>{team.city} {team.name}</option>
                {/if}
            {/each}
        </select>
    {/if}
</div>

<style>
    .team-card {
        display: flex;
		flex-direction: column;
        align-items: center;
		justify-content: flex-start;
        background-color: var(--smoke);
        border-radius: 10px;
        padding: 12px;
        flex-basis: 25%;
    }
    .team-card button {
        height: 36px;
        min-width: 254px;
    }
    .title {
        font-size: 28px;
    }
    .logo-image {
        display: flex;
		flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 300px;
        min-height: 300px;
    }
    .logo-image img {
        width: 100%;
    }
    .dice {
        max-width: 55%;
    }
    .team-select {
        font-family: var(--mono);
        font-size: inherit;
        background-color: var(--ltblue);
        border: none;
        border-radius: var(--border-radius);
        margin: 0 0 0.5em 0;
        padding: 0.5em 1em;
        line-height: 1;
        min-width: 254px;
    }
</style>