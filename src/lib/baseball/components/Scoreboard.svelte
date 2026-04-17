<script lang="ts">
	import { game } from '$lib/baseball/state/game.svelte';
	import type { Team } from '$lib/types';

	let { awayTeam, homeTeam }: { awayTeam: Team; homeTeam: Team } = $props();

	const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

	function cellText(team: 'vis' | 'hom', i: number): string {
		const score = game.scores[team][i - 1];
		if (score !== null) return String(score);
		const isActive = i === game.inning;
		const isCurrent =
			isActive &&
			((team === 'vis' && game.half === 'top') ||
				(team === 'hom' && game.half === 'bottom'));
		return isCurrent ? '·' : '';
	}

	function isCurrent(team: 'vis' | 'hom', i: number): boolean {
		return (
			i === game.inning &&
			((team === 'vis' && game.half === 'top') ||
				(team === 'hom' && game.half === 'bottom'))
		);
	}

	function isPlayed(team: 'vis' | 'hom', i: number): boolean {
		return game.scores[team][i - 1] !== null;
	}
</script>

<div class="sb">
	<div class="sb-grid">
		<!-- Header row -->
		<div class="cell corner"></div>
		{#each INNINGS as i}
			<div class="cell hdr" class:active={i === game.inning}>{i}</div>
		{/each}
		<div class="cell sep"></div>
		<div class="cell hdr rhe">R</div>
		<div class="cell hdr rhe">H</div>
		<div class="cell hdr rhe">E</div>

		<!-- Away row -->
		<div class="cell team" style:color={awayTeam.colors.secondary}>
			{awayTeam.cityKey}
		</div>
		{#each INNINGS as i}
			<div
				class="cell inn"
				class:played={isPlayed('vis', i)}
				class:cur={isCurrent('vis', i)}
			>
				{cellText('vis', i)}
			</div>
		{/each}
		<div class="cell sep"></div>
		<div class="cell tot gold">{game.totals.vis.r}</div>
		<div class="cell tot">{game.totals.vis.h}</div>
		<div class="cell tot">{game.totals.vis.e}</div>

		<!-- Home row -->
		<div class="cell team" style:color={homeTeam.colors.secondary}>
			{homeTeam.cityKey}
		</div>
		{#each INNINGS as i}
			<div
				class="cell inn"
				class:played={isPlayed('hom', i)}
				class:cur={isCurrent('hom', i)}
			>
				{cellText('hom', i)}
			</div>
		{/each}
		<div class="cell sep"></div>
		<div class="cell tot gold">{game.totals.hom.r}</div>
		<div class="cell tot">{game.totals.hom.h}</div>
		<div class="cell tot">{game.totals.hom.e}</div>
	</div>
</div>

<style>
	.sb {
		overflow: hidden;
	}

	.sb-grid {
		display: grid;
		grid-template-columns: 3.5rem repeat(9, 1fr) 2px repeat(3, 2rem);
		grid-template-rows: repeat(3, 1.75rem);
		gap: 1px;
		background-color: var(--color-border-subtle);
		font-family: var(--font-body);
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg-surface);
		font-size: var(--text-sm);
	}

	/* ── Header row ── */
	.hdr {
		font-weight: var(--weight-bold);
		color: var(--color-text-tertiary);
		background-color: var(--color-bg-elevated);
		font-size: var(--text-xs);
	}

	.hdr.active {
		color: var(--color-text-gold);
		background-color: var(--bb-gold-accent-bg);
	}

	.hdr.rhe {
		color: var(--color-text-secondary);
		font-size: var(--text-xs);
	}

	.corner {
		background-color: var(--color-bg-elevated);
	}

	/* ── Team name ── */
	.team {
		font-weight: var(--weight-black);
		font-size: var(--text-sm);
		letter-spacing: 0.06em;
		background-color: var(--color-bg-elevated);
		justify-content: flex-start;
		padding-left: 0.4rem;
		color: var(--color-text-gold);
	}

	/* ── Inning cells ── */
	.inn {
		color: var(--color-text-tertiary);
		font-size: var(--text-xs);
	}

	.inn.played {
		color: var(--color-text-primary);
		font-weight: var(--weight-bold);
		font-size: var(--text-sm);
	}

	.inn.cur {
		background-color: var(--bb-gold-accent-bg);
		color: var(--color-text-gold);
	}

	/* ── Separator ── */
	.sep {
		background-color: var(--color-border-default);
		padding: 0;
	}

	/* ── Totals ── */
	.tot {
		font-weight: var(--weight-bold);
		color: var(--color-text-primary);
		font-size: var(--text-sm);
	}

	.tot.gold {
		color: var(--color-text-gold);
	}
</style>
