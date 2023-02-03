<script lang="ts">
	import { CONVERSION } from "$lib/constants/constants";

    type SetPoint = (value: string) => void;
    export let setPointOption:SetPoint;
</script>

<div>
    <h3>Choose a Conversion Option</h3>
</div>
<div class="wrapper">
    <button class="point-button" on:click={() => setPointOption(CONVERSION.EXTRA_POINT_ATTEMPT)}>
        {CONVERSION.EXTRA_POINT_ATTEMPT}
    </button>
    <button class="point-button" on:click={() => setPointOption(CONVERSION.TWO_POINT_ATTEMPT)}>   
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