<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import { game } from '$lib/basketball/state/game.svelte';
	import { GAME_ACTION } from '$lib/basketball/constants';
	import type { BasketballGameSettingsSnapshot } from '$lib/db/database';
	import { settings } from '$lib/state/settings.svelte';
	import { sleep } from '$lib/utils/common';
	import { fireworkShow, options } from '$lib/utils/fireworks';
	import { auth } from '$lib/auth/authState.svelte';
	import { createGame, updateGameState, completeGame } from '$lib/db/repositories/gameRepository';
	import { GAME_MODE, TEAM } from '$lib/shared/constants';

	import Dice from '$lib/components/Dice.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmExit from '$lib/components/modal/ConfirmExit.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';
	import Scoreboard from '$lib/basketball/components/Scoreboard.svelte';
	import { primaryColor } from '$lib/football/utils/game';
	import Court from '$lib/basketball/components/Court.svelte';
	import ShotAnimation from '$lib/basketball/components/ShotAnimation.svelte';
	import CoinToss from '$lib/basketball/components/CoinToss.svelte';
	import { lookupDiceResult, classifyOutcome } from '$lib/basketball/utils/game';

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
	let shotRef = $state<ShotAnimation>();

	const isAutoPlay = $derived(
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

	// ── Show ball at free throw line when entering FT mode ──
	$effect(() => {
		if (game.action === GAME_ACTION.FREE_THROW && shotRef) {
			shotRef.showAtFreeThrowLine(game.possession);
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

		const roll = lookupDiceResult(diceId);
		if (!roll) {
			game.handleDiceRoll(game.action, diceId);
			game.continueAfterAction();
			return;
		}

		const outcome = classifyOutcome(roll);
		const isShot =
			outcome === 'scoring' ||
			outcome === 'scoring_and_one' ||
			outcome === 'missed_shot' ||
			outcome === 'shooting_foul';

		if (isShot && shotRef) {
			const shotType = roll.points >= 3 ? 'three' : 'two';
			const shotResult = outcome === 'missed_shot' || outcome === 'shooting_foul' ? 'missed' : 'made';
			const currentPossession = game.possession;

			shotRef.shoot(shotType, shotResult, currentPossession, () => {
				game.handleDiceRoll(game.action, diceId);
				game.continueAfterAction();
			});
		} else {
			game.handleDiceRoll(game.action, diceId);
			game.continueAfterAction();
		}
	}

	// ── Free throw roll handler ─────────────────────────────

	function handleFreeThrowRoll(dieValue: number) {
		game.restrictDice = true;
		const shotResult = dieValue % 2 === 0 ? 'made' : 'missed';
		const currentPossession = game.possession;

		if (shotRef) {
			shotRef.freeThrow(shotResult as 'made' | 'missed', currentPossession, () => {
				game.handleFreeThrow(dieValue);
				game.restrictDice = false;

				if (game.freeThrowsRemaining > 0 && shotRef) {
					shotRef.showAtFreeThrowLine(game.possession);
				} else {
					game.continueAfterAction();
				}
			});
		} else {
			game.handleFreeThrow(dieValue);
			if (game.freeThrowsRemaining <= 0) {
				game.continueAfterAction();
			} else {
				game.restrictDice = false;
			}
		}
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
			<div class="scoreboard-wrapper">
				<Scoreboard>
					{#snippet center()}
						<div class="dice-container">
							<!-- <div class="action">{game.action}</div> -->
							<Dice
								dieColor={primaryColor(settings, game.possession.toLowerCase()) ?? '#FFF'}
								pipColor={(() => {
									const team = game.possession.toLowerCase();
									const teamTyped = `${team}Team` as 'homeTeam' | 'awayTeam';
									return settings[teamTyped].colors.secondary ?? '#000';
								})()}
								singleDie={game.action === GAME_ACTION.FREE_THROW}
								restricted={game.restrictDice || game.action === GAME_ACTION.COIN_TOSS || game.action === GAME_ACTION.GAME_OVER}
								autoRoll={isAutoPlay && (game.action === GAME_ACTION.OFFENSE || game.action === GAME_ACTION.FREE_THROW)}
								paused={game.paused}
								onDiceRoll={game.action === GAME_ACTION.FREE_THROW ? handleFreeThrowRoll : handleDiceRoll}
								onRollComplete={saveGame}
							/>
							<div class="controls-row">
								<svg class="possession-arrow" class:active={game.possession === 'Home'} viewBox="0 0 30 24" aria-label="Shooting left">
									<path d="M21 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M13 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
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
								<svg class="possession-arrow" class:active={game.possession === 'Away'} viewBox="0 0 30 24" aria-label="Shooting right">
									<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M17 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</div>
						</div>
					{/snippet}
				</Scoreboard>
			</div>

			<div class="court-area">
				<Court homeLogo={`/logos/${homeTeam.logo}.webp`} homeColor={homeTeam.colors.primary} homeSecondaryColor={homeTeam.colors.secondary} possession={game.possession}>
					{#snippet svgOverlay()}
						<ShotAnimation bind:this={shotRef} />
					{/snippet}
				</Court>
				<div class="court-overlay">
					{#key game.lastPlay}
						<p class="last-play" in:fade={{ duration: 300 }}>{game.lastPlay}</p>
					{/key}
				</div>
				{#if game.action === GAME_ACTION.GAME_OVER}
					<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
				{/if}
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
		padding-top: .25rem;
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

	.court-area {
		position: relative;
		width: 100%;
		margin-top: -2.75rem;
	}

	.court-overlay {
		position: absolute;
		top: 25%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
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
		background-color: rgba(0, 0, 0, 0.5);
		text-shadow:
			0 1px 4px rgba(0, 0, 0, 0.9),
			0 0 12px rgba(0, 0, 0, 0.6);
	}

	.controls-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.possession-arrow {
		width: 1.5rem;
		height: 1.75rem;
		color: var(--color-text-tertiary);
		opacity: 0.3;
		transition: opacity var(--dur-fast) var(--ease-snes), color var(--dur-fast) var(--ease-snes);
	}

	.possession-arrow.active {
		color: var(--color-text-gold);
		opacity: 1;
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
