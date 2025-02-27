<script lang="ts">
	import { TEAM } from '$lib/constants/constants';
	import type { Team } from '$lib/types';
	import { game } from '$lib/state/game.svelte';
	import { getScoreByTeam } from '$lib/utils/game';

	type ScoresProps = {
		awayTeam: Team;
		homeTeam: Team;
	};

	let { awayTeam, homeTeam }: ScoresProps = $props();
	let awayScore = $derived(getScoreByTeam(TEAM.AWAY, game.playLog));
	let homeScore = $derived(getScoreByTeam(TEAM.HOME, game.playLog));

	let awayToRgb = awayTeam.colors.primary.replace('/ 1', '/ 0.5');
	let homeToRgb = homeTeam.colors.primary.replace('/ 1', '/ 0.5');
</script>

<div class="team-scores">
	<div
		class="team"
		style={`
        background-color: ${homeTeam.colors.primary};
        background-image: linear-gradient(to right, ${homeToRgb} 0 100%), url(/logos/${homeTeam.fieldLogo}.webp)`}
	>
		<div class="city-wrapper">
			{#if game.possession === TEAM.HOME}
				<div class="possession"></div>
			{/if}
			<div class="cityName">{homeTeam.city}</div>
			<div class="cityKey">{homeTeam.cityKey}</div>
		</div>
	</div>
	<div class="score">{homeScore}</div>
	<div
		class="team"
		style={`
        background-color: ${awayTeam.colors.primary};
        background-image: linear-gradient(to right, ${awayToRgb} 0 100%), url(/logos/${awayTeam.fieldLogo}.webp)`}
	>
		<div class="city-wrapper">
			{#if game.possession === TEAM.AWAY}
				<div class="possession"></div>
			{/if}
			<div class="cityName">{awayTeam.city}</div>
			<div class="cityKey">{awayTeam.cityKey}</div>
		</div>
	</div>
	<div class="score">{awayScore}</div>
</div>

<style>
	.team-scores {
		display: flex;
		color: var(--color-white);
		font-size: 0.9rem;
		font-weight: bold;
		white-space: nowrap;
		margin-left: 0.2rem;
	}
	.team {
		display: flex;
		justify-content: flex-end;
		width: 40%;
		padding: 0.25rem 0.5rem;
		background-position: left;
		background-position-x: -1.25rem;
		background-size: 50%;
		background-repeat: no-repeat;
		transition: all 0.3s ease-out;
	}
	.city-wrapper {
		display: flex;
		overflow: hidden;
	}
	.cityKey {
		display: block;
	}
	.cityName {
		display: none;
	}
	.possession {
		width: 1rem;
		height: 0.8rem;
		border-radius: 50%;
		margin-right: 0.3rem;
		margin-top: 0.175rem;
		box-shadow:
			inset 0 2px #111,
			inset 0 -2px #555;
		background-color: var(--color-white);
	}
	.score {
		width: 10%;
		height: 100%;
		background-color: var(--color-white);
		color: var(--color-offblack);
		padding-top: 0.25rem;
		text-align: center;
	}
	@media (min-width: 52rem) {
		.team {
			background-position-x: -25px;
			background-size: 40%;
		}
		.cityKey {
			display: none;
		}
		.cityName {
			display: block;
		}
	}
</style>
