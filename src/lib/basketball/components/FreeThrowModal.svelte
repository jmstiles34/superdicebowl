<script lang="ts">
	import { game } from '$lib/basketball/state/game.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { nonZeroRandomNumber, sleep } from '$lib/utils/common';

	type FreeThrowProps = {
		autoRoll?: boolean;
		onShoot?: (result: 'made' | 'missed', onComplete: () => void) => void;
	};

	let { autoRoll = false, onShoot }: FreeThrowProps = $props();

	let dieValue: number = $state(0);
	let rolling = $state(false);
	let canRoll = $state(true);
	let result: 'made' | 'missed' | null = $state(null);

	const rollDie = async () => {
		if (!canRoll || rolling) return;

		canRoll = false;
		rolling = true;
		result = null;

		const value = nonZeroRandomNumber(6);
		await sleep(800 * settings.speed);

		dieValue = value;
		rolling = false;
		const shotResult = value % 2 === 0 ? 'made' : 'missed';

		if (onShoot) {
			onShoot(shotResult, () => {
				result = shotResult;
				game.handleFreeThrow(value);
				finishFreeThrow();
			});
		} else {
			result = shotResult;
			game.handleFreeThrow(value);
			finishFreeThrow();
		}
	};

	const finishFreeThrow = async () => {
		await sleep(1000 * settings.speed);
		result = null;

		if (game.freeThrowsRemaining > 0) {
			canRoll = true;
		} else {
			game.continueAfterAction();
		}
	};

	$effect(() => {
		if (autoRoll && canRoll && !rolling && game.freeThrowsRemaining > 0) {
			sleep(1500 * settings.speed).then(() => {
				if (canRoll && !rolling) {
					rollDie();
				}
			});
		}
	});
</script>

<div class="free-throw">
	<h3>Free Throw</h3>
	<p class="subtitle">
		{game.freeThrowsRemaining} remaining — {game.freeThrowsScored} made
	</p>

	<button
		class="die-button"
		class:rolling
		class:made={result === 'made'}
		class:missed={result === 'missed'}
		onclick={rollDie}
		disabled={!canRoll || rolling}
	>
		{#if rolling}
			<span class="die-face">?</span>
		{:else if dieValue > 0}
			<span class="die-face">{dieValue}</span>
		{:else}
			<span class="die-face">Tap</span>
		{/if}
	</button>

	{#if result}
		<p class="result" class:made={result === 'made'} class:missed={result === 'missed'}>
			{result === 'made' ? 'Good!' : 'No good'}
		</p>
	{/if}
</div>

<style>
	.free-throw {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
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

	.die-button {
		width: 5rem;
		height: 5rem;
		border-radius: var(--radius-md);
		background-color: var(--btn-primary-bg);
		border: 3px solid var(--btn-primary-border);
		box-shadow: var(--btn-primary-shadow);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes),
			transform var(--dur-fast) var(--ease-snes);
	}

	.die-button:hover:not(:disabled) {
		background-color: var(--btn-primary-bg-hover);
		box-shadow: var(--btn-primary-shadow-hover);
		transform: scale(1.05);
	}

	.die-button:disabled {
		cursor: default;
	}

	.die-button.rolling {
		animation: shake 0.3s ease-in-out infinite;
	}

	.die-button.made {
		background-color: oklch(0.5 0.15 145);
		border-color: oklch(0.6 0.15 145);
	}

	.die-button.missed {
		background-color: oklch(0.5 0.2 25);
		border-color: oklch(0.6 0.2 25);
	}

	.die-face {
		font-family: var(--font-numeric);
		font-size: var(--text-display-md);
		font-weight: var(--weight-black);
		color: var(--color-on-accent);
	}

	.result {
		font-family: var(--font-display);
		font-weight: var(--weight-extrabold);
		font-style: italic;
		font-size: var(--text-lg);
		letter-spacing: var(--tracking-display);
		margin: 0;
	}

	.result.made {
		color: oklch(0.7 0.15 145);
	}

	.result.missed {
		color: oklch(0.7 0.2 25);
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-3px) rotate(-2deg); }
		75% { transform: translateX(3px) rotate(2deg); }
	}
</style>
