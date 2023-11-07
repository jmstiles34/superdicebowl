<script lang="ts">
	import { FOURTH_DOWN, GAME_ACTION } from "$lib/constants/constants";
	import type { Void } from "$lib/types";
    import { Sound } from "svelte-sound";
    import button from '$lib/assets/sfx/button.mp3'

    export let inFieldGoalRange: boolean = false;
    export let saveFourthDown:(a: string) => void;
    export let toggleFieldGoal:Void;

    const buttonSfx = new Sound(button);
</script>

<h3>4th Down...Choose an Option</h3>
<div class="wrapper">
    <button class="point-button" on:click={() => {buttonSfx.play(); saveFourthDown(GAME_ACTION.OFFENSE)}}>
        {FOURTH_DOWN.GO_FOR_IT}
    </button>
    {#if inFieldGoalRange}
        <button class="point-button" on:click={() => {buttonSfx.play(); toggleFieldGoal()}}>   
            {FOURTH_DOWN.FIELD_GOAL}
        </button>
    {/if}
    <button class="point-button" on:click={() => {buttonSfx.play(); saveFourthDown(GAME_ACTION.PUNT)}}>   
        {FOURTH_DOWN.PUNT}
    </button>
</div>

<style>
    h3 {
        color: var(--black);
        text-align: center;
    }
    .wrapper {
        display: flex;
        justify-content: center;
        gap: 0.25rem;
    }
    .point-button {
        margin: 0;
        min-width: 8rem;
        min-height: 3rem;
        cursor: pointer;
        font-family: inherit;
    }
</style>