<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import { game } from '$lib/basketball/state/game.svelte';
	import { GAME_ACTION } from '$lib/basketball/constants';
	import type { BasketballGameSettingsSnapshot } from '$lib/db/database';
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
	import Scoreboard from '$lib/basketball/components/Scoreboard.svelte';
	import CoinToss from '$lib/basketball/components/CoinToss.svelte';
	import FreeThrowModal from '$lib/basketball/components/FreeThrowModal.svelte';

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

	const isAutoPlay = $derived(
		mode === GAME_MODE.SIMULATION ||
			(mode === GAME_MODE.SOLO && game.possession !== settings.userTeam)
	);

	const isFreeThrowAutoPlay = $derived(
		mode === GAME_MODE.SIMULATION ||
			(mode === GAME_MODE.SOLO && game.possession !== settings.userTeam)
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
				const gameSettings: BasketballGameSettingsSnapshot = {
					sport: 'basketball',
					awayTeam: settings.awayTeam,
					homeTeam: settings.homeTeam,
					mode: settings.mode,
					winScore: settings.winScore
				};
				const record = await createGame(
					auth.currentUser.id,
					snapshot,
					gameSettings,
					'basketball'
				);
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
			goto('/basketball');
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

			<div class="play-area">
				{#if game.action === GAME_ACTION.GAME_OVER}
					<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
				{/if}
				<p class="last-play">{game.lastPlay}</p>
				<p class="action-label">{game.action}</p>
			</div>

			<div class="dice-container">
				<Dice
					dieColor={primaryColor(settings, game.possession.toLowerCase()) ?? '#FFF'}
					pipColor={(() => {
						const team = game.possession.toLowerCase();
						const teamTyped = `${team}Team` as 'homeTeam' | 'awayTeam';
						return settings[teamTyped].colors.secondary ?? '#000';
					})()}
					restricted={game.restrictDice || game.action === GAME_ACTION.FREE_THROW || game.action === GAME_ACTION.COIN_TOSS || game.action === GAME_ACTION.GAME_OVER}
					autoRoll={isAutoPlay && game.action === GAME_ACTION.OFFENSE}
					paused={game.paused}
					onDiceRoll={handleDiceRoll}
					onRollComplete={saveGame}
				/>
			</div>
		</div>

		<!-- Coin Toss modal -->
		<Modal
			showModal={game.action === GAME_ACTION.COIN_TOSS && mode !== GAME_MODE.SIMULATION}
			close={() => {}}
			hasClose={false}
			choiceRequired={true}
		>
			<CoinToss saveCoinToss={(winner) => {
				game.saveCoinToss(winner);
				saveGame();
			}} />
		</Modal>

		<!-- Free Throw modal -->
		<Modal
			showModal={game.action === GAME_ACTION.FREE_THROW}
			close={() => {}}
			hasClose={false}
			choiceRequired={true}
		>
			<FreeThrowModal autoRoll={isFreeThrowAutoPlay} />
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
		<Modal
			showModal={showSettings}
			close={toggleSettings}
			hasClose={true}
			choiceRequired={false}
		>
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

	.play-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		padding: var(--space-6);
		position: relative;
		width: 100%;
	}

	.last-play {
		font-family: var(--font-body);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-text-primary);
		text-align: center;
		margin: 0;
		max-width: 30rem;
	}

	.action-label {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		margin: 0;
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

	@media (max-width: 780px) {
		.last-play {
			font-size: var(--text-base);
		}
	}
</style>
