<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/auth/authState.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';
	import { getGuestPreferences } from '$lib/db/repositories/preferencesRepository';
	import '../styles.css';
	import '@fontsource/bebas-neue';
	import gear from '$lib/images/gear.svg';

	let { children } = $props();
	const currentYear = new Date().getFullYear();
	let isGamePage = $derived($page.url.pathname === '/game');
	let showSettings = $state(false);

	function toggleSettings() {
		showSettings = !showSettings;
	}

	$effect(() => {
		document.documentElement.setAttribute('data-theme', settings.theme);
	});

	onMount(() => {
		const guestPrefs = getGuestPreferences();
		settings.loadPreferences(guestPrefs);
		auth.initialize();
	});
</script>

<svelte:head>
	<title>{$page.data.title ?? 'SuperDiceBowl'}</title>
	<meta name="description" content="Football at the Roll of the Dice" />
</svelte:head>

{#if !isGamePage}
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
			{#if auth.isLoggedIn}
				<a class="link" href="/season">Season</a>
				<a class="link" href="/teams">My Teams</a>
				<a class="link" href="/games">My Games</a>
				<a class="link" href="/account">{auth.currentUser?.username}</a>
			{:else}
				<a class="link" href="/login">Sign In</a>
			{/if}

			<button
				class="settingsButton"
				onclick={toggleSettings}
				aria-label="Settings"
				title="Settings"
			>
				<img src={gear} alt="Settings" />
			</button>
		</div>
	</nav>
{/if}

<main>
	{@render children()}
</main>

{#if !isGamePage}
	<footer>
		<p>&copy;{currentYear} SuperDiceBowl.com v0.2.2</p>
		<a class="footer-link" href="/contact">Contact</a>
	</footer>
{/if}

<Modal showModal={showSettings} close={toggleSettings} hasClose={true} choiceRequired={false}>
	<Settings />
</Modal>

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
		gap: 1rem;
		color: var(--color-gray-300);
		font-size: var(--12px);
	}

	.footer-link {
		color: var(--color-gray-400);
		font-size: var(--12px);
	}

	.footer-link:hover {
		color: var(--color-white);
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
		align-items: center;
	}

	.settingsButton {
		padding: 0;
		background: none;
	}

	.settingsButton img {
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
