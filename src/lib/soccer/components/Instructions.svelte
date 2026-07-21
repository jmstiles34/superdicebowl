<script lang="ts">
	import SymbolIcon from '$lib/soccer/components/SymbolIcon.svelte';
	import { SOCCER_SYMBOL } from '$lib/soccer/constants';
	import { settings } from '$lib/state/settings.svelte';

	let { close }: { close: () => void } = $props();

	const symbols = [
		{
			symbol: SOCCER_SYMBOL.BALL,
			name: 'Ball Move',
			text: 'Advance the ball toward the goal — 4 balls moves 1 section, 5 moves 2, and 6 is an instant goal. On defense it clears the ball back the other way.'
		},
		{
			symbol: SOCCER_SYMBOL.KICK,
			name: 'Kick',
			text: 'On offense, take a Shot on Goal. On defense, boot the ball out to the midline.'
		},
		{
			symbol: SOCCER_SYMBOL.PENALTY,
			name: 'Penalty',
			text: 'On offense, earn a Free Kick on goal (the keeper rolls one fewer die). On defense, clear to the midline.'
		},
		{
			symbol: SOCCER_SYMBOL.RED_CARD,
			name: 'Red Card',
			text: 'Advance one section, and your opponent rolls one fewer die until the next shot is taken.'
		}
	];
</script>

<div class="instructions">
	<h3>How to Play</h3>

	<p class="lead">
		Be the first nation to score <strong>{settings.winScore}</strong>
		{settings.winScore === 1 ? 'goal' : 'goals'}.
	</p>

	<section>
		<h4>Each Round</h4>
		<p>
			Both teams roll their 6 dice (tap <em>Roll</em> for each side). The symbol you roll most
			becomes your play, and the team with more matching dice wins the roll. The winner's play is
			applied — then the round repeats.
		</p>
	</section>

	<section>
		<h4>Attack &amp; Defense</h4>
		<p>
			You're on <strong>offense</strong> when the ball is in your opponent's half and on
			<strong>defense</strong> when it's in your own. Push the ball past the midline to go on the
			attack.
		</p>
	</section>

	<section>
		<h4>The Dice</h4>
		<ul class="symbol-list">
			{#each symbols as s (s.symbol)}
				<li>
					<span class="sym"><SymbolIcon symbol={s.symbol} /></span>
					<span class="sym-text"><strong>{s.name}</strong> — {s.text}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h4>Shots on Goal</h4>
		<p>
			For a shot or free kick, both teams roll again — most <em>Balls</em> wins. Score or save, then
			the defending team restarts on offense at the midline.
		</p>
	</section>

	<section>
		<h4>Power Chip</h4>
		<p>
			When a roll ties, the chip holder may spend it to win — but it then passes to the opponent. You
			can also spend the chip to re-roll any of your own dice.
		</p>
	</section>

	<button class="got-it" onclick={close}>Got it!</button>
</div>

<style>
	.instructions {
		max-width: min(30rem, 82vw);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
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

	h4 {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-black);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-gold, gold);
		margin: 0 0 var(--space-1) 0;
	}

	.lead {
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		color: var(--color-text-primary);
		text-align: center;
		margin: 0;
	}

	section {
		margin: 0;
	}

	p {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		line-height: 1.5;
		color: var(--color-text-secondary);
		margin: 0;
	}

	strong {
		color: var(--color-text-primary);
	}

	.symbol-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.symbol-list li {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2-5);
	}

	.sym {
		flex-shrink: 0;
		width: 1.9rem;
		height: 1.9rem;
		padding: 0.2rem;
		border-radius: var(--radius-sm);
		background-color: var(--dice-bg, #fff);
		border: 1px solid var(--color-border-default);
		display: grid;
		place-items: center;
	}

	.sym-text {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		line-height: 1.4;
		color: var(--color-text-secondary);
	}

	.got-it {
		align-self: center;
		margin-top: var(--space-1);
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		padding: var(--space-2-5) var(--space-8);
		border-radius: var(--radius-sm);
		cursor: pointer;
		background-color: var(--btn-primary-bg);
		color: var(--btn-primary-text);
		border: 2px solid var(--btn-primary-border);
		box-shadow: var(--btn-primary-shadow);
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.got-it:hover {
		background-color: var(--btn-primary-bg-hover);
		box-shadow: var(--btn-primary-shadow-hover);
	}

	.got-it:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}
</style>
