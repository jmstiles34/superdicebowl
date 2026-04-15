<script lang="ts">
	import { auth } from '$lib/auth/authState.svelte';
	import { goto } from '$app/navigation';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';

	let activeTab: 'login' | 'register' = $state('login');

	$effect(() => {
		if (auth.isLoggedIn) goto('/');
	});
</script>

<div class="auth-page">
	<div class="auth-card">
		<div class="tab-row">
			<button
				class="tab"
				class:tab-selected={activeTab === 'login'}
				onclick={() => (activeTab = 'login')}
			>
				Sign In
			</button>
			<button
				class="tab"
				class:tab-selected={activeTab === 'register'}
				onclick={() => (activeTab = 'register')}
			>
				Create Account
			</button>
		</div>

		<div class="tab-content">
			{#if activeTab === 'login'}
				<LoginForm />
			{:else}
				<RegisterForm />
			{/if}
		</div>
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		justify-content: center;
		padding: 2rem 1rem;
	}
	.auth-card {
		width: 100%;
		max-width: 24rem;
	}
	.tab-row {
		display: flex;
		width: 100%;
		margin-bottom: 1.5rem;
	}
	.tab {
		flex: 1;
		padding: 0.625rem;
		text-align: center;
		font-size: var(--text-base);
		color: var(--color-text-secondary);
		background-color: var(--color-bg-surface);
		border-bottom: 2px solid var(--color-border-default);
	}
	.tab:hover {
		color: var(--color-text-primary);
	}
	.tab-selected,
	.tab-selected:hover {
		color: var(--color-text-primary);
		font-weight: 600;
		border-bottom-color: var(--color-border-brand);
	}
	.tab-content {
		padding: 0 0.25rem;
	}
</style>
