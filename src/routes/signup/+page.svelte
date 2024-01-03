<div class="container">
	<picture>
		<source type="image/avif" srcset="/images/under-construction.avif" />
		<source type="image/webp" srcset="/images/under-construction.webp" />
		<img class="construction-icon" alt="Construction Icon" src="/images/under-construction.gif" />
	</picture>
	<div>
		<h2>Under Construction</h2>
		<p>We're working on something amazing! Please check back soon.</p>
	</div>
</div>

<style>
	.container {
		display: flex;
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
		gap: 1rem;
	}

	h2 {
		color: var(--color-blue-500);
	}

	p {
		color: var(--color-gray-400);
	}

	.construction-icon {
		height: 96px;
	}
</style>
