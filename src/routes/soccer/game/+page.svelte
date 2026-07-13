<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import { game } from '$lib/soccer/state/game.svelte';
	import { GAME_ACTION, SOCCER_SYMBOL } from '$lib/soccer/constants';
	import {
		aiRerollIndices,
		aiShouldReroll,
		bestPlay,
		compareCounts,
		countSymbols,
		effectiveDiceCount,
		resolveShot,
		teamKey
	} from '$lib/soccer/utils/game';
	import type { SoccerSymbol } from '$lib/soccer/types';
	import type { SoccerGameSettingsSnapshot } from '$lib/db/database';
	import { settings } from '$lib/state/settings.svelte';
	import { readableTextColor, sleep } from '$lib/utils/common';
	import { fireworkShow, options } from '$lib/utils/fireworks';
	import { auth } from '$lib/auth/authState.svelte';
	import { createGame, updateGameState, completeGame } from '$lib/db/repositories/gameRepository';
	import { savePreferences, saveGuestPreferences } from '$lib/db/repositories/preferencesRepository';
	import { GAME_MODE, OPPOSITE_TEAM, TEAM } from '$lib/shared/constants';

	import Field from '$lib/soccer/components/Field.svelte';
	import Scoreboard from '$lib/soccer/components/Scoreboard.svelte';
	import CoinToss from '$lib/soccer/components/CoinToss.svelte';
	import SoccerDice from '$lib/soccer/components/SoccerDice.svelte';
	import PowerChipModal from '$lib/soccer/components/PowerChipModal.svelte';
	import Instructions from '$lib/soccer/components/Instructions.svelte';
	import EventAnnouncement from '$lib/components/EventAnnouncement.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmExit from '$lib/components/modal/ConfirmExit.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';

	import exit from '$lib/images/exit.svg';
	import gear from '$lib/images/gear.svg';
	import circleInfo from '$lib/images/circle-info.svg';
	import flick from '$lib/assets/sfx/flick.mp3';
	import buttonSfx from '$lib/assets/sfx/button.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	const ROLL_DELAY = 650;
	const flickSfx: Howl = createSound(flick);
	const btnSfx: Howl = createSound(buttonSfx);

	const { awayTeam, homeTeam, mode } = settings;
	const isGameReady = awayTeam.id.length && homeTeam.id.length;

	let showSettings = $state(false);
	let showInstructions = $state(false);
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

	// During a shot/free kick only balls count toward the outcome (resolveShot),
	// unlike a regular round where bestPlay compares the most-frequent symbol of
	// any type. This flag lets the dice UI root for balls specifically.
	let isShotPhase = $derived(
		game.action === GAME_ACTION.SHOT_ON_GOAL ||
			game.action === GAME_ACTION.FREE_KICK ||
			game.action === GAME_ACTION.PENALTY_SHOT
	);
	let isRollPhase = $derived(game.action === GAME_ACTION.ROLL_OFF || isShotPhase);
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
	// Country flag key for a team's dice badge. Same `/flags/{logo}.svg`
	// convention as the possession flag (Field) and scoreboard banners.
	function teamFlag(team: string): string {
		return team === TEAM.AWAY ? settings.awayTeam.logo : settings.homeTeam.logo;
	}
	// Whichever team is currently winning the pending roll. Null on a tie or
	// before both teams have rolled. Drives the resolve button's tint and the
	// direction its play icon points (toward the winning team's side).
	let resolveWinner = $derived.by(() => {
		if (!game.bothRolled) return null;
		const offRoll = rollFor(game.offenseTeamName);
		const defRoll = rollFor(game.defenseTeamName);
		if (!offRoll || !defRoll) return null;
		if (isShotPhase) {
			// Mirror resolveShotRoll: only balls decide a shot; goal = offense wins.
			const result = resolveShot(countSymbols(offRoll).ball, countSymbols(defRoll).ball);
			if (result === 'tie') return null;
			return result === 'goal' ? game.offenseTeamName : game.defenseTeamName;
		}
		const winner = compareCounts(bestPlay(offRoll), bestPlay(defRoll));
		if (winner === 'tie') return null;
		return winner === 'offense' ? game.offenseTeamName : game.defenseTeamName;
	});
	// The resolve button fills with the winner's color; before a winner exists
	// (or on a tie) it falls back to the primary button fill.
	let resolveWinnerColor = $derived(resolveWinner ? teamColor(resolveWinner) : null);
	let resolveStyle = $derived(
		resolveWinnerColor
			? `--resolve-solid: ${resolveWinnerColor}; --resolve-fg: ${readableTextColor(resolveWinnerColor)};`
			: ''
	);
	// Both teams rolled but neither won: a tie, shown with back-to-back arrows.
	let resolveTie = $derived(game.bothRolled && resolveWinner === null);
	function teamCity(team: string): string {
		return team === TEAM.AWAY ? settings.awayTeam.city : settings.homeTeam.city;
	}
	function rollFor(team: string) {
		return team === TEAM.AWAY ? game.awayRoll : game.homeRoll;
	}
	// The symbol worth rooting for in a team's roll: during a shot only balls
	// matter, so highlight balls; otherwise highlight the winning play.
	function bestSymbolFor(team: string): SoccerSymbol | null {
		const roll = rollFor(team);
		if (!game.bothRolled || !roll) return null;
		return isShotPhase ? SOCCER_SYMBOL.BALL : bestPlay(roll).symbol;
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
		// A red card in the box just opened a penalty shot (pendingShot flips to
		// 'penalty' before any roll). Announce it before the balls-only roll.
		if (game.pendingShot === 'penalty' && last.isShot && last.goalsScored === 0) {
			triggerAnnouncement('PENALTY SHOT!', 'turnover');
			return;
		}
		if (last.isShot && last.goalsScored === 0 && !isShotPhase && last.description.startsWith('Save')) {
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

	function openInstructions() {
		playSound(btnSfx, settings.volume);
		showInstructions = true;
		game.pause();
	}

	// Guarded so a stray close() (e.g. the shared Modal's window Escape handler)
	// can't spuriously open the panel or resume when it isn't showing.
	function closeInstructions() {
		if (!showInstructions) return;
		playSound(btnSfx, settings.volume);
		showInstructions = false;
		game.resume();
	}

	// Commit a ball skin chosen in the on-field picker and persist it as a user
	// preference (Dexie when logged in, localStorage for guests) so it carries
	// across games — mirrors how the Settings panel saves other cosmetic prefs.
	function selectBallDesign(key: string) {
		playSound(btnSfx, settings.volume);
		if (key === settings.ballDesign) return;
		settings.ballDesign = key;
		const prefs = { ballDesign: settings.ballDesign };
		if (auth.isLoggedIn && auth.currentUser?.id) {
			savePreferences(auth.currentUser.id, prefs);
		} else {
			saveGuestPreferences(prefs);
		}
	}

	// Light click feedback as the player browses skins in the picker.
	function previewBallDesign() {
		playSound(btnSfx, settings.volume);
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
			{#snippet teamDice(team: string)}
				{@const isRoller = humanRoller === team}
				{@const canRerollTeam = canReroll && team === game.powerChipHolder}
				<div class="team-dice" class:active={isRoller || canRerollTeam}>
					<img
						class="dice-flag"
						class:right={team === TEAM.AWAY}
						src={`/flags/${teamFlag(team)}.svg`}
						alt={`${teamCity(team)} flag`}
					/>
					<SoccerDice
						roll={rollFor(team)}
						diceCount={expectedDice(team)}
						rolling={rollingTeam === team}
						accentColor={teamColor(team)}
						bestSymbol={bestSymbolFor(team)}
						onlySymbol={isShotPhase ? SOCCER_SYMBOL.BALL : null}
						selectable={canReroll && team === game.powerChipHolder}
						selected={team === game.powerChipHolder ? selectedDice : []}
						onToggle={toggleDie}
						redCards={game.diceReduction[teamKey(team)]}
					/>
					<button
						class="action-button roll"
						onclick={canRerollTeam ? rerollClick : humanRollClick}
						disabled={busy || (!isRoller && !(canRerollTeam && selectedDice.length > 0))}
					>
						{canRerollTeam ? 'Re-roll' : 'Roll'}
					</button>
				</div>
			{/snippet}

			<div class="scoreboard-wrapper">
				<Scoreboard>
					{#snippet center()}
						<div class="toolbar">
							<button class="toolbar-button flip" onclick={handleExitClick} title="Quit Game" aria-label="Quit Game">
								<img src={exit} alt="Quit Game" />
							</button>
							<button class="toolbar-button" onclick={openInstructions} title="How to Play" aria-label="How to Play">
								<img src={circleInfo} alt="How to Play" />
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
					coinToss={game.action === GAME_ACTION.COIN_TOSS}
					ballDesign={settings.ballDesign}
					onSelectBall={selectBallDesign}
					onPreviewBall={previewBallDesign}
				/>

				<!-- Dice deck: a translucent band across the field's bottom edge so the
				     dice action reads as happening on the pitch. Rendered before the
				     announcement overlay so GOAL!/SAVE! still stacks on top. -->
				<div class="dice-deck">
					{@render teamDice(TEAM.HOME)}
					<button
						class="action-button resolve"
						style={resolveStyle}
						onclick={resolveClick}
						disabled={busy || !awaitingHumanResolve}
						aria-label="Resolve"
					>
						{#if resolveWinner}
							<svg
								class="play-icon"
								class:point-left={resolveWinner === TEAM.HOME}
								viewBox="0 0 100 100"
								aria-hidden="true"
							>
								<polygon points="30,18 82,50 30,82" />
							</svg>
						{:else if resolveTie}
							<!-- Back-to-back arrows: neither side won the roll. -->
							<svg class="play-icon" viewBox="0 0 100 100" aria-hidden="true">
								<polygon points="46,24 12,50 46,76" />
								<polygon points="54,24 88,50 54,76" />
							</svg>
						{/if}
					</button>
					{@render teamDice(TEAM.AWAY)}
				</div>

				<EventAnnouncement text={announcementText} type={announcementType} key={announcementKey} />
				{#if game.action === GAME_ACTION.GAME_OVER}
					<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
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

		<!-- Instructions -->
		<Modal showModal={showInstructions} close={closeInstructions} hasClose={false} choiceRequired={false}>
			<Instructions close={closeInstructions} />
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
		width: 95%;
		/* Drive the width off the *available height*: the field is aspect-ratio
		   locked (424/290 ≈ 1.462), so cap the width at whatever keeps the field
		   plus the scoreboard inside the viewport. The dice deck now overlaps the
		   field's bottom (no separate row below), so only the scoreboard banner
		   (~6rem) sits outside the field. Wider on tall screens, narrower on short
		   ones — no vertical clipping. */
		max-width: min(72rem, calc((100dvh - 6rem) * 1.462));
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
		/* Tuck the field up under the scoreboard so its top edge is slightly
		   overlapped by the score banners (which carry z-index: 100). */
		margin-top: -0.9rem;
	}

	/* Translucent band across the bottom of the field holding both dice groups
	   and the central resolve button. The field stays faintly visible through the
	   scrim so the action reads as happening on the pitch without distraction. */
	.dice-deck {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 5;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		/* align-items centres the content geometrically, but the dice and Roll
		   buttons carry a downward hard drop shadow (4px 4px 0) that pulls their
		   visual mass low and makes the solid faces read as sitting high. A little
		   more top padding than bottom nudges the content down so it *looks*
		   vertically centred in the bar. */
		padding: var(--space-2) var(--space-2) var(--space-1);
		background: oklch(0 0 0 / 0.42);
		backdrop-filter: blur(2px);
		/* Size the dice/buttons off the deck's own width, matching the old
		   scoreboard container so the cqw-based dice/roll-button scaling holds. */
		container-type: inline-size;
	}

	.team-dice {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2);
		border-radius: var(--radius-md);
		border: 2px solid transparent;
		transition: border-color var(--dur-fast) var(--ease-snes);
		/* Fill the space either side of the central resolve button so the
		   active-turn border frames the whole group. */
		flex: 1;
		box-sizing: border-box;
	}

	/* Country flag badge for each dice group, anchored to the deck (its parent
	   .team-dice is unpositioned) so it can straddle the deck's top line: home to
	   the left, away to the right, each nudged inward from the deck edge. The
	   translateY centres it on the top edge of the translucent background so half
	   sits on the pitch above. Mirrors the possession flag styling. */
	.dice-flag {
		position: absolute;
		top: calc(-1 * var(--space-3));
		left: var(--space-3);
		transform: translateY(-50%);
		height: 2.5rem;
		width: auto;
		border-radius: 0.2rem;
		box-shadow: 0 1px 5px oklch(0 0 0 / 0.6);
		pointer-events: none;
	}

	.dice-flag.right {
		left: auto;
		right: var(--space-3);
	}

	.team-dice.active {
		border-color: var(--color-text-gold, gold);
		box-shadow: 0 0 12px oklch(0.88 0.18 85 / 0.3);
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

	/* Reserve a stable footprint wide enough for "Re-roll (6)" so selecting dice —
	   which grows the label — never squeezes the dice row into a second line. To
	   keep the dice on a single line as the panel narrows, scale the button down
	   with the deck width (cqw resolves against the .dice-deck container): the
	   horizontal padding, text, and reserved min-width all shrink in step so the
	   button gives up room to the dice instead of pushing them to wrap. */
	.action-button.roll {
		flex-shrink: 0;
		min-width: clamp(2.75rem, 10cqw, 7rem);
		padding-left: clamp(var(--space-1), 1.8cqw, var(--space-5));
		padding-right: clamp(var(--space-1), 1.8cqw, var(--space-5));
		font-size: clamp(0.56rem, 1.9cqw, var(--text-base));
		white-space: nowrap;
		text-align: center;
	}

	/* Central resolve button in the dice deck, between the two dice groups.
	   Round, spherical-looking button. */
	.dice-deck .resolve {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 4.25rem;
		height: 4.25rem;
		padding: 0;
		border-radius: 50%;
		/* Filled with the current winner's color; falls back to the primary fill
		   before a winner exists or on a tie. */
		background-color: var(--resolve-solid, var(--btn-primary-bg));
		/* Inset highlight + shade over the fill give it a spherical feel. */
		box-shadow:
			inset 0 -5px 10px oklch(0 0 0 / 0.35),
			inset 0 5px 10px oklch(1 0 0 / 0.35),
			0 3px 6px oklch(0 0 0 / 0.45);
		transition:
			transform var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.dice-deck .resolve:hover:not(:disabled) {
		transform: scale(1.06);
	}

	/* Play triangle points right (toward the away team) by default; flipped to
	   point left when the home team is winning the roll. */
	.dice-deck .resolve .play-icon {
		width: 2.9rem;
		height: 2.9rem;
		/* Contrast against the winner's tint — a pale tint (e.g. a white team)
		   would otherwise swallow a white icon. */
		fill: var(--resolve-fg, #fff);
		filter: drop-shadow(0 1px 3px oklch(0 0 0 / 0.35));
	}

	.dice-deck .resolve .play-icon.point-left {
		transform: scaleX(-1);
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: 0 var(--space-2);
		/* Fill the space between the team banners with the field's dark green. The
		   light toolbar icons read clearly against it. */
		align-self: stretch;
		background: var(--color-field-border);
	}

	.toolbar-button {
		display: grid;
		place-items: center;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		padding: var(--space-1);
		transition: background-color var(--dur-fast) var(--ease-snes);
	}

	/* Subtle light wash on the green to signal interactivity. */
	.toolbar-button:hover {
		background: oklch(1 0 0 / 0.12);
	}

	.toolbar-button img {
		height: 1.25rem;
		width: 1.25rem;
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
