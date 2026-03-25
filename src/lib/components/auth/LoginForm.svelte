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
		color: var(--color-gray-300);
		font-size: var(--14px);
	}
	input {
		padding: 0.5rem;
		border-radius: var(--border-radius);
		border: 1px solid var(--color-gray-700);
		background: var(--color-gray-900);
		color: var(--color-white);
		font-size: 1rem;
	}
	input:focus {
		outline: 2px solid var(--color-blue-500);
		outline-offset: 1px;
	}
	.error {
		color: var(--urgent);
		font-size: var(--14px);
		margin: 0;
	}
	.submit {
		margin-top: 0.5rem;
	}
</style>
