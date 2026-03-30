<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';
	import { game } from '$lib/state/game.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { TEAM } from '$lib/constants/constants';
	import type { GameRecord } from '$lib/db/database';
	import { deleteGame, getGamesByUser } from '$lib/db/repositories/gameRepository';
	import { getSeasonsByUser } from '$lib/db/repositories/seasonRepository';
	import { getScoreByTeam } from '$lib/utils/game';
	import Modal from '$lib/components/Modal.svelte';
	import GameSummary from '$lib/components/modal/GameSummary.svelte';

	let activeTab: 'in_progress' | 'completed' = $state('in_progress');
	let inProgressGames: GameRecord[] = $state([]);
	let completedGames: GameRecord[] = $state([]);
	let confirmDeleteId: number | null = $state(null);
	let viewStatsRecord: GameRecord | null = $state(null);
	let seasonGameIds: Set<number> = $state(new Set());

	$effect(() => {
		if (auth.initialized && !auth.isLoggedIn) goto('/login');
	});

	$effect(() => {
		if (auth.currentUser?.id) loadGames();
	});

	async function loadGames() {
		if (!auth.currentUser?.id) return;
		inProgressGames = await getGamesByUser(auth.currentUser.id, 'in_progress');
		completedGames = await getGamesByUser(auth.currentUser.id, 'completed');

		const seasons = await getSeasonsByUser(auth.currentUser.id);
		const ids = new Set<number>();
		for (const s of seasons) {
			for (const week of s.schedule) {
				for (const m of week.matchups) {
					if (m.gameRecordId) ids.add(m.gameRecordId);
				}
			}
		}
		seasonGameIds = ids;
	}

	function resumeGame(record: GameRecord) {
		game.loadSnapshot(record.gameState);
		game.activeGameId = record.id!;
		settings.loadSnapshot(record.gameSettings);
		goto('/game');
	}

	async function handleDelete(gameId: number) {
		await deleteGame(gameId);
		confirmDeleteId = null;
		await loadGames();
	}

	function getHomeScore(record: GameRecord): number {
		return getScoreByTeam(TEAM.HOME, record.gameState.playLog);
	}

	function getAwayScore(record: GameRecord): number {
		return getScoreByTeam(TEAM.AWAY, record.gameState.playLog);
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

{#if auth.isLoggedIn}
	<div class="games-page">
		<h2>My Games</h2>

		<div class="tab-row">
			<button
				class="tab"
				class:tab-selected={activeTab === 'in_progress'}
				onclick={() => (activeTab = 'in_progress')}
			>
				In Progress ({inProgressGames.length})
			</button>
			<button
				class="tab"
				class:tab-selected={activeTab === 'completed'}
				onclick={() => (activeTab = 'completed')}
			>
				Completed ({completedGames.length})
			</button>
		</div>

		{#if activeTab === 'in_progress'}
			{#if inProgressGames.length === 0}
				<p class="empty">No games in progress. Start a new game from the home page.</p>
			{:else}
				<div class="game-list">
					{#each inProgressGames as record (record.id)}
						<div class="game-card">
							{#if record.id && seasonGameIds.has(record.id)}
								<span class="season-badge">Season</span>
							{/if}
							<div class="teams-row">
								<span
									class="team-badge"
									style:background-color={record.gameSettings.homeTeam.colors.primary}
								>
									{record.gameSettings.homeTeam.cityKey}
								</span>
								<span class="score">{getHomeScore(record)}</span>
								<span class="vs">-</span>
								<span class="score">{getAwayScore(record)}</span>
								<span
									class="team-badge"
									style:background-color={record.gameSettings.awayTeam.colors.primary}
								>
									{record.gameSettings.awayTeam.cityKey}
								</span>
							</div>
							<div class="meta">
								{record.gameState.lastPlay || 'Coin toss pending'}
								<span class="date">{formatDate(record.updatedAt)}</span>
							</div>
							<div class="card-actions">
								<button class="game-button" onclick={() => resumeGame(record)}>
									Resume
								</button>
								{#if confirmDeleteId === record.id}
									<div class="confirm-row">
										<button class="delete-btn" onclick={() => handleDelete(record.id!)}>
											Confirm
										</button>
										<button class="cancel-btn" onclick={() => (confirmDeleteId = null)}>
											Cancel
										</button>
									</div>
								{:else}
									<button class="delete-trigger" onclick={() => (confirmDeleteId = record.id!)}>
										Delete
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			{#if completedGames.length === 0}
				<p class="empty">No completed games yet.</p>
			{:else}
				<div class="game-list">
					{#each completedGames as record (record.id)}
						<div class="game-card">
							{#if record.id && seasonGameIds.has(record.id)}
								<span class="season-badge">Season</span>
							{/if}
							<div class="teams-row">
								<span
									class="team-badge"
									style:background-color={record.gameSettings.homeTeam.colors.primary}
								>
									{record.gameSettings.homeTeam.cityKey}
								</span>
								<span class="score">{getHomeScore(record)}</span>
								<span class="vs">-</span>
								<span class="score">{getAwayScore(record)}</span>
								<span
									class="team-badge"
									style:background-color={record.gameSettings.awayTeam.colors.primary}
								>
									{record.gameSettings.awayTeam.cityKey}
								</span>
							</div>
							<div class="meta">
								{record.gameState.lastPlay}
								<span class="date">{formatDate(record.updatedAt)}</span>
							</div>
							<div class="card-actions">
								<button class="game-button" onclick={() => (viewStatsRecord = record)}>
									View Stats
								</button>
								{#if confirmDeleteId === record.id}
									<div class="confirm-row">
										<button class="delete-btn" onclick={() => handleDelete(record.id!)}>
											Confirm
										</button>
										<button class="cancel-btn" onclick={() => (confirmDeleteId = null)}>
											Cancel
										</button>
									</div>
								{:else}
									<button class="delete-trigger" onclick={() => (confirmDeleteId = record.id!)}>
										Delete
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}

{#if viewStatsRecord}
	<Modal
		showModal={true}
		close={() => (viewStatsRecord = null)}
		hasClose={true}
		choiceRequired={false}
	>
		<GameSummary
			awayTeam={viewStatsRecord.gameSettings.awayTeam}
			homeTeam={viewStatsRecord.gameSettings.homeTeam}
			playLog={viewStatsRecord.gameState.playLog}
		/>
	</Modal>
{/if}

<style>
	.games-page {
		max-width: 30rem;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
	h2 {
		margin-bottom: 1rem;
	}
	.tab-row {
		display: flex;
		width: 100%;
		margin-bottom: 1.5rem;
	}
	.tab {
		flex: 1;
		padding: 0.625rem;
		text-align: center;
		font-size: var(--14px);
		color: var(--color-gray-300);
		background-color: var(--color-gray-900);
		border-bottom: 2px solid var(--color-gray-700);
	}
	.tab:hover {
		color: var(--color-white);
	}
	.tab-selected,
	.tab-selected:hover {
		color: var(--color-white);
		font-weight: 600;
		border-bottom-color: var(--color-blue-500);
	}
	.empty {
		color: var(--color-gray-400);
		text-align: center;
		padding: 2rem 0;
	}
	.game-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.game-card {
		position: relative;
		background: var(--color-gray-900);
		border: 1px solid var(--color-gray-700);
		border-radius: var(--border-radius);
		padding: 0.75rem;
	}
	.season-badge {
		position: absolute;
		top: 0.4rem;
		right: 0.5rem;
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-blue-300);
		border: 1px solid var(--color-blue-500);
		border-radius: 3px;
		padding: 1px 5px;
	}
	.teams-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.team-badge {
		padding: 0.2rem 0.5rem;
		border-radius: 3px;
		color: var(--color-white);
		font-size: var(--12px);
		font-weight: 600;
	}
	.score {
		color: var(--color-white);
		font-size: var(--18px);
		font-weight: 700;
		min-width: 1.5rem;
		text-align: center;
	}
	.vs {
		color: var(--color-gray-500);
		font-size: var(--14px);
	}
	.meta {
		color: var(--color-gray-400);
		font-size: var(--12px);
		text-align: center;
		margin-bottom: 0.75rem;
	}
	.date {
		display: block;
		color: var(--color-gray-500);
		margin-top: 0.25rem;
	}
	.card-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.delete-trigger {
		color: var(--urgent);
		font-size: var(--12px);
	}
	.delete-trigger:hover {
		color: var(--urgent-hover);
	}
	.confirm-row {
		display: flex;
		gap: 0.5rem;
	}
	.delete-btn {
		color: var(--color-white);
		background: var(--urgent);
		padding: 0.25rem 0.5rem;
		border-radius: var(--border-radius);
		font-size: var(--12px);
	}
	.cancel-btn {
		color: var(--color-gray-300);
		font-size: var(--12px);
	}
</style>
