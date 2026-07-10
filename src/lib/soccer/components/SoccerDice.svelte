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
		// Red-card penalties: how many die slots to render as a pulsing red card
		// instead of a die. These sit in place of the dice the team lost, so a
		// carded team still shows a full row (rolled dice + red-card markers).
		redCards?: number;
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
		onToggle,
		redCards = 0
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

	<!-- Red-card markers stand in for the dice a carded team has lost: a pulsing
	     red card in each missing die's slot instead of the die itself. -->
	{#each Array(redCards) as _, j (`rc-${j}`)}
		<span
			class="red-card-die"
			title="Red card — one fewer die until the next goal"
		>
			<svg class="red-card-svg" viewBox="0 0 24 24" role="img" aria-label="Red card penalty">
				<rect x="7" y="2.5" width="10" height="19" rx="1.6" fill="#d62828" stroke="#7a1010" stroke-width="1" />
				<rect x="8.6" y="4.2" width="2" height="15.6" rx="1" fill="#e85a5a" opacity="0.6" />
			</svg>
		</span>
	{/each}
</div>

<style>
	/* Never wrap: the row stays on one line. The dice scale with the deck width
	   (cqw resolves against the .dice-deck container) so they grow on wide screens
	   and shrink on narrow ones while six dice plus the Roll button keep fitting a
	   single line. */
	.dice-row {
		/* Size tracks the deck width: 5.2cqw scales it across screens, the 3.2rem
		   cap sets how big it gets on a wide board, and the 1.2rem floor keeps it
		   legible (and one-line) on a narrow one. Shared by dice and red-card
		   markers so they occupy identical slots. */
		--die-size: clamp(1.2rem, 5.2cqw, 3.2rem);
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		align-items: center;
		gap: clamp(0.12rem, 0.9cqw, var(--space-3));
		padding: clamp(0.12rem, 0.8cqw, var(--space-2));
		border-radius: var(--radius-md);
	}

	.die {
		position: relative;
		flex-shrink: 0;
		width: var(--die-size);
		height: var(--die-size);
		box-sizing: border-box;
		padding: clamp(0.12rem, 0.7cqw, 0.35rem);
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

	/* Red-card marker: occupies a die slot (same footprint) but shows a pulsing
	   red card instead of a die face, standing in for the die the team lost. */
	.red-card-die {
		flex-shrink: 0;
		width: var(--die-size);
		height: var(--die-size);
		display: grid;
		place-items: center;
	}

	.red-card-die .red-card-svg {
		height: 100%;
		width: auto;
		transform: rotate(-8deg);
		filter: drop-shadow(0 1px 2px oklch(0 0 0 / 0.55));
		animation: red-card-pulse 1.6s var(--ease-snes, ease-in-out) infinite;
	}

	@keyframes red-card-pulse {
		0%,
		100% {
			transform: rotate(-8deg) scale(1);
			filter: drop-shadow(0 1px 2px oklch(0 0 0 / 0.55));
		}
		50% {
			transform: rotate(-8deg) scale(1.12);
			filter: drop-shadow(0 1px 2px oklch(0 0 0 / 0.55)) drop-shadow(0 0 7px oklch(0.6 0.22 25 / 0.85));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.red-card-die .red-card-svg {
			animation: none;
		}
	}
</style>
