<script lang="ts">
	import { GAME_ACTION } from "$lib/constants/constants";


    export let action:string;

    /* let keydown = (e: KeyboardEvent) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
        close()
        }
    } */
</script>

{#if [GAME_ACTION.COIN_TOSS, GAME_ACTION.FOURTH_DOWN_OPTIONS, GAME_ACTION.POINT_OPTION].includes(action)}
    <div class="backdrop">
        <div class="modal">
            <slot/>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background: var(--mask);
        z-index: 999;
    }
    .modal {
        padding: 10px;
        border-radius: 10px;
        max-width: 400px;
        margin: 10% auto;
        text-align: center;
        background: var(--white);
    }
</style>