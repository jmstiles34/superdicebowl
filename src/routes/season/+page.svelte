<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';
	import { season } from '$lib/state/season.svelte';
	import { teamsData } from '$lib/data/data.json';
	import { getCustomTeamsByUser } from '$lib/db/repositories/customTeamRepository';
	import { createSeason, deleteSeason, getSeasonsByUser } from '$lib/db/repositories/seasonRepository';
	import { generateSchedule } from '$lib/utils/schedule';
	import type { Team } from '$lib/types';
	import type { SeasonRecord, StandingsEntry } from '$lib/db/database';
	import tap from '$lib/assets/sfx/tap.mp3';
	import tackle from '$lib/assets/sfx/tackle.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';
	import { settings } from '$lib/state/settings.svelte';
	import { pickRandom, sleep } from '$lib/utils/common';

	const tapSfx: Howl = createSound(tap);
	const tackleSfx: Howl = createSound(tackle);

	let allTeams: Team[] = $state([]);
	let selectedTeamId = $state('');
	let teamCount = $state(8);
	let weeks = $state(7);
	let winScore = $state(30);
	let activeSeason: SeasonRecord | null = $state(null);

	const evenNumbers = $derived(
		Array.from({ length: Math.floor(allTeams.length / 2) }, (_, i) => (i + 2) * 2)
	);
	const maxWeeks = $derived(Math.max(1, (teamCount - 1) * 2));

	$effect(() => {
		if (!auth.isLoggedIn) goto('/login');
	});

	onMount(async () => {
		if (!auth.isLoggedIn || !auth.currentUser?.id) return;

		let customTeamData: Team[] = [];
		const records = await getCustomTeamsByUser(auth.currentUser.id);
		customTeamData = records.map((r) => r.teamData);
		allTeams = [...customTeamData, ...teamsData];

		// Check for active season
		const activeSeasons = await getSeasonsByUser(auth.currentUser.id, 'in_progress');
		if (activeSeasons.length > 0) {
			activeSeason = activeSeasons[0];
		}
	});

	function handleTeamCountChange(e: Event) {
		const value = parseInt((e.currentTarget as HTMLSelectElement).value);
		teamCount = value;
		if (weeks > (value - 1) * 2) {
			weeks = value - 1;
		}
	}

	async function resumeSeason() {
		if (!activeSeason) return;
		playSound(tackleSfx, settings.volume);
		season.loadSeason(activeSeason);
		await sleep(500);
		goto('/season/play');
	}

	async function startSeason() {
		if (!auth.isLoggedIn || !auth.currentUser?.id || !selectedTeamId) return;

		playSound(tackleSfx, settings.volume);

		// Delete existing active season and its associated games
		if (activeSeason?.id) {
			await deleteSeason(activeSeason.id);
		}

		// Pick the user's team + random others
		const userTeam = allTeams.find((t) => t.id === selectedTeamId)!;
		const otherTeams = allTeams.filter((t) => t.id !== selectedTeamId);
		const shuffled = otherTeams.sort(() => Math.random() - 0.5);
		const seasonTeams = [userTeam, ...shuffled.slice(0, teamCount - 1)];

		const schedule = generateSchedule(seasonTeams, weeks, selectedTeamId);

		const standings: StandingsEntry[] = seasonTeams.map((t) => ({
			teamId: t.id,
			wins: 0,
			losses: 0,
			pointsFor: 0,
			pointsAgainst: 0
		}));

		const record = await createSeason(auth.currentUser.id, $state.snapshot({
			status: 'in_progress' as const,
			userTeamId: selectedTeamId,
			teams: seasonTeams,
			schedule,
			standings,
			currentWeek: 1,
			totalWeeks: weeks,
			winScore
		}));

		season.loadSeason(record);
		await sleep(500);
		goto('/season/play');
	}
</script>

<main>
	<h2>Season Mode</h2>

	{#if activeSeason}
		<div class="active-season">
			<p>You have an active season in progress.</p>
			<button class="game-button" onclick={resumeSeason}>Resume Season</button>
		</div>
		<div class="divider-line"></div>
		<p class="or-text">Or start a new season:</p>
	{/if}

	<div class="form">
		<div class="form-row">
			<label class="label" for="userTeam">Your Team</label>
			<select
				id="userTeam"
				class="select"
				bind:value={selectedTeamId}
			>
				<option value="">Select a team...</option>
				{#each allTeams as team}
					<option value={team.id}>{team.city} {team.name}</option>
				{/each}
			</select>
		</div>

		<div class="form-row">
			<label class="label" for="teamCount">Teams</label>
			<select
				id="teamCount"
				class="select"
				value={teamCount}
				onchange={handleTeamCountChange}
			>
				{#each evenNumbers as n}
					<option value={n}>{n}</option>
				{/each}
			</select>
		</div>

		<div class="form-row">
			<label class="label" for="weeks">Weeks</label>
			<select id="weeks" class="select" bind:value={weeks}>
				{#each Array(maxWeeks) as _, i}
					<option value={i + 1}>{i + 1}</option>
				{/each}
			</select>
		</div>

		<div class="form-row">
			<label class="label" for="winScore">Win Score</label>
			<select id="winScore" class="select" bind:value={winScore}>
				{#each Array(99) as _, i}
					<option value={i + 1}>{i + 1}</option>
				{/each}
			</select>
		</div>

		<button
			class="game-button start-button"
			disabled={!selectedTeamId}
			onclick={startSeason}
		>
			Start Season
		</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px;
		gap: 16px;
	}
	h2 {
		color: var(--color-white);
		margin: 0;
	}
	.active-season {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.active-season p {
		color: var(--color-gray-300);
		margin: 0;
	}
	.divider-line {
		width: 200px;
		border-top: 1px solid var(--color-gray-600);
	}
	.or-text {
		color: var(--color-gray-400);
		font-size: 0.9rem;
		margin: 0;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 280px;
	}
	.form-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	.label {
		color: var(--color-white);
		white-space: nowrap;
	}
	.select {
		font-family: inherit;
		font-size: inherit;
		background-color: var(--color-blue-300);
		border: none;
		border-radius: var(--border-radius);
		color: var(--color-offblack);
		padding: 6px 8px;
		min-width: 160px;
	}
	.start-button {
		margin-top: 8px;
	}
</style>
