<script lang="ts">
	import { onMount } from 'svelte';
	import { game } from '$lib/state/game.svelte';
	import { goto } from '$app/navigation';
	import { GAME_MODE, TEAM } from '$lib/constants/constants';
	import TeamSelect from '$lib/components/TeamSelect.svelte';
	import { beginDisabled } from '$lib/utils/game';
	import { sleep } from '$lib/utils/common';
	import gust from '$lib/assets/sfx/gust.mp3';
	import tackle from '$lib/assets/sfx/tackle.mp3';
	import tap from '$lib/assets/sfx/tap.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';
	import { settings } from '$lib/state/settings.svelte';

	const gustSfx: Howl = createSound(gust);
	const tackleSfx: Howl = createSound(tackle);
	const tapSfx: Howl = createSound(tap);

	onMount(() => {
		settings.resetSettings();
		game.resetGame();
	});

	const beginGame = () => {
		playSound(tackleSfx, settings.volume);
		sleep(1000).then(() => goto('/game'));
	};

	const handleScoreChange = (e: Event) => {
		const { value } = e.currentTarget as HTMLSelectElement;
		settings.winScore = parseInt(value);
	};
</script>

{#snippet modeButton(mode: string, text: string)}
	<button
		class="game-button mode-button"
		class:mode-selected={settings.mode === mode}
		onclick={() => {
			playSound(tapSfx, settings.volume);
			settings.mode = mode;
		}}
	>
		{text}
	</button>
{/snippet}

<main>
	<div class="mode-row">
		{@render modeButton(GAME_MODE.SOLO, 'Solo Play')}
		{@render modeButton(GAME_MODE.HEAD_TO_HEAD, 'Head-to-Head')}
		{@render modeButton(GAME_MODE.SIMULATION, 'Simulation')}
	</div>

	<div class="team-select">
		<TeamSelect
			opponentId={settings.awayTeam.id}
			saveTeam={(team) => {
				playSound(gustSfx, settings.volume);
				settings.homeTeam = team;
			}}
			team={settings.homeTeam}
			teamType={TEAM.HOME}
		/>
		<div class="vs">VS.</div>
		<TeamSelect
			opponentId={settings.homeTeam.id}
			saveTeam={(team) => {
				playSound(gustSfx, settings.volume);
				settings.awayTeam = team;
			}}
			team={settings.awayTeam}
			teamType={TEAM.AWAY}
		/>
	</div>

	<div class="begin-row">
		<div class="score-select">
			<label class="score-label" for="winScore">Win Score</label>
			<select
				id="winScore"
				class="win-score"
				value={settings.winScore}
				onchange={handleScoreChange}
			>
				{#each Array(99) as _, i}
					<option value={i + 1}>{i + 1}</option>
				{/each}
			</select>

			<button
				class="game-button begin-button"
				disabled={beginDisabled([settings.awayTeam.id, settings.homeTeam.id])}
				onclick={beginGame}
			>
				Let's Roll!
			</button>
		</div>
	</div>
</main>

<style>
	/* ── Page layout ──────────────────────────────────────────── */
	main {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		align-items: center;
		padding: var(--space-10) var(--space-8);
	}

	/* ── Mode row ─────────────────────────────────────────────── */
	.mode-row {
		display: flex;
		gap: var(--space-4);
	}

	/* ── Base game button ─────────────────────────────────────── */
	.game-button {
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		padding: var(--space-2-5) var(--space-5);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes),
			color var(--dur-fast) var(--ease-snes);

		/* Secondary button tokens at rest */
		background-color: var(--btn-secondary-bg);
		color: var(--btn-secondary-text);
		border: 2px solid var(--btn-secondary-border);
		box-shadow: var(--btn-secondary-shadow);
	}

	.game-button:hover {
		background-color: var(--btn-secondary-bg-hover);
		box-shadow: var(--btn-secondary-shadow-hover);
	}

	.game-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.game-button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* ── Mode button ──────────────────────────────────────────── */
	.mode-button {
		min-width: 8.75rem;
	}

	.mode-selected,
	.mode-selected:hover {
		background-color: var(--btn-gold-bg);
		color: var(--btn-gold-text);
		border-color: var(--btn-gold-border);
		box-shadow: var(--btn-gold-shadow);
		cursor: default;
	}

	/* ── Begin / CTA button ───────────────────────────────────── */
	.begin-button {
		background-color: var(--btn-primary-bg);
		color: var(--btn-primary-text);
		border-color: var(--btn-primary-border);
		box-shadow: var(--btn-primary-shadow);
		font-size: var(--text-md);
		padding: var(--space-2-5) var(--space-8);
	}

	.begin-button:hover {
		background-color: var(--btn-primary-bg-hover);
		box-shadow: var(--btn-primary-shadow-hover);
	}

	/* ── Team select area ─────────────────────────────────────── */
	.team-select {
		display: flex;
		gap: var(--space-6);
		align-items: center;
	}

	.vs {
		font-family: var(--font-display);
		font-weight: var(--weight-black);
		font-style: italic;
		font-size: var(--text-display-md);
		letter-spacing: var(--tracking-display);
		color: var(--color-text-tertiary);
		text-shadow: var(--text-shadow-display);
		white-space: nowrap;
		user-select: none;
	}

	/* ── Begin row ────────────────────────────────────────────── */
	.begin-row {
		display: flex;
		gap: var(--space-3);
	}

	.score-select {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	/* ── Score label ──────────────────────────────────────────── */
	.score-label {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	/* ── Win score select ─────────────────────────────────────── */
	.win-score {
		font-family: var(--font-numeric);
		font-size: var(--text-score-sm);
		font-weight: var(--weight-bold);
		background-color: var(--input-bg);
		border: 2px solid var(--input-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--input-shadow);
		color: var(--color-text-gold);
		margin: 0;
		padding: var(--space-2) var(--space-3);
		width: 5.5rem;
		cursor: pointer;
		appearance: none;
		text-align: center;
		transition:
			border-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.win-score:hover {
		border-color: var(--input-border-hover);
	}

	.win-score:focus-visible {
		outline: none;
		border-color: var(--input-border-focus);
		box-shadow: var(--input-shadow-focus);
	}

	.win-score option {
		background-color: var(--color-bg-elevated);
		color: var(--color-text-primary);
		font-family: var(--font-body);
	}

	/* ── Mobile ───────────────────────────────────────────────── */
	@media (max-width: 40rem) {
		main {
			padding: var(--space-6) var(--space-4);
			gap: var(--space-6);
		}

		.mode-row {
			gap: var(--space-2);
		}

		.mode-button {
			min-width: auto;
			padding: var(--space-2) var(--space-3);
			font-size: var(--text-sm);
		}

		.team-select {
			flex-direction: column;
			align-items: center;
			gap: var(--space-4);
		}

		.vs {
			font-size: var(--text-display-sm);
		}

		.score-select {
			flex-wrap: wrap;
			justify-content: center;
		}
	}
</style>