<script lang="ts">
	import type { Snippet } from 'svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { game } from '$lib/soccer/state/game.svelte';
	import { TEAM } from '$lib/shared/constants';
	import { readableTextColor } from '$lib/utils/common';

	let {
		center,
		homeContent,
		awayContent
	}: { center?: Snippet; homeContent?: Snippet; awayContent?: Snippet } = $props();

	function withAlpha(color: string, alpha: number): string {
		return color.replace(')', ` / ${alpha})`);
	}

	const awayOverlay = $derived(withAlpha(settings.awayTeam.colors.primary, 0.5));
	const homeOverlay = $derived(withAlpha(settings.homeTeam.colors.primary, 0.5));

	// Panel backgrounds are the team's primary color regardless of theme, so the
	// name/score foreground must contrast with that color — not the theme. Pale
	// primaries (e.g. white) otherwise render white-on-white and vanish.
	const homeFg = $derived(readableTextColor(settings.homeTeam.colors.primary));
	const awayFg = $derived(readableTextColor(settings.awayTeam.colors.primary));

	// A team carrying a red-card dice penalty rolls one fewer die until the next
	// goal clears it. Surface that as a persistent badge on the penalized panel.
	const homeRedCard = $derived(game.diceReduction.home > 0);
	const awayRedCard = $derived(game.diceReduction.away > 0);
</script>

<div class="scoreboard">
	<!-- Home team panel — defends the left goal, so it sits on the left -->
	<div class="team-panel">
		<div
			class="team-main"
			style={`
				background-color: ${settings.homeTeam.colors.primary};
				background-image: linear-gradient(to right, ${homeOverlay} 0 100%), url(/flags/${settings.homeTeam.logo}.svg);
				--team-fg: ${homeFg};
			`}
		>
			<div class="team-info">
				{@render powerChip(game.powerChipHolder === TEAM.HOME)}
				<span class="team-name">{settings.homeTeam.city}</span>
				{@render redCard(homeRedCard)}
			</div>
			<span class="score">{game.scores.home}</span>
		</div>
		{#if homeContent}
			{@render homeContent()}
		{/if}
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
				--team-fg: ${awayFg};
			`}
		>
			<span class="score right-score">{game.scores.away}</span>
			<div class="team-info right-info">
				{@render redCard(awayRedCard)}
				<span class="team-name">{settings.awayTeam.city}</span>
				{@render powerChip(game.powerChipHolder === TEAM.AWAY)}
			</div>
		</div>
		{#if awayContent}
			{@render awayContent()}
		{/if}
	</div>
</div>

<!-- The Power Chip: a gold poker-chip talisman for whichever team currently
     holds it. Always rendered (hidden when inactive) so the name stays put. -->
{#snippet powerChip(active: boolean)}
	<span class="power-chip" class:active aria-hidden={!active} title="Power Chip">
		<svg class="power-chip-svg" viewBox="0 0 48 48" role="img" aria-label="Power Chip">
			<defs>
				<radialGradient id="pcFace" cx="50%" cy="38%" r="68%">
					<stop offset="0%" stop-color="#fff7cc" />
					<stop offset="52%" stop-color="#ffd23f" />
					<stop offset="100%" stop-color="#dc9e0f" />
				</radialGradient>
			</defs>
			<!-- Edge segments of the chip -->
			<circle cx="24" cy="24" r="23" fill="#8a5a00" />
			<g stroke="#fff6cf" stroke-width="4">
				<line x1="24" y1="1" x2="24" y2="8" />
				<line x1="24" y1="40" x2="24" y2="47" />
				<line x1="1" y1="24" x2="8" y2="24" />
				<line x1="40" y1="24" x2="47" y2="24" />
				<line x1="7.7" y1="7.7" x2="12.7" y2="12.7" />
				<line x1="35.3" y1="35.3" x2="40.3" y2="40.3" />
				<line x1="40.3" y1="7.7" x2="35.3" y2="12.7" />
				<line x1="12.7" y1="35.3" x2="7.7" y2="40.3" />
			</g>
			<!-- Face -->
			<circle cx="24" cy="24" r="18" fill="url(#pcFace)" stroke="#8a5a00" stroke-width="1.5" />
			<circle cx="24" cy="24" r="13.5" fill="none" stroke="#8a5a00" stroke-width="1.4" stroke-dasharray="2.6 2.8" />
			<!-- Lightning bolt for might -->
			<path d="M27.5 9 L14 26.5 L22 26.5 L20.5 39 L34 21.5 L25.5 21.5 Z" fill="#4a2c00" stroke="#fff7cc" stroke-width="0.8" stroke-linejoin="round" />
		</svg>
	</span>
{/snippet}

<!-- Red-card penalty: shown on a team's panel while it rolls a die short. Like
     the chip, the slot is always reserved so the name doesn't shift. -->
{#snippet redCard(active: boolean)}
	<span
		class="red-card"
		class:active
		aria-hidden={!active}
		title="Red card — one fewer die until the next goal"
	>
		<svg class="red-card-svg" viewBox="0 0 24 24" role="img" aria-label="Red card penalty">
			<rect x="7" y="2.5" width="10" height="19" rx="1.6" fill="#d62828" stroke="#7a1010" stroke-width="1" />
			<rect x="8.6" y="4.2" width="2" height="15.6" rx="1" fill="#e85a5a" opacity="0.6" />
		</svg>
	</span>
{/snippet}

<style>
	.scoreboard {
		display: grid;
		/* minmax(0, 1fr) lets each team column shrink below its dice row's
		   min-content width instead of expanding the board; the dice scale down to
		   fit rather than forcing the panels wider. */
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: start;
		column-gap: 0.25rem;
		/* Size the team names + scores off the board's own width so they scale
		   smoothly across screen sizes rather than snapping at one breakpoint. */
		container-type: inline-size;
	}

	.team-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
	}

	.team-main {
		display: flex;
		align-items: center;
		align-self: stretch;
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
		align-items: center;
		justify-content: flex-end;
		flex: 1;
		gap: 0.4rem;
		overflow: hidden;
		padding-right: 0.75rem;
	}

	.right-info {
		justify-content: flex-start;
		padding-right: 0;
		padding-left: 0.75rem;
	}

	.team-name {
		font-family: var(--font-body);
		font-size: clamp(var(--text-base), 3.2cqw, var(--text-lg));
		font-weight: var(--weight-bold);
		color: var(--team-fg, var(--color-on-accent));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Reserve the chip's slot on both panels so the name never shifts when the
	   holder changes; only the active panel actually paints its chip. */
	.power-chip {
		flex-shrink: 0;
		width: clamp(1.1rem, 4.5cqw, 1.6rem);
		height: clamp(1.1rem, 4.5cqw, 1.6rem);
		display: grid;
		place-items: center;
	}

	.power-chip[aria-hidden='true'] {
		visibility: hidden;
	}

	.power-chip-svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55));
	}

	.power-chip.active .power-chip-svg {
		animation: chip-pulse 1.8s var(--ease-snes, ease-in-out) infinite;
	}

	@keyframes chip-pulse {
		0%,
		100% {
			transform: scale(1);
			filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 3px oklch(0.88 0.18 85 / 0.5));
		}
		50% {
			transform: scale(1.12);
			filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 8px oklch(0.9 0.19 90 / 0.9));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.power-chip.active .power-chip-svg {
			animation: none;
		}
	}

	/* Red-card badge — mirrors the chip's reserved slot so the name never shifts;
	   only the penalized panel paints its card. */
	.red-card {
		flex-shrink: 0;
		width: clamp(0.85rem, 3.6cqw, 1.25rem);
		height: clamp(1.1rem, 4.5cqw, 1.6rem);
		display: grid;
		place-items: center;
	}

	.red-card[aria-hidden='true'] {
		visibility: hidden;
	}

	.red-card-svg {
		width: 100%;
		height: 100%;
		transform: rotate(-10deg);
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55));
	}

	.red-card.active .red-card-svg {
		animation: card-pulse 1.8s var(--ease-snes, ease-in-out) infinite;
	}

	@keyframes card-pulse {
		0%,
		100% {
			transform: rotate(-10deg) scale(1);
			filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55));
		}
		50% {
			transform: rotate(-10deg) scale(1.12);
			filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 7px oklch(0.6 0.22 25 / 0.85));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.red-card.active .red-card-svg {
			animation: none;
		}
	}

	.score {
		font-family: var(--font-numeric);
		font-size: clamp(var(--text-lg), 6cqw, var(--text-display-md));
		font-weight: var(--weight-black);
		color: var(--team-fg, var(--color-text-primary));
		min-width: 3rem;
		text-align: center;
		border-left: 1px solid var(--team-fg, var(--color-on-accent));
		flex-shrink: 0;
	}

	.right-score {
		border-left: none;
		border-right: 1px solid var(--team-fg, var(--color-on-accent));
	}
</style>
