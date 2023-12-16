<script lang="ts">
	import { GAME_ACTION } from '$lib/constants/constants';
	export let action: string;
	const modalActions = [
		GAME_ACTION.COIN_TOSS,
		GAME_ACTION.FOURTH_DOWN_OPTIONS,
		GAME_ACTION.POINT_OPTION
	];
</script>

{#if modalActions.includes(action)}
	<div class="backdrop">
		<div class="modal">
			<slot />
		</div>
	</div>
{/if}

<style>
	.backdrop {
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		left: 0;
		background: var(--mask);
		z-index: 420;
		display: flex;
		justify-content: center;
	}

	.modal {
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--color-white);
		height: fit-content;
		margin: auto 0;
		min-width: 20rem;
	}
</style>
