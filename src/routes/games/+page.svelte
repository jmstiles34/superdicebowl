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
	import { onlineState } from '$lib/state/onlineState.svelte';
	import { getRemoteGames, type RemoteGame } from '$lib/online/remoteGames';

	let activeTab: 'in_progress' | 'completed' | 'online' = $state('in_progress');
	let remoteGames = $state<RemoteGame[]>([]);
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

	$effect(() => {
		if (onlineState.isOnline && onlineState.profile) loadRemoteGames();
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

	async function loadRemoteGames() {
		if (!onlineState.profile) return;
		remoteGames = await getRemoteGames(onlineState.profile.id);
	}

	function remoteGameStatus(rg: RemoteGame): 'your_turn' | 'waiting' | 'pending' | 'completed' {
		if (rg.status === 'completed') return 'completed';
		if (rg.status === 'pending_team_select') return 'pending';
		const myRole = rg.homeUserId === onlineState.profile?.id ? 'home' : 'away';
		return rg.currentTurn === myRole ? 'your_turn' : 'waiting';
	}

	function remoteOpponent(rg: RemoteGame): string {
		return rg.homeUserId === onlineState.profile?.id
			? rg.awayProfile.username
			: rg.homeProfile.username;
	}

	function remoteHomeScore(rg: RemoteGame): number {
		if (!rg.gameState) return 0;
		return getScoreByTeam(TEAM.HOME, rg.gameState.playLog);
	}

	function remoteAwayScore(rg: RemoteGame): number {
		if (!rg.gameState) return 0;
		return getScoreByTeam(TEAM.AWAY, rg.gameState.playLog);
	}

	let activeRemoteGames = $derived(
		remoteGames.filter((rg) => rg.status === 'in_progress' || rg.status === 'pending_team_select')
	);
	let completedRemoteGames = $derived(remoteGames.filter((rg) => rg.status === 'completed'));
	let showCompletedRemote = $state(false);

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
			{#if onlineState.isOnline}
				<button
					class="tab"
					class:tab-selected={activeTab === 'online'}
					onclick={() => (activeTab = 'online')}
				>
					Online
					{#if activeRemoteGames.length > 0}
						<span class="tab-badge">{activeRemoteGames.length}</span>
					{/if}
				</button>
			{/if}
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
								{record.gameState.lastPlay ?? 'Coin toss pending'}
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
		{:else if activeTab === 'completed'}
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

		<!-- ── Online tab ──────────────────────────────────────── -->
		{#if activeTab === 'online'}
			{#if remoteGames.length === 0}
				<p class="empty">No online games yet. Challenge a friend from the Online page.</p>
			{:else}
				{#if activeRemoteGames.length === 0}
					<p class="empty">No active online games.</p>
				{:else}
				<div class="game-list">
					{#each activeRemoteGames as rg (rg.id)}
						{@const status = remoteGameStatus(rg)}
						{@const opponent = remoteOpponent(rg)}
						<button
							class="game-card online-card"
							onclick={() => goto(`/online/game/${rg.id}`)}
						>
							<span
								class="online-status-badge"
								class:your-turn={status === 'your_turn'}
								class:waiting={status === 'waiting'}
								class:pending={status === 'pending'}
								class:completed={status === 'completed'}
							>
								{#if status === 'your_turn'}Your Turn
								{:else if status === 'waiting'}Waiting
								{:else if status === 'pending'}Pending
								{:else}Final{/if}
							</span>
							<div class="teams-row">
								{#if rg.homeTeam && rg.awayTeam}
									<span
										class="team-badge"
										style:background-color={rg.homeTeam.colors.primary}
									>
										{rg.homeTeam.cityKey}
									</span>
									<span class="score">{remoteHomeScore(rg)}</span>
									<span class="vs">-</span>
									<span class="score">{remoteAwayScore(rg)}</span>
									<span
										class="team-badge"
										style:background-color={rg.awayTeam.colors.primary}
									>
										{rg.awayTeam.cityKey}
									</span>
								{:else}
									<span class="pending-teams">Team selection in progress</span>
								{/if}
							</div>
							<div class="meta">
								vs @{opponent}
								<span class="date">{formatDate(new Date(rg.updatedAt).getTime())}</span>
							</div>
						</button>
					{/each}
				</div>
				{/if}

				{#if completedRemoteGames.length > 0}
					<button class="show-completed-toggle" onclick={() => (showCompletedRemote = !showCompletedRemote)}>
						{showCompletedRemote ? 'Hide' : 'Show'} completed ({completedRemoteGames.length})
					</button>
					{#if showCompletedRemote}
						<div class="game-list">
							{#each completedRemoteGames as rg (rg.id)}
								{@const opponent = remoteOpponent(rg)}
								<button
									class="game-card online-card"
									onclick={() => goto(`/online/game/${rg.id}`)}
								>
									<span class="online-status-badge completed">Final</span>
									<div class="teams-row">
										{#if rg.homeTeam && rg.awayTeam}
											<span class="team-badge" style:background-color={rg.homeTeam.colors.primary}>
												{rg.homeTeam.cityKey}
											</span>
											<span class="score">{remoteHomeScore(rg)}</span>
											<span class="vs">-</span>
											<span class="score">{remoteAwayScore(rg)}</span>
											<span class="team-badge" style:background-color={rg.awayTeam.colors.primary}>
												{rg.awayTeam.cityKey}
											</span>
										{/if}
									</div>
									<div class="meta">
										vs @{opponent}
										<span class="date">{formatDate(new Date(rg.updatedAt).getTime())}</span>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				{/if}
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
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		background-color: var(--color-bg-surface);
		border-bottom: 2px solid var(--color-border-default);
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.tab:hover {
		color: var(--color-on-accent);
	}
	.tab-selected,
	.tab-selected:hover {
		color: var(--color-on-accent);
		font-weight: 600;
		border-bottom-color: var(--color-border-brand);
	}
	.empty {
		color: var(--color-text-tertiary);
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
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
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
		color: var(--color-text-brand);
		border: 1px solid var(--color-border-brand);
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
		color: var(--color-on-accent);
		font-size: var(--text-xs);
		font-weight: 600;
	}
	.score {
		color: var(--color-on-accent);
		font-size: var(--text-md);
		font-weight: 700;
		min-width: 1.5rem;
		text-align: center;
	}
	.vs {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.meta {
		color: var(--color-text-gold);
		font-size: var(--text-xs);
		text-align: center;
		margin-bottom: 0.75rem;
	}
	.date {
		display: block;
		color: var(--color-text-secondary);
		margin-top: 0.25rem;
	}
	.card-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.delete-trigger {
		color: var(--color-text-danger);
		font-size: var(--text-xs);
	}
	.delete-trigger:hover {
		color: var(--color-text-danger);
	}
	.confirm-row {
		display: flex;
		gap: 0.5rem;
	}
	.delete-btn {
		color: var(--color-on-accent);
		background: var(--btn-danger-bg);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
	}
	.cancel-btn {
		color: var(--color-text-secondary);
		font-size: var(--text-xs);
	}
	/* Online tab */
	.tab-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.1rem;
		height: 1.1rem;
		padding: 0 0.25rem;
		background: var(--btn-danger-bg);
		color: var(--color-on-accent);
		font-size: 0.65rem;
		font-weight: var(--weight-bold);
		border-radius: 9999px;
		margin-left: 0.3rem;
	}
	.online-card {
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background-color var(--dur-fast) var(--ease-snes);
	}
	.online-card:hover {
		background: var(--color-bg-elevated);
	}
	.online-status-badge {
		position: absolute;
		top: 0.4rem;
		right: 0.5rem;
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-radius: 3px;
		padding: 1px 5px;
		border: 1px solid currentColor;
	}
	.online-status-badge.your-turn {
		color: var(--color-green-400, #4ade80);
		border-color: var(--color-green-400, #4ade80);
	}
	.online-status-badge.waiting {
		color: var(--color-text-tertiary);
		border-color: var(--color-border-strong);
	}
	.online-status-badge.pending {
		color: var(--color-text-gold);
		border-color: var(--color-text-gold);
	}
	.online-status-badge.completed {
		color: var(--color-text-brand);
		border-color: var(--color-border-brand);
	}
	.pending-teams {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		font-style: italic;
	}
	.show-completed-toggle {
		margin-top: 1rem;
		font-size: var(--text-sm);
		color: var(--color-text-brand);
		display: block;
	}
	.show-completed-toggle:hover {
		color: var(--color-text-secondary);
	}
</style>
