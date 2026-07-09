<script lang="ts">
	import SymbolIcon from '$lib/soccer/components/SymbolIcon.svelte';
	import type { SoccerRoll, SoccerSymbol } from '$lib/soccer/types';

	type Props = {
		roll?: SoccerRoll | null;
		diceCount?: number;
		rolling?: boolean;
		accentColor?: string;
		bestSymbol?: SoccerSymbol | null;
		// When set, only this symbol matters (a shot on goal): every other symbol
		// is greyed out to emphasise which dice count.
		onlySymbol?: SoccerSymbol | null;
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
		onlySymbol = null,
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
			class:dim={!rolling && symbol != null && onlySymbol != null && symbol !== onlySymbol}
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
	/* Never wrap: the row must stay on one line. The dice instead scale down with
	   the board width (cqw resolves against the .scoreboard container) so six dice
	   plus the Roll button keep fitting a single line as the panel narrows. */
	.dice-row {
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		gap: clamp(0.12rem, 0.9cqw, var(--space-3));
		padding: clamp(0.12rem, 0.8cqw, var(--space-2));
		border-radius: var(--radius-md);
	}

	.die {
		position: relative;
		flex-shrink: 0;
		width: clamp(1.05rem, 4cqw, 2.4rem);
		height: clamp(1.05rem, 4cqw, 2.4rem);
		padding: clamp(0.12rem, 0.7cqw, 0.3rem);
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
			opacity var(--dur-fast) var(--ease-snes),
			filter var(--dur-fast) var(--ease-snes);
	}

	/* During a shot, dice that aren't the deciding symbol (balls) are greyed and
	   faded so the eye is drawn to the ones that count. */
	.die.dim {
		filter: grayscale(1);
		opacity: 0.35;
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

</style>
