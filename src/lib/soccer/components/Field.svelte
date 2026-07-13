<script lang="ts">
	import fieldSvg from '$lib/images/soccer-field.svg';
	import {
		BALL_ROLL_DEGREES_PER_PERCENT,
		DEFAULT_BALL_DESIGN,
		FIELD_VERTICAL_CENTER_PERCENT
	} from '$lib/soccer/constants';
	import { ballDesignFor, nextBallDesign, prevBallDesign } from '$lib/soccer/ballDesigns';
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
		ballDesign = DEFAULT_BALL_DESIGN,
		onSelectBall,
		onPreviewBall
	}: Props = $props();

	// Ball-skin picker: tapping the ball opens left/right arrows plus a check so
	// the player can browse designs and confirm one, rather than blind-cycling.
	// The preview is local — nothing persists until the check commits it.
	let picking = $state(false);
	let previewDesign = $state(DEFAULT_BALL_DESIGN);

	// Double-tapping the ball opens a large, read-only look at the current skin.
	let enlarged = $state(false);

	// Show the committed skin normally; while picking, show the previewed one.
	let displayDesign = $derived(picking ? previewDesign : ballDesign);

	// Resolve the shown ball skin to its avif/webp URLs (falls back to the
	// default when the stored key is unknown). Used for both the on-field ball
	// and the goal-celebration ball so they always match.
	let ballImg = $derived(ballDesignFor(displayDesign));

	function openPicker() {
		if (!onSelectBall || celebrating) return;
		previewDesign = ballDesign;
		picking = true;
	}

	function previewNext() {
		previewDesign = nextBallDesign(previewDesign);
		onPreviewBall?.();
	}

	function previewPrev() {
		previewDesign = prevBallDesign(previewDesign);
		onPreviewBall?.();
	}

	function confirmBall() {
		picking = false;
		onSelectBall?.(previewDesign);
	}

	function cancelPicker() {
		picking = false;
	}

	// Double-tap: drop out of the picker and show the enlarged, read-only preview.
	function openEnlarged() {
		if (celebrating) return;
		picking = false;
		enlarged = true;
	}

	function closeEnlarged() {
		enlarged = false;
	}

	// Close transient overlays if the ball vanishes for a goal celebration.
	$effect(() => {
		if (celebrating) {
			if (picking) picking = false;
			if (enlarged) enlarged = false;
		}
	});

	let ballLeft = $derived(sectionCenterPercent(ballSection));

	// Roll the ball in its direction of travel: accumulate a rotation whose
	// magnitude tracks the horizontal distance crossed (a physical roll), so a
	// rightward move spins clockwise and a leftward move counter-clockwise. The
	// transform transition (below) plays this in lockstep with the `left` slide.
	let ballRotation = $state(0);
	let prevLeft: number | null = null;
	$effect(() => {
		const left = ballLeft;
		if (prevLeft !== null) {
			ballRotation += (left - prevLeft) * BALL_ROLL_DEGREES_PER_PERCENT;
		}
		prevLeft = left;
	});

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

		<!-- Transparent dismiss layer: tapping off the ball closes the picker
		     without committing the previewed skin. -->
		{#if picking}
			<button
				type="button"
				class="picker-backdrop"
				onclick={cancelPicker}
				aria-label="Close ball picker"
			></button>
		{/if}

		<button
			type="button"
			class="ball"
			class:hidden={celebrating}
			class:picking
			style:left="{ballLeft}%"
			style:top="{FIELD_VERTICAL_CENTER_PERCENT}%"
			style:transform="translate(-50%, -50%) rotate({ballRotation}deg)"
			onclick={picking ? confirmBall : openPicker}
			ondblclick={openEnlarged}
			disabled={!onSelectBall || celebrating}
			title="Change ball design (double-tap to enlarge)"
			aria-label="Change ball design"
		>
			<picture>
				<source srcset={ballImg.avif} type="image/avif" />
				<img src={ballImg.webp} alt="Ball" />
			</picture>
		</button>

		{#if picking}
			<!-- Picker controls flanking the ball: browse left/right, then tap the
			     ball itself to confirm. Anchored to the ball's position on the pitch. -->
			<button
				type="button"
				class="picker-arrow left"
				style:left="{ballLeft}%"
				style:top="{FIELD_VERTICAL_CENTER_PERCENT}%"
				onclick={previewPrev}
				aria-label="Previous ball design"
			>
				<span class="chevron"></span>
			</button>
			<button
				type="button"
				class="picker-arrow right"
				style:left="{ballLeft}%"
				style:top="{FIELD_VERTICAL_CENTER_PERCENT}%"
				onclick={previewNext}
				aria-label="Next ball design"
			>
				<span class="chevron"></span>
			</button>
		{/if}

		{#if enlarged}
			<!-- Read-only enlarged look at the current ball skin. Tap the backdrop
			     or the close button to dismiss. -->
			<div class="enlarged" role="dialog" aria-modal="true" aria-label="Ball preview">
				<button
					type="button"
					class="enlarged-backdrop"
					onclick={closeEnlarged}
					aria-label="Close ball preview"
				></button>
				<picture class="enlarged-ball">
					<source srcset={ballImg.avif} type="image/avif" />
					<img src={ballImg.webp} alt="Enlarged ball" />
				</picture>
				<button type="button" class="enlarged-close" onclick={closeEnlarged} aria-label="Close">
					<span class="x"></span>
				</button>
			</div>
		{/if}

		{#if celebrating}
			<div class="goal-fx" style:--goal-x="{goalX}%" style:--approach-x="{approachX}%">
				<span class="goal-ring"></span>
				<picture class="goal-ball">
					<source srcset={ballImg.avif} type="image/avif" />
					<img src={ballImg.webp} alt="Goal" />
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
		aspect-ratio: 424 / 290;
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
		/* Reset button chrome — the ball is a clickable target that cycles its
		   skin. The overlay disables pointer events, so re-enable them here. */
		padding: 0;
		border: none;
		background: none;
		box-sizing: border-box;
		cursor: pointer;
		pointer-events: auto;
		transform: translate(-50%, -50%);
		transition:
			left 0.6s var(--ease-snes, ease-in-out),
			transform 0.6s var(--ease-snes, ease-in-out),
			opacity 0.35s ease;
		z-index: 3;
	}

	.ball:disabled {
		cursor: default;
		pointer-events: none;
	}

	.ball picture {
		display: block;
	}

	/* Nudge on hover so the ball reads as interactive (kept subtle so it doesn't
	   fight the roll/slide transition). */
	.ball:not(:disabled):hover img {
		filter: drop-shadow(2px 3px 4px oklch(0 0 0 / 0.55)) brightness(1.08);
	}

	.ball:focus-visible {
		outline: none;
	}

	.ball:focus-visible img {
		filter: drop-shadow(0 0 3px oklch(0.9 0.2 250)) drop-shadow(2px 3px 4px oklch(0 0 0 / 0.55));
	}

	/* Respect reduced-motion: snap between sections instead of sliding/rolling. */
	@media (prefers-reduced-motion: reduce) {
		.ball {
			transition: opacity 0.35s ease;
		}
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

	/* ── Ball-skin picker ── */

	/* While picking, lift the ball above the dismiss backdrop and ring it so it
	   reads as the live preview being chosen. */
	.ball.picking {
		z-index: 6;
	}

	.ball.picking img {
		filter: drop-shadow(0 0 3px oklch(0.9 0.2 250)) drop-shadow(2px 3px 4px oklch(0 0 0 / 0.55));
	}

	/* Full-field transparent layer: a tap anywhere off the controls dismisses
	   the picker without committing a choice. */
	.picker-backdrop {
		position: absolute;
		inset: 0;
		padding: 0;
		border: none;
		background: none;
		cursor: default;
		pointer-events: auto;
		z-index: 5;
	}

	.picker-arrow {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4cqw;
		height: 4cqw;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: oklch(0.25 0 0 / 0.4);
		box-shadow: 0 0.2cqw 0.6cqw oklch(0 0 0 / 0.4);
		cursor: pointer;
		pointer-events: auto;
		z-index: 6;
		transition:
			left 0.6s var(--ease-snes, ease-in-out),
			background 0.15s ease,
			transform 0.15s ease;
	}

	.picker-arrow:hover {
		background: oklch(0.32 0 0 / 0.55);
	}

	.picker-arrow:focus-visible {
		outline: 2px solid oklch(0.9 0.2 250);
		outline-offset: 2px;
	}

	/* Arrows sit just outside the ball on either side. */
	.picker-arrow.left {
		transform: translate(-50%, -50%) translateX(-7cqw);
	}

	.picker-arrow.right {
		transform: translate(-50%, -50%) translateX(7cqw);
	}

	/* CSS chevron for the browse arrows (points per its side). */
	.chevron {
		width: 1.5cqw;
		height: 1.5cqw;
		border: solid #fff;
		border-width: 0 0.45cqw 0.45cqw 0;
	}

	.picker-arrow.left .chevron {
		transform: translateX(0.3cqw) rotate(135deg);
	}

	.picker-arrow.right .chevron {
		transform: translateX(-0.3cqw) rotate(-45deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.picker-arrow {
			transition: background 0.15s ease;
		}
	}

	/* ── Enlarged ball preview (double-tap) ── */
	.enlarged {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 8;
		pointer-events: auto;
	}

	.enlarged-backdrop {
		position: absolute;
		inset: 0;
		padding: 0;
		border: none;
		background: oklch(0 0 0 / 0.62);
		cursor: pointer;
		animation: enlarged-fade 0.2s ease;
	}

	.enlarged-ball {
		position: relative;
		z-index: 1;
		width: 40%;
		max-width: 40cqw;
		pointer-events: none;
		animation: enlarged-pop 0.22s var(--ease-snes, ease-out);
	}

	.enlarged-ball img {
		width: 100%;
		display: block;
		filter: drop-shadow(0 0.6cqw 1.2cqw oklch(0 0 0 / 0.65));
	}

	.enlarged-close {
		position: absolute;
		top: 4cqw;
		right: 4cqw;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 6cqw;
		height: 6cqw;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: oklch(0.25 0 0 / 0.72);
		box-shadow: 0 0.2cqw 0.6cqw oklch(0 0 0 / 0.55);
		cursor: pointer;
	}

	.enlarged-close:hover {
		background: oklch(0.32 0 0 / 0.85);
	}

	.enlarged-close:focus-visible {
		outline: 2px solid oklch(0.9 0.2 250);
		outline-offset: 2px;
	}

	/* CSS "×" glyph for the close button. */
	.x {
		position: relative;
		width: 3cqw;
		height: 3cqw;
	}

	.x::before,
	.x::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		width: 100%;
		height: 0.5cqw;
		background: #fff;
		border-radius: 0.25cqw;
	}

	.x::before {
		transform: translateY(-50%) rotate(45deg);
	}

	.x::after {
		transform: translateY(-50%) rotate(-45deg);
	}

	@keyframes enlarged-fade {
		from {
			opacity: 0;
		}
	}

	@keyframes enlarged-pop {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.enlarged-backdrop,
		.enlarged-ball {
			animation: none;
		}
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
