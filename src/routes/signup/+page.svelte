<script lang="ts">
	import construction from '$lib/images/under-construction.gif';
</script>

<div class="container">
	<img class="construction-icon" alt="Construction Icon" src={construction} />
	<div>
		<h1>Under Construction</h1>
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

	h1 {
		color: #333;
	}

	p {
		color: #666;
	}

	.construction-icon {
		height: 6rem;
	}
</style>
