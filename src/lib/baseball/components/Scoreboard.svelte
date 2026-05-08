<script lang="ts">
	import { game } from '$lib/baseball/state/game.svelte';
	import { getLogoUrl } from '$lib/utils/logoPreloader';
	import type { Team } from '$lib/shared/types';
	import type { Snippet } from 'svelte';

	let {
		awayTeam,
		homeTeam,
		toolbar,
		diceArea
	}: { awayTeam: Team; homeTeam: Team; toolbar?: Snippet; diceArea?: Snippet } = $props();

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
	<div class="sb-inner">
	<div class="sb-grid">
		<!-- Header row -->
		<div class="cell corner">
			{#if toolbar}
				{@render toolbar()}
			{/if}
		</div>
		{#each INNINGS as i (i)}
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
			<span class="team-full">{awayTeam.city} {awayTeam.name}</span>
			<span class="team-city">{awayTeam.city}</span>
			<span class="team-code">{awayTeam.cityKey}</span>
		</div>
		{#each INNINGS as i (i)}
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
			<span class="team-full">{homeTeam.city} {homeTeam.name}</span>
			<span class="team-city">{homeTeam.city}</span>
			<span class="team-code">{homeTeam.cityKey}</span>
		</div>
		{#each INNINGS as i (i)}
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
	{#if diceArea}
		<div class="dice-area">
			{@render diceArea()}
		</div>
	{/if}
	</div>
</div>

<style>
	.sb {
		overflow: hidden;
		border-radius: var(--radius-sm);
		border: 2px solid var(--color-border-default);
		box-shadow: 0 4px 12px oklch(0 0 0 / 0.4);
		container-type: inline-size;
	}

	.sb-inner {
		display: flex;
		align-items: stretch;
	}

	.sb-grid {
		flex: 1;
		min-width: 0;
		display: grid;
		grid-template-columns: auto repeat(9, minmax(1.25rem, 3rem)) 2px repeat(3, minmax(1.25rem, 3rem));
		grid-template-rows: repeat(3, clamp(1.5rem, 3vw, 2.5rem));
		background-color: var(--color-bg-surface);
		font-family: var(--font-body);
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg-surface);
		font-size: clamp(0.75rem, 1.5vw, 1.125rem);
		border-right: 1px solid var(--color-border-subtle);
		border-bottom: 1px solid var(--color-border-subtle);
	}

	/* ── Header row ── */
	.hdr {
		font-weight: var(--weight-bold);
		color: var(--color-text-tertiary);
		background-color: var(--color-bg-elevated);
		font-size: clamp(0.625rem, 1.25vw, 1rem);
	}

	.hdr.active {
		color: var(--color-text-gold);
	}

	.hdr.rhe {
		color: var(--color-text-secondary);
		font-size: clamp(0.625rem, 1.25vw, 1rem);
	}

	.corner {
		background-color: var(--color-bg-elevated);
		display: flex;
		align-items: center;
		justify-content: start;
		gap: 0.25rem;
	}

	/* ── Team name ── */
	.team {
		font-weight: var(--weight-black);
		font-size: clamp(0.625rem, 1.25vw, 1rem);
		letter-spacing: 0.04em;
		justify-content: flex-end;
		padding-left: 2.25rem;
		padding-right: 0.5rem;
		white-space: nowrap;
		text-shadow: 0 1px 2px oklch(0 0 0 / 0.4);
		min-width: 10rem;
	}

	/* ── Responsive team name ── */
	.team-full {
		display: none;
	}
	.team-city {
		display: inline;
	}
	.team-code {
		display: none;
	}

	@container (min-width: 48rem) {
		.team-full {
			display: inline;
		}
		.team-city {
			display: none;
		}
	}

	@container (max-width: 34rem) {
		.team-city {
			display: none;
		}
		.team-code {
			display: inline;
		}
		.team {
			padding-left: 0.5rem;
			padding-right: 0.25rem;
			min-width: 4rem;
		}
	}

	/* ── Inning cells ── */
	.inn {
		color: var(--color-text-tertiary);
	}

	.inn.played {
		color: var(--color-text-primary);
		font-weight: var(--weight-bold);
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
	}

	.tot.gold {
		color: var(--color-text-gold);
	}

	/* ── Dice area ── */
	.dice-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.25rem 0.5rem;
		background-color: var(--color-bg-surface);
		border-left: 2px solid var(--color-border-default);
		overflow: hidden;
	}

	.dice-area > :global(*) {
		zoom: var(--dice-zoom, 1);
	}

	@media (max-width: 60rem) {
		.dice-area {
			--dice-zoom: 0.8;
			padding: 0.1rem 0.25rem;
		}
	}

	@media (max-width: 40rem) {
		.dice-area {
			--dice-zoom: 0.55;
			padding: 0 0.15rem;
		}
	}
</style>
