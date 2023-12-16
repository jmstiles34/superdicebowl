<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { settings } from '$lib/stores/Settings';
	import '../styles.css';
	import '@fontsource/bebas-neue';
	import soundOn from '$lib/images/volume-high.svg';
	import soundOff from '$lib/images/volume-xmark.svg';
	export let data;

	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>{$page.data.title ?? 'SuperDiceBowl'}</title>
	<meta name="description" content="Football at the Roll of the Dice" />
</svelte:head>

<nav>
	<a class="logo-wrapper" href="/">
		<picture>
			<source type="image/avif" srcset="/sdb-logo.avif" />
			<source type="image/webp" srcset="/sdb-logo.webp" />
			<img alt="SuperDiceBowl" src="/sdb-logo.png" />
		</picture>
		<h1>Super&middot;Dice&middot;Bowl</h1>
	</a>

	<div class="menu-wrapper">
		{#if data.hasOwnProperty('user')}
			<form method="POST" action="/logout" use:enhance>
				<button>Log out</button>
			</form>
		{:else}
			<a class="link" href="/login">Log in</a>
			<a class="link" href="/signup">Sign up</a>
		{/if}

		<button
			class="volumeButton"
			on:click={settings.toggleVolume}
			on:keypress={settings.toggleVolume}
			tabindex="0"
			title={$settings.volume ? 'Mute sounds' : 'Play sounds'}
		>
			<img src={$settings.volume ? soundOn : soundOff} alt="Sound toggle" />
		</button>
	</div>
</nav>

<main>
	<slot />
</main>

<footer>
	<p>
		&copy;{currentYear} SuperDiceBowl.com v0.1.4
	</p>
</footer>

<style>
	nav,
	footer {
		margin: 0 auto;
		padding: 8px 16px;
	}

	nav {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		width: 100%;
		max-width: var(--column);
	}

	h1 {
		font-family: 'Bebas Neue', sans-serif;
		margin: 0;
	}

	a {
		color: var(--color-white);
		font-weight: 500;
		text-wrap: nowrap;
	}

	main {
		height: 0;
		flex: 1;
		overflow-y: scroll;
	}

	main::-webkit-scrollbar {
		display: none;
	}

	footer {
		display: flex;
		height: 2rem;
		align-items: center;
		color: var(--color-gray-300);
		font-size: 0.75rem;
	}

	.logo-wrapper {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.logo-wrapper img {
		height: 2.5rem;
	}

	.menu-wrapper {
		display: flex;
		gap: 16px;
		justify-content: end;
	}

	.volumeButton {
		padding: 0;
		background: none;
		margin-top: -2px;
	}

	.volumeButton img {
		height: 1.5rem;
		width: 1.5rem;
	}

	@media (max-height: 30rem) {
		footer,
		nav {
			height: 0;
			padding: 4px var(--side);
			visibility: collapse;
		}
	}
</style>
