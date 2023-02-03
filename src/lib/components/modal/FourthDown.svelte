<script lang="ts">
	import { FOURTH_DOWN } from "$lib/constants/constants";
    
    type SetPO = (value: string) => void;
    export let setFourthDownChoice:SetPO;
    export let inFieldGoalRange: boolean = false;
</script>

<div>
    <h3>4th Down...Choose an Option</h3>
</div>
<div class="wrapper">
    <button class="point-button" on:click={() => setFourthDownChoice(FOURTH_DOWN.GO_FOR_IT)}>
        {FOURTH_DOWN.GO_FOR_IT}
    </button>
    {#if inFieldGoalRange}
        <button class="point-button" on:click={() => setFourthDownChoice(FOURTH_DOWN.FIELD_GOAL)}>   
            {FOURTH_DOWN.FIELD_GOAL}
        </button>
    {/if}
    <button class="point-button" on:click={() => setFourthDownChoice(FOURTH_DOWN.PUNT)}>   
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