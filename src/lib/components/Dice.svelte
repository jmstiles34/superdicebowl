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
		dieColor: string;
		pipColor: string;
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
			isAutoPlay(settings.mode, game.possession) &&
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
</script>

<button class="dice-button" onclick={handleRollDice}>
	<div class="face" class:rolling style={`background-color: ${dieColor};`}>
		{#each Array(die1Pips) as _}
			<span class="pip" style={`background-color: ${pipColor};`}></span>
		{/each}
	</div>
	<div class="face" class:rolling style={`background-color: ${dieColor};`}>
		{#each Array(die2Pips) as _}
			<span class="pip" style={`background-color: ${pipColor};`}></span>
		{/each}
	</div>
</button>

<style>
	.dice-button {
		display: flex;
		background: transparent;
		cursor: pointer;
		border-radius: 0.625rem;
		padding: 0.25rem;
		gap: 0.3rem;
		margin: 0;
	}
	.dice-button:hover {
		background-color: var(--color-blue-500);
	}
	.face {
		display: grid;
		grid-template-areas:
			'a . c'
			'e g f'
			'd . b';
		padding: 0.5rem;
		min-height: 3rem;
		min-width: 3rem;
		background-color: var(--color-white);
		box-shadow:
			inset 0 4px var(--color-white),
			inset 0 -4px #bbb,
			inset 4px 0 #d7d7d7,
			inset -4px 0 #d7d7d7;
		border-radius: 10%;
		cursor: pointer;
		transition: transform 0.3s ease-out;
	}
	.rolling {
		transform: scale(0);
	}

	.pip {
		display: block;
		align-self: center;
		justify-self: center;
		min-width: 0.6rem;
		min-height: 0.6rem;
		border-radius: 50%;
		background-color: var(--color-gray-900);
		box-shadow:
			inset 0 2px #111,
			inset 0 -2px #555;
	}

	.pip:nth-child(2) {
		grid-area: b;
	}
	.pip:nth-child(3) {
		grid-area: c;
	}
	.pip:nth-child(4) {
		grid-area: d;
	}
	.pip:nth-child(5) {
		grid-area: e;
	}
	.pip:nth-child(6) {
		grid-area: f;
	}
	/* This selects the last pip of odd-valued dice (1, 3, 5) and positions the pip in the center */
	.pip:nth-child(odd):last-child {
		grid-area: g;
	}
	@media (max-width: 40rem) {
		.face {
			padding: 0.25rem;
			min-height: 2rem;
			min-width: 2rem;
			box-shadow:
				inset 0 3px var(--color-white),
				inset 0 -3px #bbb,
				inset 3px 0 #d7d7d7,
				inset -3px 0 #d7d7d7;
		}

		.pip {
			min-width: 0.4rem;
			min-height: 0.4rem;
			box-shadow:
				inset 0 2px #111,
				inset 0 -2px #555;
		}
	}
</style>
