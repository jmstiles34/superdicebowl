<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { settings } from '$lib/stores/Settings';
	import '../styles.css';
	import '@fontsource/bebas-neue';
	import logo from '$lib/images/sdb-logo.png';
	import soundOn from '$lib/images/volume-high.svg';
	import soundOff from '$lib/images/volume-xmark.svg';
	export let data;

	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>{$page.data.title ?? 'SuperDiceBowl'}</title>
	<meta name="description" content="Football at the Roll of a Dice" />
</svelte:head>

<nav>
	<a href="/">
		<img alt="SuperDiceBowl" src={logo} />
	</a>
	<a class="logo-text" href="/">Super&middot;Dice&middot;Bowl</a>

	{#if data.hasOwnProperty('user')}
		<form method="POST" action="/logout" use:enhance>
			<button>Log out</button>
		</form>
	{:else}
		<a href="/login">Log in</a>
		<a href="/signup">Sign up</a>
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
		padding: 16px;
	}

	nav {
		color: var(--ivory);
		display: flex;
		gap: 16px;
		width: 100%;
		height: 3rem;
		align-items: center;
		max-width: var(--column);
		z-index: 100;
	}

	nav img {
		height: 2.5rem;
	}

	.logo-text {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.5rem;
		margin-left: -8px;
		margin-right: auto;
	}

	footer {
		display: flex;
		height: 2rem;
		align-items: center;
		color: var(--gray);
		font-size: 0.75rem;
	}

	main {
		height: 0;
		flex: 1;
		overflow-y: scroll;
	}

	a {
		text-wrap: nowrap;
	}

	main::-webkit-scrollbar {
		display: none;
	}

	.volumeButton {
		padding: 0;
		margin-top: 12px;
		background: none;
	}

	.volumeButton img {
		height: 24px;
		width: 24px;
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
