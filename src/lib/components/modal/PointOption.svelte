<script lang="ts">
    import { CONVERSION, GAME_ACTION } from "$lib/constants/constants";
    import { Sound } from "svelte-sound";
    import button from '$lib/assets/sfx/button.mp3'
	import { settings } from "$lib/stores/Settings";

    export let savePointOption:(a: string) => void;
    $: buttonSfx = new Sound(button, {volume: $settings.volume});
</script>

<h3>Choose a Conversion Option</h3>
<div class="wrapper">
    <button class="point-button" on:click={() => {buttonSfx.play(); savePointOption(GAME_ACTION.EXTRA_POINT)}}>
        {CONVERSION.EXTRA_POINT_ATTEMPT}
    </button>
    <button class="point-button" on:click={() => {buttonSfx.play(); savePointOption(GAME_ACTION.TWO_POINT)}}>   
        {CONVERSION.TWO_POINT_ATTEMPT}
    </button>
</div>

<style>
    h3 {
        color: var(--black);
        text-align: center;
    }
    .wrapper {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }
    .point-button {
        margin: 0 1em;
        min-width: 8rem;
        min-height: 3rem;
        cursor: pointer;
        font-family: inherit;
    }
</style>