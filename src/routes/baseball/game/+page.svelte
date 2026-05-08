<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import { game } from '$lib/baseball/state/game.svelte';
	import { GAME_ACTION } from '$lib/baseball/constants';
	import { lookupDiceResult } from '$lib/baseball/utils/game';
	import { pickZone } from '$lib/baseball/utils/hitZones';
	import { settings } from '$lib/state/settings.svelte';
	import { sleep } from '$lib/utils/common';
	import { primaryColor } from '$lib/football/utils/game';
	import { fireworkShow, options } from '$lib/utils/fireworks';
	import type { BatterHand, HitType } from '$lib/baseball/types';
	import { auth } from '$lib/auth/authState.svelte';
	import { createGame, updateGameState, completeGame } from '$lib/db/repositories/gameRepository';

	import Dice from '$lib/components/Dice.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmExit from '$lib/components/modal/ConfirmExit.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';
	import Scoreboard from '$lib/baseball/components/Scoreboard.svelte';
	import FieldSVG from '$lib/baseball/components/FieldSVG.svelte';
	import SvgBaseRunners from '$lib/baseball/components/SvgBaseRunners.svelte';
	import SvgBatter from '$lib/baseball/components/SvgBatter.svelte';
	import SvgPitchBall from '$lib/baseball/components/SvgPitchBall.svelte';
	import SvgBattedBall from '$lib/baseball/components/SvgBattedBall.svelte';
	import SvgHitResult from '$lib/baseball/components/SvgHitResult.svelte';

	import exit from '$lib/images/exit.svg';
	import gear from '$lib/images/gear.svg';
	import button from '$lib/assets/sfx/button.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	const buttonSfx: Howl = createSound(button);

	const { awayTeam, homeTeam } = settings;
	const isGameReady = awayTeam.id.length && homeTeam.id.length;
	let showSettings = $state(false);

	onDestroy(() => {
		game.resetGame();
	});

	// ── Component refs ───────────────────────────────────────
	let batterRef = $state<SvgBatter>();
	let pitchBallRef = $state<SvgPitchBall>();
	let battedBallRef = $state<SvgBattedBall>();
	let hitResultRef = $state<SvgHitResult>();
	let baseRunnersRef = $state<SvgBaseRunners>();
	let fw = $state(fireworkShow);

	// ── Settings ─────────────────────────────────────────────
	let batterHand: BatterHand = $state(Math.random() < 0.5 ? 'rh' : 'lh');

	function newBatter() {
		batterHand = Math.random() < 0.5 ? 'rh' : 'lh';
	}

	// ── Track half-inning changes to clear runners visually ──
	let prevHalf = $state(game.half);
	let prevInning = $state(game.inning);

	$effect(() => {
		if (game.half !== prevHalf || game.inning !== prevInning) {
			baseRunnersRef?.clearAll();
			prevHalf = game.half;
			prevInning = game.inning;
		}
	});

	// ── Game over detection ──────────────────────────────────
	$effect(() => {
		if (game.action === GAME_ACTION.GAME_OVER) {
			markGameComplete();
			sleep(100).then(() => {
				const fireworks = fw.fireworksInstance();
				fireworks.start();
			});
		}
	});

	// ── Dice → animation → state ─────────────────────────────

	function handleDiceRoll(diceId: number) {
		game.restrictDice = true;

		const result = lookupDiceResult(diceId);
		if (!result) {
			game.restrictDice = false;
			return;
		}

		const isHit = result.isHit ?? false;
		const isOut = result.isOut ?? false;
		const isWalk = !isHit && !isOut && (result.batterAdvancement ?? 0) === 1;
		const batterAdv = result.batterAdvancement ?? 0;
		const outCount = result.outCount ?? 1;

		// Determine result overlay text
		const hasRunners = game.bases.first || game.bases.second || game.bases.third;
		let overlayText = '';
		if (isWalk) {
			overlayText = 'WALK!';
		} else if (isOut && outCount >= 2 && hasRunners) {
			overlayText = 'DOUBLE PLAY!';
		} else if (isOut && result.isSacrifice && hasRunners) {
			overlayText = 'SAC FLY!';
		} else if (isOut) {
			overlayText = 'OUT!';
		}

		if (isWalk) {
			pitchBallRef?.throwPitch(() => {
				game.handleDiceRoll(game.action, diceId);
				hitResultRef?.show(overlayText);
				baseRunnersRef?.syncToState();
				sleep(800).then(() => {
					newBatter();
					game.continueAfterAction();
				});
			});
		} else if (isOut && !result.isSacrifice) {
			pitchBallRef?.throwPitch(() => {
				batterRef?.swing();
				setTimeout(() => {
					game.handleDiceRoll(game.action, diceId);
					hitResultRef?.show(overlayText);
					baseRunnersRef?.syncToState();
					sleep(800).then(() => {
						newBatter();
						game.continueAfterAction();
					});
				}, 400);
			});
		} else {
			// Hit or sacrifice fly
			const hitType = mapDiceToHitType(batterAdv, isOut);
			const zone = pickZone(hitType);
			const hitOverlay = isOut ? overlayText : hitLabel(batterAdv);

			pitchBallRef?.throwPitch(() => {
				batterRef?.swing();
				battedBallRef?.play(hitType, zone, () => {
					game.handleDiceRoll(game.action, diceId);
					hitResultRef?.show(hitOverlay);
					baseRunnersRef?.syncToState();
					sleep(800).then(() => {
						newBatter();
						game.continueAfterAction();
					});
				});
			});
		}
	}

	function hitLabel(batterAdv: number): string {
		if (batterAdv >= 4) return 'HOME RUN!';
		if (batterAdv === 3) return 'TRIPLE!';
		if (batterAdv === 2) return 'DOUBLE!';
		return 'SINGLE!';
	}

	function mapDiceToHitType(batterAdv: number, isOut: boolean): HitType {
		if (isOut) return 'flyball';
		if (batterAdv >= 4) return 'homerun';
		if (batterAdv === 3) return 'liner';
		if (batterAdv === 2) return Math.random() < 0.5 ? 'liner' : 'flyball';
		return Math.random() < 0.5 ? 'grounder' : 'liner';
	}

	// ── Save game ────────────────────────────────────────────

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
					settings.snapshotSettings(),
					'baseball'
				);
				game.activeGameId = record.id!;
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

	// ── Exit / toolbar ───────────────────────────────────────

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
		if (game.action === GAME_ACTION.GAME_OVER) {
			goto('/baseball');
		} else {
			game.handleExitClick();
		}
	}

	function cancelExit() {
		playSound(buttonSfx, settings.volume);
		game.cancelExit();
	}
</script>

{#if isGameReady}
	<main>
		<div class="game">
			<div class="scoreboard-wrapper">
				<Scoreboard {awayTeam} {homeTeam}>
					{#snippet toolbar()}
						<button
							class="toolbarButton flip"
							onclick={handleExitClick}
							title="Quit Game"
							aria-label="Quit Game"
						>
							<img src={exit} alt="Quit Game" />
						</button>
						<button
							class="toolbarButton"
							onclick={toggleSettings}
							title="Settings"
							aria-label="Settings"
						>
							<img src={gear} alt="Settings" />
						</button>
					{/snippet}
					{#snippet diceArea()}
						<div class="outs-indicator">
							{#each [1, 2, 3] as n (n)}
								<span class="out-dot" class:lit={n <= game.outs}></span>
							{/each}
						</div>
						<Dice
							dieColor={primaryColor(settings, game.possession.toLowerCase()) ?? '#FFF'}
							pipColor={(() => {
								const team = game.possession.toLowerCase();
								const teamTyped = `${team}Team` as 'homeTeam' | 'awayTeam';
								return settings[teamTyped].colors.tertiary ?? settings[teamTyped].colors.secondary ?? '#000';
							})()}
							restricted={game.restrictDice}
							onDiceRoll={handleDiceRoll}
							onRollComplete={saveGame}
						/>
					{/snippet}
				</Scoreboard>
			</div>

			<div class="field-outer">
				<svg
					class="field-svg"
					viewBox="0 0 1200 630"
					preserveAspectRatio="xMidYMid meet"
					xmlns="http://www.w3.org/2000/svg"
				>
					<FieldSVG outfieldLogo={homeTeam.logo} />
					<SvgBaseRunners bind:this={baseRunnersRef} />
					<SvgBatter hand={batterHand} bind:this={batterRef} />
					<SvgPitchBall bind:this={pitchBallRef} />
					<SvgBattedBall bind:this={battedBallRef} />
					<SvgHitResult bind:this={hitResultRef} />
				</svg>
				{#if game.action === GAME_ACTION.GAME_OVER}
					<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
				{/if}
			</div>

		</div>

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
			<Settings hideWinScore />
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
		max-width: 75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		flex: 1;
		min-height: 0;
	}

	.scoreboard-wrapper {
		position: relative;
		z-index: 100;
		width: 100%;
		margin-bottom: -1.5rem;
	}

	.toolbarButton {
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-1);
	}

	.toolbarButton img {
		height: 1.25rem;
		width: 1.25rem;
		transition: filter var(--dur-fast) var(--ease-snes);
	}

	.toolbarButton:hover img {
		filter: brightness(0.7);
	}

	.flip {
		transform: scaleX(-1);
	}

	.field-outer {
		position: relative;
		overflow: hidden;
		width: 100%;
		border: 2px solid var(--color-border-default);
		border-radius: var(--radius-sm);
		flex: 1;
		min-height: 0;
	}

	.field-svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.outs-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.35rem 0;
	}

	.out-dot {
		width: 0.9rem;
		height: 0.9rem;
		border-radius: 50%;
		border: 2px solid var(--color-text-tertiary);
		transition:
			background-color 0.15s,
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.out-dot.lit {
		background-color: var(--bb-out-red);
		border-color: var(--bb-out-red-border);
		box-shadow: var(--bb-out-red-glow);
	}

	/* ── Mobile landscape: fit in viewport ── */
	@media (max-height: 500px) and (orientation: landscape) {
		main {
			padding: 0.25rem 0.5rem;
		}
		.game {
			width: 100%;
			max-width: 100%;
		}
		.scoreboard-wrapper {
			margin-bottom: -1rem;
		}
	}

	/* ── Narrow screens ── */
	@media (max-width: 40rem) {
		.game {
			width: 95%;
		}
		.scoreboard-wrapper {
			margin-bottom: -1rem;
		}
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
