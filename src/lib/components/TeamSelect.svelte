<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { DEFAULT_TEAM, DICE_COLORS, NOOP, POSITION, TEAM } from '$lib/constants/constants';
	import { teamsData } from '$lib/data/data.json';
	import type { SaveTeam, Team } from '$lib/types';
	import { pickRandom } from '$lib/utils/common';
	import { setRandomTeam, teamByUUId } from '$lib/utils/game';
	import { cubicInOut } from 'svelte/easing';
	import fadeScale from '$lib/transitions/fadeScale';
	import Modal from '$lib/components/Modal.svelte';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import CustomTeam from '$lib/components/modal/CustomTeam.svelte';

	export let opponentId: string;
	export let saveTeam: SaveTeam;
	export let team: Team;
	export let teamType: string;

	const fadeArgs = {
		delay: 0,
		duration: 250,
		easing: cubicInOut,
		baseScale: 0.5
	};

	let showCustomTeam: boolean;
	let selected: string = team.id;
	$: if (team.id) selected = team.id;

	let allTeamsData: Team[] = [];

	onMount(() => {
		setTeamData();
		selected = '';
	});

	function handleTeamSelect(e: Event) {
		const { value } = e.currentTarget as HTMLSelectElement;
		if (!value || value === '') {
			selected = '';
			saveTeam(DEFAULT_TEAM);
		} else {
			saveTeam(teamByUUId(allTeamsData)(value));
		}
	}

	async function closeCustomTeamModal(id: string) {
		setTeamData();
		tick();
		showCustomTeam = false;
		saveTeam(teamByUUId(allTeamsData)(id));
		if (!id) saveTeam(DEFAULT_TEAM);
		selected = '';
	}

	function setTeamData() {
		let lsTeamData = browser && localStorage.getItem('customTeams');
		let customTeamData: Team[] = lsTeamData ? JSON.parse(lsTeamData) : [];
		allTeamsData = [...customTeamData, ...teamsData];
	}

	function handleRandomizeKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			setRandomTeam(allTeamsData, opponentId, saveTeam);
		}
	}
</script>

<div class="team-card">
	<h1>{teamType} Team</h1>
	<div class="helmet" class:flipLeft={teamType === TEAM.AWAY}>
		{#if team.id.length}
			{#each [team.id] as c (c)}
				<div
					in:fadeScale|global={fadeArgs}
					class:hover={team.isCustom}
					on:click={team.isCustom ? () => (showCustomTeam = true) : NOOP}
					on:keydown
					role="button"
					tabindex="0"
				>
					<CustomHelmet
						bg="#2e2e2e"
						faceMask={team.colors.faceMask}
						helmet={team.colors.helmet}
						stripe={team.colors.stripe}
						trim={team.colors.trim}
						direction={teamType === TEAM.HOME ? POSITION.RIGHT : POSITION.LEFT}
						logo={team.logo}
						logoFixed={teamType === TEAM.AWAY && team.logoFixed}
						logoLeft={team.logoLeft}
						logoTransform={team.logoTransform || ''}
						setTransform={NOOP}
						title={team.isCustom ? `EDIT: ${team.city} ${team.name}` : `${team.city} ${team.name}`}
					/>
				</div>
			{/each}
		{:else}
			<div
				on:click={() => (showCustomTeam = true)}
				on:keydown
				role="button"
				tabindex="0"
				class="dice"
			>
				<img
					class="hover"
					alt={`${teamType} Team Placeholder`}
					src={`/images/${pickRandom(DICE_COLORS)}_dice.png`}
				/>
			</div>
		{/if}
	</div>
	<div class="select-row">
		<select
			name="teamSelect"
			on:change={handleTeamSelect}
			bind:value={selected}
			class="team-select"
		>
			<option value="">Choose {teamType} Team</option>
			{#each allTeamsData as team}
				{#if team.id !== opponentId}
					<option value={team.id}>{team.city} {team.name}</option>
				{/if}
			{/each}
		</select>
		<button
			class="random"
			on:click={() => setRandomTeam(allTeamsData, opponentId, saveTeam)}
			on:keydown={handleRandomizeKeydown}
		>
			<picture>
				<source type="image/avif" srcset="/images/randomize.avif" />
				<img alt={`Random ${teamType} Team`} src="/images/randomize.png" />
			</picture>
		</button>
	</div>
</div>

<Modal
	showModal={showCustomTeam}
	close={() => (showCustomTeam = false)}
	hasClose={true}
	choiceRequired={false}
>
	<div class="model-content">
		<CustomTeam customTeamId={selected} close={closeCustomTeamModal} />
	</div>
</Modal>

<style>
	.team-card {
		align-items: center;
		background-color: var(--color-gray-900);
		border-radius: 0.5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 13px;
	}
	.hover {
		cursor: pointer;
	}
	.helmet {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 18.75rem;
		margin: 0 0 16px 0;
	}

	.flipLeft {
		transform: scale(-1, 1);
	}

	.dice {
		display: flex;
		justify-content: center;
		min-width: 18.75rem;
		margin: 2.75rem 0;
	}
	.dice img {
		max-width: 55%;
	}
	.select-row {
		display: flex;
		gap: 1rem;
	}

	.random img {
		height: 2.5rem;
	}

	.team-select {
		font-family: inherit;
		font-size: 1rem;
		background-color: var(--color-blue-300);
		border: none;
		border-radius: var(--border-radius);
		color: var(--color-offblack);
		margin: 0;
		padding: 0.25em;
	}
</style>
