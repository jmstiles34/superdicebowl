<script lang="ts">
	import { game } from '$lib/hockey/state/game.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { nonZeroRandomNumber, sleep } from '$lib/utils/common';

	type SaveAttemptProps = {
		autoRoll?: boolean;
		onResult?: (result: 'save' | 'goal') => void;
	};

	let { autoRoll = false, onResult }: SaveAttemptProps = $props();

	let rolling = $state(false);
	let canRoll = $state(true);
	let result: 'save' | 'goal' | null = $state(null);
	let rolledValue: number = $state(0);

	// Puck animation state
	let puckVisible = $state(false);
	let puckX = $state(50);
	let puckY = $state(50);
	let puckAtTarget = $state(false);

	// Goal lamp
	let lampOn = $state(false);

	// Randomize which 3 numbers are saves and which 3 are goals
	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	const shuffled = shuffle([1, 2, 3, 4, 5, 6]);
	const saveNumbers = new Set(shuffled.slice(0, 3));
	const goalNumbers = new Set(shuffled.slice(3));

	// Positions for the 6 zones (percentage-based within the scene)
	// Save positions: on the goalie (glove high, chest, blocker low)
	// Goal positions: open net (top-left, top-right, five-hole)
	type Zone = { x: number; y: number; type: 'save' | 'goal'; value: number };

	const savePositions = [
		{ x: 27, y: 42 },  // glove side
		{ x: 50, y: 48 },  // chest
		{ x: 73, y: 42 },  // blocker side
	];

	const goalPositions = [
		{ x: 22, y: 22 },  // top-left corner
		{ x: 78, y: 22 },  // top-right corner
		{ x: 50, y: 72 },  // five-hole
	];

	const saveNums = [...saveNumbers];
	const goalNums = [...goalNumbers];

	const zones: Zone[] = [
		...savePositions.map((p, i) => ({ ...p, type: 'save' as const, value: saveNums[i] })),
		...goalPositions.map((p, i) => ({ ...p, type: 'goal' as const, value: goalNums[i] })),
	];

	function zoneForValue(v: number): Zone {
		return zones.find((z) => z.value === v)!;
	}

	const rollDie = async () => {
		if (!canRoll || rolling) return;

		canRoll = false;
		rolling = true;
		result = null;
		puckAtTarget = false;
		lampOn = false;

		const value = nonZeroRandomNumber(6);
		rolledValue = value;
		const zone = zoneForValue(value);
		const outcome: 'save' | 'goal' = saveNumbers.has(value) ? 'save' : 'goal';

		// Show puck at bottom center
		puckVisible = true;
		puckX = 50;
		puckY = 95;

		await sleep(100);

		// Animate puck to target zone
		puckX = zone.x;
		puckY = zone.y;

		await sleep(500 * settings.speed);

		// Puck arrived
		puckAtTarget = true;
		rolling = false;
		result = outcome;

		if (outcome === 'goal') {
			lampOn = true;
		}

		game.handleSaveRoll(value, outcome);
		onResult?.(outcome);

		await sleep(3000 * settings.speed);

		// Clean up and continue
		puckVisible = false;
		puckAtTarget = false;
		lampOn = false;
		result = null;
		game.continueAfterAction();
	};

	$effect(() => {
		if (autoRoll && canRoll && !rolling) {
			sleep(1500 * settings.speed).then(() => {
				if (canRoll && !rolling) {
					rollDie();
				}
			});
		}
	});
</script>

<div class="save-scene-wrapper">
	<h3>Shot on Goal!</h3>
	<p class="subtitle">Tap to shoot</p>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="scene"
		class:lamp-active={lampOn}
		onclick={rollDie}
		style:cursor={canRoll && !rolling ? 'pointer' : 'default'}
	>
		<!-- Goal net background -->
		<img
			class="goal-img"
			src="/images/hockey-goal.webp"
			alt="Hockey goal"
		/>

		<!-- Goalie overlay -->
		<img
			class="goalie-img"
			class:save-flash={result === 'save'}
			src="/images/hockey-goalie.svg"
			alt="Goalie"
		/>

		<!-- Number zones -->
		{#each zones as zone (zone.value)}
			<div
				class="zone"
				class:zone-save={zone.type === 'save'}
				class:zone-goal={zone.type === 'goal'}
				class:zone-hit={puckAtTarget && rolledValue === zone.value}
				class:zone-hit-save={puckAtTarget && rolledValue === zone.value && result === 'save'}
				class:zone-hit-goal={puckAtTarget && rolledValue === zone.value && result === 'goal'}
				style:left="{zone.x}%"
				style:top="{zone.y}%"
			>
				{zone.value}
			</div>
		{/each}

		<!-- Puck -->
		{#if puckVisible}
			<div
				class="puck"
				class:puck-at-target={puckAtTarget}
				style:left="{puckX}%"
				style:top="{puckY}%"
			>
			</div>
		{/if}

		<!-- Goal lamp -->
		{#if lampOn}
			<div class="goal-lamp"></div>
		{/if}
	</div>

	<!-- Result text -->
	{#if result}
		<p class="result-text" class:is-save={result === 'save'} class:is-goal={result === 'goal'}>
			{result === 'save' ? 'SAVE!' : 'GOAL!'}
		</p>
	{/if}
</div>

<style>
	.save-scene-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		min-width: min(22rem, 80vw);
	}

	h3 {
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

	.subtitle {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		text-align: center;
		margin: 0;
	}

	/* ── Scene container ───────────────────────────────────── */
	.scene {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 3;
		border-radius: var(--radius-md);
		overflow: hidden;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		background: oklch(0.25 0.01 240);
		transition: box-shadow 0.3s ease;
	}

	.scene.lamp-active {
		box-shadow:
			0 0 30px oklch(0.65 0.28 25 / 0.6),
			0 0 60px oklch(0.65 0.28 25 / 0.3),
			inset 0 0 40px oklch(0.65 0.28 25 / 0.15);
	}

	/* ── Goal image ────────────────────────────────────────── */
	.goal-img {
		position: absolute;
		inset: 5% 8%;
		width: 84%;
		height: 90%;
		object-fit: contain;
		z-index: 1;
	}

	/* ── Goalie image ──────────────────────────────────────── */
	.goalie-img {
		position: absolute;
		left: 50%;
		bottom: 2%;
		width: 65%;
		height: 85%;
		transform: translateX(-50%);
		object-fit: contain;
		z-index: 3;
		filter: drop-shadow(0 2px 6px oklch(0 0 0 / 0.6));
		transition: filter 0.3s ease;
	}

	.goalie-img.save-flash {
		filter:
			drop-shadow(0 0 12px oklch(0.7 0.2 145 / 0.8))
			drop-shadow(0 0 24px oklch(0.7 0.2 145 / 0.4));
		animation: goalie-save 0.4s ease-out;
	}

	@keyframes goalie-save {
		0% { transform: translateX(-50%) scale(1); }
		30% { transform: translateX(-50%) scale(1.06); }
		100% { transform: translateX(-50%) scale(1); }
	}

	/* ── Number zones ──────────────────────────────────────── */
	.zone {
		position: absolute;
		transform: translate(-50%, -50%);
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-numeric);
		font-size: var(--text-lg);
		font-weight: var(--weight-black);
		z-index: 4;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		pointer-events: none;
	}

	.zone-save {
		background: oklch(0.45 0.15 145 / 0.85);
		color: oklch(0.95 0.03 145);
		border: 2px solid oklch(0.6 0.15 145);
		text-shadow: 0 1px 2px oklch(0 0 0 / 0.5);
	}

	.zone-goal {
		background: oklch(0.5 0.2 25 / 0.85);
		color: oklch(0.95 0.05 25);
		border: 2px solid oklch(0.65 0.2 25);
		text-shadow: 0 1px 2px oklch(0 0 0 / 0.5);
	}

	.zone-hit {
		transform: translate(-50%, -50%) scale(1.4);
	}

	.zone-hit-save {
		box-shadow:
			0 0 12px oklch(0.7 0.2 145 / 0.9),
			0 0 24px oklch(0.7 0.2 145 / 0.5);
		animation: zone-pulse-save 0.6s ease-in-out infinite;
	}

	.zone-hit-goal {
		box-shadow:
			0 0 12px oklch(0.7 0.25 25 / 0.9),
			0 0 24px oklch(0.7 0.25 25 / 0.5);
		animation: zone-pulse-goal 0.6s ease-in-out infinite;
	}

	@keyframes zone-pulse-save {
		0%, 100% { box-shadow: 0 0 12px oklch(0.7 0.2 145 / 0.9), 0 0 24px oklch(0.7 0.2 145 / 0.5); }
		50% { box-shadow: 0 0 20px oklch(0.7 0.2 145 / 1), 0 0 40px oklch(0.7 0.2 145 / 0.7); }
	}

	@keyframes zone-pulse-goal {
		0%, 100% { box-shadow: 0 0 12px oklch(0.7 0.25 25 / 0.9), 0 0 24px oklch(0.7 0.25 25 / 0.5); }
		50% { box-shadow: 0 0 20px oklch(0.7 0.25 25 / 1), 0 0 40px oklch(0.7 0.25 25 / 0.7); }
	}

	/* ── Puck ──────────────────────────────────────────────── */
	.puck {
		position: absolute;
		width: 1.25rem;
		height: 1.25rem;
		background: oklch(0.15 0 0);
		border: 2px solid oklch(0.4 0 0);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		z-index: 5;
		transition:
			left 0.45s cubic-bezier(0.22, 1, 0.36, 1),
			top 0.45s cubic-bezier(0.22, 1, 0.36, 1);
		box-shadow: 0 2px 6px oklch(0 0 0 / 0.7);
	}

	.puck.puck-at-target {
		animation: puck-impact 0.3s ease-out;
	}

	@keyframes puck-impact {
		0% { transform: translate(-50%, -50%) scale(1); }
		40% { transform: translate(-50%, -50%) scale(1.5); }
		100% { transform: translate(-50%, -50%) scale(1); }
	}

	/* ── Goal lamp ─────────────────────────────────────────── */
	.goal-lamp {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: oklch(0.65 0.28 25);
		z-index: 6;
		animation: lamp-flash 0.4s ease-in-out infinite alternate;
		box-shadow:
			0 0 20px oklch(0.65 0.28 25 / 0.9),
			0 0 50px oklch(0.65 0.28 25 / 0.6),
			0 0 100px oklch(0.65 0.28 25 / 0.3);
	}

	@keyframes lamp-flash {
		0% { opacity: 0.6; background: oklch(0.55 0.25 25); }
		100% { opacity: 1; background: oklch(0.72 0.28 25); }
	}

	/* ── Result text ───────────────────────────────────────── */
	.result-text {
		font-family: var(--font-display);
		font-weight: var(--weight-extrabold);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		margin: 0;
		animation: result-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.result-text.is-save {
		color: oklch(0.7 0.15 145);
		text-shadow: 0 0 12px oklch(0.7 0.15 145 / 0.5);
	}

	.result-text.is-goal {
		color: oklch(0.7 0.2 25);
		text-shadow: 0 0 12px oklch(0.7 0.2 25 / 0.5);
	}

	@keyframes result-pop {
		0% { transform: scale(0.5); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}
</style>
