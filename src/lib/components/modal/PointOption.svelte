<script lang="ts">
    import { CONVERSION, GAME_ACTION } from "$lib/constants/constants";
	import { sfx } from "$lib/utils/common";
    export let savePointOption:(a: string) => void;
</script>

<div>
    <h3>Choose a Conversion Option</h3>
</div>
<div class="wrapper">
    <button class="point-button" on:click={() => {sfx('button'); savePointOption(GAME_ACTION.EXTRA_POINT)}}>
        {CONVERSION.EXTRA_POINT_ATTEMPT}
    </button>
    <button class="point-button" on:click={() => {sfx('button'); savePointOption(GAME_ACTION.TWO_POINT)}}>   
        {CONVERSION.TWO_POINT_ATTEMPT}
    </button>
</div>

<style>
    h3 {
        color: var(--black);
    }
    .wrapper {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .point-button {
        margin: 0 15px;
        min-width: 160px;
        cursor: pointer;
        font-family: var(--mono);
    }
</style>