<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import { game } from '$lib/soccer/state/game.svelte';
	import { GAME_ACTION } from '$lib/soccer/constants';
	import {
		aiRerollIndices,
		aiShouldReroll,
		bestPlay,
		effectiveDiceCount,
		teamKey
	} from '$lib/soccer/utils/game';
	import type { SoccerGameSettingsSnapshot } from '$lib/db/database';
	import { settings } from '$lib/state/settings.svelte';
	import { sleep } from '$lib/utils/common';
	import { fireworkShow, options } from '$lib/utils/fireworks';
	import { auth } from '$lib/auth/authState.svelte';
	import { createGame, updateGameState, completeGame } from '$lib/db/repositories/gameRepository';
	import { GAME_MODE, OPPOSITE_TEAM, TEAM } from '$lib/shared/constants';

	import Field from '$lib/soccer/components/Field.svelte';
	import Scoreboard from '$lib/soccer/components/Scoreboard.svelte';
	import CoinToss from '$lib/soccer/components/CoinToss.svelte';
	import SoccerDice from '$lib/soccer/components/SoccerDice.svelte';
	import PowerChipModal from '$lib/soccer/components/PowerChipModal.svelte';
	import EventAnnouncement from '$lib/components/EventAnnouncement.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmExit from '$lib/components/modal/ConfirmExit.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';

	import exit from '$lib/images/exit.svg';
	import gear from '$lib/images/gear.svg';
	import flick from '$lib/assets/sfx/flick.mp3';
	import buttonSfx from '$lib/assets/sfx/button.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	const ROLL_DELAY = 650;
	const flickSfx: Howl = createSound(flick);
	const btnSfx: Howl = createSound(buttonSfx);

	const { awayTeam, homeTeam, mode } = settings;
	const isGameReady = awayTeam.id.length && homeTeam.id.length;
	// Home defends the left goal, Away the right — order the dice panels to
	// match each team's side (and the scoreboard).
	const teamOrder = [TEAM.HOME, TEAM.AWAY];

	let showSettings = $state(false);
	let fw = $state(fireworkShow);

	// Local round UI state
	let busy = $state(false);
	let rollingTeam = $state<string | null>(null);
	let selectedDice = $state<number[]>([]);

	// Announcement overlay
	let announcementText = $state('');
	let announcementType: 'goal' | 'save' | 'turnover' = $state('goal');
	let announcementKey = $state(0);

	function triggerAnnouncement(text: string, type: 'goal' | 'save' | 'turnover') {
		announcementText = text;
		announcementType = type;
		announcementKey = announcementKey + 1;
	}

	// ── Control helpers ──────────────────────────────────────
	const isAI = (team: string) => mode === GAME_MODE.SOLO && team !== settings.userTeam;

	let isRollPhase = $derived(
		game.action === GAME_ACTION.ROLL_OFF ||
			game.action === GAME_ACTION.SHOT_ON_GOAL ||
			game.action === GAME_ACTION.FREE_KICK
	);
	let humanRoller = $derived(
		isRollPhase && !game.bothRolled && game.nextRoller && !isAI(game.nextRoller)
			? game.nextRoller
			: null
	);
	let awaitingHumanResolve = $derived(
		isRollPhase && game.bothRolled && !isAI(game.powerChipHolder)
	);
	let canReroll = $derived(awaitingHumanResolve && !game.chipRerollUsed);

	function teamColor(team: string): string {
		return team === TEAM.AWAY ? settings.awayTeam.colors.primary : settings.homeTeam.colors.primary;
	}
	function teamCity(team: string): string {
		return team === TEAM.AWAY ? settings.awayTeam.city : settings.homeTeam.city;
	}
	function rollFor(team: string) {
		return team === TEAM.AWAY ? game.awayRoll : game.homeRoll;
	}
	function expectedDice(team: string): number {
		let count = effectiveDiceCount(game.diceReduction[teamKey(team)]);
		if (game.action === GAME_ACTION.FREE_KICK && team === game.defenseTeamName) {
			count = Math.max(1, count - 1);
		}
		return count;
	}

	// ── Step runner (serializes async transitions) ───────────
	function startStep(fn: () => Promise<void> | void) {
		if (busy) return;
		busy = true;
		Promise.resolve()
			.then(fn)
			.finally(() => {
				busy = false;
			});
	}

	// AI auto-stepping: roll for an AI roller, or resolve for an AI chip holder.
	$effect(() => {
		if (busy || game.paused) return;
		if (!isRollPhase) return;
		if (!game.bothRolled) {
			const roller = game.nextRoller;
			if (roller && isAI(roller)) startStep(() => performRoll(roller));
		} else if (isAI(game.powerChipHolder)) {
			startStep(aiResolveWindow);
		}
	});

	async function performRoll(team: string) {
		rollingTeam = team;
		playSound(flickSfx, settings.volume);
		await sleep(ROLL_DELAY * settings.speed);
		game.rollForTeam(team);
		rollingTeam = null;
		await sleep(350 * settings.speed);
	}

	async function aiResolveWindow() {
		const holder = game.powerChipHolder;
		const roll = rollFor(holder);
		if (roll && !game.chipRerollUsed) {
			const play = bestPlay(roll);
			if (aiShouldReroll(play, holder === game.possession)) {
				rollingTeam = holder;
				playSound(flickSfx, settings.volume);
				await sleep(ROLL_DELAY * settings.speed);
				game.rerollWithChip(aiRerollIndices(roll));
				rollingTeam = null;
				await sleep(350 * settings.speed);
			}
		}
		await sleep(500 * settings.speed);
		applyResolve();
	}

	function applyResolve() {
		const prevLen = game.playLog.length;
		game.resolveResult();
		postResolve(prevLen);
	}

	function postResolve(prevLen: number) {
		announceNew(prevLen);
		if (game.action !== GAME_ACTION.POWER_CHIP_TIE) game.continueAfterAction();
	}

	function announceNew(prevLen: number) {
		const added = game.playLog.slice(prevLen);
		if (added.some((e) => e.goalsScored > 0)) {
			triggerAnnouncement('GOAL!', 'goal');
			return;
		}
		const last = added[added.length - 1];
		if (!last) return;
		const shotOngoing =
			game.action === GAME_ACTION.SHOT_ON_GOAL || game.action === GAME_ACTION.FREE_KICK;
		if (last.isShot && last.goalsScored === 0 && !shotOngoing && last.description.startsWith('Save')) {
			triggerAnnouncement('SAVE!', 'save');
			return;
		}
		if (last.isRedCard) triggerAnnouncement('RED CARD!', 'turnover');
	}

	// ── Human interactions ───────────────────────────────────
	function humanRollClick() {
		const roller = game.nextRoller;
		if (roller) startStep(() => performRoll(roller));
	}

	function toggleDie(index: number) {
		selectedDice = selectedDice.includes(index)
			? selectedDice.filter((i) => i !== index)
			: [...selectedDice, index];
	}

	function rerollClick() {
		if (!selectedDice.length) return;
		const holder = game.powerChipHolder;
		const indices = [...selectedDice];
		selectedDice = [];
		startStep(async () => {
			rollingTeam = holder;
			playSound(flickSfx, settings.volume);
			await sleep(ROLL_DELAY * settings.speed);
			game.rerollWithChip(indices);
			rollingTeam = null;
			await sleep(350 * settings.speed);
		});
	}

	function resolveClick() {
		selectedDice = [];
		startStep(async () => {
			await sleep(150 * settings.speed);
			applyResolve();
		});
	}

	function onTieDecision(useChip: boolean) {
		startStep(async () => {
			await sleep(150 * settings.speed);
			const prevLen = game.playLog.length;
			game.resolveTie(useChip);
			postResolve(prevLen);
		});
	}

	// ── Persistence ──────────────────────────────────────────
	async function saveGame() {
		if (!auth.isLoggedIn || !auth.currentUser?.id) return;
		try {
			const snapshot = game.snapshotState();
			if (game.activeGameId) {
				await updateGameState(game.activeGameId, snapshot);
			} else {
				const gameSettings: SoccerGameSettingsSnapshot = {
					sport: 'soccer',
					awayTeam: settings.awayTeam,
					homeTeam: settings.homeTeam,
					mode: settings.mode,
					winScore: settings.winScore
				};
				const record = await createGame(auth.currentUser.id, snapshot, gameSettings, 'soccer');
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

	onDestroy(() => {
		game.resetGame();
	});

	// ── Game over ────────────────────────────────────────────
	$effect(() => {
		if (game.action === GAME_ACTION.GAME_OVER) {
			markGameComplete();
			sleep(100).then(() => fw.fireworksInstance().start());
		}
	});

	// ── Toolbar ──────────────────────────────────────────────
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
		if (game.action === GAME_ACTION.GAME_OVER) goto('/soccer');
		else game.handleExitClick();
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
						<div class="toolbar">
							<button class="toolbar-button flip" onclick={handleExitClick} title="Quit Game" aria-label="Quit Game">
								<img src={exit} alt="Quit Game" />
							</button>
							<button class="toolbar-button" onclick={toggleSettings} title="Settings" aria-label="Settings">
								<img src={gear} alt="Settings" />
							</button>
						</div>
					{/snippet}
				</Scoreboard>
			</div>

			<div class="field-area">
				<Field
					ballSection={game.ballSection}
					possession={game.possession}
					awayTeam={settings.awayTeam}
					homeTeam={settings.homeTeam}
					goalScorer={game.goalScorer}
					lastPlay={game.lastPlay}
				/>
				<EventAnnouncement text={announcementText} type={announcementType} key={announcementKey} />
				{#if game.action === GAME_ACTION.GAME_OVER}
					<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
				{/if}
			</div>

			<div class="dice-panel">
				{#each teamOrder as team (team)}
					<div class="team-dice" class:active={humanRoller === team || (game.bothRolled && game.powerChipHolder === team && canReroll)}>
						<span class="dice-label" style:color={teamColor(team)}>{teamCity(team)}</span>
						<SoccerDice
							roll={rollFor(team)}
							diceCount={expectedDice(team)}
							rolling={rollingTeam === team}
							accentColor={teamColor(team)}
							bestSymbol={game.bothRolled && rollFor(team) ? bestPlay(rollFor(team)!).symbol : null}
							selectable={canReroll && team === game.powerChipHolder}
							selected={team === game.powerChipHolder ? selectedDice : []}
							onToggle={toggleDie}
						/>
						{#if humanRoller === team}
							<button class="action-button roll" onclick={humanRollClick} disabled={busy}>Roll</button>
						{/if}
					</div>
				{/each}
			</div>

			<div class="controls-bar">
				{#if humanRoller}
					<span class="prompt">{teamCity(humanRoller)} to roll</span>
				{:else if awaitingHumanResolve}
					{#if canReroll}
						<button class="action-button" onclick={rerollClick} disabled={busy || selectedDice.length === 0}>
							Re-roll{selectedDice.length ? ` (${selectedDice.length})` : ''}
						</button>
						<span class="prompt">Tap {teamCity(game.powerChipHolder)}'s dice to re-roll (uses chip)</span>
					{/if}
					<button class="action-button resolve" onclick={resolveClick} disabled={busy}>Resolve</button>
				{/if}
			</div>
		</div>

		<!-- Coin toss -->
		<Modal
			showModal={game.action === GAME_ACTION.COIN_TOSS}
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

		<!-- Power chip tie -->
		<Modal
			showModal={game.action === GAME_ACTION.POWER_CHIP_TIE}
			close={() => {}}
			hasClose={false}
			choiceRequired={true}
		>
			<PowerChipModal
				holderName={teamCity(game.powerChipHolder)}
				opponentName={teamCity(OPPOSITE_TEAM[game.powerChipHolder])}
				holderIsOffense={game.chipHolderIsOffense}
				isShot={game.pendingShot != null}
				autoResolve={isAI(game.powerChipHolder)}
				onDecision={onTieDecision}
			/>
		</Modal>

		<!-- Exit confirmation -->
		<Modal
			showModal={game.action === GAME_ACTION.EXIT}
			close={cancelExit}
			hasClose={false}
			choiceRequired={true}
		>
			<ConfirmExit cancel={cancelExit} />
		</Modal>

		<!-- Settings -->
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
		max-width: 60rem;
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

	.field-area {
		position: relative;
		width: 100%;
		margin-top: 0.5rem;
	}


	.dice-panel {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
		width: 100%;
		margin-top: 0.75rem;
		flex-wrap: wrap;
	}

	.team-dice {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: var(--space-2);
		border-radius: var(--radius-md);
		border: 2px solid transparent;
		transition: border-color var(--dur-fast) var(--ease-snes);
		min-width: 9rem;
	}

	.team-dice.active {
		border-color: var(--color-text-gold, gold);
		box-shadow: 0 0 12px oklch(0.88 0.18 85 / 0.3);
	}

	.dice-label {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-black);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
	}

	.controls-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		flex-wrap: wrap;
		min-height: 3rem;
		margin-top: 0.25rem;
	}

	.prompt {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.action-button {
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-sm);
		cursor: pointer;
		background-color: var(--btn-secondary-bg);
		color: var(--btn-secondary-text);
		border: 2px solid var(--btn-secondary-border);
		box-shadow: var(--btn-secondary-shadow);
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.action-button:hover {
		background-color: var(--btn-secondary-bg-hover);
		box-shadow: var(--btn-secondary-shadow-hover);
	}

	.action-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.action-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		pointer-events: none;
	}

	.action-button.roll,
	.action-button.resolve {
		background-color: var(--btn-primary-bg);
		color: var(--btn-primary-text);
		border-color: var(--btn-primary-border);
		box-shadow: var(--btn-primary-shadow);
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: 0 var(--space-2);
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
