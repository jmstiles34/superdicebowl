<main>
	<h1>Super Dice Basketball</h1>
	<p class="coming-soon">Coming Soon</p>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		align-items: center;
		padding: var(--space-10) var(--space-8);
	}

	h1 {
		font-family: var(--font-display);
		font-weight: var(--weight-black);
		font-style: italic;
		font-size: var(--text-display-lg);
		letter-spacing: var(--tracking-display);
		color: var(--color-text-primary);
		text-shadow: var(--text-shadow-display);
		text-align: center;
		margin: 0;
	}

	.coming-soon {
		font-family: var(--font-body);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		color: var(--color-text-secondary);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
	}
</style>
