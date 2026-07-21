<script lang="ts">
	import Pitch from '$lib/soccer/components/Pitch.svelte';
	import Ball from '$lib/soccer/components/Ball.svelte';
	import { TEAM } from '$lib/shared/constants';
	import type { Team } from '$lib/shared/types';

	type Props = {
		ballSection: number;
		possession: string;
		awayTeam: Team;
		homeTeam: Team;
		goalScorer?: string | null;
		lastPlay?: string;
		coinToss?: boolean;
		ballDesign?: string;
		// Commit a chosen ball skin (fired when the picker's check is tapped).
		onSelectBall?: (key: string) => void;
		// Optional click feedback for the picker's arrow taps (sound, etc.).
		onPreviewBall?: () => void;
	};

	let {
		ballSection,
		possession,
		awayTeam,
		homeTeam,
		goalScorer = null,
		lastPlay = '',
		coinToss = false,
		ballDesign,
		onSelectBall,
		onPreviewBall
	}: Props = $props();

	// The possession flag hides while a goal celebration plays.
	let celebrating = $derived(goalScorer != null);

	// Possession indicator: the offense flag, with chevrons pointing the way it
	// attacks. Home drives toward the right goal, Away toward the left.
	let offenseTeam = $derived(possession === TEAM.AWAY ? awayTeam : homeTeam);
	let attackingLeft = $derived(possession === TEAM.AWAY);
</script>

<div class="field-wrapper">
	<Pitch />

	<div class="overlay">
		{#if offenseTeam.logo && !coinToss}
			<div class="possession" class:hidden={celebrating}>
				<img
					class="poss-flag"
					src={`/flags/${offenseTeam.logo}.svg`}
					alt={`${offenseTeam.city} attacking`}
				/>
				<span class="arrows" class:left={attackingLeft} aria-hidden="true">
					<span class="chev"></span>
					<span class="chev"></span>
					<span class="chev"></span>
					<span class="chev"></span>
				</span>
			</div>
		{/if}

		{#key lastPlay}
			{#if lastPlay}
				<p class="last-play">{lastPlay}</p>
			{/if}
		{/key}

		<Ball {ballSection} {goalScorer} {ballDesign} {onSelectBall} {onPreviewBall} />
	</div>
</div>

<style>
	.field-wrapper {
		container-type: inline-size;
		position: relative;
		width: 100%;
		/* Fill the height handed down by the game page's .field-area rather than
		   holding the pitch's native ratio — the pitch stretches to fill the screen
		   (like the football field). Overlay positions are all percentage-based, so
		   the ball and markings track the stretched box correctly. */
		height: 100%;
		margin: 0 auto;
	}

	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	/* ── Possession indicator: offense flag + directional chevrons ──
	   The flag is the centred anchor (hanging just below the top field outline,
	   inside the pitch); the chevrons are positioned absolutely to its attacking
	   side so they never shift the flag off centre. */
	.possession {
		position: absolute;
		top: 6%; /* just below the pitch's top boundary line (~5.2%) */
		left: 50%; /* the midline */
		transform: translate(-50%, 0);
		transition: opacity 0.4s var(--ease-snes, ease-in-out);
	}

	.possession.hidden {
		opacity: 0;
	}

	/* Sits directly beneath the possession display, just inside the top border. */
	.last-play {
		position: absolute;
		top: 12.5%;
		left: 50%;
		transform: translateX(-50%);
		font-family: var(--font-body);
		font-size: clamp(0.7rem, 2.2cqw, 1.1rem);
		font-weight: var(--weight-bold);
		color: #fff;
		text-align: center;
		margin: 0;
		padding: 0.2rem 0.7rem;
		border-radius: 0.375rem;
		background-color: rgba(0, 0, 0, 0.55);
		max-width: 80%;
		pointer-events: none;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
		/* Appear, hold for ~2s, then fade out. Re-triggered by the {#key} block
		   remounting whenever the play text changes. */
		animation: last-play-fade 3s ease forwards;
	}

	@keyframes last-play-fade {
		0% {
			opacity: 0;
		}
		7% {
			opacity: 1;
		}
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.last-play {
			animation: none;
		}
	}

	.poss-flag {
		display: block;
		height: 4cqw;
		width: auto;
		/* Match the dice-group flag badges in the game page for a consistent
		   corner radius across all flags. */
		border-radius: 0.2rem;
		box-shadow: 0 0.25cqw 0.6cqw oklch(0 0 0 / 0.55);
	}

	.arrows {
		position: absolute;
		top: 50%;
		left: 100%; /* attacking right: chevrons to the right of the flag */
		margin-left: 1cqw;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		gap: 0.25cqw;
	}

	/* Attacking left: move the chevrons to the flag's left and flip them so
	   they point (and pulse) toward the left goal. */
	.arrows.left {
		left: auto;
		right: 100%;
		margin-left: 0;
		margin-right: 1cqw;
		transform: translateY(-50%) scaleX(-1);
	}

	.chev {
		width: 2.8cqw;
		height: 2.8cqw;
		border: solid #fff;
		border-width: 0 0.55cqw 0.55cqw 0;
		transform: rotate(-45deg);
		opacity: 0.2;
		filter: drop-shadow(0 0.15cqw 0.15cqw oklch(0 0 0 / 0.5));
		animation: chev-pulse 1.6s ease-in-out infinite;
	}

	/* Stagger the pulse so it flows outward in the attack direction. */
	.chev:nth-child(1) {
		animation-delay: 0s;
	}
	.chev:nth-child(2) {
		animation-delay: 0.22s;
	}
	.chev:nth-child(3) {
		animation-delay: 0.44s;
	}
	.chev:nth-child(4) {
		animation-delay: 0.66s;
	}

	@keyframes chev-pulse {
		0%,
		100% {
			opacity: 0.2;
		}
		50% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chev {
			animation: none;
			opacity: 0.75;
		}
	}
</style>
