<script lang="ts">
	import SymbolIcon from '$lib/soccer/components/SymbolIcon.svelte';
	import type { SoccerRoll, SoccerSymbol } from '$lib/soccer/types';

	type Props = {
		roll?: SoccerRoll | null;
		diceCount?: number;
		rolling?: boolean;
		accentColor?: string;
		bestSymbol?: SoccerSymbol | null;
		selectable?: boolean;
		selected?: number[];
		onToggle?: (index: number) => void;
	};

	let {
		roll = null,
		diceCount = 6,
		rolling = false,
		accentColor = 'var(--color-border-default)',
		bestSymbol = null,
		selectable = false,
		selected = [],
		onToggle
	}: Props = $props();

	// How many die slots to render: the roll if present, else the expected count.
	let slots = $derived(roll ? roll.length : diceCount);
	let selectedSet = $derived(new Set(selected));
</script>

<div class="dice-row" style:--accent={accentColor}>
	{#each Array(slots) as _, i (i)}
		{@const symbol = roll?.[i] ?? null}
		<button
			type="button"
			class="die"
			class:rolling
			class:best={!rolling && symbol != null && symbol === bestSymbol}
			class:selected={selectedSet.has(i)}
			class:selectable
			disabled={!selectable}
			aria-label={selectable ? `Toggle die ${i + 1} for re-roll` : undefined}
			onclick={() => selectable && onToggle?.(i)}
		>
			{#if !rolling && symbol}
				{#key symbol}
					<span class="face reveal"><SymbolIcon {symbol} /></span>
				{/key}
			{/if}
		</button>
	{/each}
</div>

<style>
	.dice-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-1);
		padding: var(--space-1);
		border-radius: var(--radius-md);
	}

	.die {
		position: relative;
		width: 2.4rem;
		height: 2.4rem;
		padding: 0.3rem;
		margin: 0;
		border-radius: var(--radius-md);
		background-color: var(--dice-bg, #fff);
		border: 2px solid var(--accent);
		box-shadow: var(--dice-shadow);
		display: grid;
		place-items: center;
		transition:
			transform var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes),
			opacity var(--dur-fast) var(--ease-snes);
	}

	.die:disabled {
		cursor: default;
	}

	.die.selectable {
		cursor: pointer;
	}

	.die.selectable:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.die.best {
		box-shadow:
			0 0 0 2px var(--accent),
			0 0 10px var(--accent);
		transform: translateY(-2px);
	}

	.die.selected {
		outline: 3px dashed var(--color-text-gold, gold);
		outline-offset: 1px;
		opacity: 0.85;
	}

	.face {
		width: 100%;
		height: 100%;
	}

	.reveal {
		animation: die-reveal var(--dur-base) var(--ease-snes);
	}

	@keyframes die-reveal {
		0% {
			transform: scale(0) rotate(-90deg);
			opacity: 0;
		}
		100% {
			transform: scale(1) rotate(0);
			opacity: 1;
		}
	}

	/* Tumbling blank while awaiting a result */
	.die.rolling {
		animation: die-tumble 0.5s linear infinite;
	}

	@keyframes die-tumble {
		0% {
			transform: rotate(0) scale(0.92);
		}
		50% {
			transform: rotate(180deg) scale(1);
		}
		100% {
			transform: rotate(360deg) scale(0.92);
		}
	}

	@media (max-width: 40rem) {
		.die {
			width: 1.85rem;
			height: 1.85rem;
			padding: 0.2rem;
		}
	}
</style>
