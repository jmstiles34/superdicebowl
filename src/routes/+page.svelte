<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/Settings';
	import { game } from '$lib/stores/Game';
	import { goto } from '$app/navigation';
	import { GAME_MODE, TEAM } from '$lib/constants/constants';
	import TeamSelect from '$lib/components/TeamSelect.svelte';
	import { beginDisabled } from '$lib/utils/game';
	import { sleep } from '$lib/utils/common';
	import { Sound } from 'svelte-sound';
	import gust from '$lib/assets/sfx/gust.mp3';
	import tackle from '$lib/assets/sfx/tackle.mp3';
	import tap from '$lib/assets/sfx/tap.mp3';

	$: gustSfx = new Sound(gust, { volume: $settings.volume });
	$: tackleSfx = new Sound(tackle, { volume: $settings.volume });
	$: tapSfx = new Sound(tap, { volume: $settings.volume });

	onMount(() => {
		settings.resetTeams();
		game.reset();
	});
	let winScore = $settings.winScore;
	$: settings.updateScore(winScore);

	function beginGame() {
		tackleSfx.play();
		sleep(1000).then(() => goto('/game'));
	}
</script>

<main>
	<div class="mode-row">
		<button
			class="mode-button"
			class:mode-selected={$settings.mode === GAME_MODE.SOLO}
			on:click={() => {
				tapSfx.play();
				settings.updateMode(GAME_MODE.SOLO);
			}}
		>
			Solo Play
		</button>
		<button
			class="mode-button"
			class:mode-selected={$settings.mode === GAME_MODE.HEAD_TO_HEAD}
			on:click={() => {
				tapSfx.play();
				settings.updateMode(GAME_MODE.HEAD_TO_HEAD);
			}}
		>
			Head-to-Head
		</button>
	</div>

	<div class="team-select">
		<TeamSelect
			opponentId={$settings.awayTeam.id}
			saveTeam={(team) => {
				gustSfx.play();
				settings.updateHomeTeam(team);
			}}
			team={$settings.homeTeam}
			teamType={TEAM.HOME}
		/>
		<div class="vs">VS.</div>
		<TeamSelect
			opponentId={$settings.homeTeam.id}
			saveTeam={(team) => {
				gustSfx.play();
				settings.updateAwayTeam(team);
			}}
			team={$settings.awayTeam}
			teamType={TEAM.AWAY}
		/>
	</div>

	<div class="begin-row">
		<div class="score-select">
			<label class="score-label" for="winScore">Win Score:</label>
			<select id="winScore" class="win-score" bind:value={winScore}>
				{#each Array(99) as _, i}
					<option value={i + 1}>{i + 1}</option>
				{/each}
			</select>
		</div>
		<button
			class="begin-button"
			disabled={beginDisabled([$settings.awayTeam.id, $settings.homeTeam.id])}
			on:click={beginGame}
		>
			Let's Roll!
		</button>
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
		background-color: var(--ltblue);
		min-width: 8.75rem;
		&:hover {
			background-color: var(--button-hover);
		}
	}
	.mode-selected,
	.mode-selected:hover {
		background-color: var(--steelblue);
		color: var(--ivory);
		cursor: default;
	}
	.score-label {
		color: var(--ivory);
		margin: auto 0;
		padding-right: 6px;
		white-space: nowrap;
	}

	.score-select {
		display: flex;
	}
	.team-select {
		display: flex;
		gap: 16px;
	}
	.vs {
		color: var(--ivory);
		font-size: 1.75rem;
		margin: auto 0;
	}
	.win-score {
		font-family: inherit;
		font-size: inherit;
		background-color: var(--ltblue);
		border: none;
		border-radius: var(--border-radius);
		color: var(--black);
		margin: 0 8px 8px 0;
		padding: 3px 8px;
	}
	@media (max-width: 40rem) {
		.team-select {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
