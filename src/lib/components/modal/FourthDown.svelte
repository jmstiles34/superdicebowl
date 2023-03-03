<script lang="ts">
	import { FOURTH_DOWN, GAME_ACTION } from "$lib/constants/constants";
	import type { Void } from "$lib/types";
	import { sfx } from "$lib/utils/common";
    export let inFieldGoalRange: boolean = false;
    export let saveFourthDown:(a: string) => void;
    export let toggleFieldGoal:Void;
</script>

<div>
    <h3>4th Down...Choose an Option</h3>
</div>
<div class="wrapper">
    <button class="point-button" on:click={() => {sfx('button'); saveFourthDown(GAME_ACTION.OFFENSE)}}>
        {FOURTH_DOWN.GO_FOR_IT}
    </button>
    {#if inFieldGoalRange}
        <button class="point-button" on:click={() => {sfx('button'); toggleFieldGoal()}}>   
            {FOURTH_DOWN.FIELD_GOAL}
        </button>
    {/if}
    <button class="point-button" on:click={() => {sfx('button'); saveFourthDown(GAME_ACTION.PUNT)}}>   
        {FOURTH_DOWN.PUNT}
    </button>
</div>

<style>
    h3 {
        color: var(--black);
    }
    .wrapper {
        display: flex;
        justify-content: center;
        gap: 4px;
    }
    .point-button {
        margin: 0;
        min-width: 125px;
        min-height: 50px;
        cursor: pointer;
        font-family: var(--mono);
    }
</style>