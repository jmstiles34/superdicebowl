<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Fireworks } from '@fireworks-js/svelte';
	import type { FireworksOptions } from '@fireworks-js/svelte';
	import { game } from '$lib/stores/Game';
	import { settings } from '$lib/state/settings.svelte';
	import button from '$lib/assets/sfx/button.mp3';
	import { equals, gt, sleep } from '$lib/utils/common';
	import {
		compareFns,
		getScoreByTeam,
		inFieldGoalRange,
		isGameComplete,
		isModalChoice,
		makeFourthDownChoice,
		makePointChoice,
		primaryColor,
		secondaryColor,
		showDownDistance
	} from '$lib/utils/game';
	import {
		BALL_FIELD_GOAL,
		DOWN,
		GAME_ACTION,
		GAME_MODE,
		NOOP,
		TEAM
	} from '$lib/constants/constants';
	import Dice from '$lib/components/Dice.svelte';
	import CoinToss from '$lib/components/modal/CoinToss.svelte';
	import Field from '$lib/components/Field.svelte';
	import FourthDown from '$lib/components/modal/FourthDown.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PointOption from '$lib/components/modal/PointOption.svelte';
	import Scores from '$lib/components/Scores.svelte';
	import GameSummary from '$lib/components/modal/GameSummary.svelte';
	import exit from '$lib/images/exit.svg';
	import summary from '$lib/images/summary.svg';
	import ConfirmExit from '$lib/components/modal/ConfirmExit.svelte';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	const modalActions = [
		GAME_ACTION.COIN_TOSS,
		GAME_ACTION.FOURTH_DOWN_OPTIONS,
		GAME_ACTION.POINT_OPTION
	];

	const { awayTeam, homeTeam, mode, winScore } = settings;
	let cancelExitAction = '';
	let showGameSummary = $state(false);
	let fw: Fireworks;
	let options: FireworksOptions = {
		explosion: 3,
		opacity: 0.5,
		intensity: 15,
		sound: {
			enabled: true,
			files: [
				'/sfx/firework1.mp3',
				'/sfx/firework2.mp3',
				'/sfx/firework3.mp3',
				'/sfx/firework4.mp3',
				'/sfx/firework5.mp3'
			],
			volume: {
				min: 2,
				max: 4
			}
		}
	};
	const isGameReady = awayTeam.id.length && homeTeam.id.length;
	const buttonSfx: Howl = createSound(button);
	let awayScore = $derived(getScoreByTeam(TEAM.AWAY, $game.playLog));
	let homeScore = $derived(getScoreByTeam(TEAM.HOME, $game.playLog));
	let gameOver = $derived(isGameComplete(awayScore, homeScore, winScore));

	onDestroy(() => {
		game.reset();
	});

	$effect(() => {
		if (gameOver) {
			const winner = gt(awayScore, homeScore) ? awayTeam.city : homeTeam.city;
			game.gameComplete(winner);
		}
	});

	$effect(() => {
		game.handleNextAction($game.action, $game.ballIndex, gameOver);
	});

	$effect(() => {
		if ($game.action === GAME_ACTION.GAME_OVER) {
			sleep(100).then(() => {
				const fireworks = fw.fireworksInstance();
				fireworks.start();
			});
			sleep(3000).then(() => (showGameSummary = true));
		}
	});

	$effect(() => {
		if (isModalChoice(mode, $game.possession, $game.action)) {
			if ($game.action === GAME_ACTION.POINT_OPTION) {
				sleep(1000).then(() => {
					playSound(buttonSfx, settings.volume);
					game.preparePointOption(makePointChoice(awayScore, homeScore, winScore));
				});
			} else {
				sleep(1000).then(() => {
					const choiceAction = makeFourthDownChoice(awayScore, homeScore, $game.ballIndex);
					playSound(buttonSfx, settings.volume);
					if (choiceAction === GAME_ACTION.FIELD_GOAL) {
						game.toggleFieldGoal();
					} else {
						game.saveFourthDown(choiceAction);
					}
				});
			}
		}
	});

	function cancelExit() {
		playSound(buttonSfx, settings.volume);
		game.setAction(cancelExitAction);
	}

	function handleExitClick() {
		playSound(buttonSfx, settings.volume);
		cancelExitAction = $game.action;
		game.setAction(GAME_ACTION.EXIT);
	}

	function toggleGameSummary() {
		playSound(buttonSfx, settings.volume);
		showGameSummary = !showGameSummary;
	}
</script>

{#if isGameReady}
	<main>
		<div class="game">
			<div class="scoreboard">
				<div class="menu-with-play">
					<div class="toolbar">
						<div>
							<button
								class="toolbarButton flip"
								onclick={handleExitClick}
								onkeypress={handleExitClick}
								tabindex="0"
								title="Quit Game"
							>
								<img src={exit} alt="Quit Game" />
							</button>
						</div>
						<div class="divider">|</div>
						<div>
							<button
								class="toolbarButton"
								onclick={toggleGameSummary}
								onkeypress={toggleGameSummary}
								tabindex="0"
								title={`${showGameSummary ? 'Close' : 'Open'}  Game Summary`}
							>
								<img src={summary} alt="Game Summary" />
							</button>
						</div>
					</div>
					<div class="last-play">{$game.lastPlay}</div>
				</div>
				<div class="dice-container">
					<div class="action">{$game.action}</div>
					<Dice
						dieColor={primaryColor(settings, $game.possession) || '#FFF'}
						pipColor={secondaryColor(settings, $game.possession) || '000'}
					/>
					{#if $game.restrictDice || (mode === GAME_MODE.SOLO && $game.possession === TEAM.AWAY)}
						<div class="dice-block"></div>
					{/if}
				</div>
				<div class="scores">
					<Scores {awayTeam} {homeTeam} />
				</div>
			</div>

			<Field
				{awayTeam}
				ballIndex={$game.ballIndex}
				downToGo={`${DOWN[$game.currentDown]} & ${$game.yardsToGo}`}
				firstDownIndex={$game.firstDownIndex}
				{homeTeam}
				inFieldGoalRange={inFieldGoalRange($game.action, $game.possession, $game.ballIndex)}
				missedKick={$game.missedKick}
				onsideKick={$game.onsideKick}
				possession={$game.possession}
				showDownDistance={showDownDistance($game.action) && !$game.restrictDice}
				toggleFieldGoal={game.toggleFieldGoal}
			/>
			{#if $game.action === GAME_ACTION.GAME_OVER}
				<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
			{/if}
		</div>

		<Modal
			showModal={showGameSummary}
			close={toggleGameSummary}
			hasClose={true}
			choiceRequired={false}
		>
			<GameSummary
				{awayTeam}
				{homeTeam}
				playLog={$game.playLog}
				gameIsOver={equals($game.action, GAME_ACTION.GAME_OVER)}
			/>
		</Modal>

		<Modal
			showModal={equals($game.action, GAME_ACTION.EXIT)}
			close={cancelExit}
			hasClose={true}
			choiceRequired={false}
		>
			<ConfirmExit />
		</Modal>

		<Modal showModal={modalActions.includes($game.action)} close={NOOP} on:click={game.clearModal}>
			<div class="model-content">
				{#if equals($game.action, GAME_ACTION.COIN_TOSS)}
					<CoinToss saveCoinToss={game.saveCoinToss} />
				{/if}
				{#if equals($game.action, GAME_ACTION.POINT_OPTION) && !equals($game.action, GAME_ACTION.GAME_OVER)}
					<PointOption savePointOption={game.preparePointOption} />
				{/if}
				{#if equals($game.action, GAME_ACTION.FOURTH_DOWN_OPTIONS)}
					<FourthDown
						inFieldGoalRange={compareFns[$game.possession](
							$game.ballIndex,
							BALL_FIELD_GOAL[$game.possession]
						)}
						saveFourthDown={game.saveFourthDown}
						toggleFieldGoal={game.toggleFieldGoal}
					/>
				{/if}
			</div>
		</Modal>
	</main>
{/if}

<style>
	main {
		position: relative;
		padding: 1rem;
	}
	button {
		background: none;
		border: none;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		cursor: pointer;
	}
	.game {
		max-width: 90%;
		margin: -3.25rem auto 0 auto;
	}
	.scoreboard {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		column-gap: 0.25rem;
		top: 2.5rem;
	}
	.toolbar {
		display: flex;
		gap: 8px;
		margin-top: 14px;
		z-index: 100;
	}
	.toolbarButton {
		cursor: pointer;
		padding: 0;
	}
	.toolbarButton img {
		height: 1.5em;
		width: 1.5em;
	}
	.flip {
		transform: scale(-1, 1);
	}
	.divider {
		color: var(--color-blue-500);
		font-weight: bold;
		font-size: 1.25rem;
	}
	.dice-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: var(--color-gray-900);
		border: 1px solid var(--color-white);
		border-radius: 1rem;
		padding: 0.25rem 0.5rem;
		z-index: 100;
		filter: drop-shadow(3px 6px 8px hsl(0deg 0% 0% / 0.5));
	}
	.action {
		color: var(--color-white);
		font-family: inherit;
		font-size: 0.9rem;
		white-space: nowrap;
		margin: 0 auto;
	}
	.dice-block {
		position: absolute;
		top: 0;
		height: 100%;
		width: 100%;
		background-color: var(--color-offblack);
		opacity: 0.2;
	}
	.scores {
		display: flex;
		flex-direction: column;
		margin-top: 10px;
	}
	.menu-with-play {
		display: flex;
	}
	.last-play {
		text-align: center;
		font-size: clamp(0.5rem, 0.3182rem + 0.7273vw, 0.9rem);
		font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial,
			sans-serif;
		color: gold;
		margin-top: 18px;
		width: 100%;
	}

	:global(.fireworks) {
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		position: fixed;
		background: transparent;
	}
	@media (max-width: 40rem) {
		.scoreboard {
			top: 2.25rem;
		}
		.scores {
			margin-top: 0;
		}
		.dice-container {
			padding: 0.2rem 0.25rem;
		}
		.action {
			font-size: 0.7rem;
		}
		.toolbar {
			gap: 8px;
			margin-top: 6px;
		}
		.toolbarButton img {
			height: 16px;
			width: 16px;
		}
		.divider {
			font-size: 0.85rem;
		}
		.last-play {
			margin-top: 8px;
		}
	}
</style>
