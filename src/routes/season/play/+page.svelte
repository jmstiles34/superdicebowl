<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';
	import { season } from '$lib/state/season.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { GAME_MODE, TEAM } from '$lib/constants/constants';
	import { game } from '$lib/state/game.svelte';
	import { getGame } from '$lib/db/repositories/gameRepository';
	import { getSeasonsByUser, updateSeason } from '$lib/db/repositories/seasonRepository';
	import { simulateInstantGame } from '$lib/utils/instantGame';
	import MatchupCard from '$lib/components/season/MatchupCard.svelte';
	import Standings from '$lib/components/season/Standings.svelte';
	import button from '$lib/assets/sfx/button.mp3';
	import tap from '$lib/assets/sfx/tap.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';
	import { sleep } from '$lib/utils/common';

	const buttonSfx: Howl = createSound(button);
	const tapSfx: Howl = createSound(tap);

	let activeTab: 'schedule' | 'standings' = $state('schedule');
	let viewWeek = $state(1);
	let loading = $state(true);

	const viewWeekData = $derived(season.schedule.find((w) => w.weekNumber === viewWeek));
	const isViewingCurrentWeek = $derived(viewWeek === season.currentWeek);
	const canAdvance = $derived(season.isWeekComplete && season.currentWeek < season.totalWeeks);

	$effect(() => {
		if (!auth.isLoggedIn) goto('/login');
	});

	onMount(async () => {
		if (!auth.isLoggedIn || !auth.currentUser?.id) return;

		// If no season loaded, try to load from DB
		if (!season.activeSeasonId) {
			const activeSeasons = await getSeasonsByUser(auth.currentUser.id, 'in_progress');
			if (activeSeasons.length > 0) {
				season.loadSeason(activeSeasons[0]);
			} else {
				goto('/season');
				return;
			}
		}

		viewWeek = season.currentWeek;
		loading = false;
	});

	function prevWeek() {
		if (viewWeek > 1) {
			playSound(tapSfx, settings.volume);
			viewWeek--;
		}
	}

	function nextWeek() {
		if (viewWeek < season.currentWeek) {
			playSound(tapSfx, settings.volume);
			viewWeek++;
		}
	}

	async function advanceWeek() {
		playSound(buttonSfx, settings.volume);
		season.advanceWeek();
		viewWeek = season.currentWeek;
		await saveSeason();
	}

	async function saveSeason() {
		if (!season.activeSeasonId) return;
		await updateSeason(season.activeSeasonId, season.snapshotSeason());
	}

	async function playGame(matchupIndex: number) {
		const matchup = viewWeekData?.matchups[matchupIndex];
		if (!matchup) return;

		playSound(buttonSfx, settings.volume);

		const homeTeam = season.getTeamById(matchup.homeTeamId);
		const awayTeam = season.getTeamById(matchup.awayTeamId);
		if (!homeTeam || !awayTeam) return;

		season.isSeasonGame = true;
		season.activeWeek = viewWeek;
		season.activeMatchupIndex = matchupIndex;

		// Resume existing game
		if (matchup.status === 'in_progress' && matchup.gameRecordId) {
			const record = await getGame(matchup.gameRecordId);
			if (record) {
				game.loadSnapshot(record.gameState);
				game.activeGameId = record.id!;
				settings.loadSnapshot(record.gameSettings);
				settings.userTeam = matchup.homeTeamId === season.userTeamId ? TEAM.HOME : TEAM.AWAY;
				await sleep(500);
				goto('/game');
				return;
			}
		}

		// Start new game
		settings.homeTeam = homeTeam;
		settings.awayTeam = awayTeam;
		settings.mode = GAME_MODE.SOLO;
		settings.userTeam = matchup.homeTeamId === season.userTeamId ? TEAM.HOME : TEAM.AWAY;
		settings.winScore = season.winScore;

		season.markMatchupInProgress(viewWeek, matchupIndex);
		await saveSeason();

		sleep(500).then(() => goto('/game'));
	}

	function simulateGame(matchupIndex: number) {
		const matchup = viewWeekData?.matchups[matchupIndex];
		if (!matchup) return;

		playSound(buttonSfx, settings.volume);

		const homeTeam = season.getTeamById(matchup.homeTeamId);
		const awayTeam = season.getTeamById(matchup.awayTeamId);
		if (!homeTeam || !awayTeam) return;

		season.isSeasonGame = true;
		season.activeWeek = viewWeek;
		season.activeMatchupIndex = matchupIndex;

		settings.homeTeam = homeTeam;
		settings.awayTeam = awayTeam;
		settings.mode = GAME_MODE.SIMULATION;
		settings.winScore = season.winScore;

		sleep(500).then(() => goto('/game'));
	}

	async function instantScore(matchupIndex: number) {
		const matchup = viewWeekData?.matchups[matchupIndex];
		if (!matchup) return;

		playSound(tapSfx, settings.volume);

		const homeTeam = season.getTeamById(matchup.homeTeamId);
		const awayTeam = season.getTeamById(matchup.awayTeamId);
		if (!homeTeam || !awayTeam) return;

		const result = simulateInstantGame(season.winScore);
		season.recordGameResult(viewWeek, matchupIndex, result.homeScore, result.awayScore);
		await saveSeason();
	}
</script>

{#if !loading && season.activeSeasonId}
	<main>
		<div class="tabs">
			<button
				class="tab"
				class:active={activeTab === 'schedule'}
				onclick={() => { activeTab = 'schedule'; }}
			>
				Schedule
			</button>
			<button
				class="tab"
				class:active={activeTab === 'standings'}
				onclick={() => { activeTab = 'standings'; }}
			>
				Standings
			</button>
		</div>

		{#if activeTab === 'schedule'}
			<div class="week-nav">
				<button
					class="nav-arrow"
					disabled={viewWeek <= 1}
					onclick={prevWeek}
				>&lt;</button>
				<span class="week-label">Week {viewWeek} of {season.totalWeeks}</span>
				<button
					class="nav-arrow"
					disabled={viewWeek >= season.currentWeek}
					onclick={nextWeek}
				>&gt;</button>
			</div>

			{#if viewWeekData}
				<div class="matchups">
					{#each viewWeekData.matchups as matchup, i}
						{@const homeTeam = season.getTeamById(matchup.homeTeamId)}
						{@const awayTeam = season.getTeamById(matchup.awayTeamId)}
						{#if homeTeam && awayTeam}
							<MatchupCard
								{matchup}
								{homeTeam}
								{awayTeam}
								isCurrentWeek={isViewingCurrentWeek}
								onPlay={() => playGame(i)}
								onSimulate={() => simulateGame(i)}
								onInstant={() => instantScore(i)}
							/>
						{/if}
					{/each}
				</div>
			{/if}

			{#if isViewingCurrentWeek && canAdvance}
				<button class="game-button advance-btn" onclick={advanceWeek}>
					Advance to Week {season.currentWeek + 1}
				</button>
			{/if}

			{#if season.isSeasonComplete}
				{@const champion = season.sortedStandings[0]}
				{@const champTeam = champion ? season.getTeamById(champion.teamId) : undefined}
				<div class="season-complete">
					{#if champTeam && champion}
						<h3>Season Complete!</h3>
						<p class="champion">
							{champTeam.city} {champTeam.name} are the champions!
						</p>
						<p class="record">{champion.wins}-{champion.losses}</p>
					{/if}
					<button class="game-button" onclick={() => goto('/season')}>
						Back to Season Setup
					</button>
				</div>
			{/if}
		{:else}
			<Standings />
		{/if}
	</main>
{/if}

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16px 32px;
		gap: 16px;
		max-width: 500px;
		margin: 0 auto;
	}
	.tabs {
		display: flex;
		gap: 0;
		border-radius: var(--border-radius);
		overflow: hidden;
		border: 1px solid var(--color-gray-600);
	}
	.tab {
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 8px 24px;
		border: none;
		background: var(--color-gray-800);
		color: var(--color-gray-300);
		cursor: pointer;
	}
	.tab:hover {
		background: var(--color-gray-700);
	}
	.tab.active {
		background: var(--color-blue-600);
		color: var(--color-white);
		font-weight: 600;
	}
	.week-nav {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.nav-arrow {
		font-family: inherit;
		font-size: 1.2rem;
		font-weight: 700;
		background: var(--color-gray-700);
		color: var(--color-white);
		border: 1px solid var(--color-gray-500);
		border-radius: var(--border-radius);
		padding: 4px 12px;
		cursor: pointer;
	}
	.nav-arrow:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.nav-arrow:not(:disabled):hover {
		background: var(--color-gray-600);
	}
	.week-label {
		color: var(--color-white);
		font-size: 1rem;
		font-weight: 600;
		min-width: 120px;
		text-align: center;
	}
	.matchups {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}
	.advance-btn {
		margin-top: 8px;
	}
	.season-complete {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		margin-top: 16px;
	}
	.season-complete h3 {
		color: gold;
		margin: 0;
		font-size: 1.3rem;
	}
	.champion {
		color: var(--color-white);
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
	}
	.record {
		color: var(--color-gray-300);
		margin: 0;
	}
</style>
