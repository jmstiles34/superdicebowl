<script lang="ts">
	import { settings } from '$lib/state/settings.svelte';
	import { aiShouldUseChip } from '$lib/soccer/utils/game';
	import { sleep } from '$lib/utils/common';

	type Props = {
		holderName: string;
		opponentName: string;
		holderIsOffense: boolean;
		isShot: boolean;
		autoResolve?: boolean;
		onDecision: (useChip: boolean) => void;
	};

	let {
		holderName,
		opponentName,
		holderIsOffense,
		isShot,
		autoResolve = false,
		onDecision
	}: Props = $props();

	let decided = $state(false);

	function decide(useChip: boolean) {
		if (decided) return;
		decided = true;
		onDecision(useChip);
	}

	// AI holder decides automatically after a short beat.
	$effect(() => {
		if (autoResolve && !decided) {
			sleep(1200 * settings.speed).then(() => decide(aiShouldUseChip(isShot, holderIsOffense)));
		}
	});
</script>

<div class="chip-modal">
	<h3>Tie Roll!</h3>
	<div class="chip-icon" aria-hidden="true">◉</div>
	<p class="body">
		<strong>{holderName}</strong> holds the Power Chip.
		{#if isShot}
			Use it to win the {holderIsOffense ? 'shot' : 'save'}?
		{:else}
			Use it to win this roll?
		{/if}
	</p>

	{#if autoResolve}
		<p class="thinking">{holderName} is deciding…</p>
	{:else}
		<div class="actions">
			<button class="chip-btn use" onclick={() => decide(true)}>
				Use Chip — Win
				<span class="hint">(passes to {opponentName})</span>
			</button>
			<button class="chip-btn keep" onclick={() => decide(false)}>
				Keep Chip
				<span class="hint">({opponentName} wins the roll)</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.chip-modal {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		min-width: min(20rem, 80vw);
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

	.chip-icon {
		font-size: 2.75rem;
		line-height: 1;
		color: var(--color-text-gold, gold);
		text-shadow:
			0 0 10px oklch(0.88 0.18 85 / 0.8),
			0 0 22px oklch(0.88 0.18 85 / 0.4);
		animation: chip-pulse 1.6s ease-in-out infinite;
	}

	@keyframes chip-pulse {
		0%, 100% { transform: scale(1); opacity: 1; }
		50% { transform: scale(0.9); opacity: 0.7; }
	}

	.body {
		font-family: var(--font-body);
		font-size: var(--text-base);
		color: var(--color-text-primary);
		text-align: center;
		margin: 0;
	}

	.thinking {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		margin: 0;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
	}

	.chip-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		padding: var(--space-2-5) var(--space-4);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.chip-btn:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.chip-btn.use {
		background-color: var(--btn-gold-bg);
		color: var(--btn-gold-text);
		border: 2px solid var(--btn-gold-border);
		box-shadow: var(--btn-gold-shadow);
	}

	.chip-btn.keep {
		background-color: var(--btn-secondary-bg);
		color: var(--btn-secondary-text);
		border: 2px solid var(--btn-secondary-border);
		box-shadow: var(--btn-secondary-shadow);
	}

	.chip-btn:hover {
		filter: brightness(1.05);
	}

	.hint {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: none;
		opacity: 0.85;
	}
</style>
