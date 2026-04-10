<script lang="ts">
	import { PASSWORD_RULES } from '$lib/constants/auth';

	let { password = '' }: { password: string } = $props();
</script>

<ul class="rules">
	{#each PASSWORD_RULES as rule}
		<li class:pass={rule.test(password)} class:fail={password.length > 0 && !rule.test(password)}>
			{rule.label}
		</li>
	{/each}
</ul>

<style>
	.rules {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	li {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}
	li::before {
		content: '\25CB\00a0\00a0';
	}
	.pass {
		color: oklch(0.72 0.19 142);
	}
	.pass::before {
		content: '\2713\00a0\00a0';
	}
	.fail {
		color: var(--color-text-danger);
	}
	.fail::before {
		content: '\2717\00a0\00a0';
	}
</style>
