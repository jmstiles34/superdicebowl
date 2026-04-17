<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';
	import { game } from '$lib/baseball/state/game.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import type { BaseballGameStateSnapshot, GameRecord } from '$lib/db/database';
	import { deleteGame, getGamesByUser } from '$lib/db/repositories/gameRepository';

	let activeTab: 'in_progress' | 'completed' = $state('in_progress');
	let inProgressGames: GameRecord[] = $state([]);
	let completedGames: GameRecord[] = $state([]);
	let confirmDeleteId: number | null = $state(null);

	$effect(() => {
		if (auth.initialized && !auth.isLoggedIn) goto('/login');
	});

	$effect(() => {
		if (auth.currentUser?.id) loadGames();
	});

	async function loadGames() {
		if (!auth.currentUser?.id) return;
		inProgressGames = await getGamesByUser(auth.currentUser.id, 'in_progress', 'baseball');
		completedGames = await getGamesByUser(auth.currentUser.id, 'completed', 'baseball');
	}

	function asBaseball(record: GameRecord): BaseballGameStateSnapshot {
		return record.gameState as BaseballGameStateSnapshot;
	}

	function inningDisplay(record: GameRecord): string {
		const s = asBaseball(record);
		const halfLabel = s.half === 'top' ? 'Top' : 'Bot';
		return `${halfLabel} ${s.inning}`;
	}

	function resumeGame(record: GameRecord) {
		const snapshot = asBaseball(record);
		game.loadSnapshot(snapshot);
		game.activeGameId = record.id!;
		settings.homeTeam = record.gameSettings.homeTeam;
		settings.awayTeam = record.gameSettings.awayTeam;
		settings.mode = record.gameSettings.mode;
		goto('/baseball/game');
	}

	async function handleDelete(gameId: number) {
		await deleteGame(gameId);
		confirmDeleteId = null;
		await loadGames();
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

	const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
</script>

{#snippet lineScore(s: BaseballGameStateSnapshot, homeKey: string, awayKey: string, homeColor: string, awayColor: string)}
	<div class="line-score">
		<div class="ls-grid">
			<div class="ls-cell ls-corner"></div>
			{#each INNINGS as i}
				<div class="ls-cell ls-hdr" class:ls-active={i === s.inning}>{i}</div>
			{/each}
			<div class="ls-cell ls-sep"></div>
			<div class="ls-cell ls-hdr ls-rhe">R</div>
			<div class="ls-cell ls-hdr ls-rhe">H</div>
			<div class="ls-cell ls-hdr ls-rhe">E</div>

			<div class="ls-cell ls-team" style:color={awayColor}>{awayKey}</div>
			{#each INNINGS as i}
				<div class="ls-cell ls-inn">{cellText(s.scores.vis[i - 1])}</div>
			{/each}
			<div class="ls-cell ls-sep"></div>
			<div class="ls-cell ls-tot">{s.totals.vis.r}</div>
			<div class="ls-cell ls-tot">{s.totals.vis.h}</div>
			<div class="ls-cell ls-tot">{s.totals.vis.e}</div>

			<div class="ls-cell ls-team" style:color={homeColor}>{homeKey}</div>
			{#each INNINGS as i}
				<div class="ls-cell ls-inn">{cellText(s.scores.hom[i - 1])}</div>
			{/each}
			<div class="ls-cell ls-sep"></div>
			<div class="ls-cell ls-tot">{s.totals.hom.r}</div>
			<div class="ls-cell ls-tot">{s.totals.hom.h}</div>
			<div class="ls-cell ls-tot">{s.totals.hom.e}</div>
		</div>
	</div>
{/snippet}

{#if auth.isLoggedIn}
	<div class="games-page">
		<h2>Baseball Games</h2>

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
				<p class="empty">No baseball games in progress.</p>
			{:else}
				<div class="game-list">
					{#each inProgressGames as record (record.id)}
						{@const s = asBaseball(record)}
						<div class="game-card">
							{@render lineScore(s, record.gameSettings.homeTeam.cityKey, record.gameSettings.awayTeam.cityKey, record.gameSettings.homeTeam.colors.primary, record.gameSettings.awayTeam.colors.primary)}
							<div class="meta">
								{inningDisplay(record)}
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
									<button
										class="delete-trigger"
										onclick={() => (confirmDeleteId = record.id!)}
									>
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
				<p class="empty">No completed baseball games yet.</p>
			{:else}
				<div class="game-list">
					{#each completedGames as record (record.id)}
						{@const s = asBaseball(record)}
						<div class="game-card">
							{@render lineScore(s, record.gameSettings.homeTeam.cityKey, record.gameSettings.awayTeam.cityKey, record.gameSettings.homeTeam.colors.primary, record.gameSettings.awayTeam.colors.primary)}
							<div class="meta">
								{s.lastPlay || 'Final'}
								<span class="date">{formatDate(record.updatedAt)}</span>
							</div>
							<div class="card-actions">
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
									<button
										class="delete-trigger"
										onclick={() => (confirmDeleteId = record.id!)}
									>
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
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
		padding: 0.75rem;
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

	/* ── Line score ── */
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
