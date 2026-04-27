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

	const centerIce = rinkCoords(50, 50);
	const belowCenter = rinkCoords(50, 62);
	const aboveCenter = rinkCoords(50, 38);

	// Away is penalized when home has the power play (home is in possession + PP active)
	const awayInBox = $derived(game.powerPlay && game.possession === 'Home');
	// Home is penalized when away has the power play
	const homeInBox = $derived(game.powerPlay && game.possession === 'Away');

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
			<Scoreboard>
				{#snippet toolbar()}
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
				{/snippet}
			</Scoreboard>

			<div class="rink-area">
				<Rink
					awayTeam={`${awayTeam.city} ${awayTeam.name}`}
					homeTeam={`${homeTeam.city} ${homeTeam.name}`}
					awayColor={awayTeam.colors.primary}
					homeColor={homeTeam.colors.primary}
					homeLogo={`/logos/${homeTeam.logo}.webp`}
				>
					{#snippet awayBox()}
						{#if awayInBox}
							<svg viewBox="0 0 20 28" class="penalty-player" aria-label="Player in penalty box">
								<circle cx="10" cy="5" r="4" fill="currentColor" />
								<path d="M3 12 h14 l-2 16 h-10 z" fill="currentColor" />
							</svg>
						{/if}
					{/snippet}
					{#snippet homeBox()}
						{#if homeInBox}
							<svg viewBox="0 0 20 28" class="penalty-player" aria-label="Player in penalty box">
								<circle cx="10" cy="5" r="4" fill="currentColor" />
								<path d="M3 12 h14 l-2 16 h-10 z" fill="currentColor" />
							</svg>
						{/if}
					{/snippet}

					{#if game.powerPlay}
						<p class="rink-overlay-text power-play-label" style:left={aboveCenter.left} style:top={aboveCenter.top}>
							Power Play
						</p>
					{/if}
					<p class="rink-overlay-text last-play" style:left={centerIce.left} style:top={centerIce.top}>
						{game.lastPlay}
					</p>
					<p class="rink-overlay-text action-label" style:left={belowCenter.left} style:top={belowCenter.top}>
						{game.action}
					</p>
				</Rink>

				{#if game.action === GAME_ACTION.GAME_OVER}
					<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
				{/if}
			</div>

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
	}

	.game {
		display: flex;
		flex-direction: column;
		flex: 1;
		align-items: center;
	}

	.rink-area {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		position: relative;
		padding: var(--space-2) var(--space-4);
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
		color: var(--rink-boards, #1e293b);
		text-shadow:
			0 0 4px var(--rink-ice, #e8f0f5),
			0 0 8px var(--rink-ice, #e8f0f5);
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

	.penalty-player {
		height: 100%;
		width: auto;
		color: var(--rink-boards, #1e293b);
		opacity: 0.8;
	}

	.dice-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-4);
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
