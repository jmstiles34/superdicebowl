<script lang="ts">
	import { FOURTH_DOWN, GAME_ACTION } from '$lib/constants/constants';
	import type { Void } from '$lib/types';
	import button from '$lib/assets/sfx/button.mp3';
	import { settings } from '$lib/state/settings.svelte';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	type FourthDownProps = {
		inFieldGoalRange: boolean;
		saveFourthDown: (a: string) => void;
		toggleFieldGoal: Void;
	};

	let { inFieldGoalRange, saveFourthDown, toggleFieldGoal }: FourthDownProps = $props();
	const buttonSfx: Howl = createSound(button);
</script>

<h3>4th Down</h3>
<p class="subtitle">Choose an option</p>

<div class="wrapper">
	<button
		class="option-button"
		onclick={() => {
			playSound(buttonSfx, settings.volume);
			saveFourthDown(GAME_ACTION.OFFENSE);
		}}
	>
		{FOURTH_DOWN.GO_FOR_IT}
	</button>

	{#if inFieldGoalRange}
		<button
			class="option-button option-button--gold"
			onclick={() => {
				playSound(buttonSfx, settings.volume);
				toggleFieldGoal();
			}}
		>
			{FOURTH_DOWN.FIELD_GOAL}
		</button>
	{/if}

	<button
		class="option-button"
		onclick={() => {
			playSound(buttonSfx, settings.volume);
			saveFourthDown(GAME_ACTION.PUNT);
		}}
	>
		{FOURTH_DOWN.PUNT}
	</button>
</div>

<style>
	h3 {
		font-family: var(--font-display);
		font-weight: var(--weight-extrabold);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		text-shadow: var(--text-shadow-display);
		color: var(--modal-header-text);
		text-align: center;
		margin: 0 0 var(--space-1) 0;
	}

	.subtitle {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		text-align: center;
		margin: 0 0 var(--space-5) 0;
	}

	.wrapper {
		display: flex;
		justify-content: center;
		align-items: stretch;
		gap: var(--space-3);
	}

	/* ── Base option button ───────────────────────────────────── */
	.option-button {
		flex: 1;
		min-width: 7rem;
		min-height: 3.5rem;
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		text-align: center;
		white-space: nowrap;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-sm);
		border: 2px solid var(--btn-secondary-border);
		background-color: var(--btn-secondary-bg);
		color: var(--btn-secondary-text);
		box-shadow: var(--btn-secondary-shadow);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes),
			color var(--dur-fast) var(--ease-snes);
	}

	.option-button:hover {
		background-color: var(--btn-secondary-bg-hover);
		box-shadow: var(--btn-secondary-shadow-hover);
		color: var(--color-text-primary);
	}

	.option-button:active {
		background-color: var(--btn-secondary-bg-active);
		transform: translateY(2px);
		box-shadow: none;
	}

	.option-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	/* ── Field goal — gold accent (high-value play) ───────────── */
	.option-button--gold {
		border-color: var(--btn-gold-border);
		background-color: var(--btn-gold-bg);
		color: var(--btn-gold-text);
		box-shadow: var(--btn-gold-shadow);
	}

	.option-button--gold:hover {
		background-color: var(--btn-gold-bg-hover);
		box-shadow: var(--btn-gold-shadow-hover);
		color: var(--btn-gold-text);
	}
</style>