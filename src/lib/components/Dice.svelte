<script lang="ts">
	import { game } from '$lib/state/game.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { nonZeroRandomNumber, sleep } from '$lib/utils/common';
	import { isAutoPlay, isRollAction } from '$lib/utils/game';
	import { GAME_MODE, TEAM } from '$lib/constants/constants';
	import flick from '$lib/assets/sfx/flick.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	type DiceProps = {
		dieColor?: string;
		pipColor?: string;
		pipCount?: number;
		rollDelay?: number;
		onRollComplete?: () => void;
	};

	let { dieColor, pipColor, pipCount = 6, rollDelay = 1000, onRollComplete }: DiceProps = $props();

	const flickSfx: Howl = createSound(flick);
	let die1Pips: number = $state(1);
	let die2Pips: number = $state(1);
	let rolling: boolean = $state(false);
	let canRoll: boolean = $state(true);

	$effect(() => {
		if (
			isAutoPlay(settings.mode, game.possession, settings.userTeam) &&
			isRollAction(game.action) &&
			canRoll &&
			!game.paused
		) {
			if (game.ballIndex > 0 || game.currentDown > 0) {
				sleep(2000 * settings.speed).then(() => {
					if (!game.paused) handleRollDice();
				});
			}
		}
	});

	export async function showOpponentRoll(die1: number, die2: number): Promise<void> {
		playSound(flickSfx, settings.volume);
		rolling = true;
		await sleep(rollDelay);
		die1Pips = die1;
		die2Pips = die2;
		rolling = false;
		await sleep(rollDelay);
	}

	async function handleRollDice() {
		if (!canRoll) return;

		game.restrictDice = true;
		playSound(flickSfx, settings.volume);
		canRoll = false;
		let die1: number = nonZeroRandomNumber(pipCount);
		let die2: number = nonZeroRandomNumber(pipCount);
		let diceId = Math.min(die1 * 10 + die2, die2 * 10 + die1);

		rolling = true;
		await sleep(rollDelay);
		die1Pips = die1;
		die2Pips = die2;
		rolling = false;
		await sleep(rollDelay);
		canRoll = true;
		game.handleDiceRoll(game.action, diceId);
		onRollComplete?.();
	}

	/* Resolve token fallbacks at the style attribute level so parent-supplied
	   colors override tokens without needing !important in CSS. */
	const buttonStyle = $derived(
		[
			dieColor ? `--die-color: ${dieColor}` : '',
			pipColor ? `--pip-color: ${pipColor}` : ''
		]
			.filter(Boolean)
			.join('; ')
	);
</script>

<button
	class="dice-button"
	class:rolling={rolling}
	class:restricted={!canRoll}
	onclick={handleRollDice}
	style={buttonStyle}
>
	<div class="face" class:rolling>
		{#each Array(die1Pips) as _}
			<span class="pip"></span>
		{/each}
	</div>
	<div class="face" class:rolling>
		{#each Array(die2Pips) as _}
			<span class="pip"></span>
		{/each}
	</div>
</button>

<style>
	/* ── Button wrapper ───────────────────────────────────────── */
	.dice-button {
		display: flex;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-md);
		padding: var(--space-1);
		gap: var(--space-1-5);
		margin: 0;
		transition: box-shadow var(--dur-fast) var(--ease-snes);
	}

	.dice-button:hover {
		background-color: var(--color-surface-brand);
	}

	.dice-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	/* Active roll: neon glow on the whole button (dark mode only —
	   --dice-glow-active is `none` in light mode) */
	.dice-button.rolling {
		box-shadow: var(--dice-glow-active);
	}

	/* Locked out while game is processing the roll result */
	.dice-button.restricted {
		opacity: 0.75;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* ── Die face ─────────────────────────────────────────────── */
	.face {
		display: grid;
		grid-template-areas:
			'a . c'
			'e g f'
			'd . b';
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr;
		place-items: center;
		padding: 0.4rem;
		gap: 0.1rem;
		width: 3rem;
		height: 3rem;

		/* Token-driven background — falls back to --dice-bg if no
		   --die-color was set by the parent via the style attribute */
		background-color: var(--die-color, var(--dice-bg));

		/* SNES double-border: inner rim highlight + outer dark frame
		   + hard pixel drop (no blur) — replaces the old 3D bevel */
		border: 2px solid var(--die-color, var(--dice-border));
		box-shadow: var(--dice-shadow);

		border-radius: var(--radius-md);
		cursor: pointer;
		transition: transform var(--dur-slow) var(--ease-snes);
	}

	.face.rolling {
		transform: scale(0);
	}

	/* ── Pip ──────────────────────────────────────────────────── */
	.pip {
		display: block;
		align-self: center;
		justify-self: center;
		min-width: 0.5rem;
		min-height: 0.5rem;
		border-radius: 50%;

		/* Token-driven pip colour — falls back to --dice-dot */
		background-color: var(--pip-color, var(--dice-dot));

		/* Subtle inner glow on the dot in dark mode;
		   --dice-dot-glow is `none` in light mode */
		box-shadow: var(--dice-dot-glow);
	}

	/* Pip grid-area placement */
	.pip:nth-child(1) { grid-area: a; }
	.pip:nth-child(2) { grid-area: b; }
	.pip:nth-child(3) { grid-area: c; }
	.pip:nth-child(4) { grid-area: d; }
	.pip:nth-child(5) { grid-area: e; }
	.pip:nth-child(6) { grid-area: f; }
	/* 1, 3, 5 — center the last pip when the count is odd */
	.pip:nth-child(odd):last-child { grid-area: g; }

	/* ── Mobile ───────────────────────────────────────────────── */
	@media (max-width: 40rem) {
		.face {
			padding: 0.25rem;
			gap: 0.05rem;
			width: 2rem;
			height: 2rem;
			/* Lighter drop on small screens */
			box-shadow:
				3px 3px 0 var(--brand-950),
				inset 0 1px 0 rgba(112, 128, 240, 0.4),
				0 0 0 2px rgba(0, 7, 64, 0.9);
		}

		.pip {
			min-width: 0.4rem;
			min-height: 0.4rem;
		}
	}
</style>