<script lang="ts">
	import { game } from '$lib/baseball/state/game.svelte';
	import { getLogoUrl } from '$lib/utils/logoPreloader';
	import type { Team } from '$lib/types';
	import type { Snippet } from 'svelte';

	let { awayTeam, homeTeam, toolbar }: { awayTeam: Team; homeTeam: Team; toolbar?: Snippet } =
		$props();

	function teamBgStyle(team: Team): string {
		const primary = team.colors.primary;
		const fade = primary.replace(')', ' / 0.7)');
		const logoUrl = team.logo ? getLogoUrl(team.logo) : '';
		if (!logoUrl) return `background-color: ${primary}`;
		return `background-color: ${primary}; background-image: linear-gradient(${fade}, ${fade}), url(${logoUrl}); background-position: -0.5rem center; background-size: 2.75rem; background-repeat: no-repeat;`;
	}

	const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

	function cellText(team: 'vis' | 'hom', i: number): string {
		const score = game.scores[team][i - 1];
		if (score !== null) return String(score);
		const isActive = i === game.inning;
		const isCurrent =
			isActive &&
			((team === 'vis' && game.half === 'top') ||
				(team === 'hom' && game.half === 'bottom'));
		return isCurrent ? '·' : '—';
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
		<div class="cell corner">
			{#if toolbar}
				{@render toolbar()}
			{/if}
		</div>
		{#each INNINGS as i}
			<div class="cell hdr" class:active={i === game.inning}>{i}</div>
		{/each}
		<div class="cell sep"></div>
		<div class="cell hdr rhe">R</div>
		<div class="cell hdr rhe">H</div>
		<div class="cell hdr rhe">E</div>

		<!-- Away row -->
		<div
			class="cell team"
			style="{teamBgStyle(awayTeam)} color: {awayTeam.colors.tertiary ?? awayTeam.colors.secondary};"
		>
			{awayTeam.city}
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
		<div
			class="cell team"
			style="{teamBgStyle(homeTeam)} color: {homeTeam.colors.tertiary ?? homeTeam.colors.secondary};"
		>
			{homeTeam.city}
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

	<!-- Outs indicator -->
	<div class="outs-indicator">
		<span class="outs-label">Outs</span>
		{#each [1, 2, 3] as n}
			<span class="out-dot" class:lit={n <= game.outs}></span>
		{/each}
	</div>
</div>

<style>
	.sb {
		overflow: hidden;
		border-radius: var(--radius-sm);
		border: 2px solid var(--color-border-default);
		box-shadow: 0 4px 12px oklch(0 0 0 / 0.4);
	}

	.sb-grid {
		display: grid;
		grid-template-columns: auto repeat(9, 2.5rem) 2px repeat(3, 2.5rem);
		grid-template-rows: repeat(3, 2.25rem);
		gap: 1px;
		background-color: var(--color-border-subtle);
		font-family: var(--font-body);
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg-surface);
		font-size: var(--text-base);
	}

	/* ── Header row ── */
	.hdr {
		font-weight: var(--weight-bold);
		color: var(--color-text-tertiary);
		background-color: var(--color-bg-elevated);
		font-size: var(--text-sm);
	}

	.hdr.active {
		color: var(--color-text-gold);
	}

	.hdr.rhe {
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
	}

	.corner {
		background-color: var(--color-bg-elevated);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	/* ── Team name ── */
	.team {
		font-weight: var(--weight-black);
		font-size: var(--text-sm);
		letter-spacing: 0.04em;
		justify-content: flex-end;
		padding-left: 2.25rem;
		padding-right: 0.5rem;
		white-space: nowrap;
		text-shadow: 0 1px 2px oklch(0 0 0 / 0.4);
		min-width: 8.5rem;
	}

	/* ── Inning cells ── */
	.inn {
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
	}

	.inn.played {
		color: var(--color-text-primary);
		font-weight: var(--weight-bold);
		font-size: var(--text-base);
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
		font-size: var(--text-base);
	}

	.tot.gold {
		color: var(--color-text-gold);
	}

	/* ── Outs indicator ── */
	.outs-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.4rem 0;
		background-color: var(--color-bg-elevated);
		border-top: 2px solid var(--color-border-default);
	}

	.outs-label {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		color: var(--color-text-gold);
		letter-spacing: 0.05em;
	}

	.out-dot {
		width: 0.9rem;
		height: 0.9rem;
		border-radius: 50%;
		border: 2px solid var(--color-text-tertiary);
		transition:
			background-color 0.15s,
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.out-dot.lit {
		background-color: var(--bb-out-red);
		border-color: var(--bb-out-red-border);
		box-shadow: var(--bb-out-red-glow);
	}
</style>
