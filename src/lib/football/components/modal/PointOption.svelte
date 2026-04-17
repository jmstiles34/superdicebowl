<script lang="ts">
	import { CONVERSION, GAME_ACTION } from '$lib/constants/constants';
	import button from '$lib/assets/sfx/button.mp3';
	import { settings } from '$lib/state/settings.svelte';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	let { savePointOption }: { savePointOption: (a: string) => void } = $props();
	const buttonSfx: Howl = createSound(button);
</script>

<h3>Choose a Conversion</h3>
<div class="wrapper">
	<button
		class="option-button"
		onclick={() => {
			playSound(buttonSfx, settings.volume);
			savePointOption(GAME_ACTION.EXTRA_POINT);
		}}
	>
		{CONVERSION.EXTRA_POINT_ATTEMPT}
	</button>
	<button
		class="option-button"
		onclick={() => {
			playSound(buttonSfx, settings.volume);
			savePointOption(GAME_ACTION.TWO_POINT);
		}}
	>
		{CONVERSION.TWO_POINT_ATTEMPT}
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
		margin: 0 0 var(--space-5) 0;
	}

	.wrapper {
		display: flex;
		align-items: stretch;
		gap: var(--space-4);
	}

	.option-button {
		flex: 1;
		min-width: 9rem;
		min-height: 3.5rem;
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		text-align: center;
		padding: var(--space-3) var(--space-5);
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
</style>