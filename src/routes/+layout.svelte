<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import '../styles.css';
	import '@fontsource/bebas-neue';
	import logo from '$lib/images/sdb-logo.png';
	export let data;

	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>{$page.data.title ?? 'SuperDiceBowl'}</title>
	<meta name="description" content="Football at the Roll of a Dice" />
</svelte:head>

<nav>
	<div class="logo">
		<div>
			<a href="/">
				<img class="logo-image" alt="SuperDiceBowl" src={logo} />
			</a>
		</div>      
		<div class="logo-text">
			<a href="/">Super&middot;Dice&middot;Bowl</a>
		</div>
	</div>
	

	<div class="links">
		{#if data.hasOwnProperty('user')}
			<form method="POST" action="/logout" use:enhance>
				<button>Log out</button>
			</form>
		{:else}
			<a href="/login">Log in</a>
			<a href="/signup">Sign up</a>
		{/if}
	</div>
</nav>

<main>
	<slot />
</main>

<footer>
	<p>
		&copy;{currentYear} SuperDiceBowl.com v.010
	</p>
</footer>

<style>
	nav,
	footer {
		margin: 0 auto;
		padding: 1rem;
	}

	nav {
		color: var(--ivory);
		display: flex;
		width: 100%;
		height: 3rem;
		align-items: center;
		justify-content: space-between;
		max-width: var(--column);
		z-index: 100;
	}

	footer {
		display: flex;
		height: 2rem;
		align-items: center;
    	color: var(--gray);
		font-size: 0.75rem;
	}

	a {
		text-decoration: none;
	}

	button {
		background: none;
		border: none;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		cursor: pointer;
	}

	.links {
		display: flex;
		align-items: center;
	}

	main {
		height: 0;
		flex: 1;
		overflow-y: scroll;
	}

	main::-webkit-scrollbar {
		display: none;
	}

	.links {
		display: flex;
		gap: 1em;
		white-space: nowrap;
	}
	.logo {
		display: flex;
		flex-direction: row;
		gap: .5em;
		align-items: center;
	}

	.logo-image {
		height: 2.5em;
    	width: 2.5em;
	}

	.logo-text {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.5rem;
	}

	@media (max-height: 30rem) {
		footer, nav {
			height: 0;
			padding: 0.25rem var(--side);
			visibility: collapse;
		}
	}
</style>
