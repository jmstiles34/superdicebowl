<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/Settings';
	import { game } from '$lib/stores/Game';
	import { goto } from '$app/navigation';
	import { GAME_MODE, TEAM } from '$lib/constants/constants';
	import TeamSelect from '$lib/components/TeamSelect.svelte';
	import { beginDisabled } from '$lib/utils/game';
	import { playSound, sleep } from '$lib/utils/common';
	import { Sound } from 'svelte-sound';
	import gust from '$lib/assets/sfx/gust.mp3';
	import tackle from '$lib/assets/sfx/tackle.mp3';
	import tap from '$lib/assets/sfx/tap.mp3';

	const gustSfx: Sound = new Sound(gust);
	const tackleSfx: Sound = new Sound(tackle);
	const tapSfx: Sound = new Sound(tap);

	onMount(() => {
		settings.resetTeams();
		game.reset();
	});

	const beginGame = () => {
		playSound(tackleSfx, $settings.volume);
		sleep(1000).then(() => goto('/game'));
	};

	const handleScoreChange = (e: Event) => {
		const { value } = e.currentTarget as HTMLSelectElement;
		settings.updateScore(parseInt(value));
	};
</script>

{#snippet modeButton(mode, text)}
	<button
		class="game-button mode-button"
		class:mode-selected={$settings.mode === mode}
		onclick={() => {
			playSound(tapSfx, $settings.volume);
			settings.updateMode(mode);
		}}
	>
		{text}
	</button>
{/snippet}

<main>
	<div class="mode-row">
		{@render modeButton(GAME_MODE.SOLO, 'Solo Play')}
		{@render modeButton(GAME_MODE.HEAD_TO_HEAD, 'Head-to-Head')}
	</div>

	<div class="team-select">
		<TeamSelect
			opponentId={$settings.awayTeam.id}
			saveTeam={(team) => {
				playSound(gustSfx, $settings.volume);
				settings.updateHomeTeam(team);
			}}
			team={$settings.homeTeam}
			teamType={TEAM.HOME}
		/>
		<div class="vs">VS.</div>
		<TeamSelect
			opponentId={$settings.homeTeam.id}
			saveTeam={(team) => {
				playSound(gustSfx, $settings.volume);
				settings.updateAwayTeam(team);
			}}
			team={$settings.awayTeam}
			teamType={TEAM.AWAY}
		/>
	</div>

	<div class="begin-row">
		<div class="score-select">
			<label class="score-label" for="winScore">Win Score:</label>
			<select
				id="winScore"
				class="win-score"
				value={$settings.winScore}
				onchange={handleScoreChange}
			>
				{#each Array(99) as _, i}
					<option value={i + 1}>{i + 1}</option>
				{/each}
			</select>

			<button
				class="game-button"
				disabled={beginDisabled([$settings.awayTeam.id, $settings.homeTeam.id])}
				onclick={beginGame}
			>
				Let's Roll!
			</button>
		</div>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 16px;
		align-items: center;
		padding: 32px;
	}

	.begin-row {
		display: flex;
		gap: 8px;
	}

	.mode-row {
		display: flex;
		gap: 32px;
	}

	.mode-button {
		min-width: 8.75rem;
	}
	.mode-selected,
	.mode-selected:hover {
		background-color: var(--color-blue-600);
		color: var(--color-white);
		font-weight: 600;
		cursor: default;
	}
	.score-label {
		color: var(--color-white);
		margin: auto 0;
		white-space: nowrap;
	}
	.score-select {
		display: flex;
		gap: 8px;
	}
	.team-select {
		display: flex;
		gap: 16px;
	}
	.vs {
		color: var(--color-white);
		font-size: 1.75rem;
		margin: auto 0;
	}
	.win-score {
		font-family: inherit;
		font-size: inherit;
		background-color: var(--color-blue-300);
		border: none;
		border-radius: var(--border-radius);
		color: var(--color-offblack);
		margin: 0;
		padding: 3px 8px;
	}
	@media (max-width: 40rem) {
		.team-select {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
