<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Fireworks } from '@fireworks-js/svelte';
	import { auth } from '$lib/auth/authState.svelte';
	import { onlineState } from '$lib/state/onlineState.svelte';
	import { game } from '$lib/state/game.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { BALL_FIELD_GOAL, DOWN, GAME_ACTION, GAME_MODE, NOOP, TEAM } from '$lib/constants/constants';
	import { clearTurnNotifications } from '$lib/online/friends';
	import { getRemoteGame, checkAndApplyForfeit, resignGame, type RemoteGame } from '$lib/online/remoteGames';
	import {
		deriveTurn,
		isActionableState,
		pushGameState,
		markRemoteGameComplete,
		notifyYourTurn,
		notifyGameOver,
		subscribeToGame
	} from '$lib/online/remoteGameEngine';
	import button from '$lib/assets/sfx/button.mp3';
	import { sleep } from '$lib/utils/common';
	import { fireworkShow, options } from '$lib/utils/fireworks';
	import {
		compareFns,
		getScoreByTeam,
		inFieldGoalRange,
		isGameComplete,
		isRollAction,
		primaryColor,
		secondaryColor,
		showDownDistance
	} from '$lib/utils/game';
	import { createSound, playSound } from '$lib/utils/sound';
	import type { GameStateSnapshot } from '$lib/db/database';
	import Dice from '$lib/components/Dice.svelte';
	import EventAnnouncement from '$lib/components/EventAnnouncement.svelte';
	import Field from '$lib/components/Field.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PointOption from '$lib/components/modal/PointOption.svelte';
	import FourthDown from '$lib/components/modal/FourthDown.svelte';
	import Scores from '$lib/components/Scores.svelte';
	import GameSummary from '$lib/components/modal/GameSummary.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';
	import exit from '$lib/images/exit.svg';
	import gear from '$lib/images/gear.svg';
	import summary from '$lib/images/summary.svg';

	const gameId = $derived($page.params.id as string);
	const buttonSfx = createSound(button);

	let remoteGame = $state<RemoteGame | null>(null);
	let myRole = $state<'home' | 'away' | null>(null);
	let loaded = $state(false);
	let loadError = $state('');
	let waitingForAccept = $state(false);
	let showGameSummary = $state(false);
	let showSettings = $state(false);
	let fw = $state(fireworkShow);
	let channel: ReturnType<typeof subscribeToGame> | null = null;
	let diceEl = $state<{ showOpponentRoll: (d1: number, d2: number) => Promise<void> } | null>(null);

	let syncFailed = $state(false);

	let announcementText = $state('');
	let announcementType: 'touchdown' | 'turnover' | 'fieldgoal' | 'safety' = $state('touchdown');
	let announcementKey = $state(0);

	// Derived game state
	let awayScore = $derived(getScoreByTeam(TEAM.AWAY, game.playLog));
	let homeScore = $derived(getScoreByTeam(TEAM.HOME, game.playLog));
	let gameOver = $derived(
		remoteGame !== null && isGameComplete(awayScore, homeScore, remoteGame.winScore)
	);
	let opponentUsername = $derived(
		myRole === 'home'
			? (remoteGame?.awayProfile.username ?? '')
			: (remoteGame?.homeProfile.username ?? '')
	);
	let opponentUserId = $derived(
		myRole === 'home' ? (remoteGame?.awayUserId ?? '') : (remoteGame?.homeUserId ?? '')
	);

	// It's my turn when current_turn matches my role AND the action needs input
	let isMyTurn = $derived(remoteGame?.currentTurn === myRole);

	// ── Sync state ────────────────────────────────────────────
	// Version counter replaces unreliable timestamp-based reflection filtering.
	// Each push increments localVersion. Incoming events with version <= localVersion
	// are our own reflections and are discarded.
	let localVersion = 0;
	let remoteVersion = -1;
	// True only when THIS client initiated the current action (dice roll / modal).
	// Prevents the opponent's continueAfterAction chain from pushing.
	let isActingPlayer = false;
	// Prevents the continueAfterAction chain from pushing a SECOND time after
	// the initial onRollComplete/modal push. Both sides run the chain locally,
	// so only ONE push per player action is needed.
	let hasPushedForCurrentAction = false;

	let awayTeam = $derived(settings.awayTeam);
	let homeTeam = $derived(settings.homeTeam);

	// ── Init ───────────────────────────────────────────────────
	onMount(async () => {
		if (!onlineState.profile) {
			goto('/online');
			return;
		}

		let rg = await getRemoteGame(gameId);
		if (!rg) {
			loadError = 'Game not found.';
			return;
		}

		rg = await checkAndApplyForfeit(rg);

		// Pending: away player hasn't accepted yet — show waiting screen to home player.
		// Subscribe to changes so we auto-reload when the opponent accepts.
		if (rg.status === 'pending_team_select') {
			if (rg.homeUserId !== onlineState.profile.id) { goto('/online'); return; }
			remoteGame = rg;
			myRole = 'home';
			waitingForAccept = true;
			loaded = true;
			channel = subscribeToGame(gameId, () => {
				// Opponent accepted — reload the page to enter the game
				channel?.unsubscribe();
				channel = null;
				location.reload();
			});
			return;
		}

		if (rg.status !== 'in_progress') {
			// Show completed game in read-only mode
			remoteGame = rg;
			myRole =
				rg.homeUserId === onlineState.profile.id
					? 'home'
					: rg.awayUserId === onlineState.profile.id
						? 'away'
						: null;
			if (!myRole) { goto('/online'); return; }
			settings.homeTeam = rg.homeTeam;
			settings.awayTeam = rg.awayTeam!;
			settings.winScore = rg.winScore;
			settings.mode = GAME_MODE.HEAD_TO_HEAD;
			if (rg.gameState) game.loadSnapshot(rg.gameState);
			showGameSummary = true;
			loaded = true;
			return;
		}

		myRole =
			rg.homeUserId === onlineState.profile.id
				? 'home'
				: rg.awayUserId === onlineState.profile.id
					? 'away'
					: null;

		if (!myRole) {
			goto('/online');
			return;
		}

		remoteGame = rg;
		settings.homeTeam = rg.homeTeam;
		settings.awayTeam = rg.awayTeam!;
		settings.winScore = rg.winScore;
		settings.mode = GAME_MODE.HEAD_TO_HEAD;
		settings.userTeam = myRole === 'home' ? TEAM.HOME : TEAM.AWAY;

		if (rg.gameState) game.loadSnapshot(rg.gameState);

		game.setSaveGame(saveRemoteGame);
		localVersion = rg.gameState?.stateVersion ?? 0;
		loaded = true;

		channel = subscribeToGame(gameId, handleRemoteUpdate);

		// Clear stale your_turn notifications for this game — the player
		// is already in the game so the notification has served its purpose.
		clearTurnNotifications(onlineState.profile.id, gameId);
		onlineState.refreshUnreadCount();

		// Re-sync when the tab becomes visible (catches missed realtime events)
		document.addEventListener('visibilitychange', handleVisibility);

		// Poll the DB as a fallback for missed realtime events.
		// Realtime can silently drop events (WebSocket reconnects, network
		// blips, backgrounded tabs). Polling every few seconds ensures both
		// players always converge to the latest state.
		pollTimer = setInterval(resyncFromDb, POLL_INTERVAL_MS);

		// Lock orientation
		try {
			const orientation = screen.orientation as ScreenOrientation & {
				lock?(type: string): Promise<void>;
			};
			orientation.lock?.('landscape')?.catch(() => {});
		} catch {}
	});

	const POLL_INTERVAL_MS = 5000;
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	function handleVisibility() {
		if (document.visibilityState === 'visible') resyncFromDb();
	}

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
		channel?.unsubscribe();
		document.removeEventListener('visibilitychange', handleVisibility);
		game.resetGame();
		try {
			(screen.orientation as ScreenOrientation & { unlock?(): void }).unlock?.();
		} catch {}
	});

	// ── Remote save ────────────────────────────────────────────
	// Only pushes ONCE per player action. The continueAfterAction chain calls
	// this.save() multiple times, but the hasPushedForCurrentAction guard
	// ensures only the first push goes through. Both sides run the animation
	// chain locally, so they independently arrive at the same final state.
	async function saveRemoteGame() {
		if (!remoteGame || !myRole || !onlineState.profile) return;
		if (!isActingPlayer || hasPushedForCurrentAction) return;
		hasPushedForCurrentAction = true;

		localVersion++;
		const snapshot = { ...game.snapshotState(), stateVersion: localVersion };
		const newTurn = deriveTurn(snapshot);

		const ok = await pushGameState(gameId, snapshot, newTurn);
		if (!ok) {
			localVersion--;
			hasPushedForCurrentAction = false;
			syncFailed = true;
			return;
		}

		syncFailed = false;
		remoteGame = { ...remoteGame, currentTurn: newTurn, gameState: snapshot };

		// deriveTurn already accounts for chain possession flips, so
		// newTurn reliably indicates who acts next. No need to wait for
		// an actionable state — with push-once the final state is never
		// pushed, so the notification must go out with the first push.
		if (newTurn !== myRole) {
			await notifyYourTurn(gameId, opponentUserId, onlineState.profile.id);
		}
	}

	// ── Realtime handler ───────────────────────────────────────
	async function handleRemoteUpdate(
		snapshot: GameStateSnapshot,
		currentTurn: 'home' | 'away',
		_updatedAt: string
	) {
		const incomingVersion = snapshot.stateVersion ?? 0;

		// Discard our own reflections and duplicate/out-of-order events
		if (incomingVersion <= localVersion) return;
		if (incomingVersion <= remoteVersion) return;
		remoteVersion = incomingVersion;
		// Advance localVersion so our next push is always higher than
		// any version we've seen (prevents version collisions when both
		// players start from the same loaded stateVersion).
		localVersion = Math.max(localVersion, incomingVersion);

		// Opponent acted — reset our action flags
		isActingPlayer = false;
		hasPushedForCurrentAction = false;

		// Show the opponent's dice roll before applying the new state
		if (diceEl && isRollAction(game.action) && snapshot.diceId > 0) {
			const die1 = Math.floor(snapshot.diceId / 10);
			const die2 = snapshot.diceId % 10;
			await diceEl.showOpponentRoll(die1, die2);
		}

		// A newer event may have arrived and been processed during the
		// dice animation await. If so, this snapshot is stale — skip it.
		if (incomingVersion < remoteVersion) return;

		game.loadSnapshot(snapshot);
		if (remoteGame) remoteGame = { ...remoteGame, currentTurn, gameState: snapshot };
	}

	// ── Resync from DB ───────────────────────────────────────
	// Supabase realtime can miss events (WebSocket drop, backgrounded tab,
	// network glitch). Polling catches missed state changes.
	// IMPORTANT: Skip when we're the acting player — our own pushes update
	// the DB, and polling a stale version mid-action would overwrite local
	// state that hasn't been pushed yet (e.g. resetting an EP roll result).
	async function resyncFromDb() {
		if (!onlineState.profile || !myRole || !remoteGame || remoteGame.status !== 'in_progress') return;
		if (isActingPlayer) return;
		const rg = await getRemoteGame(gameId);
		if (!rg?.gameState) return;
		const dbVersion = rg.gameState.stateVersion ?? 0;
		if (dbVersion <= remoteVersion || dbVersion <= localVersion) return;
		remoteVersion = dbVersion;
		localVersion = Math.max(localVersion, dbVersion);
		game.loadSnapshot(rg.gameState);
		if (remoteGame) remoteGame = { ...remoteGame, currentTurn: rg.currentTurn, gameState: rg.gameState };
	}

	// ── Game over ──────────────────────────────────────────────
	$effect(() => {
		if (gameOver && game.action !== GAME_ACTION.GAME_OVER && remoteGame?.status === 'in_progress') {
			sleep(1500).then(async () => {
				const winner = awayScore > homeScore ? awayTeam.city : homeTeam.city;
				game.gameComplete(winner);

				const snapshot = game.snapshotState();
				const wasMe = await markRemoteGameComplete(gameId, snapshot);
				if (wasMe && remoteGame) {
					await notifyGameOver(gameId, remoteGame.homeUserId, remoteGame.awayUserId);
				}
				if (remoteGame) remoteGame = { ...remoteGame, status: 'completed' };

				sleep(100).then(() => fw.fireworksInstance().start());
				sleep(3000).then(() => (showGameSummary = true));
			});
		}
	});

	// ── Animation chain ────────────────────────────────────────
	$effect(() => {
		game.continueAfterAction();
	});

	// ── Announcements ──────────────────────────────────────────
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
		} else if (action === GAME_ACTION.INTERCEPTION) {
			announcementText = 'INTERCEPTION!';
			announcementType = 'turnover';
			announcementKey = Date.now();
		} else if (action === GAME_ACTION.FUMBLE) {
			announcementText = 'FUMBLE!';
			announcementType = 'turnover';
			announcementKey = Date.now();
		} else if (action === GAME_ACTION.TURNOVER) {
			announcementText = 'TURNOVER ON DOWNS!';
			announcementType = 'turnover';
			announcementKey = Date.now();
		} else if (lastPlay.includes('Safety')) {
			announcementText = 'SAFETY!';
			announcementType = 'safety';
			announcementKey = Date.now();
		}
	});

	// ── UI handlers ────────────────────────────────────────────
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
			goto('/online');
		} else {
			game.handleExitClick();
		}
	}

	function cancelExit() {
		playSound(buttonSfx, settings.volume);
		game.cancelExit();
	}

	let resignLoading = $state(false);

	async function handleResign() {
		if (!remoteGame || !onlineState.profile || resignLoading) return;
		resignLoading = true;
		await resignGame(gameId, onlineState.profile.id, opponentUserId);
		resignLoading = false;
		goto('/online');
	}
</script>

{#if loadError}
	<div class="load-error">
		<p>{loadError}</p>
		<a href="/online">Back to Online</a>
	</div>
{:else if waitingForAccept && remoteGame}
	<div class="load-error">
		<p>Waiting for @{remoteGame.awayProfile.username} to accept your challenge…</p>
		<a href="/online">Back to Online</a>
	</div>
{:else if loaded && remoteGame && myRole}
	<main>
		<div class="game">
			<div class="scoreboard">
				<div class="menu-with-play">
					<div class="toolbar">
						<div>
							<button class="toolbarButton flip" onclick={handleExitClick} title="Quit" aria-label="Quit">
								<img src={exit} alt="Quit" />
							</button>
						</div>
						<div class="divider">|</div>
						<div>
							<button class="toolbarButton" onclick={() => { playSound(buttonSfx, settings.volume); showGameSummary = !showGameSummary; }} title="Game Summary" aria-label="Game Summary">
								<img src={summary} alt="Game Summary" />
							</button>
						</div>
						<div class="divider">|</div>
						<div>
							<button class="toolbarButton" onclick={toggleSettings} title="Settings" aria-label="Settings">
								<img src={gear} alt="Settings" />
							</button>
						</div>
					</div>
					<div class="last-play">{game.lastPlay}</div>
				</div>

				<div class="dice-container">
					<div class="action">{game.action}</div>
					<Dice
						bind:this={diceEl}
						dieColor={primaryColor(settings, game.possession) ?? '#FFF'}
						pipColor={secondaryColor(settings, game.possession) ?? '#000'}
						onRollComplete={() => { isActingPlayer = true; hasPushedForCurrentAction = false; saveRemoteGame(); }}
					/>
					<!-- Block dice when: game is restricted, or it's not my turn during an actionable state -->
					{#if game.restrictDice || (isActionableState(game.action) && !isMyTurn)}
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

				<!-- Waiting banner — shown when it's the opponent's actionable turn -->
				{#if isActionableState(game.action) && !isMyTurn}
					<div class="waiting-banner">
						Waiting for @{opponentUsername}…
					</div>
				{/if}

				<!-- Sync status — diagnostic indicator for push failures -->
				{#if syncFailed}
					<div class="sync-status failed">Save failed — check connection</div>
				{/if}
			</div>

			<!-- Modals — only interactive when it's my turn -->
			{#if (game.action === GAME_ACTION.POINT_OPTION || game.action === GAME_ACTION.FOURTH_DOWN_OPTIONS) && isMyTurn}
				<Modal showModal={true} close={NOOP} hasClose={false} choiceRequired={true}>
					{#if game.action === GAME_ACTION.POINT_OPTION}
						<PointOption savePointOption={(a) => { game.preparePointOption(a); isActingPlayer = true; hasPushedForCurrentAction = false; saveRemoteGame(); }} />
					{:else if game.action === GAME_ACTION.FOURTH_DOWN_OPTIONS}
						<FourthDown
							inFieldGoalRange={compareFns[game.possession](game.ballIndex, BALL_FIELD_GOAL[game.possession])}
							saveFourthDown={(a) => { game.saveFourthDown(a); isActingPlayer = true; hasPushedForCurrentAction = false; saveRemoteGame(); }}
							toggleFieldGoal={() => { game.toggleFieldGoal(); isActingPlayer = true; hasPushedForCurrentAction = false; saveRemoteGame(); }}
						/>
					{/if}
				</Modal>
			{/if}

			{#if game.action === GAME_ACTION.GAME_OVER}
				<Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
			{/if}
		</div>

		<Modal showModal={showGameSummary} close={() => { playSound(buttonSfx, settings.volume); showGameSummary = !showGameSummary; }} hasClose={true} choiceRequired={false}>
			<GameSummary {awayTeam} {homeTeam} playLog={game.playLog} />
		</Modal>

		<Modal showModal={game.action === GAME_ACTION.EXIT} close={cancelExit} hasClose={false} choiceRequired={true}>
			<div class="exit-container">
				<h3>Leave Game</h3>
				<p class="exit-subtitle">You can return to this game later from the online lobby.</p>
				<div class="exit-buttons">
					<button class="exit-btn secondary" onclick={cancelExit}>Cancel</button>
					<button class="exit-btn" onclick={() => goto('/online')}>Leave</button>
					<button class="exit-btn danger" onclick={handleResign} disabled={resignLoading}>
						{resignLoading ? 'Resigning…' : 'Resign'}
					</button>
				</div>
			</div>
		</Modal>

		<Modal showModal={showSettings} close={toggleSettings} hasClose={true} choiceRequired={false}>
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
	.load-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
	}
	.load-error a {
		color: var(--color-text-brand);
	}
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
		color: var(--color-text-brand);
		font-weight: bold;
		font-size: 1.25rem;
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
		font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
		color: var(--color-text-gold);
		margin-top: 18px;
		width: 100%;
	}
	.field-container {
		position: relative;
		clip-path: inset(0 -1rem);
	}
	.waiting-banner {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background: oklch(0.15 0.02 240 / 0.9);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		padding: 0.4rem 1rem;
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		white-space: nowrap;
		pointer-events: none;
	}
	.sync-status {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		font-size: 0.65rem;
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-sm);
		pointer-events: none;
		z-index: 10;
	}
	.sync-status.failed {
		background: oklch(0.4 0.15 25 / 0.9);
		color: oklch(0.9 0.1 25);
		border: 1px solid oklch(0.6 0.15 25);
		animation: pulse 2s ease-in-out infinite;
	}
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
	.exit-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-8);
	}
	.exit-container h3 {
		font-family: var(--font-display);
		font-weight: var(--weight-extrabold);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		text-shadow: var(--text-shadow-display);
		color: var(--modal-header-text);
		text-align: center;
		margin: 0;
	}
	.exit-subtitle {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		text-align: center;
		margin: 0;
	}
	.exit-buttons {
		display: flex;
		justify-content: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}
	.exit-btn {
		min-width: 7rem;
		min-height: 2.75rem;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		border: 2px solid var(--btn-secondary-border);
		background-color: var(--btn-secondary-bg);
		color: var(--btn-secondary-text);
		box-shadow: var(--btn-secondary-shadow);
		cursor: pointer;
	}
	.exit-btn:hover { background-color: var(--btn-secondary-bg-hover); }
	.exit-btn.secondary { border-color: var(--btn-secondary-border); }
	.exit-btn.danger {
		border-color: var(--btn-danger-border);
		background-color: var(--btn-danger-bg);
		color: var(--btn-danger-text);
		box-shadow: var(--btn-danger-shadow);
	}
	.exit-btn.danger:hover { background-color: var(--btn-danger-bg-hover); }
	.exit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
	:global(.fireworks) {
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		position: fixed;
		background: transparent;
	}
	@media (max-width: 40rem) {
		.scoreboard { top: 2.25rem; }
		.scores { margin-top: 0; }
		.dice-container { padding: 0.2rem 0.25rem; }
		.action { font-size: 0.7rem; }
		.toolbar { gap: 8px; margin-top: 6px; }
		.toolbarButton img { height: 16px; width: 16px; }
		.divider { font-size: 0.85rem; }
		.last-play { margin-top: 8px; }
	}
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
		.scoreboard { top: 0; flex-shrink: 0; }
		.field-container { flex: 1; min-height: 0; margin-top: -2.75rem; }
	}
</style>
