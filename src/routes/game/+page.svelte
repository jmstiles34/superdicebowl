<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Fireworks } from '@fireworks-js/svelte';
	import type { FireworksOptions } from '@fireworks-js/svelte';
	import { game } from '$lib/stores/Game';
	import { settings } from '$lib/stores/Settings';
	import { Sound } from 'svelte-sound';
	import button from '$lib/assets/sfx/button.mp3';
	import chime from '$lib/assets/sfx/chime.mp3';
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
	import { BALL_FIELD_GOAL, DOWN, GAME_ACTION, GAME_MODE, TEAM } from '$lib/constants/constants';
	import Dice from '$lib/components/Dice.svelte';
	import CoinToss from '$lib/components/modal/CoinToss.svelte';
	import Field from '$lib/components/Field.svelte';
	import FourthDown from '$lib/components/modal/FourthDown.svelte';
	import GameModal from '$lib/components/GameModal.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PointOption from '$lib/components/modal/PointOption.svelte';
	import Scores from '$lib/components/Scores.svelte';
	import GameSummary from '$lib/components/modal/GameSummary.svelte';
	import exit from '$lib/images/exit.svg';
	import summary from '$lib/images/summary.svg';
	import ConfirmExit from '$lib/components/modal/ConfirmExit.svelte';

	const { awayTeam, homeTeam, mode, winScore } = $settings;
	$: ({
		action,
		ballIndex,
		currentDown,
		firstDownIndex,
		lastPlay,
		missedKick,
		onsideKick,
		playLog,
		possession,
		restrictDice,
		yardsToGo
	} = $game);

	let cancelExitAction = '';
	let showGameSummary = false;
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
	$: buttonSfx = new Sound(button, { volume: $settings.volume });
	$: chimeSfx = new Sound(chime, { volume: $settings.volume });

	onDestroy(() => {
		game.reset();
	});

	$: awayScore = getScoreByTeam(TEAM.AWAY, playLog);
	$: homeScore = getScoreByTeam(TEAM.HOME, playLog);
	$: gameOver = isGameComplete(awayScore, homeScore, winScore);

	$: if (gameOver) {
		const winner = gt(awayScore, homeScore) ? awayTeam.city : homeTeam.city;
		game.gameComplete(winner);
	}

	$: game.handleNextAction(action, ballIndex, gameOver);
	$: if (action === GAME_ACTION.GAME_OVER) {
		sleep(100).then(() => {
			const fireworks = fw.fireworksInstance();
			fireworks.start();
		});
		sleep(3000).then(() => (showGameSummary = true));
	}

	$: if (isModalChoice(mode, possession, action)) {
		if (action === GAME_ACTION.POINT_OPTION) {
			sleep(1000).then(() => {
				buttonSfx.play();
				game.preparePointOption(makePointChoice(awayScore, homeScore, winScore));
			});
		} else {
			sleep(1000).then(() => {
				const choiceAction = makeFourthDownChoice(awayScore, homeScore, ballIndex);
				buttonSfx.play();
				if (choiceAction === GAME_ACTION.FIELD_GOAL) {
					game.toggleFieldGoal();
				} else {
					game.saveFourthDown(choiceAction);
				}
			});
		}
	}

	function cancelExit() {
		buttonSfx.play();
		game.setAction(cancelExitAction);
	}

	function handleExitClick() {
		buttonSfx.play();
		cancelExitAction = action;
		game.setAction(GAME_ACTION.EXIT);
	}

	function toggleGameSummary() {
		buttonSfx.play();
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
								on:click={handleExitClick}
								on:keypress={handleExitClick}
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
								on:click={toggleGameSummary}
								on:keypress={toggleGameSummary}
								tabindex="0"
								title={`${showGameSummary ? 'Close' : 'Open'}  Game Summary`}
							>
								<img src={summary} alt="Game Summary" />
							</button>
						</div>
					</div>
					<div class="last-play">{lastPlay}</div>
				</div>
				<div class="dice-container">
					<div class="action">{action}</div>
					<Dice
						dieColor={primaryColor($settings, possession)}
						pipColor={secondaryColor($settings, possession)}
					/>
					{#if restrictDice || (mode === GAME_MODE.SOLO && possession === TEAM.AWAY)}
						<div class="dice-block" />
					{/if}
				</div>
				<div class="scores">
					<Scores {awayTeam} {homeTeam} />
				</div>
			</div>

			<Field
				{awayTeam}
				{ballIndex}
				downToGo={`${DOWN[currentDown]} & ${yardsToGo}`}
				{firstDownIndex}
				{homeTeam}
				inFieldGoalRange={inFieldGoalRange(action, possession, ballIndex)}
				{missedKick}
				{onsideKick}
				{possession}
				showDownDistance={showDownDistance(action) && !restrictDice}
				toggleFieldGoal={game.toggleFieldGoal}
			/>
			{#if action === GAME_ACTION.GAME_OVER}
				<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
			{/if}
		</div>

		<Modal showModal={showGameSummary} close={toggleGameSummary} hasClose={true}>
			<GameSummary
				{awayTeam}
				{homeTeam}
				{playLog}
				gameIsOver={equals(action, GAME_ACTION.GAME_OVER)}
			/>
		</Modal>

		<Modal showModal={equals(action, GAME_ACTION.EXIT)} close={cancelExit} hasClose={true}>
			<ConfirmExit />
		</Modal>

		<GameModal {action} on:click={game.clearModal}>
			<div class="model-content">
				{#if equals(action, GAME_ACTION.COIN_TOSS)}
					<CoinToss saveCoinToss={game.saveCoinToss} />
				{/if}
				{#if equals(action, GAME_ACTION.POINT_OPTION) && !equals(action, GAME_ACTION.GAME_OVER)}
					<PointOption savePointOption={game.preparePointOption} />
				{/if}
				{#if equals(action, GAME_ACTION.FOURTH_DOWN_OPTIONS)}
					<FourthDown
						inFieldGoalRange={compareFns[possession](ballIndex, BALL_FIELD_GOAL[possession])}
						saveFourthDown={game.saveFourthDown}
						toggleFieldGoal={game.toggleFieldGoal}
					/>
				{/if}
			</div>
		</GameModal>
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
		color: var(--steelblue);
		font-weight: bold;
		font-size: 1.25rem;
	}
	.dice-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: var(--smoke);
		border: 1px solid var(--white);
		border-radius: 1rem;
		padding: 0.25rem 0.5rem;
		z-index: 100;
	}
	.action {
		color: var(--white);
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
		background-color: var(--black);
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
