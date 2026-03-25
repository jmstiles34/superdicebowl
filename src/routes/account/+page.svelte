<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';

	let showDeleteConfirm = $state(false);
	let deleteError = $state('');

	$effect(() => {
		if (auth.initialized && !auth.isLoggedIn) goto('/login');
	});

	async function handleLogout() {
		await auth.logout();
		goto('/');
	}

	async function handleDeleteAccount() {
		const result = await auth.deleteAccount();
		if (result.success) {
			goto('/');
		} else {
			deleteError = result.error;
		}
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

{#if auth.currentUser}
	<div class="account-page">
		<div class="account-card">
			<h2>Account</h2>

			<div class="info-row">
				<span class="label">Username</span>
				<span class="value">{auth.currentUser.username}</span>
			</div>

			<div class="info-row">
				<span class="label">Member since</span>
				<span class="value">{formatDate(auth.currentUser.createdAt)}</span>
			</div>

			<div class="actions">
				<button class="game-button" onclick={handleLogout}>
					Log Out
				</button>

				{#if !showDeleteConfirm}
					<button class="delete-trigger" onclick={() => (showDeleteConfirm = true)}>
						Delete Account
					</button>
				{:else}
					<div class="delete-confirm">
						<p class="delete-warning">
							This will permanently delete your account and all associated data. This cannot be undone.
						</p>
						{#if deleteError}
							<p class="error">{deleteError}</p>
						{/if}
						<div class="delete-actions">
							<button class="game-button" onclick={() => (showDeleteConfirm = false)}>
								Cancel
							</button>
							<button class="delete-button" onclick={handleDeleteAccount}>
								Yes, Delete My Account
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.account-page {
		display: flex;
		justify-content: center;
		padding: 2rem 1rem;
	}
	.account-card {
		width: 100%;
		max-width: 24rem;
	}
	h2 {
		margin-bottom: 1.5rem;
	}
	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-gray-800);
	}
	.label {
		color: var(--color-gray-400);
		font-size: var(--14px);
	}
	.value {
		color: var(--color-white);
		font-weight: 500;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 2rem;
	}
	.delete-trigger {
		color: var(--urgent);
		font-size: var(--14px);
		text-align: center;
	}
	.delete-trigger:hover {
		color: var(--urgent-hover);
	}
	.delete-confirm {
		padding: 1rem;
		background: var(--color-gray-900);
		border: 1px solid var(--urgent);
		border-radius: var(--border-radius);
	}
	.delete-warning {
		color: var(--color-gray-300);
		font-size: var(--14px);
		margin-bottom: 1rem;
	}
	.delete-actions {
		display: flex;
		gap: 0.5rem;
	}
	.delete-button {
		flex: 1;
		padding: 0.5em;
		text-align: center;
		background-color: var(--urgent);
		color: var(--color-white);
		border-radius: var(--border-radius);
	}
	.delete-button:hover {
		background-color: oklch(0.5 0.16 24);
	}
	.error {
		color: var(--urgent);
		font-size: var(--14px);
		margin-bottom: 0.5rem;
	}
</style>
