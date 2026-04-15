<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';
	import { onlineState } from '$lib/state/onlineState.svelte';
	import { onlineSignUp, onlineSignIn } from '$lib/online/onlineAuth';
	import { linkOnlineAccount, unlinkOnlineAccount } from '$lib/db/repositories/userRepository';
	import { deleteOnlineAccount } from '$lib/online/onlineAuth';

	let showDeleteConfirm = $state(false);
	let deleteError = $state('');

	// Online account form state
	type OnlineView = 'none' | 'signup' | 'signin';
	let onlineView = $state<OnlineView>('none');
	let onlineEmail = $state('');
	let onlinePassword = $state('');
	let onlineError = $state('');
	let onlineLoading = $state(false);

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

	async function handleOnlineSignUp() {
		if (!auth.currentUser) return;
		onlineError = '';
		onlineLoading = true;
		const generatedPassword = crypto.randomUUID() + crypto.randomUUID();
		const result = await onlineSignUp(onlineEmail, generatedPassword, auth.currentUser.username);
		onlineLoading = false;
		if (!result.success) {
			onlineError = result.error;
			return;
		}
		onlineState.setProfile({ id: result.userId, username: result.username });
		await linkOnlineAccount(auth.currentUser.id!, result.userId, onlineEmail, generatedPassword);
		onlineView = 'none';
		onlineEmail = '';
	}

	async function handleOnlineSignIn() {
		onlineError = '';
		onlineLoading = true;
		const result = await onlineSignIn(onlineEmail, onlinePassword);
		onlineLoading = false;
		if (!result.success) {
			onlineError = result.error;
			return;
		}
		onlineState.setProfile({ id: result.userId, username: result.username });
		if (auth.currentUser?.id) {
			await linkOnlineAccount(auth.currentUser.id, result.userId, onlineEmail, onlinePassword);
		}
		onlineView = 'none';
		onlineEmail = '';
		onlinePassword = '';
	}

	async function handleOnlineSignOut() {
		await onlineState.signOut();
	}

	let showDeleteOnlineConfirm = $state(false);
	let deleteOnlineError = $state('');
	let deleteOnlineLoading = $state(false);

	async function handleDeleteOnlineAccount() {
		if (!auth.currentUser?.id || !auth.currentUser.onlineAccountId) return;
		deleteOnlineError = '';
		deleteOnlineLoading = true;
		await deleteOnlineAccount(auth.currentUser.onlineAccountId);
		await unlinkOnlineAccount(auth.currentUser.id);
		auth.currentUser = { ...auth.currentUser, onlineAccountId: undefined, onlineEmail: undefined, onlinePassword: undefined };
		await onlineState.signOut();
		deleteOnlineLoading = false;
		showDeleteOnlineConfirm = false;
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
			<h2>My Account</h2>

			<div class="info-row">
				<span class="label">Username</span>
				<span class="value">@{auth.currentUser.username}</span>
			</div>

			<div class="info-row">
				<span class="label">Member since</span>
				<span class="value">{formatDate(auth.currentUser.createdAt)}</span>
			</div>

			<!-- Online Play Section -->
			<div class="section-divider">
				<h3>Online Play</h3>
			</div>

			{#if onlineState.isOnline}
				<div class="online-connected">
					<span class="connected-dot"></span>
					<span class="connected-label">Connected for online play</span>
				</div>
				<div class="online-account-actions">
					<button class="sign-out-online" onclick={handleOnlineSignOut}>Sign out</button>
					<span class="online-actions-sep">·</span>
					<button class="delete-online-trigger" onclick={() => (showDeleteOnlineConfirm = true)}>
						Delete online account
					</button>
				</div>
				{#if showDeleteOnlineConfirm}
					<div class="delete-online-confirm">
						<p class="delete-online-warning">
							This will permanently delete your online account, friends, and any in-progress games.
							Your local account will not be affected.
						</p>
						{#if deleteOnlineError}
							<p class="error">{deleteOnlineError}</p>
						{/if}
						<div class="delete-actions">
							<button class="game-button" onclick={() => (showDeleteOnlineConfirm = false)}>
								Cancel
							</button>
							<button class="delete-button" disabled={deleteOnlineLoading} onclick={handleDeleteOnlineAccount}>
								{deleteOnlineLoading ? 'Deleting…' : 'Yes, Delete Online Account'}
							</button>
						</div>
					</div>
				{/if}
			{:else if onlineView === 'none'}
				<p class="online-description">
					Create or connect an online account to challenge other players.
				</p>
				<div class="online-actions">
					<button class="game-button" onclick={() => (onlineView = 'signup')}>
						Create Online Account
					</button>
					<button class="text-button" onclick={() => (onlineView = 'signin')}>
						Sign in to existing account
					</button>
				</div>
			{:else if onlineView === 'signup'}
				<p class="online-description">
					Your username <strong>@{auth.currentUser?.username}</strong> will be used online.
					Just add an email for account recovery.
				</p>
				<form class="online-form" onsubmit={(e) => { e.preventDefault(); handleOnlineSignUp(); }}>
					<div class="field">
						<label for="online-email">Email</label>
						<input
							id="online-email"
							type="email"
							bind:value={onlineEmail}
							autocomplete="email"
							required
						/>
					</div>
					{#if onlineError}
						<p class="error">{onlineError}</p>
					{/if}
					<div class="form-actions">
						<button type="button" class="cancel-button" onclick={() => { onlineView = 'none'; onlineError = ''; }}>
							Cancel
						</button>
						<button type="submit" class="game-button" disabled={onlineLoading}>
							{onlineLoading ? 'Creating…' : 'Create Account'}
						</button>
					</div>
					<button type="button" class="text-button" onclick={() => { onlineView = 'signin'; onlineError = ''; }}>
						Already have an account? Sign in
					</button>
				</form>
			{:else if onlineView === 'signin'}
				<form class="online-form" onsubmit={(e) => { e.preventDefault(); handleOnlineSignIn(); }}>
					<div class="field">
						<label for="signin-email">Email</label>
						<input
							id="signin-email"
							type="email"
							bind:value={onlineEmail}
							autocomplete="email"
							required
						/>
					</div>
					<div class="field">
						<label for="signin-password">Password</label>
						<input
							id="signin-password"
							type="password"
							bind:value={onlinePassword}
							autocomplete="current-password"
							required
						/>
					</div>
					{#if onlineError}
						<p class="error">{onlineError}</p>
					{/if}
					<div class="form-actions">
						<button type="button" class="cancel-button" onclick={() => { onlineView = 'none'; onlineError = ''; }}>
							Cancel
						</button>
						<button type="submit" class="game-button" disabled={onlineLoading}>
							{onlineLoading ? 'Signing in…' : 'Sign In'}
						</button>
					</div>
					<button type="button" class="text-button" onclick={() => { onlineView = 'signup'; onlineError = ''; }}>
						Need an account? Create one
					</button>
				</form>
			{/if}

			<!-- Local account actions -->
			<div class="section-divider">
				<h3>Account</h3>
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
	h3 {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		margin: 0;
	}
	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border-subtle);
	}
	.label {
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
	}
	.value {
		color: var(--color-text-primary);
		font-weight: 500;
	}
	.online-connected {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}
	.connected-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--color-text-success);
		flex-shrink: 0;
	}
	.connected-label {
		font-size: var(--text-sm);
		color: var(--color-text-success);
	}
	.section-divider {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin: 1.5rem 0 1rem;
	}
	.section-divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--color-bg-elevated);
	}
	.online-description {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		margin-bottom: 1rem;
	}
	.online-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.online-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.field label {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}
	.field input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
		color: var(--input-text);
		font-size: var(--text-base);
	}
	.field input:focus {
		outline: none;
		border-color: var(--color-border-focus);
		box-shadow: var(--focus-ring);
	}
	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	.cancel-button {
		flex: 1;
		padding: 0.5em;
		text-align: center;
		background: var(--color-bg-elevated);
		color: var(--color-text-secondary);
		border-radius: var(--radius-sm);
		font-size: var(--text-base);
	}
	.cancel-button:hover {
		background: var(--color-bg-overlay);
	}
	.text-button {
		font-size: var(--text-sm);
		color: var(--color-text-brand);
		text-align: center;
		width: 100%;
	}
	.text-button:hover {
		color: var(--color-text-secondary);
	}
	.online-account-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}
	.online-actions-sep {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}
	.sign-out-online {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}
	.sign-out-online:hover {
		color: var(--color-text-primary);
	}
	.delete-online-trigger {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}
	.delete-online-trigger:hover {
		color: var(--color-text-danger);
	}
	.delete-online-confirm {
		margin-top: 0.5rem;
		padding: 1rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-danger);
		border-radius: var(--radius-sm);
	}
	.delete-online-warning {
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
		margin-bottom: 1rem;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 0.5rem;
	}
	.delete-trigger {
		color: var(--color-text-danger);
		font-size: var(--text-sm);
		text-align: center;
	}
	.delete-trigger:hover {
		color: var(--color-text-danger);
	}
	.delete-confirm {
		padding: 1rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-danger);
		border-radius: var(--radius-sm);
	}
	.delete-warning {
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
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
		background-color: var(--btn-danger-bg);
		color: var(--color-on-accent);
		border-radius: var(--radius-sm);
	}
	.delete-button:hover {
		background-color: oklch(0.5 0.16 24);
	}
	.error {
		color: var(--color-text-danger);
		font-size: var(--text-sm);
		margin-bottom: 0.5rem;
	}
</style>
