<script lang="ts">
	import fieldSvg from '$lib/images/soccer-field.svg';
	import ballAvif from '$lib/images/soccer-ball-02.avif';
	import ballWebp from '$lib/images/soccer-ball-02.webp';
	import { FIELD_VERTICAL_CENTER_PERCENT } from '$lib/soccer/constants';
	import { sectionCenterPercent } from '$lib/soccer/utils/game';
	import { TEAM } from '$lib/shared/constants';
	import type { Team } from '$lib/shared/types';

	type Props = {
		ballSection: number;
		possession: string;
		awayTeam: Team;
		homeTeam: Team;
		goalScorer?: string | null;
		lastPlay?: string;
	};

	let {
		ballSection,
		possession,
		awayTeam,
		homeTeam,
		goalScorer = null,
		lastPlay = ''
	}: Props = $props();

	let ballLeft = $derived(sectionCenterPercent(ballSection));
	let celebrating = $derived(goalScorer != null);
	// Home attacks the right goal, Away the left. During a goal the ball rockets
	// from the penalty-spot area into that net (% of the rendered pitch width).
	let goalX = $derived(goalScorer === TEAM.HOME ? 95 : 5);
	let approachX = $derived(goalScorer === TEAM.HOME ? 84 : 16);

	// Possession indicator: the offense flag, with chevrons pointing the way it
	// attacks. Home drives toward the right goal, Away toward the left.
	let offenseTeam = $derived(possession === TEAM.AWAY ? awayTeam : homeTeam);
	let attackingLeft = $derived(possession === TEAM.AWAY);
</script>

<div class="field-wrapper">
	<img class="pitch" src={fieldSvg} alt="Soccer pitch" />

	<div class="overlay">
		{#if offenseTeam.logo}
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

		<picture
			class="ball"
			class:hidden={celebrating}
			style:left="{ballLeft}%"
			style:top="{FIELD_VERTICAL_CENTER_PERCENT}%"
		>
			<source srcset={ballAvif} type="image/avif" />
			<img src={ballWebp} alt="Ball" />
		</picture>

		{#if celebrating}
			<div class="goal-fx" style:--goal-x="{goalX}%" style:--approach-x="{approachX}%">
				<span class="goal-ring"></span>
				<picture class="goal-ball">
					<source srcset={ballAvif} type="image/avif" />
					<img src={ballWebp} alt="Goal" />
				</picture>
			</div>
		{/if}
	</div>
</div>

<style>
	.field-wrapper {
		container-type: inline-size;
		position: relative;
		width: 100%;
		aspect-ratio: 440 / 300;
		margin: 0 auto;
	}

	.pitch {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.ball {
		position: absolute;
		width: 6%;
		transform: translate(-50%, -50%);
		transition:
			left 0.6s var(--ease-snes, ease-in-out),
			opacity 0.35s ease;
		z-index: 3;
	}

	/* Hidden under the goal celebration: snap out of sight (no lingering slide)
	   and fade back in at the kickoff spot once the celebration ends. */
	.ball.hidden {
		opacity: 0;
		transition: opacity 0.12s ease;
	}

	.ball img {
		width: 100%;
		display: block;
		filter: drop-shadow(2px 3px 4px oklch(0 0 0 / 0.55));
	}

	/* ── Goal celebration: ball rockets into the net ── */
	.goal-fx {
		position: absolute;
		inset: 0;
		z-index: 4;
		pointer-events: none;
	}

	.goal-ball {
		position: absolute;
		top: 50%;
		left: var(--approach-x);
		width: 6%;
		transform: translate(-50%, -50%);
		animation: shoot-in 0.85s var(--ease-snes, ease-out) forwards;
	}

	.goal-ball img {
		width: 100%;
		display: block;
		filter: drop-shadow(2px 3px 5px oklch(0 0 0 / 0.6));
	}

	@keyframes shoot-in {
		0% {
			left: var(--approach-x);
			transform: translate(-50%, -50%) scale(0.85) rotate(0deg);
			opacity: 0.3;
		}
		25% {
			opacity: 1;
		}
		100% {
			left: var(--goal-x);
			transform: translate(-50%, -50%) scale(1.1) rotate(1080deg);
			opacity: 1;
		}
	}

	.goal-ring {
		position: absolute;
		top: 50%;
		left: var(--goal-x);
		width: 4%;
		aspect-ratio: 1;
		transform: translate(-50%, -50%) scale(0);
		border: 3px solid #fff;
		border-radius: 50%;
		opacity: 0;
		animation: goal-ring 0.7s ease-out 0.45s forwards;
	}

	@keyframes goal-ring {
		0% {
			transform: translate(-50%, -50%) scale(0.2);
			opacity: 0.9;
		}
		100% {
			transform: translate(-50%, -50%) scale(4);
			opacity: 0;
		}
	}

	/* ── Possession indicator: offense flag + directional chevrons ──
	   The flag is the centred anchor (sitting on the midline, over the top
	   field border); the chevrons are positioned absolutely to its attacking
	   side so they never shift the flag off centre. */
	.possession {
		position: absolute;
		top: 6.7%; /* the top boundary line of the pitch */
		left: 50%; /* the midline */
		transform: translate(-50%, -50%);
		transition: opacity 0.4s var(--ease-snes, ease-in-out);
	}

	.possession.hidden {
		opacity: 0;
	}

	/* Sits directly beneath the possession display, just inside the top border. */
	.last-play {
		position: absolute;
		top: 13%;
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
		border-radius: 0.15cqw;
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
