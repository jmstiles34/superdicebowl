<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { game } from '$lib/baseball/state/game.svelte';
	import { GAME_MODE, TEAM } from '$lib/shared/constants';
	import { DEFAULT_TEAM } from '$lib/shared/constants';
	import { beginDisabled } from '$lib/football/utils/game';
	import { sleep } from '$lib/utils/common';
	import tap from '$lib/assets/sfx/tap.mp3';
	import gust from '$lib/assets/sfx/gust.mp3';
	import tackle from '$lib/assets/sfx/tackle.mp3';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';
	import { settings } from '$lib/state/settings.svelte';
	import TeamSelect from '$lib/baseball/components/TeamSelect.svelte';
	import type { Team } from '$lib/shared/types';

	const gustSfx: Howl = createSound(gust);
	const tackleSfx: Howl = createSound(tackle);
	const tapSfx: Howl = createSound(tap);

	let mode = $state(GAME_MODE.HEAD_TO_HEAD);
	let homeTeam: Team = $state(DEFAULT_TEAM);
	let awayTeam: Team = $state(DEFAULT_TEAM);

	onMount(() => {
		game.resetGame();
		homeTeam = DEFAULT_TEAM;
		awayTeam = DEFAULT_TEAM;
		mode = GAME_MODE.HEAD_TO_HEAD;
	});

	const beginGame = () => {
		settings.homeTeam = homeTeam;
		settings.awayTeam = awayTeam;
		settings.mode = mode;
		playSound(tackleSfx, settings.volume);
		sleep(1000).then(() => goto('/baseball/game'));
	};
</script>

<main>
	<h1>Super Dice Baseball</h1>

	<div class="mode-row">
		{#each [[GAME_MODE.SOLO, 'Solo Play'], [GAME_MODE.HEAD_TO_HEAD, 'Head-to-Head'], [GAME_MODE.SIMULATION, 'Simulation']] as [m, text]}
			<button
				class="game-button mode-button"
				class:mode-selected={mode === m}
				onclick={() => {
					playSound(tapSfx, settings.volume);
					mode = m;
				}}
			>
				{text}
			</button>
		{/each}
	</div>

	<div class="team-select">
		<TeamSelect
			opponentId={awayTeam.id}
			saveTeam={(team) => {
				playSound(gustSfx, settings.volume);
				homeTeam = team;
			}}
			team={homeTeam}
			teamType={TEAM.HOME}
		/>
		<div class="vs">VS.</div>
		<TeamSelect
			opponentId={homeTeam.id}
			saveTeam={(team) => {
				playSound(gustSfx, settings.volume);
				awayTeam = team;
			}}
			team={awayTeam}
			teamType={TEAM.AWAY}
		/>
	</div>

	<div class="begin-row">
		<button
			class="game-button begin-button"
			disabled={beginDisabled([awayTeam.id, homeTeam.id])}
			onclick={beginGame}
		>
			Play Ball!
		</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		align-items: center;
		padding: var(--space-10) var(--space-8);
	}

	h1 {
		font-family: var(--font-display);
		font-weight: var(--weight-black);
		font-style: italic;
		font-size: var(--text-display-lg);
		letter-spacing: var(--tracking-display);
		color: var(--color-text-primary);
		text-shadow: var(--text-shadow-display);
		text-align: center;
		margin: 0;
	}

	.mode-row {
		display: flex;
		gap: var(--space-4);
	}

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

	.begin-row {
		display: flex;
		gap: var(--space-3);
	}

	@media (max-width: 780px) {
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
	}
</style>
