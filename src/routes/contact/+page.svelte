<script lang="ts">
	import { pickRandom } from '$lib/utils/common';

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let honeypot = $state('');
	let challengeAnswer = $state('');
	let error = $state('');
	let success = $state(false);
	let submitting = $state(false);

	const num1 = pickRandom([2, 3, 4, 5, 6, 7, 8, 9]) as number;
	const num2 = pickRandom([2, 3, 4, 5, 6, 7, 8, 9]) as number;
	const correctAnswer = num1 + num2;

	let isValid = $derived(
		name.trim().length > 0 &&
			email.trim().length > 0 &&
			message.trim().length > 0 &&
			challengeAnswer.trim().length > 0
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (parseInt(challengeAnswer.trim()) !== correctAnswer) {
			error = 'Incorrect answer. Please try again.';
			return;
		}

		submitting = true;

		try {
			const res = await fetch('/contact.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					message: message.trim(),
					hp: honeypot
				})
			});

			if (!res.ok) {
				const data = await res.json().catch(() => null);
				error = data?.error ?? 'Something went wrong. Please try again.';
			} else {
				success = true;
			}
		} catch {
			error = 'Could not reach the server. Please try again later.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="contact-page">
	<div class="contact-card">
		<h2>Contact Us</h2>

		{#if success}
			<div class="success-message">
				<p>Thanks for reaching out! We'll get back to you soon.</p>
			</div>
		{:else}
			<form onsubmit={handleSubmit}>
				<label>
					<span>Name</span>
					<input type="text" bind:value={name} autocomplete="name" required />
				</label>

				<label>
					<span>Email</span>
					<input type="email" bind:value={email} autocomplete="email" required />
				</label>

				<label>
					<span>Message</span>
					<textarea bind:value={message} rows={5} required></textarea>
				</label>

				<!-- Honeypot — hidden from real users -->
				<div class="hp" aria-hidden="true">
					<label>
						<span>Leave this blank</span>
						<input type="text" bind:value={honeypot} tabindex={-1} autocomplete="off" />
					</label>
				</div>

				<label>
					<span>What is {num1} + {num2}?</span>
					<input
						type="text"
						bind:value={challengeAnswer}
						autocomplete="off"
						inputmode="numeric"
						required
					/>
				</label>

				{#if error}
					<p class="error">{error}</p>
				{/if}

				<button type="submit" class="game-button submit" disabled={submitting || !isValid}>
					{submitting ? 'Sending...' : 'Send Message'}
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.contact-page {
		display: flex;
		justify-content: center;
		padding: 2rem 1rem;
	}

	.contact-card {
		width: 100%;
		max-width: 24rem;
	}

	h2 {
		text-align: center;
		margin-bottom: 1.5rem;
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
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
	}

	input,
	textarea {
		padding: 0.5rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border-default);
		background: var(--color-bg-surface);
		color: var(--color-on-accent);
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
	}

	input:focus,
	textarea:focus {
		outline: 2px solid var(--color-border-brand);
		outline-offset: 1px;
	}

	.hp {
		position: absolute;
		left: -9999px;
		opacity: 0;
		height: 0;
		overflow: hidden;
	}

	.error {
		color: var(--color-text-danger);
		font-size: var(--text-sm);
		margin: 0;
	}

	.success-message {
		text-align: center;
		color: var(--color-text-secondary);
		padding: 2rem 0;
	}

	.submit {
		margin-top: 0.5rem;
	}
</style>
