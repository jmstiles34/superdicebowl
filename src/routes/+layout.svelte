<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/auth/authState.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Settings from '$lib/components/modal/Settings.svelte';
	import { getGuestPreferences } from '$lib/db/repositories/preferencesRepository';
	import '../styles.css';
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
			<span class="logo-text">Super&middot;Dice&middot;Bowl</span>
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
				class="settings-button"
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
		<p>&copy;{currentYear} SuperDiceBowl.com v1.0.0</p>
		<a class="footer-link" href="/contact">Contact</a>
	</footer>
{/if}

<Modal showModal={showSettings} close={toggleSettings} hasClose={true} choiceRequired={false}>
	<Settings />
</Modal>

<style>
	/* ── Nav ──────────────────────────────────────────────────── */
	nav {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		width: 100%;
		max-width: var(--column);
		margin: 0 auto;
		padding: 0 var(--space-5);
		height: var(--header-h);
		background-color: var(--color-header-bg);
		border-bottom: 2px solid var(--color-header-border);
		box-shadow: var(--color-header-shadow);
		/* Keeps the header visually "above" page content */
		position: relative;
		z-index: var(--z-sticky);
	}

	/* ── Logo ─────────────────────────────────────────────────── */
	.logo-wrapper {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		text-decoration: none;
	}

	.logo-wrapper img {
		height: 2.25rem;
		width: auto;
		filter: drop-shadow(var(--color-header-logo-glow));
		transition: filter var(--dur-base) var(--ease-snes);
	}

	.logo-wrapper:hover img {
		filter: drop-shadow(0 0 12px rgba(112, 128, 240, 0.8));
	}

	.logo-text {
		font-family: var(--font-display);
		font-weight: var(--weight-black);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		color: var(--color-header-text);
		text-shadow: var(--text-shadow-display);
		white-space: nowrap;
	}

	/* ── Nav links ────────────────────────────────────────────── */
	.menu-wrapper {
		display: flex;
		gap: var(--space-2);
		justify-content: flex-end;
		align-items: center;
	}

	.link {
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		color: var(--brand-200);
		text-decoration: none;
		white-space: nowrap;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		border: 1px solid transparent;
		transition:
			color var(--dur-fast) var(--ease-snes),
			background-color var(--dur-fast) var(--ease-snes),
			border-color var(--dur-fast) var(--ease-snes);
	}

	.link:hover {
		color: var(--color-header-text);
		background-color: var(--nav-bg-active);
		border-color: rgba(64, 96, 240, 0.25);
	}

	/* ── Settings button ──────────────────────────────────────── */
	.settings-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			border-color var(--dur-fast) var(--ease-snes);
	}

	.settings-button:hover {
		background-color: var(--nav-bg-active);
		border-color: rgba(64, 96, 240, 0.25);
	}

	.settings-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.settings-button img {
		height: 1.25rem;
		width: 1.25rem;
		display: block;
		transition: filter var(--dur-fast) var(--ease-snes);
	}

	.settings-button:hover img {
		filter: brightness(1.5);
	}

	/* ── Main ─────────────────────────────────────────────────── */
	main {
		height: 0;
		flex: 1;
		overflow-y: scroll;
	}

	main::-webkit-scrollbar {
		display: none;
	}

	/* ── Footer ───────────────────────────────────────────────── */
	footer {
		display: flex;
		height: 2rem;
		align-items: center;
		gap: var(--space-4);
		margin: 0 auto;
		padding: 0 var(--space-5);
		color: var(--color-text-tertiary);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		border-top: 1px solid var(--color-border-subtle);
	}

	.footer-link {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-decoration: none;
		transition: color var(--dur-fast) var(--ease-snes);
	}

	.footer-link:hover {
		color: var(--color-text-brand);
	}

	/* ── Compact screens ──────────────────────────────────────── */
	@media (max-height: 30rem) {
		footer,
		nav {
			height: 0;
			padding: 4px var(--space-5);
			visibility: collapse;
		}
	}
</style>