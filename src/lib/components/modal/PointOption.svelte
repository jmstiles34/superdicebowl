<script lang="ts">
	import { CONVERSION, GAME_ACTION } from '$lib/constants/constants';
	import button from '$lib/assets/sfx/button.mp3';
	import { settings } from '$lib/state/settings.svelte';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	let { savePointOption }: { savePointOption: (a: string) => void } = $props();
	const buttonSfx: Howl = createSound(button);
</script>

<h3>Choose a Conversion Option</h3>
<div class="wrapper">
	<button
		class="game-button"
		onclick={() => {
			playSound(buttonSfx, settings.volume);
			savePointOption(GAME_ACTION.EXTRA_POINT);
		}}
	>
		{CONVERSION.EXTRA_POINT_ATTEMPT}
	</button>
	<button
		class="game-button"
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
		color: var(--color-offblack);
		text-align: center;
	}
	button {
		margin: 0 1em;
		min-width: 8rem;
		min-height: 3rem;
	}
	.wrapper {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
</style>
