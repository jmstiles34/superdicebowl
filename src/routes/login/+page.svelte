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
		font-size: var(--16px);
		color: var(--color-gray-300);
		background-color: var(--color-gray-900);
		border-bottom: 2px solid var(--color-gray-700);
	}
	.tab:hover {
		color: var(--color-white);
	}
	.tab-selected,
	.tab-selected:hover {
		color: var(--color-white);
		font-weight: 600;
		border-bottom-color: var(--color-blue-500);
	}
	.tab-content {
		padding: 0 0.25rem;
	}
</style>
