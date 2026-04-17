<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import { game } from '$lib/baseball/state/game.svelte';
	import { GAME_ACTION } from '$lib/baseball/constants';
	import { lookupDiceResult } from '$lib/baseball/utils/game';
	import { pickZone } from '$lib/baseball/utils/hitZones';
	import { settings } from '$lib/state/settings.svelte';
	import { sleep } from '$lib/utils/common';
	import { primaryColor, secondaryColor } from '$lib/utils/game';
	import { fireworkShow, options } from '$lib/utils/fireworks';
	import type { BatterHand, HitType, MowPattern } from '$lib/baseball/types';
	import { auth } from '$lib/auth/authState.svelte';
	import { createGame, updateGameState, completeGame } from '$lib/db/repositories/gameRepository';

	import Dice from '$lib/components/Dice.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmExit from '$lib/components/modal/ConfirmExit.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';
	import Scoreboard from '$lib/baseball/components/Scoreboard.svelte';
	import Field from '$lib/baseball/components/Field.svelte';
	import BaseRunners from '$lib/baseball/components/BaseRunners.svelte';
	import Batter from '$lib/baseball/components/Batter.svelte';
	import PitchBall from '$lib/baseball/components/PitchBall.svelte';
	import BattedBall from '$lib/baseball/components/BattedBall.svelte';
	import HitResult from '$lib/baseball/components/HitResult.svelte';

	import exit from '$lib/images/exit.svg';
	import gear from '$lib/images/gear.svg';
	import button from '$lib/assets/sfx/button.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	const buttonSfx: Howl = createSound(button);

	const { awayTeam, homeTeam } = settings;
	const isGameReady = awayTeam.id.length && homeTeam.id.length;
	let showSettings = $state(false);

	// ── Canvas scaling ───────────────────────────────────────
	const DESIGN_W = 900;
	const DESIGN_H = 920;
	let outerEl = $state<HTMLDivElement>();
	let scale = $state(1);

	onMount(() => {
		if (!outerEl) return;
		const ro = new ResizeObserver(() => {
			if (!outerEl) return;
			const sw = outerEl.clientWidth / DESIGN_W;
			const sh = outerEl.clientHeight / DESIGN_H;
			scale = Math.min(sw, sh);
		});
		ro.observe(outerEl);
		scale = Math.min(outerEl.clientWidth / DESIGN_W, outerEl.clientHeight / DESIGN_H);
		return () => ro.disconnect();
	});

	onDestroy(() => {
		game.resetGame();
	});

	// ── Component refs ───────────────────────────────────────
	let batterRef = $state<Batter>();
	let pitchBallRef = $state<PitchBall>();
	let battedBallRef = $state<BattedBall>();
	let hitResultRef = $state<HitResult>();
	let baseRunnersRef = $state<BaseRunners>();
	let fw = $state(fireworkShow);

	// ── Settings ─────────────────────────────────────────────
	let batterHand: BatterHand = $state(Math.random() < 0.5 ? 'rh' : 'lh');
	let mowPattern: MowPattern = $state('');

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
		let overlayText = '';
		if (isWalk) {
			overlayText = 'WALK!';
		} else if (isOut && outCount >= 2) {
			overlayText = 'DOUBLE PLAY!';
		} else if (isOut && result.isSacrifice) {
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
				setTimeout(() => {
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
				}, 80);
			});
		} else {
			// Hit or sacrifice fly
			const hitType = mapDiceToHitType(batterAdv, isOut);
			const zone = pickZone(hitType);
			const hitOverlay = isOut ? overlayText : zone.label;

			pitchBallRef?.throwPitch(() => {
				setTimeout(() => {
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
				}, 80);
			});
		}
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
			<div class="scoreboard">
				<div class="menu-with-play">
					<div class="toolbar">
						<button
							class="toolbarButton flip"
							onclick={handleExitClick}
							title="Quit Game"
							aria-label="Quit Game"
						>
							<img src={exit} alt="Quit Game" />
						</button>
						<div class="divider">|</div>
						<button
							class="toolbarButton"
							onclick={toggleSettings}
							title="Settings"
							aria-label="Settings"
						>
							<img src={gear} alt="Settings" />
						</button>
					</div>
					<div class="last-play">{game.lastPlay}</div>
				</div>
				<div class="dice-container">
					<div class="outs-indicator">
						<span class="outs-label">Outs</span>
						{#each [1, 2, 3] as n}
							<span class="out-dot" class:lit={n <= game.outs}></span>
						{/each}
					</div>
					<Dice
						dieColor={primaryColor(settings, game.possession.toLowerCase()) ?? '#FFF'}
						pipColor={secondaryColor(settings, game.possession.toLowerCase()) ?? '#000'}
						restricted={game.restrictDice}
						onDiceRoll={handleDiceRoll}
						onRollComplete={saveGame}
					/>
				</div>
				<div class="scores">
					<Scoreboard {awayTeam} {homeTeam} />
				</div>
				
			</div>

			<div class="field-outer" bind:this={outerEl}>
				<div class="field-canvas" style:transform="scale({scale})">
					<div class="field-region">
						<div
							id="stadium"
							class="stadium"
							class:pat-wide-stripes={mowPattern === 'pat-wide-stripes'}
							class:pat-cross-cut={mowPattern === 'pat-cross-cut'}
							class:pat-radial={mowPattern === 'pat-radial'}
							class:pat-diamond={mowPattern === 'pat-diamond'}
							class:pat-fan={mowPattern === 'pat-fan'}
						>
							<Field {mowPattern} />
							<BaseRunners bind:this={baseRunnersRef} />
							<Batter hand={batterHand} bind:this={batterRef} />
							<PitchBall bind:this={pitchBallRef} />
							<BattedBall bind:this={battedBallRef} />
						</div>
					</div>
					<HitResult bind:this={hitResultRef} />
				</div>
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
			<Settings hideWinScore>
				{#snippet extra()}
					<div class="mow-setting">
						<label class="mow-label" for="mowPattern">Grass Pattern</label>
						<select
							id="mowPattern"
							class="mow-select"
							value={mowPattern}
							onchange={(e) => {
								mowPattern = (e.currentTarget as HTMLSelectElement).value as MowPattern;
							}}
						>
							<option value="">Stripes</option>
							<option value="pat-wide-stripes">Wide</option>
							<option value="pat-cross-cut">Cross</option>
							<option value="pat-radial">Radial</option>
							<option value="pat-diamond">Diamond</option>
							<option value="pat-fan">Fan</option>
						</select>
					</div>
				{/snippet}
			</Settings>
		</Modal>
	</main>
{/if}

<style>
	main {
		position: relative;
		padding: 1rem;
	}

	.game {
		max-width: 90%;
		margin: -3.25rem auto 0 auto;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 14px;
		z-index: 100;
	}

	.menu-with-play {
		display: flex;
	}

	.scoreboard {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: start;
		column-gap: 0.25rem;
		top: 2.5rem;
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
		filter: brightness(1.5);
	}

	.flip {
		transform: scaleX(-1);
	}

	.mow-setting {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		padding: var(--space-3) 0;
	}

	.mow-label {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.mow-select {
		font-family: var(--font-numeric);
		font-size: var(--text-score-xs);
		font-weight: var(--weight-bold);
		color: var(--color-text-gold);
		background-color: var(--input-bg);
		border: 2px solid var(--input-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--input-shadow);
		padding: var(--space-1-5) var(--space-3);
		cursor: pointer;
		appearance: none;
		text-align: center;
		min-width: 4.5rem;
	}

	.mow-select:hover {
		border-color: var(--input-border-hover);
	}

	.mow-select:focus-visible {
		outline: none;
		border-color: var(--input-border-focus);
		box-shadow: var(--input-shadow-focus);
	}

	.last-play {
		flex: 1;
		text-align: center;
		font-size: var(--text-sm);
		font-family: var(--font-body);
		color: var(--color-text-gold);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.outs-indicator {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.out-dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		border: 1.5px solid var(--color-text-tertiary);
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

	.outs-label {
		font-family: var(--font-body);
		font-size: 0.8rem;
		font-weight: var(--weight-bold);
		color: var(--color-text-gold);
		letter-spacing: 0.05em;
		margin-right: 0.15rem;
	}

	.dice-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: var(--color-bg-surface);
		border: 1px solid var(--color-on-accent);
		border-radius: 1rem;
		padding: 0.25rem 0.5rem;
		z-index: 100;
		filter: drop-shadow(3px 6px 8px oklch(0 0 0 / 0.5));
	}

	.field-outer {
		flex: 1;
		min-height: 0;
		position: relative;
		overflow: hidden;
		background: var(--bb-field-bg);
	}

	.field-canvas {
		position: absolute;
		top: 0;
		left: 50%;
		width: 900px;
		height: 920px;
		transform-origin: top center;
		margin-left: -450px;
		background: var(--bb-field-bg);
	}

	.field-canvas::before {
		content: '';
		position: absolute;
		inset: 0;
		border: 4px solid var(--bb-panel-border);
		box-shadow: inset 0 0 0 2px var(--bb-accent-blue-12);
		pointer-events: none;
		z-index: 9000;
	}

	.field-canvas::after {
		content: '';
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 3px,
			oklch(0 0 0 / 0.07) 3px,
			oklch(0 0 0 / 0.07) 4px
		);
		pointer-events: none;
		z-index: 8000;
	}

	.field-region {
		position: absolute;
		top: 104px;
		left: 4px;
		right: 4px;
		bottom: 4px;
		perspective: 900px;
		perspective-origin: 50% 18%;
		background: var(--color-bg-void);
		overflow: visible;
	}

	.stadium {
		transform: translateY(80px) rotateX(10deg);
		transform-origin: 50% 50%;
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
