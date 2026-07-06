<script lang="ts">
	import type { Snippet } from 'svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { game } from '$lib/soccer/state/game.svelte';
	import { TEAM } from '$lib/shared/constants';

	let { center }: { center?: Snippet } = $props();

	function withAlpha(color: string, alpha: number): string {
		return color.replace(')', ` / ${alpha})`);
	}

	const awayOverlay = $derived(withAlpha(settings.awayTeam.colors.primary, 0.5));
	const homeOverlay = $derived(withAlpha(settings.homeTeam.colors.primary, 0.5));
</script>

<div class="scoreboard">
	<!-- Home team panel — defends the left goal, so it sits on the left -->
	<div class="team-panel">
		<div
			class="team-main"
			style={`
				background-color: ${settings.homeTeam.colors.primary};
				background-image: linear-gradient(to right, ${homeOverlay} 0 100%), url(/flags/${settings.homeTeam.logo}.svg);
			`}
		>
			<div class="team-info">
				<div class="team-name-group">
					<span class="team-name">{settings.homeTeam.city}</span>
					<span class="chip" class:hidden={game.powerChipHolder !== TEAM.HOME}>● Power Chip</span>
				</div>
			</div>
			<span class="score">{game.scores.home}</span>
		</div>
	</div>

	<!-- Center slot (dice) -->
	{#if center}
		{@render center()}
	{/if}

	<!-- Away team panel — defends the right goal, so it sits on the right -->
	<div class="team-panel">
		<div
			class="team-main right"
			style={`
				background-color: ${settings.awayTeam.colors.primary};
				background-image: linear-gradient(to left, ${awayOverlay} 0 100%), url(/flags/${settings.awayTeam.logo}.svg);
			`}
		>
			<span class="score right-score">{game.scores.away}</span>
			<div class="team-info right-info">
				<div class="team-name-group right-group">
					<span class="team-name">{settings.awayTeam.city}</span>
					<span class="chip" class:hidden={game.powerChipHolder !== TEAM.AWAY}>● Power Chip</span>
				</div>
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

	.team-panel {
		display: flex;
		flex-direction: column;
	}

	.team-main {
		display: flex;
		align-items: center;
		background-position: left;
		background-position-x: -1rem;
		background-size: 30%;
		background-repeat: no-repeat;
		overflow: hidden;
	}

	.team-main.right {
		background-position: right;
		background-position-x: calc(100% + 1rem);
	}

	.team-info {
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		flex: 1;
		gap: 0.3rem;
		overflow: hidden;
		padding-right: 0.75rem;
	}

	.right-info {
		justify-content: flex-start;
		padding-right: 0;
		padding-left: 0.75rem;
	}

	.team-name-group {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.1rem;
		overflow: hidden;
	}

	.right-group {
		align-items: flex-start;
	}

	.team-name {
		font-family: var(--font-body);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-on-accent);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chip {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-bold);
		color: var(--color-text-gold, gold);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		white-space: nowrap;
		text-shadow: 0 0 6px oklch(0.88 0.18 85 / 0.6);
	}

	/* Always occupy the chip's line so both panels stay the same height. */
	.chip.hidden {
		visibility: hidden;
	}

	.score {
		font-family: var(--font-numeric);
		font-size: var(--text-display-md);
		font-weight: var(--weight-black);
		color: var(--color-text-primary);
		min-width: 3rem;
		text-align: center;
		border-left: 1px solid var(--color-on-accent);
		flex-shrink: 0;
	}

	.right-score {
		border-left: none;
		border-right: 1px solid var(--color-on-accent);
	}

	@media (max-width: 780px) {
		.team-name {
			font-size: var(--text-base);
		}
		.score {
			font-size: var(--text-lg);
		}
	}
</style>
