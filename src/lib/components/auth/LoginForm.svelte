<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		submitting = true;

		const result = await auth.login(username, password);
		submitting = false;

		if (result.success) {
			goto('/');
		} else {
			error = result.error;
		}
	}
</script>

<form onsubmit={handleSubmit}>
	<label>
		<span>Username</span>
		<input
			type="text"
			bind:value={username}
			autocomplete="username"
			required
		/>
	</label>

	<label>
		<span>Password</span>
		<input
			type="password"
			bind:value={password}
			autocomplete="current-password"
			required
		/>
	</label>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<button type="submit" class="game-button submit" disabled={submitting || !username || !password}>
		{submitting ? 'Signing in...' : 'Sign In'}
	</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
	}
	input {
		padding: 0.5rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border-default);
		background: var(--color-bg-surface);
		color: var(--input-text);
		font-size: 1rem;
	}
	input:focus {
		outline: 2px solid var(--color-border-brand);
		outline-offset: 1px;
	}
	.error {
		color: var(--color-text-danger);
		font-size: var(--text-sm);
		margin: 0;
	}
	.submit {
		margin-top: 0.5rem;
	}
</style>
