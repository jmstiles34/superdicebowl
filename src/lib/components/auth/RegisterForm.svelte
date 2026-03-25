<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';
	import { validatePassword, validateUsername } from '$lib/auth/passwordUtils';
	import { REGISTER_BENEFITS } from '$lib/constants/auth';
	import PasswordRules from './PasswordRules.svelte';

	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let submitting = $state(false);

	let usernameValidation = $derived(username.length > 0 ? validateUsername(username) : null);
	let passwordValidation = $derived(password.length > 0 ? validatePassword(password) : null);
	let passwordsMatch = $derived(
		confirmPassword.length > 0 && password === confirmPassword
	);
	let canSubmit = $derived(
		usernameValidation?.valid &&
		passwordValidation?.valid &&
		passwordsMatch &&
		!submitting
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		submitting = true;
		const result = await auth.register(username, password);
		submitting = false;

		if (result.success) {
			goto('/');
		} else {
			error = result.error;
		}
	}
</script>

<div class="benefits">
	<p class="benefits-title">Create an account to:</p>
	<ul>
		{#each REGISTER_BENEFITS as benefit}
			<li>{benefit}</li>
		{/each}
	</ul>
</div>

<form onsubmit={handleSubmit}>
	<label>
		<span>Username</span>
		<input
			type="text"
			bind:value={username}
			autocomplete="username"
			required
		/>
		{#if usernameValidation && !usernameValidation.valid}
			<span class="field-error">{usernameValidation.error}</span>
		{/if}
	</label>

	<label>
		<span>Password</span>
		<input
			type="password"
			bind:value={password}
			autocomplete="new-password"
			required
		/>
		<PasswordRules {password} />
	</label>

	<label>
		<span>Confirm Password</span>
		<input
			type="password"
			bind:value={confirmPassword}
			autocomplete="new-password"
			required
		/>
		{#if confirmPassword.length > 0 && !passwordsMatch}
			<span class="field-error">Passwords do not match</span>
		{/if}
	</label>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<button type="submit" class="game-button submit" disabled={!canSubmit}>
		{submitting ? 'Creating account...' : 'Create Account'}
	</button>
</form>

<style>
	.benefits {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: var(--color-gray-900);
		border-radius: var(--border-radius);
		border: 1px solid var(--color-gray-700);
	}
	.benefits-title {
		color: var(--color-white);
		font-size: var(--14px);
		margin-bottom: 0.5rem;
	}
	.benefits ul {
		margin: 0;
		padding-left: 1.25rem;
	}
	.benefits li {
		color: var(--color-gray-300);
		font-size: var(--14px);
		line-height: 1.6;
	}
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
	.field-error {
		color: var(--urgent);
		font-size: var(--12px);
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
