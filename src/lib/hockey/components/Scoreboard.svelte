<script lang="ts">
	import type { Snippet } from 'svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { game } from '$lib/hockey/state/game.svelte';
	import { getLogoUrl } from '$lib/utils/logoPreloader';

	let { center }: { center?: Snippet } = $props();

	function withAlpha(color: string, alpha: number): string {
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
					<span class="possession-puck"></span>
				{/if}
				<div class="team-name-group">
					<span class="team-name"><span class="city">{settings.awayTeam.city}</span> {settings.awayTeam.name}</span>
					<span class="shots">SOG: {game.shotsOnGoal.away}</span>
				</div>
			</div>
			<span class="score">{game.scores.away}</span>
		</div>
	</div>

	<!-- Center slot (dice) -->
	{#if center}
		{@render center()}
	{/if}

	<!-- Home team panel -->
	<div class="team-panel">
		<div
			class="team-main home"
			style={`
				background-color: ${settings.homeTeam.colors.primary};
				background-image: linear-gradient(to left, ${homeOverlay} 0 100%), url(${getLogoUrl(settings.homeTeam.logo)});
			`}
		>
			<span class="score home-score">{game.scores.home}</span>
			<div class="team-info home-info">
				<div class="team-name-group home-group">
					<span class="team-name"><span class="city">{settings.homeTeam.city}</span> {settings.homeTeam.name}</span>
					<span class="shots">SOG: {game.shotsOnGoal.home}</span>
				</div>
				{#if game.possession === 'Home'}
					<span class="possession-puck"></span>
				{/if}
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

	.team-main.home {
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

	.home-info {
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

	.home-group {
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

	.shots {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: oklch(1 0 0 / 0.65);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		white-space: nowrap;
	}

	.score {
		font-family: var(--font-numeric);
		font-size: var(--text-display-md);
		font-weight: var(--weight-black);
		color: var(--color-text-primary);
		min-width: 2rem;
		text-align: right;
		padding: 0 0.75rem;
		border-left: 1px solid var(--color-on-accent);
		flex-shrink: 0;
	}

	.home-score {
		text-align: left;
		border-left: none;
		border-right: 1px solid var(--color-on-accent);
	}

	.possession-puck {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		background-color: var(--color-on-accent);
		flex-shrink: 0;
		margin-top: 0.45rem;
		opacity: 0.9;
	}

	@media (max-width: 780px) {
		.city { display: none; }
		.team-name { font-size: var(--text-base); }
		.score { font-size: var(--text-lg); }
	}
</style>
