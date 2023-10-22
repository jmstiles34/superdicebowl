<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { browser } from "$app/environment";
    import { DEFAULT_TEAM, DICE_COLORS, NOOP, TEAM } from '$lib/constants/constants';
    import { teamsData } from '$lib/data/data.json'
    import type { SaveTeam, Team } from '$lib/types';
	import { pickRandom } from '$lib/utils/common';
	import { setRandomTeam, teamByUUId } from '$lib/utils/game';
    import { cubicInOut } from 'svelte/easing';
    import fadeScale from '$lib/transitions/fadeScale';
    import Modal from '$lib/components/Modal.svelte';
    import CustomHelmet from "$lib/components/CustomHelmet.svelte";
    import CustomTeam from '$lib/components/modal/CustomTeam.svelte';
    
    export let opponentId:string;
    export let saveTeam:SaveTeam;
    export let team:Team;
    export let teamType:string;
    export let useRandomizer: boolean = false;
    
    let showCustomTeam:boolean;

    let allTeamsData:(Team)[] = [];
    onMount(() => setTeamData());

    let selected:string = "";
    $: if(selected.length) {saveTeam(teamByUUId(allTeamsData)(selected))}

    const fadeArgs = {
		delay: 0,
		duration: 250,
		easing: cubicInOut,
		baseScale: 0.5
	}

    async function closeCustomTeamModal(id:string) {
        setTeamData();
        tick();
        showCustomTeam = false;
        selected = id;
        if(!id) saveTeam(DEFAULT_TEAM);
    }
    
    function setTeamData() {
        let lsTeamData = browser && localStorage.getItem('customTeams');
        let customTeamData:Team[] = lsTeamData ? JSON.parse(lsTeamData) : [];
        allTeamsData = [...customTeamData, ...teamsData];
    }
</script>

<div class="team-card">
    <h1>{teamType} Team</h1>
    <div class="logo-image" class:flipLeft={teamType === TEAM.AWAY}>
        {#if team.id.length}
            {#each [team.id] as c (c)}
                <div 
                    in:fadeScale|global={fadeArgs} 
                    class:hover={team.isCustom}
                    on:click={team.isCustom ? () => showCustomTeam = true : NOOP}
                    on:keydown
                    role="button"
                    tabindex=0
                >
                    <CustomHelmet 
                        bg="#2e2e2e"
                        faceMask={team.colors.faceMask} 
                        helmet={team.colors.helmet}
                        stripe={team.colors.stripe}
                        trim={team.colors.trim}
                        logo={team.logo}
                        logoFlip={teamType === TEAM.AWAY && team.logoFixed}
                        logoWidth={team.logoWidth || 2.5}
                        logoPosition={team.logoPosition || [13, 20]}
                        height={250}
                        width={250}
                        title={team.isCustom ? `EDIT: ${team.city} ${team.name}` : `${team.city} ${team.name}`} 
                    />
                </div>
            {/each}
        {:else}
            <div 
                on:click={() => showCustomTeam = true}
                on:keydown
                role="button"
                tabindex=0
                class="dice"
            >    
                <img 
                    class="hover" 
                    alt={`Team Placeholder`} 
                    src={`/images/${pickRandom(DICE_COLORS)}_dice.png`}
                />
            </div>
        {/if}
    </div>

    {#if useRandomizer }
        <button on:click={() => setRandomTeam(allTeamsData, opponentId, saveTeam)}>
            Team Randomizer
        </button>
    {:else}
        <select bind:value={selected} class="team-select">
            <option value="">Choose Your Team</option>
            {#each allTeamsData as team}
                {#if team.id !== opponentId}
                    <option value={team.id}>{team.city} {team.name}</option>
                {/if}
            {/each}
        </select>
    {/if}
</div>

<Modal showModal={showCustomTeam} close={() => showCustomTeam = false}>
    <div class="model-content">
        <CustomTeam customTeamId={selected} close={closeCustomTeamModal}/>
    </div>
</Modal>

<style>
    .team-card {
        align-items: center;
        background-color: var(--smoke);
        border-radius: 0.5rem;
        display: flex;
		flex-direction: column;
        justify-content: space-between;
        padding: 0.8rem;
    }
    .team-card button {
        height: 2.25rem;
        min-width: 15rem;
    }
    .hover {
        cursor: pointer;
    }
    .logo-image {
        display: flex;
		flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 18.75rem;
        margin: 0 0 1rem 0;
    }

    .flipLeft {
        transform:  scale(-1, 1);
    }

    .dice{
        display: flex;
        justify-content: center;
        min-width: 18.75rem;
        margin: 2.75rem 0;
    }
    .dice img {
        max-width: 55%;
    }
    .team-select {
        font-family: inherit;
        font-size: inherit;
        background-color: var(--ltblue);
        border: none;
        border-radius: var(--border-radius);
        color: var(--black);
        margin: 0 0 0.5em 0;
        padding: 0.5em 1em;
        line-height: 1;
        min-width: 15rem;
    }
</style>