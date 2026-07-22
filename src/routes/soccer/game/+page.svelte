<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import confetti from 'canvas-confetti';
	import { game } from '$lib/soccer/state/game.svelte';
	import { BALL_MOVE_ONE, BALL_MOVE_TWO, GAME_ACTION, SOCCER_SYMBOL } from '$lib/soccer/constants';
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
	import { oklchToHex, readableTextColor, sleep } from '$lib/utils/common';
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
	import fanChant1 from '$lib/assets/sfx/soccer/fan-chant-01.opus';
	import fanChant2 from '$lib/assets/sfx/soccer/fan-chant-02.opus';
	import fanChant3 from '$lib/assets/sfx/soccer/fan-chant-03.opus';
	import fanChant4 from '$lib/assets/sfx/soccer/fan-chant-04.opus';
	import fanChant5 from '$lib/assets/sfx/soccer/fan-chant-05.opus';
	import fanChant6 from '$lib/assets/sfx/soccer/fan-chant-06.opus';
	import fanChant7 from '$lib/assets/sfx/soccer/fan-chant-07.opus';
	import fanChant8 from '$lib/assets/sfx/soccer/fan-chant-08.opus';
	import fanChant9 from '$lib/assets/sfx/soccer/fan-chant-09.opus';
	import fanChant10 from '$lib/assets/sfx/soccer/fan-chant-10.opus';
	import fanChant11 from '$lib/assets/sfx/soccer/fan-chant-11.opus';
	import goal1 from '$lib/assets/sfx/soccer/goal-01.opus';
	import goal2 from '$lib/assets/sfx/soccer/goal-02.opus';
	import goal3 from '$lib/assets/sfx/soccer/goal-03.opus';
	import goal4 from '$lib/assets/sfx/soccer/goal-04.opus';
	import whistleFoul from '$lib/assets/sfx/soccer/whistle-foul.opus';
	import whistleEnd from '$lib/assets/sfx/soccer/whistle-end.opus';
	import whistleKickoff from '$lib/assets/sfx/soccer/whistle-kickoff.opus';
	import save1 from '$lib/assets/sfx/soccer/save-01.opus';
	import save2 from '$lib/assets/sfx/soccer/save-02.opus';
	import save3 from '$lib/assets/sfx/soccer/save-03.opus';
	import redCard1 from '$lib/assets/sfx/soccer/red-card-01.opus';
	import redCard2 from '$lib/assets/sfx/soccer/red-card-02.opus';
	import pass1 from '$lib/assets/sfx/soccer/pass-01.opus';
	import pass2 from '$lib/assets/sfx/soccer/pass-02.opus';
	import pass3 from '$lib/assets/sfx/soccer/pass-03.opus';
	import type { Howl } from 'howler';
	import { createLoopSound, createSound, playSound } from '$lib/utils/sound';

	const ROLL_DELAY = 650;
	const flickSfx: Howl = createSound(flick);
	const btnSfx: Howl = createSound(buttonSfx);
	// Goal celebration: alternate randomly between the two goal stings.
	const goalSfx: Howl[] = [createSound(goal1), createSound(goal2), createSound(goal3), createSound(goal4)];
	// Foul whistle: played when a roll is won on penalty (whistle) symbols.
	const whistleFoulSfx: Howl = createSound(whistleFoul);
	// Full-time whistle: played when the game ends.
	const whistleEndSfx: Howl = createSound(whistleEnd);
	// Kickoff whistle: played once the coin toss places the ball to start play.
	const whistleKickoffSfx: Howl = createSound(whistleKickoff);
	// Save: a random keeper save sting when a shot is stopped.
	const saveSfx: Howl[] = [createSound(save1), createSound(save2), createSound(save3)];
	// Red card: a random sting when a red card is issued on a roll.
	const redCardSfx: Howl[] = [createSound(redCard1), createSound(redCard2)];
	// Pass: a random kick sound when a ball move advances the ball 1-2 sections.
	const passSfx: Howl[] = [createSound(pass1), createSound(pass2), createSound(pass3)];

	// Background crowd ambience: pick a random chant on load and loop it. Kept
	// well below the SFX volume so it sits under the dice/whistle sounds.
	const CROWD_VOLUME_FACTOR = 0.35;
	const fanChants = [fanChant1, fanChant2, fanChant3, fanChant4, fanChant5, fanChant6, fanChant7, fanChant8, fanChant9, fanChant10, fanChant11];
	const crowdSfx: Howl = createLoopSound(fanChants[Math.floor(Math.random() * fanChants.length)]);

	const { awayTeam, homeTeam, mode } = settings;
	const isGameReady = awayTeam.id.length && homeTeam.id.length;

	let showSettings = $state(false);
	let showInstructions = $state(false);
	let fw = $state(fireworkShow);

	// Goal confetti: a center pop over the field, tinted with the scoring team's
	// colors. Bound to its own canvas so particles draw only over the field-area,
	// not document.body. Instance is created lazily once the canvas mounts.
	let confettiCanvas = $state<HTMLCanvasElement>();
	let fireConfetti = $derived.by<confetti.CreateTypes | null>(() =>
		confettiCanvas ? confetti.create(confettiCanvas, { resize: true }) : null
	);

	// Fire a center burst tinted with the scoring team's primary/secondary colors.
	// Skipped entirely when the user prefers reduced motion.
	function celebrateGoalConfetti(team: string) {
		if (!fireConfetti) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const t = team === TEAM.AWAY ? settings.awayTeam : settings.homeTeam;
		const colors = [oklchToHex(t.colors.primary), oklchToHex(t.colors.secondary)];
		fireConfetti({
			particleCount: 120,
			spread: 100,
			startVelocity: 45,
			origin: { x: 0.5, y: 0.55 },
			colors
		});
	}

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
		// A roll won on whistles (penalty symbol) awards a free kick — offensively
		// or as a defensive clear. Blow the foul whistle either way.
		if (added.some((e) => e.symbol === SOCCER_SYMBOL.PENALTY)) {
			playSound(whistleFoulSfx, settings.volume);
		}
		// A roll won on a red card issues one — as an advance, a defensive clear, or
		// a foul in the box. Play the red-card sting on any of them.
		if (added.some((e) => e.symbol === SOCCER_SYMBOL.RED_CARD)) {
			playSound(redCardSfx[Math.floor(Math.random() * redCardSfx.length)], settings.volume);
		}
		// A ball move that advances the ball 1-2 sections (4 or 5 balls; 6 is a
		// goal, handled above). Play a pass sound for the completed move.
		if (
			added.some(
				(e) =>
					e.symbol === SOCCER_SYMBOL.BALL &&
					e.goalsScored === 0 &&
					(e.count === BALL_MOVE_ONE || e.count === BALL_MOVE_TWO)
			)
		) {
			playSound(passSfx[Math.floor(Math.random() * passSfx.length)], settings.volume);
		}
		if (added.some((e) => e.goalsScored > 0)) {
			playSound(goalSfx[Math.floor(Math.random() * goalSfx.length)], settings.volume);
			triggerAnnouncement('GOAL!', 'goal');
			// game.goalScorer is the true scorer (set by celebrateGoal in
			// resolveResult, which runs before this) — correct even on own goals.
			if (game.goalScorer) celebrateGoalConfetti(game.goalScorer);
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
			playSound(saveSfx[Math.floor(Math.random() * saveSfx.length)], settings.volume);
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

	// The human chip holder backed out of the tie prompt — return to the roll
	// phase so they can review the dice (or re-roll) before deciding again.
	// Ignored while an AI holds the chip so a stray Escape can't derail its turn.
	function cancelTie() {
		if (isAI(game.powerChipHolder)) return;
		game.cancelTie();
	}

	// ── Persistence ──────────────────────────────────────────
	async function saveGame() {
		if (!auth.isLoggedIn || !auth.currentUser?.id) return;
		try {
			const snapshot = game.snapshotState();
			if (game.activeGameId) {
				await updateGameState(game.activeGameId, snapshot);
			} else {
				// $state.snapshot deep-clones the live team proxies to plain objects;
				// passing the raw settings proxies straight to Dexie throws
				// DataCloneError (structured clone can't serialize them).
				const gameSettings: SoccerGameSettingsSnapshot = $state.snapshot({
					sport: 'soccer' as const,
					awayTeam: settings.awayTeam,
					homeTeam: settings.homeTeam,
					mode: settings.mode,
					winScore: settings.winScore
				});
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

	// Drive the crowd loop off the volume setting: start it once audio is allowed,
	// track volume changes, and go silent (paused) when the user mutes.
	$effect(() => {
		crowdSfx.volume((settings.volume / 100) * CROWD_VOLUME_FACTOR);
		if (settings.volume > 0) {
			if (!crowdSfx.playing()) crowdSfx.play();
		} else if (crowdSfx.playing()) {
			crowdSfx.pause();
		}
	});

	// Lock to landscape on mobile (best-effort; unsupported on iOS Safari, where
	// the portrait-overlay below prompts the user to rotate instead). Mirrors the
	// football game so both play in landscape.
	onMount(() => {
		const orientation = screen.orientation as ScreenOrientation & {
			lock?(type: string): Promise<void>;
			unlock?(): void;
		};
		try {
			orientation.lock?.('landscape')?.catch(() => {});
		} catch {
			// orientation lock not supported on all platforms
		}
		return () => {
			try {
				orientation.unlock?.();
			} catch {
				// orientation unlock not supported on all platforms
			}
		};
	});

	onDestroy(() => {
		crowdSfx.stop();
		crowdSfx.unload();
		game.resetGame();
	});

	// ── Game over ────────────────────────────────────────────
	$effect(() => {
		if (game.action === GAME_ACTION.GAME_OVER) {
			playSound(whistleEndSfx, settings.volume);
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
				<div class="team-dice" class:active={isRoller || canRerollTeam} class:mirror={team === TEAM.AWAY}>
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
				<!-- Goal confetti canvas: a fixed-size backing buffer that `resize: true`
				     keeps matched to the field-area. Sits above the announcement. -->
				<canvas bind:this={confettiCanvas} class="confetti-canvas"></canvas>
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
					playSound(whistleKickoffSfx, settings.volume);
					saveGame();
				}}
			/>
		</Modal>

		<!-- Power chip tie -->
		<Modal
			showModal={game.action === GAME_ACTION.POWER_CHIP_TIE}
			close={cancelTie}
			hasClose={false}
			choiceRequired={isAI(game.powerChipHolder)}
		>
			<PowerChipModal
				holderName={teamCity(game.powerChipHolder)}
				opponentName={teamCity(OPPOSITE_TEAM[game.powerChipHolder])}
				holderIsOffense={game.chipHolderIsOffense}
				isShot={game.pendingShot != null}
				autoResolve={isAI(game.powerChipHolder)}
				onDecision={onTieDecision}
				onCancel={cancelTie}
			/>
		</Modal>

		<!-- Exit confirmation -->
		<Modal
			showModal={game.action === GAME_ACTION.EXIT}
			close={cancelExit}
			hasClose={false}
			choiceRequired={true}
		>
			<ConfirmExit cancel={cancelExit} home="/soccer" />
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

	<!-- Mobile portrait: prompt to rotate to landscape (shown when the orientation
	     lock isn't honoured, e.g. iOS Safari). -->
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
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.game {
		/* Fill the whole viewport: the scoreboard and dice deck span the full
		   width and the field stretches to take all remaining height. The field is
		   no longer aspect-ratio locked (see Field.svelte), so it expands and
		   shrinks with the screen like the football pitch instead of letterboxing. */
		width: 100%;
		flex: 1;
		min-height: 0;
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
		/* Take all the height left under the scoreboard so the pitch fills the
		   screen. The Field stretches to this box (height: 100%) and the dice deck
		   overlays its bottom edge. */
		flex: 1;
		min-height: 0;
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
		/* Gap and horizontal padding scale with the deck width so the two dice
		   groups plus the resolve button always fit a narrow phone without
		   clipping; they open back up to --space-2 on wider screens. */
		gap: clamp(0.15rem, 1cqw, var(--space-2));
		/* align-items centres the content geometrically, but the dice and Roll
		   buttons carry a downward hard drop shadow (4px 4px 0) that pulls their
		   visual mass low and makes the solid faces read as sitting high. A little
		   more top padding than bottom nudges the content down so it *looks*
		   vertically centred in the bar. */
		padding: var(--space-2) clamp(0.15rem, 1cqw, var(--space-2)) var(--space-1);
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
		gap: clamp(0.15rem, 1cqw, var(--space-2));
		padding: clamp(0.15rem, 1cqw, var(--space-2));
		border-radius: var(--radius-md);
		border: 2px solid transparent;
		transition: border-color var(--dur-fast) var(--ease-snes);
		/* Fill the space either side of the central resolve button so the
		   active-turn border frames the whole group. */
		flex: 1;
		box-sizing: border-box;
	}

	/* Away group mirrors the home group: reversing the row order puts the Roll
	   button on the inside (next to the central resolve button) and the dice
	   spanning outward, so the two sides read as a symmetric reflection. */
	.team-dice.mirror {
		flex-direction: row-reverse;
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
		min-width: clamp(1.9rem, 8cqw, 7rem);
		padding-left: clamp(var(--space-1), 1.6cqw, var(--space-5));
		padding-right: clamp(var(--space-1), 1.6cqw, var(--space-5));
		font-size: clamp(0.5rem, 1.8cqw, var(--text-base));
		white-space: nowrap;
		text-align: center;
	}

	/* Central resolve button in the dice deck, between the two dice groups.
	   Round, spherical-looking button. */
	.dice-deck .resolve {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		/* Scale with the deck so it gives up room to the dice on a narrow phone
		   (was a fixed 4.25rem, which forced the dice groups to overflow). */
		width: clamp(2.6rem, 11cqw, 4.25rem);
		height: clamp(2.6rem, 11cqw, 4.25rem);
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
		width: clamp(1.7rem, 7cqw, 2.9rem);
		height: clamp(1.7rem, 7cqw, 2.9rem);
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

	/* Goal confetti overlay: fills the field-area, never intercepts pointer
	   events, and stacks above the dice deck and GOAL! announcement. */
	.confetti-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 200;
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

	/* Hidden by default; only the mobile-portrait media query below reveals it. */
	.portrait-overlay {
		display: none;
	}

	/* ── Mobile portrait: force-landscape overlay ──────────── */
	@media (max-width: 600px) and (orientation: portrait) {
		.portrait-overlay {
			display: flex;
			position: fixed;
			inset: 0;
			z-index: 99999;
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
			0%,
			100% {
				transform: rotate(0deg);
			}
			25% {
				transform: rotate(90deg);
			}
			75% {
				transform: rotate(90deg);
			}
		}
	}
</style>
