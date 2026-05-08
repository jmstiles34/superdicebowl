<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import { game } from '$lib/hockey/state/game.svelte';
	import { GAME_ACTION } from '$lib/hockey/constants';
	import type { HockeyGameSettingsSnapshot } from '$lib/db/database';
	import { settings } from '$lib/state/settings.svelte';
	import { sleep } from '$lib/utils/common';
	import { primaryColor } from '$lib/football/utils/game';
	import { fireworkShow, options } from '$lib/utils/fireworks';
	import { auth } from '$lib/auth/authState.svelte';
	import { createGame, updateGameState, completeGame } from '$lib/db/repositories/gameRepository';
	import { GAME_MODE, TEAM } from '$lib/shared/constants';

	import Dice from '$lib/components/Dice.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmExit from '$lib/components/modal/ConfirmExit.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';
	import Scoreboard from '$lib/hockey/components/Scoreboard.svelte';
	import Rink, { rinkCoords } from '$lib/hockey/components/Rink.svelte';
	import CoinToss from '$lib/hockey/components/CoinToss.svelte';
	import SaveAttemptModal from '$lib/hockey/components/SaveAttemptModal.svelte';

	const lastPlayPos = rinkCoords(50, 12);
	const centerIce = rinkCoords(50, 50);
	const aboveCenter = rinkCoords(50, 38);

	import exit from '$lib/images/exit.svg';
	import gear from '$lib/images/gear.svg';
	import buttonSfx from '$lib/assets/sfx/button.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	const btnSfx: Howl = createSound(buttonSfx);

	const { awayTeam, homeTeam, mode } = settings;
	const isGameReady = awayTeam.id.length && homeTeam.id.length;
	let showSettings = $state(false);
	let fw = $state(fireworkShow);

	// Offense auto-roll: simulation, or solo when opponent has puck
	const isOffenseAutoPlay = $derived(
		mode === GAME_MODE.SIMULATION ||
			(mode === GAME_MODE.SOLO && game.possession !== settings.userTeam)
	);

	// Save auto-roll: the DEFENDER rolls during save attempt.
	// Defender is the team NOT in possession (offense shot, defense saves).
	const isSaveAutoPlay = $derived(
		mode === GAME_MODE.SIMULATION ||
			(mode === GAME_MODE.SOLO && game.possession === settings.userTeam)
	);

	onDestroy(() => {
		game.resetGame();
	});

	// ── Auto coin toss for simulation mode ──────────────────
	$effect(() => {
		if (mode === GAME_MODE.SIMULATION && game.action === GAME_ACTION.COIN_TOSS) {
			game.restrictDice = true;
			sleep(500 * settings.speed).then(() => {
				const winner = Math.random() < 0.5 ? TEAM.HOME : TEAM.AWAY;
				game.saveCoinToss(winner);
				saveGame();
			});
		}
	});

	// ── Game over detection ─────────────────────────────────
	$effect(() => {
		if (game.action === GAME_ACTION.GAME_OVER) {
			markGameComplete();
			sleep(100).then(() => {
				const fireworks = fw.fireworksInstance();
				fireworks.start();
			});
		}
	});

	// ── Dice roll handler ───────────────────────────────────

	function handleDiceRoll(diceId: number) {
		game.restrictDice = true;
		game.handleDiceRoll(game.action, diceId);
		game.continueAfterAction();
	}

	// ── Save game ───────────────────────────────────────────

	async function saveGame() {
		if (!auth.isLoggedIn || !auth.currentUser?.id) return;
		try {
			const snapshot = game.snapshotState();
			if (game.activeGameId) {
				await updateGameState(game.activeGameId, snapshot);
			} else {
				const gameSettings: HockeyGameSettingsSnapshot = {
					sport: 'hockey',
					awayTeam: settings.awayTeam,
					homeTeam: settings.homeTeam,
					mode: settings.mode,
					winScore: settings.winScore
				};
				const record = await createGame(auth.currentUser.id, snapshot, gameSettings, 'hockey');
				game.activeGameId = record.id as number;
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

	// ── Exit / toolbar ──────────────────────────────────────

	function toggleSettings() {
		playSound(btnSfx, settings.volume);
		if (showSettings) {
			showSettings = false;
			game.resume();
		} else {
			showSettings = true;
			game.pause();
		}
	}

	function handleExitClick() {
		playSound(btnSfx, settings.volume);
		if (game.action === GAME_ACTION.GAME_OVER) {
			goto('/hockey');
		} else {
			game.handleExitClick();
		}
	}

	function cancelExit() {
		playSound(btnSfx, settings.volume);
		game.cancelExit();
	}
</script>

{#if isGameReady}
	<main>
		<div class="game">
			<div class="scoreboard-wrapper">
				<Scoreboard>
					{#snippet center()}
						<div class="dice-container">
							<Dice
								dieColor={primaryColor(settings, game.possession.toLowerCase()) ?? '#FFF'}
								pipColor={(() => {
									const team = game.possession.toLowerCase();
									const teamTyped = `${team}Team` as 'homeTeam' | 'awayTeam';
									return settings[teamTyped].colors.secondary ?? '#000';
								})()}
								restricted={game.restrictDice || game.action === GAME_ACTION.SAVE_ATTEMPT || game.action === GAME_ACTION.COIN_TOSS || game.action === GAME_ACTION.GAME_OVER}
								autoRoll={isOffenseAutoPlay && game.action === GAME_ACTION.OFFENSE}
								paused={game.paused}
								onDiceRoll={handleDiceRoll}
								onRollComplete={saveGame}
							/>
							<div class="controls-row">
								<span class="pp-indicator" class:active={game.powerPlay && game.possession === 'Away'}>PP</span>
								<button
									class="toolbar-button flip"
									onclick={handleExitClick}
									title="Quit Game"
									aria-label="Quit Game"
								>
									<img src={exit} alt="Quit Game" />
								</button>
								<button
									class="toolbar-button"
									onclick={toggleSettings}
									title="Settings"
									aria-label="Settings"
								>
									<img src={gear} alt="Settings" />
								</button>
								<span class="pp-indicator" class:active={game.powerPlay && game.possession === 'Home'}>PP</span>
							</div>
						</div>
					{/snippet}
				</Scoreboard>
			</div>

			<div class="rink-area">
				<Rink
					homeLogo={`/logos/${homeTeam.logo}.webp`}
				>
					{#if game.powerPlay}
						<p class="rink-overlay-text power-play-label" style:left={aboveCenter.left} style:top={aboveCenter.top}>
							Power Play
						</p>
					{/if}
					<p class="rink-overlay-text last-play" style:left={lastPlayPos.left} style:top={lastPlayPos.top}>
						{game.lastPlay}
					</p>
				</Rink>

				{#if game.action === GAME_ACTION.GAME_OVER}
					<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
				{/if}
			</div>
		</div>

		<!-- Coin Toss / Face Off modal -->
		<Modal
			showModal={game.action === GAME_ACTION.COIN_TOSS && mode !== GAME_MODE.SIMULATION}
			close={() => {}}
			hasClose={false}
			choiceRequired={true}
		>
			<CoinToss
				saveCoinToss={(winner) => {
					game.saveCoinToss(winner);
					saveGame();
				}}
			/>
		</Modal>

		<!-- Save Attempt modal -->
		<Modal
			showModal={game.action === GAME_ACTION.SAVE_ATTEMPT}
			close={() => {}}
			hasClose={false}
			choiceRequired={true}
		>
			<SaveAttemptModal autoRoll={isSaveAutoPlay} />
		</Modal>

		<!-- Exit confirmation modal -->
		<Modal
			showModal={game.action === GAME_ACTION.EXIT}
			close={cancelExit}
			hasClose={false}
			choiceRequired={true}
		>
			<ConfirmExit cancel={cancelExit} />
		</Modal>

		<!-- Settings modal -->
		<Modal showModal={showSettings} close={toggleSettings} hasClose={true} choiceRequired={false}>
			<Settings />
		</Modal>
	</main>
{/if}

<style>
	main {
		position: relative;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.game {
		width: 90%;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	.scoreboard-wrapper {
		position: relative;
		z-index: 100;
		width: 100%;
		padding-top: 0.25rem;
	}

	.rink-area {
		position: relative;
		width: 100%;
		margin-top: -2.25rem;
	}

	.rink-overlay-text {
		position: absolute;
		transform: translate(-50%, -50%);
		text-align: center;
		margin: 0;
		pointer-events: none;
		max-width: 60%;
	}

	.last-play {
		font-family: var(--font-body);
		font-size: clamp(0.75rem, 2vw, 1.25rem);
		font-weight: var(--weight-bold);
		color: #fff;
		text-align: center;
		margin: 0;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		background-color: rgba(0, 0, 0, 0.55);
		text-shadow:
			0 1px 4px rgba(0, 0, 0, 0.9),
			0 0 12px rgba(0, 0, 0, 0.6);
	}

	.action-label {
		font-family: var(--font-body);
		font-size: clamp(0.6rem, 1.2vw, 0.85rem);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--rink-blue, #1e40af);
		opacity: 0.7;
	}

	.power-play-label {
		font-family: var(--font-display);
		font-size: clamp(0.65rem, 1.4vw, 0.95rem);
		font-weight: var(--weight-bold);
		font-style: italic;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--rink-red, #dc2626);
		text-shadow: 0 0 6px var(--rink-ice, #e8f0f5);
	}


	.dice-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 7.5rem;
		background-color: var(--color-bg-surface);
		border: 1px solid var(--color-on-accent);
		border-radius: 1rem;
		padding: 0.25rem 0.5rem;
		z-index: 100;
		filter: drop-shadow(3px 6px 8px oklch(0 0 0 / 0.5));
	}

	.controls-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.pp-indicator {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-black);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: transparent;
		min-width: 1.5rem;
		text-align: center;
	}

	.pp-indicator.active {
		color: oklch(0.88 0.18 85);
		text-shadow:
			0 0 6px oklch(0.88 0.18 85 / 0.8),
			0 0 12px oklch(0.88 0.18 85 / 0.5);
		animation: pp-pulse 1s ease-in-out infinite;
	}

	@keyframes pp-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.toolbar-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-1);
	}

	.toolbar-button img {
		height: 1.25rem;
		width: 1.25rem;
		transition: filter var(--dur-fast) var(--ease-snes);
	}

	.toolbar-button:hover img {
		filter: brightness(0.7);
	}

	.flip {
		transform: scaleX(-1);
	}

	:global(.fireworks) {
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		position: absolute;
		background: transparent;
		z-index: 9999;
	}
</style>
