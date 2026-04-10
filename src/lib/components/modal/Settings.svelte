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
			speed: settings.speed,
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

	function handleSpeedChange(e: Event) {
		const { value } = e.currentTarget as HTMLSelectElement;
		settings.speed = parseFloat(value);
		persist();
	}
</script>

<div class="settings">
	<h3>Settings</h3>

	<!-- Volume -->
	<div class="setting-row">
		<span class="label">Volume</span>
		<div class="volume-control">
			<button
				class="icon-button"
				onclick={toggleMute}
				aria-label="Toggle mute"
				title={settings.volume > 0 ? 'Mute' : 'Unmute'}
			>
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

	<!-- Theme -->
	<div class="setting-row">
		<span class="label">Theme</span>
		<button class="toggle" onclick={toggleTheme} aria-label="Toggle theme">
			<span class="theme-icon">{settings.theme === 'dark' ? '🌙' : '☀️'}</span>
			<span class="toggle-label">{settings.theme === 'dark' ? 'Dark' : 'Light'}</span>
		</button>
	</div>

	<!-- Default Win Score -->
	<div class="setting-row">
		<label class="label" for="defaultWinScore">Default Win Score</label>
		<select
			id="defaultWinScore"
			class="setting-select"
			value={settings.winScore}
			onchange={handleScoreChange}
		>
			{#each Array(99) as _, i}
				<option value={i + 2}>{i + 2}</option>
			{/each}
		</select>
	</div>

	<!-- Play Speed -->
	<div class="setting-row">
		<label class="label" for="simSpeed">Play Speed</label>
		<select
			id="simSpeed"
			class="setting-select"
			value={settings.speed}
			onchange={handleSpeedChange}
		>
			<option value={2}>.5x</option>
			<option value={1}>1x</option>
			<option value={0.5}>2x</option>
			<option value={0.25}>3x</option>
		</select>
	</div>
</div>

<style>
	.settings {
		min-width: 18rem;
		padding: var(--space-2);
	}

	h3 {
		font-family: var(--font-display);
		font-weight: var(--weight-extrabold);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		text-shadow: var(--text-shadow-display);
		color: var(--modal-header-text);
		text-align: center;
		margin: 0 0 var(--space-5) 0;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.setting-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.label {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.volume-control {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.icon-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.icon-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.sound-icon {
		height: 1.1rem;
		width: 1.1rem;
		display: block;
		transition: filter var(--dur-fast) var(--ease-snes);
	}

	.icon-button:hover .sound-icon {
		filter: brightness(1.5);
	}

	input[type='range'] {
		width: 6rem;
		accent-color: var(--color-border-focus);
		cursor: pointer;
	}

	.volume-value {
		font-family: var(--font-numeric);
		font-size: var(--text-score-xs);
		font-weight: var(--weight-bold);
		color: var(--color-text-gold);
		min-width: 2rem;
		text-align: right;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		background-color: var(--btn-secondary-bg);
		border: 2px solid var(--btn-secondary-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--btn-secondary-shadow);
		padding: var(--space-1-5) var(--space-3);
		color: var(--btn-secondary-text);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.toggle:hover {
		background-color: var(--btn-secondary-bg-hover);
		box-shadow: var(--btn-secondary-shadow-hover);
	}

	.toggle:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.theme-icon {
		font-size: 0.9rem;
		line-height: 1;
	}

	.toggle-label {
		min-width: 2.5rem;
		text-align: left;
	}

	.setting-select {
		font-family: var(--font-numeric);
		font-size: var(--text-score-xs);
		font-weight: var(--weight-bold);
		color: var(--color-text-gold);
		background-color: var(--input-bg);
		border: 2px solid var(--input-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--input-shadow);
		padding: var(--space-1-5) var(--space-3);
		cursor: pointer;
		appearance: none;
		text-align: center;
		min-width: 4.5rem;
		transition:
			border-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.setting-select:hover {
		border-color: var(--input-border-hover);
	}

	.setting-select:focus-visible {
		outline: none;
		border-color: var(--input-border-focus);
		box-shadow: var(--input-shadow-focus);
	}

	.setting-select option {
		background-color: var(--color-bg-elevated);
		color: var(--color-text-primary);
		font-family: var(--font-body);
	}
</style>