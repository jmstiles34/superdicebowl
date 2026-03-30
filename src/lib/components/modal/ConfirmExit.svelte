<script lang="ts">
	import { goto } from '$app/navigation';
	import { season } from '$lib/state/season.svelte';

	function exitGame() {
		const dest = season.isSeasonGame ? '/season/play' : '/';
		season.isSeasonGame = false;
		season.activeWeek = null;
		season.activeMatchupIndex = null;
		goto(dest);
	}
</script>

<div class="container">
	<h3>Are you sure you want to exit?</h3>

	<button class="game-button" onclick={exitGame}>
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
