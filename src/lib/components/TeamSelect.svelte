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
    <div class="title">{teamType} Team</div>
    <div class="logo-image" class:flipLeft={teamType === TEAM.AWAY}>
        {#if team.id.length}
            {#each [team.id] as c (c)}
                <div 
                    in:fadeScale={fadeArgs} 
                    class:hover={team.isCustom}
                    on:click={team.isCustom ? () => showCustomTeam = true : NOOP}
                    on:keydown
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
            <img 
                class="dice hover" 
                alt={`Team Placeholder`} 
                src={`/images/${pickRandom(DICE_COLORS)}_dice.png`}
                on:click={() => showCustomTeam = true}
                on:keydown
            />
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
    .hover {
        cursor: pointer;
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
    .flipLeft {
        transform:  scale(-1, 1);
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