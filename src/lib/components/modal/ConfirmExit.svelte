<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="container">
	<h3>Are you sure you want to exit?</h3>

	<button
		class="game-button"
		onclick={() => {
			goto('/');
		}}
	>
		Exit Game
	</button>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
	}
	h3 {
		color: var(--color-offblack);
		text-align: center;
	}
	button {
		margin: 0 1em;
		min-width: 8rem;
		min-height: 3rem;
	}
</style>
