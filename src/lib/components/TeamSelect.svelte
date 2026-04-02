<script lang="ts">
	import { onMount } from 'svelte';
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
	import { auth } from '$lib/auth/authState.svelte';
	import { getCustomTeamsByUser } from '$lib/db/repositories/customTeamRepository';

	type TeamSelectProps = {
		opponentId: string;
		saveTeam: SaveTeam;
		team: Team;
		teamType: string;
	};

	let { opponentId, saveTeam, team, teamType }: TeamSelectProps = $props();

	const fadeArgs = {
		delay: 0,
		duration: 250,
		easing: cubicInOut,
		baseScale: 0.5
	};

	let showCustomTeam: boolean = $state(false);
	let selected: string = $derived(team.id);
	let diceColor: string | unknown = $state('');
	let allTeamsData: Team[] = $state([]);

	onMount(() => {
		diceColor = pickRandom(DICE_COLORS);
		loadTeamData();
	});

	function handleTeamSelect(e: Event) {
		const { value } = e.currentTarget as HTMLSelectElement;
		if (!value || value === '') {
			saveTeam(DEFAULT_TEAM);
		} else {
			saveTeam(teamByUUId(allTeamsData)(value));
		}
	}

	async function closeCustomTeamModal(id: string) {
		await loadTeamData();
		showCustomTeam = false;
		if (id) {
			saveTeam(teamByUUId(allTeamsData)(id));
		} else {
			saveTeam(DEFAULT_TEAM);
		}
	}

	async function loadTeamData() {
		let customTeamData: Team[] = [];
		if (auth.isLoggedIn && auth.currentUser?.id) {
			const records = await getCustomTeamsByUser(auth.currentUser.id);
			customTeamData = records.map((r) => r.teamData);
		}
		allTeamsData = [...customTeamData, ...teamsData];
	}

	function handleRandomizeKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			setRandomTeam(allTeamsData, opponentId, saveTeam);
		}
	}

	let canCreateCustom = $derived(auth.isLoggedIn);
</script>

<div class="team-card">
	<h1>{teamType} Team</h1>
	<div class="helmet" class:flipLeft={teamType === TEAM.AWAY}>
		{#if team.id.length}
			{#each [team.id] as c (c)}
				<button
					in:fadeScale|global={fadeArgs}
					class:hover={team.isCustom && canCreateCustom}
					onclick={team.isCustom && canCreateCustom ? () => (showCustomTeam = true) : NOOP}
				>
					<CustomHelmet
						faceMask={team.colors.faceMask}
						helmet={team.colors.helmet}
						stripe={team.colors.stripe}
						trim={team.colors.trim}
						direction={teamType === TEAM.HOME ? POSITION.RIGHT : POSITION.LEFT}
						logo={team.logo}
						logoFixed={teamType === TEAM.AWAY && team.logoFixed}
						logoLeft={team.logoLeft}
						logoX={team.logoX}
						logoY={team.logoY}
						logoWidth={team.logoWidth}
						logoHeight={team.logoHeight}
						logoRotation={team.logoRotation}
						title={team.isCustom ? `EDIT: ${team.city} ${team.name}` : `${team.city} ${team.name}`}
					/>
				</button>
			{/each}
		{:else}
			<button
				onclick={canCreateCustom ? () => (showCustomTeam = true) : NOOP}
				class="dice"
				aria-label={`${teamType} Team Placeholder`}
			>
				{#if diceColor}
					<img
						class:hover={canCreateCustom}
						alt={`${teamType} Team Placeholder`}
						src={`/images/dice-${diceColor}.svg`}
					/>
				{/if}
			</button>
		{/if}
	</div>
	<div class="select-row">
		<div class="mini-helmet">
			{#if team.id.length}
				<CustomHelmet
					faceMask={team.colors.faceMask}
					helmet={team.colors.helmet}
					stripe={team.colors.stripe}
					trim={team.colors.trim}
					direction={POSITION.RIGHT}
					logo={team.logo}
					logoFixed={false}
					logoLeft={team.logoLeft}
					logoX={team.logoX}
					logoY={team.logoY}
					logoWidth={team.logoWidth}
					logoHeight={team.logoHeight}
					logoRotation={team.logoRotation}
				/>
			{:else if diceColor}
				<img
					class="mini-dice"
					alt={`${teamType} Team Placeholder`}
					src={`/images/dice-${diceColor}.svg`}
				/>
			{/if}
		</div>
		<select name="teamSelect" onchange={handleTeamSelect} value={selected} class="team-select">
			<option value="">Choose {teamType} Team</option>
			{#each allTeamsData as team}
				{#if team.id !== opponentId}
					<option value={team.id}>{team.city} {team.name}</option>
				{/if}
			{/each}
		</select>
		<button
			class="random"
			onclick={() => setRandomTeam(allTeamsData, opponentId, saveTeam)}
			onkeydown={handleRandomizeKeydown}
			aria-label={`Random ${teamType} Team`}
		>
			<picture>
				<source type="image/avif" srcset="/images/randomize.avif" />
				<img alt={`Random ${teamType} Team`} src="/images/randomize.png" />
			</picture>
		</button>
	</div>
</div>

{#if canCreateCustom}
	<Modal
		showModal={showCustomTeam}
		close={() => (showCustomTeam = false)}
		hasClose={true}
		choiceRequired={false}
	>
		<div class="modal-content">
			<CustomTeam customTeamId={selected} close={closeCustomTeamModal} />
		</div>
	</Modal>
{/if}

<style>
	.team-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		background-color: var(--card-bg);
		border: 2px solid var(--card-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--card-shadow);
		padding: var(--space-5);
		transition:
			border-color var(--dur-base) var(--ease-snes),
			box-shadow var(--dur-base) var(--ease-snes);
	}

	.team-card:has(.hover:hover) {
		border-color: var(--card-border-hover);
		box-shadow: var(--card-shadow-hover);
	}

	h1 {
		font-family: var(--font-display);
		font-weight: var(--weight-extrabold);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		color: var(--color-text-primary);
		text-shadow: var(--text-shadow-display);
		text-transform: uppercase;
		margin: 0 0 var(--space-4) 0;
		align-self: flex-start;
	}
	.hover {
		cursor: pointer;
	}

	.helmet {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 18.75rem;
		height: 16rem;
		margin: 0 0 var(--space-4) 0;
	}

	.flipLeft {
		transform: scale(-1, 1);
	}

	.dice {
		display: flex;
		justify-content: center;
		min-width: 18.75rem;
	}

	.dice img {
		transition: transform var(--dur-base) var(--ease-snes);
	}

	.select-row {
		display: flex;
		gap: var(--space-3);
		width: 100%;
	}

	/* ── Team select dropdown ─────────────────────────────────── */
	.team-select {
		flex: 1;
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		background-color: var(--input-bg);
		border: 2px solid var(--input-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--input-shadow);
		color: var(--input-text);
		margin: 0;
		padding: var(--space-2) var(--space-3);
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237080F0' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right var(--space-3) center;
		padding-right: var(--space-8);
		cursor: pointer;
		transition:
			border-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.team-select:hover {
		border-color: var(--input-border-hover);
	}

	.team-select:focus-visible {
		outline: none;
		border-color: var(--input-border-focus);
		box-shadow: var(--input-shadow-focus);
	}

	.team-select option {
		background-color: var(--color-bg-elevated);
		color: var(--color-text-primary);
	}

	/* ── Randomize button ─────────────────────────────────────── */
	.random {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--btn-secondary-bg);
		border: 2px solid var(--btn-secondary-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--btn-secondary-shadow);
		padding: var(--space-2) var(--space-3);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.random:hover {
		background-color: var(--btn-secondary-bg-hover);
		box-shadow: var(--btn-secondary-shadow-hover);
	}

	.random:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.random img {
		height: 1.5rem;
		width: 1.5rem;
		display: block;
	}

	/* ── Mini helmet (mobile only) ────────────────────────────── */
	.mini-helmet {
		display: none;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		flex-shrink: 0;
	}

	.mini-helmet :global(.helmet-wrapper) {
		height: 2.5rem;
	}

	.mini-dice {
		width: 2rem;
		height: 2rem;
	}

	/* ── Small screens ───────────────────────────────────────── */
	@media (max-width: 780px) {
		.team-card {
			padding: var(--space-3);
		}

		h1 {
			font-size: var(--text-sm);
			margin: 0 0 var(--space-2) 0;
		}

		.helmet {
			display: none;
		}

		.mini-helmet {
			display: flex;
		}

		.select-row {
			align-items: center;
		}
	}
</style>