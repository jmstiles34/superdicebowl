<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import { auth } from '$lib/auth/authState.svelte';
	import { game } from '$lib/state/game.svelte';
	import { season } from '$lib/state/season.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import {
		completeGame,
		createGame,
		updateGameState
	} from '$lib/db/repositories/gameRepository';
	import { updateSeason } from '$lib/db/repositories/seasonRepository';
	import button from '$lib/assets/sfx/button.mp3';
	import { sleep } from '$lib/utils/common';
	import { fireworkShow, options } from '$lib/utils/fireworks';
	import {
		compareFns,
		getScoreByTeam,
		isAutoPlay,
		inFieldGoalRange,
		isGameComplete,
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
	import EventAnnouncement from '$lib/components/EventAnnouncement.svelte';
	import Field from '$lib/components/Field.svelte';
	import FourthDown from '$lib/components/modal/FourthDown.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PointOption from '$lib/components/modal/PointOption.svelte';
	import Scores from '$lib/components/Scores.svelte';
	import GameSummary from '$lib/components/modal/GameSummary.svelte';
	import exit from '$lib/images/exit.svg';
	import gear from '$lib/images/gear.svg';
	import summary from '$lib/images/summary.svg';
	import ConfirmExit from '$lib/components/modal/ConfirmExit.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	const modalActions = [
		GAME_ACTION.COIN_TOSS,
		GAME_ACTION.FOURTH_DOWN_OPTIONS,
		GAME_ACTION.POINT_OPTION
	];

	const { awayTeam, homeTeam, mode, userTeam, winScore } = settings;
	let showGameSummary = $state(false);
	let showSettings = $state(false);
	let fw = $state(fireworkShow);

	const isGameReady = awayTeam.id.length && homeTeam.id.length;
	const buttonSfx: Howl = createSound(button);
	let awayScore = $derived(getScoreByTeam(TEAM.AWAY, game.playLog));
	let homeScore = $derived(getScoreByTeam(TEAM.HOME, game.playLog));
	let gameOver = $derived(isGameComplete(awayScore, homeScore, winScore));

	let announcementText = $state('');
	let announcementType: 'touchdown' | 'turnover' | 'fieldgoal' | 'safety' = $state('touchdown');
	let announcementKey = $state(0);

	$effect(() => {
		const action = game.action;
		const lastPlay = game.lastPlay;

		if (action === GAME_ACTION.TOUCHDOWN) {
			announcementText = 'TOUCHDOWN!';
			announcementType = 'touchdown';
			announcementKey = Date.now();
		} else if (action === GAME_ACTION.FIELD_GOAL_MADE) {
			announcementText = 'FIELD GOAL!';
			announcementType = 'fieldgoal';
			announcementKey = Date.now();
		} else if (lastPlay.includes('TURNOVER') && lastPlay.includes('Int')) {
			announcementText = 'INTERCEPTION!';
			announcementType = 'turnover';
			announcementKey = Date.now();
		} else if (lastPlay.includes('TURNOVER') && lastPlay.includes('Fumble')) {
			announcementText = 'FUMBLE!';
			announcementType = 'turnover';
			announcementKey = Date.now();
		} else if (lastPlay.includes('TURNOVER') && lastPlay.includes('On downs')) {
			announcementText = 'TURNOVER ON DOWNS!';
			announcementType = 'turnover';
			announcementKey = Date.now();
		} else if (lastPlay.includes('Safety')) {
			announcementText = 'SAFETY!';
			announcementType = 'safety';
			announcementKey = Date.now();
		}
	});

	async function saveGame() {
		if (!auth.isLoggedIn || !auth.currentUser?.id) return;

		try {
			const snapshot = game.snapshotState();
			if (game.activeGameId) {
				await updateGameState(game.activeGameId, snapshot);
			} else {
				const record = await createGame(
					auth.currentUser.id,
					snapshot,
					settings.snapshotSettings()
				);
				game.activeGameId = record.id!;

				// Link game record to season matchup
				if (season.isSeasonGame && season.activeWeek !== null && season.activeMatchupIndex !== null) {
					season.setMatchupGameRecordId(season.activeWeek, season.activeMatchupIndex, record.id!);
					if (season.activeSeasonId) {
						await updateSeason(season.activeSeasonId, season.snapshotSeason());
					}
				}
			}
		} catch (e) {
			console.error('Failed to save game:', e);
		}
	}

	async function markGameComplete() {
		if (!auth.isLoggedIn || !game.activeGameId) return;
		await completeGame(game.activeGameId, game.snapshotState());
	}

	game.setSaveGame(saveGame);

	onMount(() => {
		const orientation = screen.orientation as ScreenOrientation & {
			lock?(type: string): Promise<void>;
			unlock?(): void;
		};
		try {
			orientation.lock?.('landscape')?.catch(() => {});
		} catch {}
		return () => {
			try {
				orientation.unlock?.();
			} catch {}
		};
	});

	onDestroy(() => {
		game.resetGame();
		if (season.isSeasonGame) {
			season.isSeasonGame = false;
			season.activeWeek = null;
			season.activeMatchupIndex = null;
		}
	});

	$effect(() => {
		if (gameOver && game.action !== GAME_ACTION.GAME_OVER) {
			sleep(1500).then(() => {
				const winner = awayScore > homeScore ? awayTeam.city : homeTeam.city;
				game.gameComplete(winner);
				markGameComplete();

				if (season.isSeasonGame && season.activeWeek !== null && season.activeMatchupIndex !== null) {
					season.recordGameResult(season.activeWeek, season.activeMatchupIndex, homeScore, awayScore);
					if (season.activeSeasonId) {
						updateSeason(season.activeSeasonId, season.snapshotSeason());
					}
				}

				sleep(100).then(() => {
					const fireworks = fw.fireworksInstance();
					fireworks.start();
				});
				sleep(3000).then(() => (showGameSummary = true));
			});
		}
	});

	$effect(() => {
		game.continueAfterAction();
	});

	$effect(() => {
		if (mode === GAME_MODE.SIMULATION && game.action === GAME_ACTION.COIN_TOSS) {
			game.restrictDice = true;
			game.lastPlay = 'Coin Toss...';
			sleep(500 * settings.speed).then(() => {
				const winner = Math.random() < 0.5 ? TEAM.HOME : TEAM.AWAY;
				game.saveCoinToss(winner);
				saveGame();
			});
		}
	});

	function toggleSettings() {
		playSound(buttonSfx, settings.volume);
		if (showSettings) {
			showSettings = false;
			game.resume();
		} else {
			showSettings = true;
			game.pause();
		}
	}

	function handleExitClick() {
		playSound(buttonSfx, settings.volume);
		if (gameOver) {
			const dest = season.isSeasonGame ? '/season/play' : '/';
			season.isSeasonGame = false;
			season.activeWeek = null;
			season.activeMatchupIndex = null;
			goto(dest);
		} else {
			game.handleExitClick();
		}
	}

	function cancelExit() {
		playSound(buttonSfx, settings.volume);
		game.cancelExit();
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
								title="Quit Game"
								aria-label="Quit Game"
							>
								<img src={exit} alt="Quit Game" />
							</button>
						</div>
						<div class="divider">|</div>
						<div>
							<button
								class="toolbarButton"
								onclick={toggleGameSummary}
								title={`${showGameSummary ? 'Close' : 'Open'} Game Summary`}
								aria-label="Game Summary"
							>
								<img src={summary} alt="Game Summary" />
							</button>
						</div>
						<div class="divider">|</div>
						<div>
							<button
								class="toolbarButton"
								onclick={toggleSettings}
								title="Settings"
								aria-label="Settings"
							>
								<img src={gear} alt="Settings" />
							</button>
						</div>
					</div>
					<div class="last-play">{game.lastPlay}</div>
				</div>
				<div class="dice-container">
					<div class="action">{game.action}</div>
					<Dice
						dieColor={primaryColor(settings, game.possession) || '#FFF'}
						pipColor={secondaryColor(settings, game.possession) || '#000'}
						onRollComplete={saveGame}
					/>
					{#if game.restrictDice || isAutoPlay(mode, game.possession, userTeam)}
						<div class="dice-block"></div>
					{/if}
				</div>
				<div class="scores">
					<Scores {awayTeam} {homeTeam} />
				</div>
			</div>

			<div class="field-container">
				<Field
					{awayTeam}
					ballIndex={game.ballIndex}
					downToGo={`${DOWN[game.currentDown]} & ${game.yardsToGo}`}
					firstDownIndex={game.firstDownIndex}
					{homeTeam}
					inFieldGoalRange={inFieldGoalRange(game.action, game.possession, game.ballIndex)}
					missedKick={game.missedKick}
					missedTwoPoint={game.missedTwoPoint}
					onsideKick={game.onsideKick}
					possession={game.possession}
					showDownDistance={showDownDistance(game.action) && !game.restrictDice}
					toggleFieldGoal={game.toggleFieldGoal}
				/>
				<EventAnnouncement text={announcementText} type={announcementType} key={announcementKey} />
			</div>

		{#if modalActions.includes(game.action) && (game.action === GAME_ACTION.COIN_TOSS || !isAutoPlay(mode, game.possession, userTeam))}
			<Modal showModal={true} close={NOOP} hasClose={false} choiceRequired={true}>
				{#if game.action === GAME_ACTION.COIN_TOSS}
					<CoinToss saveCoinToss={(a) => { game.saveCoinToss(a); saveGame(); }} />
				{:else if game.action === GAME_ACTION.POINT_OPTION}
					<PointOption savePointOption={(a) => { game.preparePointOption(a); saveGame(); }} />
				{:else if game.action === GAME_ACTION.FOURTH_DOWN_OPTIONS}
					<FourthDown
						inFieldGoalRange={compareFns[game.possession](
							game.ballIndex,
							BALL_FIELD_GOAL[game.possession]
						)}
						saveFourthDown={(a) => { game.saveFourthDown(a); saveGame(); }}
						toggleFieldGoal={() => { game.toggleFieldGoal(); saveGame(); }}
					/>
				{/if}
			</Modal>
		{/if}
			{#if game.action === GAME_ACTION.GAME_OVER}
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
				playLog={game.playLog}
			/>
		</Modal>

		<Modal
			showModal={game.action === GAME_ACTION.EXIT}
			close={cancelExit}
			hasClose={false}
			choiceRequired={true}
		>
			<ConfirmExit cancel={cancelExit} />
		</Modal>

		<Modal
			showModal={showSettings}
			close={toggleSettings}
			hasClose={true}
			choiceRequired={false}
		>
			<Settings />
		</Modal>

	</main>

	<div class="portrait-overlay">
		<div class="portrait-message">
			<span class="rotate-icon">📱</span>
			<p>Rotate your device to landscape for the best experience</p>
		</div>
	</div>
{/if}

<style>
	main {
		position: relative;
		padding: 1rem;
	}
	.portrait-overlay {
		display: none;
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
		align-items: start;
		column-gap: 0.25rem;
		top: 2.5rem;
	}
	.toolbar {
		display: flex;
		align-items: center;
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
		min-height: 20px;
		min-width: 20px;
		transition: filter var(--dur-fast) var(--ease-snes);
	}
	.toolbarButton:hover img {
		filter: brightness(1.5);
	}
	.flip {
		transform: scale(-1, 1);
	}
	.divider {
		color: var(--brand-300);
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
		filter: drop-shadow(3px 6px 8px oklch(0 0 0 / 0.5));
	}
	.action {
		color: var(--color-text-gold);
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
		border-radius: var(--radius-md);
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
		color: var(--color-text-gold);
		margin-top: 18px;
		width: 100%;
	}

	.field-container {
		position: relative;
		clip-path: inset(0 -1rem);
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

	/* ── Mobile portrait: force-landscape overlay ──────────── */
	@media (max-width: 600px) and (orientation: portrait) {
		.portrait-overlay {
			display: flex;
			position: fixed;
			inset: 0;
			z-index: 9999;
			background-color: var(--color-bg-base, #111);
			align-items: center;
			justify-content: center;
		}
		.portrait-message {
			text-align: center;
			color: var(--color-text-primary, #fff);
			font-family: var(--font-body, sans-serif);
			padding: 2rem;
		}
		.rotate-icon {
			font-size: 3rem;
			display: inline-block;
			animation: rock 1.5s ease-in-out infinite;
		}
		.portrait-message p {
			margin-top: 1rem;
			font-size: 1.25rem;
			line-height: 1.4;
		}
		@keyframes rock {
			0%, 100% { transform: rotate(0deg); }
			25% { transform: rotate(90deg); }
			75% { transform: rotate(90deg); }
		}
	}

	/* ── Mobile landscape: fit everything in viewport ─────── */
	@media (max-height: 500px) and (orientation: landscape) {
		main {
			padding: 0.25rem 0.5rem;
			height: 100vh;
			height: 100dvh;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}
		.game {
			width: 100%;
			max-width: 100%;
			margin: 0 auto;
			display: flex;
			flex-direction: column;
			flex: 1;
			min-height: 0;
		}
		.scoreboard {
			top: 0;
			flex-shrink: 0;
		}
		.field-container {
			flex: 1;
			min-height: 0;
			margin-top: -2.75rem;
		}
	}
</style>
