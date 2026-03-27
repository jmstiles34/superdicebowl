<script lang="ts">
	import { auth } from '$lib/auth/authState.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { savePreferences, saveGuestPreferences } from '$lib/db/repositories/preferencesRepository';
	import soundOn from '$lib/images/volume-high.svg';
	import soundLow from '$lib/images/volume-low.svg';
	import soundOff from '$lib/images/volume-off.svg';

	let volumeIcon = $derived(
		settings.volume === 0 ? soundOff : settings.volume <= 40 ? soundLow : soundOn
	);

	function persist() {
		const prefs = {
			volume: settings.volume,
			theme: settings.theme,
			defaultWinScore: settings.winScore
		};
		if (auth.isLoggedIn && auth.currentUser?.id) {
			savePreferences(auth.currentUser.id, prefs);
		} else {
			saveGuestPreferences(prefs);
		}
	}

	function handleVolumeChange(e: Event) {
		settings.volume = parseInt((e.currentTarget as HTMLInputElement).value);
		persist();
	}

	function toggleMute() {
		settings.volume = settings.volume > 0 ? 0 : 75;
		persist();
	}

	function toggleTheme() {
		settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
		persist();
	}

	function handleScoreChange(e: Event) {
		const { value } = e.currentTarget as HTMLSelectElement;
		settings.winScore = parseInt(value);
		persist();
	}
</script>

<div class="settings">
	<h3>Settings</h3>

	<div class="setting-row">
		<span class="label">Volume</span>
		<div class="volume-control">
			<button class="icon-button" onclick={toggleMute} aria-label="Toggle mute" title={settings.volume > 0 ? 'Mute' : 'Unmute'}>
				<img class="sound-icon" src={volumeIcon} alt="Volume" />
			</button>
			<input
				type="range"
				min="0"
				max="100"
				step="5"
				value={settings.volume}
				oninput={handleVolumeChange}
				aria-label="Volume level"
			/>
			<span class="volume-value">{settings.volume}</span>
		</div>
	</div>

	<div class="setting-row">
		<span class="label">Theme</span>
		<button class="toggle" onclick={toggleTheme} aria-label="Toggle theme">
			<span class="theme-icon">{settings.theme === 'dark' ? '🌙' : '☀️'}</span>
			<span class="toggle-label">{settings.theme === 'dark' ? 'Dark' : 'Light'}</span>
		</button>
	</div>

	<div class="setting-row">
		<label class="label" for="defaultWinScore">Default Win Score</label>
		<select
			id="defaultWinScore"
			class="score-select"
			value={settings.winScore}
			onchange={handleScoreChange}
		>
			{#each Array(99) as _, i}
				<option value={i + 2}>{i + 2}</option>
			{/each}
		</select>
	</div>
</div>

<style>
	.settings {
		min-width: 16rem;
	}

	h3 {
		color: var(--color-offblack);
		text-align: center;
		margin-bottom: 1rem;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--color-gray-200);
	}

	.setting-row:last-child {
		border-bottom: none;
	}

	.label {
		color: var(--color-offblack);
		font-size: var(--15px);
		font-weight: 500;
	}

	.volume-control {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.icon-button {
		padding: 0.2rem;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.sound-icon {
		height: 1.2rem;
		width: 1.2rem;
	}

	input[type='range'] {
		width: 6rem;
		accent-color: var(--color-blue-500);
		cursor: pointer;
	}

	.volume-value {
		color: var(--color-offblack);
		font-size: var(--12px);
		min-width: 1.75rem;
		text-align: right;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--color-gray-100);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--border-radius);
		padding: 0.35rem 0.6rem;
		color: var(--color-offblack);
		font-size: var(--14px);
		cursor: pointer;
	}

	.toggle:hover {
		background: var(--color-gray-200);
	}

	.theme-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.toggle-label {
		min-width: 2rem;
	}

	.score-select {
		background: var(--color-gray-100);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--border-radius);
		padding: 0.35rem 0.5rem;
		color: var(--color-offblack);
		font-size: var(--14px);
		cursor: pointer;
	}
</style>
