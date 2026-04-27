<script lang="ts">
	import type { Snippet } from 'svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { game } from '$lib/basketball/state/game.svelte';
	import { MAX_TEAM_FOULS } from '$lib/basketball/constants';
	import { getLogoUrl } from '$lib/utils/logoPreloader';

	let { center }: { center?: Snippet } = $props();

	function withAlpha(color: string, alpha: number): string {
		// oklch(0.5 0.2 26) → oklch(0.5 0.2 26 / 0.5)
		return color.replace(')', ` / ${alpha})`);
	}

	const awayOverlay = $derived(withAlpha(settings.awayTeam.colors.primary, 0.5));
	const homeOverlay = $derived(withAlpha(settings.homeTeam.colors.primary, 0.5));
</script>

<div class="scoreboard">
	<!-- Away team panel -->
	<div class="team-panel">
		<div
			class="team-main"
			style={`
				background-color: ${settings.awayTeam.colors.primary};
				background-image: linear-gradient(to right, ${awayOverlay} 0 100%), url(${getLogoUrl(settings.awayTeam.logo)});
			`}
		>
			<div class="team-info">
				{#if game.possession === 'Away'}
					<img class="possession-ball" src="/images/basketball.webp" alt="Possession" />
				{/if}
				<span class="team-name">
					<span class="city">{settings.awayTeam.city}</span> {settings.awayTeam.name}
				</span>
			</div>
			<span class="score">{String(game.scores.away).padStart(2, '0')}</span>
		</div>
		<div class="foul-row">
			<span class="foul-label">Fouls</span>
			<div class="foul-dots">
				{#each Array(MAX_TEAM_FOULS) as _, i (i)}
					<span class="foul-dot" class:lit={i < game.fouls.away}></span>
				{/each}
			</div>
		</div>
	</div>

	<!-- Center column (dice slot) -->
	{#if center}
		{@render center()}
	{/if}

	<!-- Home team panel -->
	<div class="team-panel">
		<div
			class="team-main"
			style={`
				background-color: ${settings.homeTeam.colors.primary};
				background-image: linear-gradient(to right, ${homeOverlay} 0 100%), url(${getLogoUrl(settings.homeTeam.logo)});
			`}
		>
			<div class="team-info">
				{#if game.possession === 'Home'}
					<img class="possession-ball" src="/images/basketball.webp" alt="Possession" />
				{/if}
				<span class="team-name">
					<span class="city">{settings.homeTeam.city}</span> {settings.homeTeam.name}
				</span>
			</div>
			<span class="score">{String(game.scores.home).padStart(2, '0')}</span>
		</div>
		<div class="foul-row">
			<span class="foul-label">Fouls</span>
			<div class="foul-dots">
				{#each Array(MAX_TEAM_FOULS) as _, i (i)}
					<span class="foul-dot" class:lit={i < game.fouls.home}></span>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.scoreboard {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: start;
		column-gap: 0.25rem;
	}

	/* ── Team panel ──────────────────────────────────────────── */
	.team-panel {
		display: flex;
		flex-direction: column;
	}

	.team-main {
		display: flex;
		align-items: center;
		background-position: left;
		background-position-x: -1.25rem;
		background-size: 50%;
		background-repeat: no-repeat;
		overflow: hidden;
	}

	.team-info {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex: 1;
		gap: 0.3rem;
		overflow: hidden;
		padding-right: 0.5rem;
	}

	.possession-ball {
		width: 0.9rem;
		height: 0.9rem;
		flex-shrink: 0;
	}

	.team-name {
		font-family: var(--font-body);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-on-accent);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: right;
	}

	.score {
		font-family: var(--font-numeric);
		font-size: var(--text-display-sm);
		font-weight: var(--weight-black);
		color: var(--color-text-primary);
		min-width: 2rem;
		text-align: right;
		padding: 0.25rem 0.5rem;
		border-left: 1px solid var(--color-on-accent);
		background-color: var(--color-bg-surface);
	}

	/* ── Foul indicator row ──────────────────────────────────── */
	.foul-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding-top: var(--space-1);
	}

	.foul-label {
		font-family: var(--font-body);
		font-size: 0.6rem;
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
	}

	.foul-dots {
		display: flex;
		gap: 0.25rem;
	}

	.foul-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		border: 1px solid var(--color-text-tertiary);
		background-color: transparent;
		transition: background-color var(--dur-fast) var(--ease-snes);
	}

	.foul-dot.lit {
		background-color: var(--color-text-gold);
		border-color: var(--color-text-gold);
	}

	@media (min-width: 52rem) {
		.team-main {
			background-position-x: -25px;
			background-size: 40%;
		}
	}

	@media (max-width: 780px) {
		.city {
			display: none;
		}

		.team-name {
			font-size: var(--text-base);
		}

		.score {
			font-size: var(--text-lg);
		}
	}
</style>
