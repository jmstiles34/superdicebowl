<script lang="ts">
	import { season } from '$lib/state/season.svelte';

	const standings = $derived(season.sortedStandings);
</script>

<div class="standings">
	<table>
		<thead>
			<tr>
				<th class="rank">#</th>
				<th class="team-col">Team</th>
				<th>W</th>
				<th>L</th>
				<th>PF</th>
				<th>PA</th>
				<th>GB</th>
			</tr>
		</thead>
		<tbody>
			{#each standings as entry, i}
				{@const team = season.getTeamById(entry.teamId)}
				{#if team}
					<tr class:user-team={entry.teamId === season.userTeamId}>
						<td class="rank">{i + 1}</td>
						<td class="team-col">
							<div class="team-cell">
								<div class="badge" style:background-color={team.colors.primary}>
									{team.cityKey}
								</div>
								<span>{team.city}</span>
							</div>
						</td>
						<td>{entry.wins}</td>
						<td>{entry.losses}</td>
						<td>{entry.pointsFor}</td>
						<td>{entry.pointsAgainst}</td>
						<td>{entry.gamesBack > 0 ? entry.gamesBack : '-'}</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>

<style>
	.standings {
		width: 100%;
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	th {
		color: var(--color-text-tertiary);
		font-weight: 600;
		text-align: center;
		padding: 6px 8px;
		border-bottom: 1px solid var(--color-border-strong);
	}
	td {
		color: var(--color-text-primary);
		text-align: center;
		padding: 6px 8px;
		border-bottom: 1px solid var(--color-border-default);
	}
	.rank {
		width: 2rem;
	}
	.team-col {
		text-align: left;
	}
	.team-cell {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.badge {
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--color-on-accent);
		padding: 2px 5px;
		border-radius: 3px;
		min-width: 1.8rem;
		text-align: center;
	}
	.user-team {
		background-color: var(--color-bg-elevated);
	}
	.user-team td {
		color: gold;
		font-weight: 600;
	}
</style>
