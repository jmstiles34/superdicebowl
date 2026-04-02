<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';
	import { season } from '$lib/state/season.svelte';

	type ConfirmExitProps = {
		cancel: () => void;
	};

	let { cancel }: ConfirmExitProps = $props();

	function exitGame() {
		const dest = season.isSeasonGame ? '/season/play' : '/';
		season.isSeasonGame = false;
		season.activeWeek = null;
		season.activeMatchupIndex = null;
		goto(dest);
	}
</script>

<div class="container">
	<h3>Exit Game?</h3>
	{#if !auth.isLoggedIn}
		<p class="subtitle">Your progress will not be saved.</p>
	{/if}

	<div class="button-row">
		<button class="cancel-button" onclick={cancel}>
			Cancel
		</button>
		<button class="exit-button" onclick={exitGame}>
			Exit Game
		</button>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-8);
	}

	h3 {
		font-family: var(--font-display);
		font-weight: var(--weight-extrabold);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		text-shadow: var(--text-shadow-display);
		color: var(--modal-header-text);
		text-align: center;
		margin: 0;
	}

	.subtitle {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		text-align: center;
		margin: 0 0 var(--space-3) 0;
	}

	.button-row {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
	}

	.cancel-button,
	.exit-button {
		min-width: 9rem;
		min-height: 3rem;
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		text-align: center;
		padding: var(--space-2-5) var(--space-6);
		border-radius: var(--radius-sm);
		border: 2px solid var(--btn-danger-border);
		background-color: var(--btn-danger-bg);
		color: var(--btn-danger-text);
		box-shadow: var(--btn-danger-shadow);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.cancel-button {
		border-color: var(--btn-secondary-border);
		background-color: var(--btn-secondary-bg);
		color: var(--btn-secondary-text);
		box-shadow: var(--btn-secondary-shadow);
	}

	.cancel-button:hover {
		background-color: var(--btn-secondary-bg-hover);
		box-shadow: var(--btn-secondary-shadow-hover);
	}

	.exit-button:hover {
		background-color: var(--btn-danger-bg-hover);
	}

	.exit-button:active {
		transform: translateY(2px);
		box-shadow: none;
	}

	.exit-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}
</style>