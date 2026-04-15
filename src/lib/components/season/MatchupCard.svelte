<script lang="ts">
	import type { SeasonMatchup } from '$lib/db/database';
	import type { Team } from '$lib/types';

	type MatchupCardProps = {
		matchup: SeasonMatchup;
		homeTeam: Team;
		awayTeam: Team;
		isCurrentWeek: boolean;
		onPlay?: () => void;
		onSimulate?: () => void;
		onInstant?: () => void;
	};

	let {
		matchup,
		homeTeam,
		awayTeam,
		isCurrentWeek,
		onPlay,
		onSimulate,
		onInstant
	}: MatchupCardProps = $props();

	const isCompleted = $derived(matchup.status === 'completed');
	const isPending = $derived(matchup.status === 'pending');
	const isInProgress = $derived(matchup.status === 'in_progress');
</script>

<div class="card" class:completed={isCompleted}>
	<div class="teams">
		<div class="team">
			<div class="badge" style:background-color={homeTeam.colors.primary}>
				{homeTeam.cityKey}
			</div>
			<span class="team-name">{homeTeam.city}</span>
		</div>

		{#if isCompleted}
			<div class="score">
				<span class:winner={matchup.homeScore > matchup.awayScore}>{matchup.homeScore}</span>
				<span class="dash">-</span>
				<span class:winner={matchup.awayScore > matchup.homeScore}>{matchup.awayScore}</span>
			</div>
		{:else}
			<span class="vs">vs</span>
		{/if}

		<div class="team">
			<div class="badge" style:background-color={awayTeam.colors.primary}>
				{awayTeam.cityKey}
			</div>
			<span class="team-name">{awayTeam.city}</span>
		</div>
	</div>

	{#if isCurrentWeek && (isPending || isInProgress)}
		<div class="actions">
			{#if matchup.isUserGame}
				<button class="action-btn play" onclick={onPlay}>
					{isInProgress ? 'Resume' : 'Play'}
				</button>
			{:else}
				<button class="action-btn sim" onclick={onSimulate}>Simulate</button>
				<button class="action-btn instant" onclick={onInstant}>Instant</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-sm);
		padding: 10px 14px;
	}
	.completed {
		opacity: 0.85;
	}
	.teams {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.team {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
	}
	.team:last-child {
		flex-direction: row-reverse;
	}
	.badge {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-on-accent);
		padding: 3px 6px;
		border-radius: 3px;
		text-align: center;
		min-width: 2rem;
	}
	.team-name {
		color: var(--color-text-primary);
		font-size: 0.85rem;
		white-space: nowrap;
	}
	.vs {
		color: var(--color-text-tertiary);
		font-size: 0.8rem;
		min-width: 2rem;
		text-align: center;
	}
	.score {
		display: flex;
		gap: 4px;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		min-width: 4rem;
		justify-content: center;
	}
	.dash {
		color: var(--color-text-muted);
	}
	.winner {
		color: gold;
	}
	.actions {
		display: flex;
		gap: 8px;
		justify-content: center;
	}
	.action-btn {
		font-family: inherit;
		font-size: 0.8rem;
		font-weight: 600;
		border: none;
		border-radius: var(--radius-sm);
		padding: 5px 14px;
		cursor: pointer;
	}
	.play {
		background-color: var(--btn-primary-bg);
		color: var(--color-on-accent);
	}
	.play:hover {
		background-color: var(--btn-primary-bg-active);
	}
	.sim {
		background-color: var(--color-bg-overlay);
		color: var(--color-text-primary);
	}
	.sim:hover {
		background-color: var(--color-bg-overlay);
	}
	.instant {
		background-color: var(--color-bg-overlay);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border-strong);
	}
	.instant:hover {
		background-color: var(--color-bg-overlay);
	}
</style>
