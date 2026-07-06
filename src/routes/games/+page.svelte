<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/auth/authState.svelte';
	import { game as footballGame } from '$lib/football/state/game.svelte';
	import { game as baseballGame } from '$lib/baseball/state/game.svelte';
	import { game as hockeyGame } from '$lib/hockey/state/game.svelte';
	import { game as basketballGame } from '$lib/basketball/state/game.svelte';
	import { game as soccerGame } from '$lib/soccer/state/game.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { TEAM } from '$lib/shared/constants';
	import type {
		BaseballGameStateSnapshot,
		BasketballGameStateSnapshot,
		FootballGameSettingsSnapshot,
		FootballGameStateSnapshot,
		GameRecord,
		HockeyGameStateSnapshot,
		SoccerGameStateSnapshot
	} from '$lib/db/database';
	import type { SportType } from '$lib/shared/types';
	import { deleteGame, getGamesByUser } from '$lib/db/repositories/gameRepository';
	import { getSeasonsByUser } from '$lib/db/repositories/seasonRepository';
	import { getScoreByTeam } from '$lib/football/utils/game';
	import Modal from '$lib/components/Modal.svelte';
	import GameSummary from '$lib/football/components/modal/GameSummary.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { onlineState } from '$lib/state/onlineState.svelte';
	import { declineChallenge, getRemoteGames, resignGame, type RemoteGame } from '$lib/football/online/remoteGames';

	const SPORTS: { id: SportType; label: string }[] = [
		{ id: 'football', label: 'Football' },
		{ id: 'baseball', label: 'Baseball' },
		{ id: 'hockey', label: 'Hockey' },
		{ id: 'basketball', label: 'Basketball' },
		{ id: 'soccer', label: 'Soccer' }
	];

	function parseSport(value: string | null): SportType {
		if (
			value === 'baseball' ||
			value === 'hockey' ||
			value === 'basketball' ||
			value === 'soccer'
		)
			return value;
		return 'football';
	}

	let currentSport: SportType = $state(parseSport($page.url.searchParams.get('sport')));
	let activeTab: 'in_progress' | 'completed' | 'online' = $state('in_progress');
	let remoteGames = $state<RemoteGame[]>([]);
	let inProgressGames: GameRecord[] = $state([]);
	let completedGames: GameRecord[] = $state([]);
	let confirmDeleteId: number | null = $state(null);
	let viewStatsRecord: GameRecord | null = $state(null);
	let seasonGameIds = new SvelteSet<number>();

	$effect(() => {
		const urlSport = parseSport($page.url.searchParams.get('sport'));
		if (urlSport !== currentSport) currentSport = urlSport;
	});

	$effect(() => {
		if (auth.initialized && !auth.isLoggedIn) goto('/login');
	});

	$effect(() => {
		if (auth.currentUser?.id) loadGames();
	});

	$effect(() => {
		if (currentSport === 'football' && onlineState.isOnline && onlineState.profile) loadRemoteGames();
	});

	// If the user switches away from football, force the active tab off "online"
	$effect(() => {
		if (currentSport !== 'football' && activeTab === 'online') activeTab = 'in_progress';
	});

	// Poll remote games so the list stays fresh (scores, turn status)
	const GAMES_POLL_MS = 10000;
	let gamesPollTimer: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if (currentSport === 'football' && activeTab === 'online' && onlineState.isOnline) {
			if (!gamesPollTimer) {
				gamesPollTimer = setInterval(loadRemoteGames, GAMES_POLL_MS);
			}
		} else {
			if (gamesPollTimer) {
				clearInterval(gamesPollTimer);
				gamesPollTimer = null;
			}
		}
	});

	onDestroy(() => {
		if (gamesPollTimer) clearInterval(gamesPollTimer);
	});

	async function loadGames() {
		if (!auth.currentUser?.id) return;
		const userId = auth.currentUser.id;
		const sport = currentSport;
		const [ip, cp] = await Promise.all([
			getGamesByUser(userId, 'in_progress', sport),
			getGamesByUser(userId, 'completed', sport)
		]);
		// Guard against a stale response after the user switched sports mid-fetch
		if (sport !== currentSport) return;
		inProgressGames = ip;
		completedGames = cp;

		if (sport === 'football') {
			const seasons = await getSeasonsByUser(userId);
			seasonGameIds.clear();
			for (const s of seasons) {
				for (const week of s.schedule) {
					for (const m of week.matchups) {
						if (m.gameRecordId) seasonGameIds.add(m.gameRecordId);
					}
				}
			}
		} else {
			seasonGameIds.clear();
		}
	}

	async function loadRemoteGames() {
		if (!onlineState.profile) return;
		remoteGames = await getRemoteGames(onlineState.profile.id);
	}

	function selectSport(sport: SportType) {
		if (sport === currentSport) return;
		currentSport = sport;
		confirmDeleteId = null;
		viewStatsRecord = null;
		const params = new URLSearchParams($page.url.searchParams);
		params.set('sport', sport);
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true, noScroll: true });
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
		if (!rg.gameState || rg.gameState.sport !== 'football') return 0;
		return getScoreByTeam(TEAM.HOME, rg.gameState.playLog);
	}

	function remoteAwayScore(rg: RemoteGame): number {
		if (!rg.gameState || rg.gameState.sport !== 'football') return 0;
		return getScoreByTeam(TEAM.AWAY, rg.gameState.playLog);
	}

	let activeRemoteGames = $derived(
		remoteGames.filter((rg) => rg.status === 'in_progress' || rg.status === 'pending_team_select')
	);
	let completedRemoteGames = $derived(remoteGames.filter((rg) => rg.status === 'completed'));
	let showCompletedRemote = $state(false);
	let confirmActionId = $state<string | null>(null);
	let actionLoading = $state(false);

	async function handleResign(rg: RemoteGame) {
		if (!onlineState.profile || actionLoading) return;
		actionLoading = true;
		const opponentId = rg.homeUserId === onlineState.profile.id ? rg.awayUserId : rg.homeUserId;
		await resignGame(rg.id, onlineState.profile.id, opponentId);
		confirmActionId = null;
		actionLoading = false;
		await loadRemoteGames();
	}

	async function handleCancelChallenge(rg: RemoteGame) {
		if (actionLoading) return;
		actionLoading = true;
		await declineChallenge(rg.id);
		confirmActionId = null;
		actionLoading = false;
		await loadRemoteGames();
	}

	function resumeGame(record: GameRecord) {
		const sport = record.gameState.sport;
		// All sports share homeTeam/awayTeam/mode on the settings singleton;
		// football also persists winScore via its dedicated loadSnapshot.
		if (sport === 'football') {
			footballGame.loadSnapshot(record.gameState);
			footballGame.activeGameId = record.id!;
			settings.loadSnapshot(record.gameSettings as FootballGameSettingsSnapshot);
			goto('/game');
		} else if (sport === 'baseball') {
			baseballGame.loadSnapshot(record.gameState);
			baseballGame.activeGameId = record.id!;
			settings.homeTeam = record.gameSettings.homeTeam;
			settings.awayTeam = record.gameSettings.awayTeam;
			settings.mode = record.gameSettings.mode;
			goto('/baseball/game');
		} else if (sport === 'hockey') {
			hockeyGame.loadSnapshot(record.gameState);
			hockeyGame.activeGameId = record.id!;
			settings.homeTeam = record.gameSettings.homeTeam;
			settings.awayTeam = record.gameSettings.awayTeam;
			settings.mode = record.gameSettings.mode;
			if ('winScore' in record.gameSettings) settings.winScore = record.gameSettings.winScore;
			goto('/hockey/game');
		} else if (sport === 'basketball') {
			basketballGame.loadSnapshot(record.gameState);
			basketballGame.activeGameId = record.id!;
			settings.homeTeam = record.gameSettings.homeTeam;
			settings.awayTeam = record.gameSettings.awayTeam;
			settings.mode = record.gameSettings.mode;
			if ('winScore' in record.gameSettings) settings.winScore = record.gameSettings.winScore;
			goto('/basketball/game');
		} else if (sport === 'soccer') {
			soccerGame.loadSnapshot(record.gameState);
			soccerGame.activeGameId = record.id!;
			settings.homeTeam = record.gameSettings.homeTeam;
			settings.awayTeam = record.gameSettings.awayTeam;
			settings.mode = record.gameSettings.mode;
			if ('winScore' in record.gameSettings) settings.winScore = record.gameSettings.winScore;
			goto('/soccer/game');
		}
	}

	async function handleDelete(gameId: number) {
		await deleteGame(gameId);
		confirmDeleteId = null;
		await loadGames();
	}

	function getFootballHomeScore(record: GameRecord): number {
		if (record.gameState.sport !== 'football') return 0;
		return getScoreByTeam(TEAM.HOME, record.gameState.playLog);
	}

	function getFootballAwayScore(record: GameRecord): number {
		if (record.gameState.sport !== 'football') return 0;
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

	function cellText(val: number | null): string {
		return val !== null ? String(val) : '-';
	}

	function inningLabel(s: BaseballGameStateSnapshot): string {
		return `${s.half === 'top' ? 'Top' : 'Bot'} ${s.inning}`;
	}

	const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
</script>

{#snippet footballScore(record: GameRecord)}
	<div class="teams-row">
		<span class="team-badge" style:background-color={record.gameSettings.homeTeam.colors.primary}>
			{record.gameSettings.homeTeam.cityKey}
		</span>
		<span class="score">{getFootballHomeScore(record)}</span>
		<span class="vs">-</span>
		<span class="score">{getFootballAwayScore(record)}</span>
		<span class="team-badge" style:background-color={record.gameSettings.awayTeam.colors.primary}>
			{record.gameSettings.awayTeam.cityKey}
		</span>
	</div>
{/snippet}

{#snippet hockeyOrBasketballScore(record: GameRecord, homeScore: number, awayScore: number)}
	<div class="teams-row">
		<span class="team-badge" style:background-color={record.gameSettings.homeTeam.colors.primary}>
			{record.gameSettings.homeTeam.cityKey}
		</span>
		<span class="score">{homeScore}</span>
		<span class="vs">-</span>
		<span class="score">{awayScore}</span>
		<span class="team-badge" style:background-color={record.gameSettings.awayTeam.colors.primary}>
			{record.gameSettings.awayTeam.cityKey}
		</span>
	</div>
{/snippet}

{#snippet baseballLineScore(s: BaseballGameStateSnapshot, homeKey: string, awayKey: string, homeColor: string, awayColor: string)}
	<div class="line-score">
		<div class="ls-grid">
			<div class="ls-cell ls-corner"></div>
			{#each INNINGS as i (i)}
				<div class="ls-cell ls-hdr" class:ls-active={i === s.inning}>{i}</div>
			{/each}
			<div class="ls-cell ls-sep"></div>
			<div class="ls-cell ls-hdr ls-rhe">R</div>
			<div class="ls-cell ls-hdr ls-rhe">H</div>
			<div class="ls-cell ls-hdr ls-rhe">E</div>

			<div class="ls-cell ls-team" style:color={awayColor}>{awayKey}</div>
			{#each INNINGS as i (i)}
				<div class="ls-cell ls-inn">{cellText(s.scores.vis[i - 1])}</div>
			{/each}
			<div class="ls-cell ls-sep"></div>
			<div class="ls-cell ls-tot">{s.totals.vis.r}</div>
			<div class="ls-cell ls-tot">{s.totals.vis.h}</div>
			<div class="ls-cell ls-tot">{s.totals.vis.e}</div>

			<div class="ls-cell ls-team" style:color={homeColor}>{homeKey}</div>
			{#each INNINGS as i (i)}
				<div class="ls-cell ls-inn">{cellText(s.scores.hom[i - 1])}</div>
			{/each}
			<div class="ls-cell ls-sep"></div>
			<div class="ls-cell ls-tot">{s.totals.hom.r}</div>
			<div class="ls-cell ls-tot">{s.totals.hom.h}</div>
			<div class="ls-cell ls-tot">{s.totals.hom.e}</div>
		</div>
	</div>
{/snippet}

{#snippet gameCardBody(record: GameRecord)}
	{#if record.gameState.sport === 'football'}
		{@render footballScore(record)}
		<div class="meta">
			{record.gameState.lastPlay ?? 'Coin toss pending'}
			<span class="date">{formatDate(record.updatedAt)}</span>
		</div>
	{:else if record.gameState.sport === 'baseball'}
		{@const s = record.gameState as BaseballGameStateSnapshot}
		{@render baseballLineScore(
			s,
			record.gameSettings.homeTeam.cityKey,
			record.gameSettings.awayTeam.cityKey,
			record.gameSettings.homeTeam.colors.primary,
			record.gameSettings.awayTeam.colors.primary
		)}
		<div class="meta">
			{record.status === 'completed' ? s.lastPlay || 'Final' : inningLabel(s)}
			<span class="date">{formatDate(record.updatedAt)}</span>
		</div>
	{:else if record.gameState.sport === 'hockey'}
		{@const s = record.gameState as HockeyGameStateSnapshot}
		{@render hockeyOrBasketballScore(record, s.scores.home, s.scores.away)}
		<div class="meta">
			{s.lastPlay || (record.status === 'completed' ? 'Final' : 'Face-off pending')}
			<span class="sub-meta">
				SOG {s.shotsOnGoal.home}–{s.shotsOnGoal.away}{s.powerPlay ? ' · Power Play' : ''}
			</span>
			<span class="date">{formatDate(record.updatedAt)}</span>
		</div>
	{:else if record.gameState.sport === 'basketball'}
		{@const s = record.gameState as BasketballGameStateSnapshot}
		{@render hockeyOrBasketballScore(record, s.scores.home, s.scores.away)}
		<div class="meta">
			{s.lastPlay || (record.status === 'completed' ? 'Final' : 'Tip-off pending')}
			<span class="sub-meta">Fouls {s.fouls.home}–{s.fouls.away}</span>
			<span class="date">{formatDate(record.updatedAt)}</span>
		</div>
	{:else if record.gameState.sport === 'soccer'}
		{@const s = record.gameState as SoccerGameStateSnapshot}
		{@render hockeyOrBasketballScore(record, s.scores.home, s.scores.away)}
		<div class="meta">
			{s.lastPlay || (record.status === 'completed' ? 'Final' : 'Coin toss pending')}
			<span class="date">{formatDate(record.updatedAt)}</span>
		</div>
	{/if}
{/snippet}

{#if auth.isLoggedIn}
	<div class="games-page">
		<h2>My Games</h2>

		<div class="sport-row">
			{#each SPORTS as s (s.id)}
				<button
					class="sport-tab"
					class:sport-selected={currentSport === s.id}
					onclick={() => selectSport(s.id)}
				>
					{s.label}
				</button>
			{/each}
		</div>

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
			{#if currentSport === 'football' && onlineState.isOnline}
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
				<p class="empty">No games in progress.</p>
			{:else}
				<div class="game-list">
					{#each inProgressGames as record (record.id)}
						<div class="game-card">
							{#if record.id && seasonGameIds.has(record.id)}
								<span class="season-badge">Season</span>
							{/if}
							{@render gameCardBody(record)}
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
							{@render gameCardBody(record)}
							<div class="card-actions">
								{#if record.gameState.sport === 'football'}
									<button class="game-button" onclick={() => (viewStatsRecord = record)}>
										View Stats
									</button>
								{:else}
									<span></span>
								{/if}
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

		<!-- ── Online tab (football only) ──────────────────────── -->
		{#if activeTab === 'online' && currentSport === 'football'}
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
						<div class="game-card">
							<button
								class="online-card-body"
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
							<div class="card-actions">
								{#if confirmActionId === rg.id}
									<div class="confirm-row">
										{#if rg.status === 'pending_team_select'}
											<button class="delete-btn" disabled={actionLoading} onclick={() => handleCancelChallenge(rg)}>
												{actionLoading ? 'Cancelling…' : 'Confirm Cancel'}
											</button>
										{:else}
											<button class="delete-btn" disabled={actionLoading} onclick={() => handleResign(rg)}>
												{actionLoading ? 'Resigning…' : 'Confirm Resign'}
											</button>
										{/if}
										<button class="cancel-btn" onclick={() => (confirmActionId = null)}>
											Back
										</button>
									</div>
								{:else}
									<button class="delete-trigger" onclick={() => (confirmActionId = rg.id)}>
										{rg.status === 'pending_team_select' ? 'Cancel' : 'Resign'}
									</button>
								{/if}
							</div>
						</div>
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
			playLog={(viewStatsRecord.gameState as FootballGameStateSnapshot).playLog}
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
	.sport-row {
		display: flex;
		gap: 0.25rem;
		width: 100%;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}
	.sport-tab {
		flex: 1 1 auto;
		min-width: max-content;
		padding: 0.375rem 0.75rem;
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		background-color: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			color var(--dur-fast) var(--ease-snes),
			background-color var(--dur-fast) var(--ease-snes),
			border-color var(--dur-fast) var(--ease-snes);
	}
	.sport-tab:hover {
		color: var(--color-text-primary);
	}
	.sport-selected,
	.sport-selected:hover {
		color: var(--color-text-primary);
		border-color: var(--color-border-brand);
		background-color: var(--nav-bg-active);
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
		color: var(--color-text-primary);
	}
	.tab-selected,
	.tab-selected:hover {
		color: var(--color-text-primary);
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
		color: var(--color-text-primary);
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
	.sub-meta {
		display: block;
		color: var(--color-text-tertiary);
		margin-top: 0.15rem;
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
	.online-card-body {
		cursor: pointer;
		text-align: left;
		width: 100%;
		position: relative;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		padding: 0;
		color: inherit;
		font: inherit;
		transition: background-color var(--dur-fast) var(--ease-snes);
	}
	.online-card-body:hover {
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

	/* ── Baseball line score ── */
	.line-score {
		margin-bottom: 0.5rem;
		overflow-x: auto;
	}

	.ls-grid {
		display: grid;
		grid-template-columns: 2.5rem repeat(9, 1fr) 3px repeat(3, 1.5rem);
		grid-template-rows: repeat(3, 1fr);
		gap: 1px;
		background-color: var(--color-border-subtle);
		font-size: var(--text-xs);
		font-family: var(--font-numeric, var(--font-body));
	}

	.ls-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.15rem 0;
		background-color: var(--color-bg-surface);
	}

	.ls-corner {
		background-color: var(--color-bg-elevated);
	}

	.ls-hdr {
		font-weight: var(--weight-bold);
		color: var(--color-text-tertiary);
		background-color: var(--color-bg-elevated);
		font-size: 0.6rem;
	}

	.ls-hdr.ls-active {
		color: var(--color-text-gold);
		background-color: rgba(245, 197, 24, 0.1);
	}

	.ls-hdr.ls-rhe {
		color: var(--color-text-secondary);
	}

	.ls-team {
		font-weight: var(--weight-bold);
		font-size: 0.55rem;
		letter-spacing: 0.04em;
		background-color: var(--color-bg-elevated);
		justify-content: flex-start;
		padding-left: 0.3rem;
	}

	.ls-inn {
		color: var(--color-text-secondary);
		font-size: 0.65rem;
	}

	.ls-sep {
		background-color: var(--color-border-default);
		padding: 0;
	}

	.ls-tot {
		font-weight: var(--weight-bold);
		color: var(--color-text-primary);
		font-size: 0.65rem;
	}
</style>
