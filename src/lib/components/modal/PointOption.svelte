<script lang="ts">
	import { game } from '$lib/stores/Game'
    import { BALL_EXTRA_POINT, BALL_TWO_POINT, CONVERSION, GAME_ACTION } from "$lib/constants/constants";

    let ballPlacement = {
       [GAME_ACTION.EXTRA_POINT]: BALL_EXTRA_POINT,
       [GAME_ACTION.TWO_POINT]: BALL_TWO_POINT,
    }

    function setPointOption(action:string) {
        game.updateGame({
            action,
            ballIndex: ballPlacement[action][$game.possession],
            firstDownIndex: -1,
            lastPlay: `Must Roll ${action === GAME_ACTION.TWO_POINT ? 8 : 4}+ to Convert`,
            restrictDice: false,
            showModal: false,
        });
    }
</script>

<div>
    <h3>Choose a Conversion Option</h3>
</div>
<div class="wrapper">
    <button class="point-button" on:click={() => setPointOption(GAME_ACTION.EXTRA_POINT)}>
        {CONVERSION.EXTRA_POINT_ATTEMPT}
    </button>
    <button class="point-button" on:click={() => setPointOption(GAME_ACTION.TWO_POINT)}>   
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