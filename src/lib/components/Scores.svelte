<script lang="ts">
  import { hexToRGB } from '$lib/utils/common';
  import { TEAM } from '$lib/constants/constants';
  import type { Team } from '$lib/types';
  import { game } from '$lib/stores/Game';
  import { getScoreByTeam } from '$lib/utils/game';

  export let awayTeam: Team;
  export let homeTeam: Team;

  $: awayScore = getScoreByTeam(TEAM.AWAY, $game.playLog);
  $: homeScore = getScoreByTeam(TEAM.HOME, $game.playLog);
  $: possession = $game.possession;

  let awayToRgb = hexToRGB(awayTeam.colors.primary);
  let homeToRgb = hexToRGB(homeTeam.colors.primary);
</script>

<div class="team-scores">
  <div
    class="team"
    style={`
        background-color: ${homeTeam.colors.primary};
        background-image: linear-gradient(to right, rgba(${homeToRgb.r},${homeToRgb.g},${
      homeToRgb.b
    }, 0.5) 0 100%), url(/logos/${
      homeTeam.hasOwnProperty('logo') ? `custom/${homeTeam.logo}` : homeTeam.name
    }.png);
    `}
  >
    <div class="city-wrapper">
      {#if possession === TEAM.HOME}
        <div class="possession" />
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
        background-image: linear-gradient(to right, rgba(${awayToRgb.r},${awayToRgb.g},${
      awayToRgb.b
    }, 0.5) 0 100%), url(/logos/${
      awayTeam.hasOwnProperty('logo') ? `custom/${awayTeam.logo}` : awayTeam.name
    }.png);
    `}
  >
    <div class="city-wrapper">
      {#if possession === TEAM.AWAY}
        <div class="possession" />
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
    color: var(--white);
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
    box-shadow: inset 0 2px #111, inset 0 -2px #555;
    background-color: var(--white);
  }
  .score {
    width: 10%;
    height: 100%;
    background-color: var(--white);
    color: var(--black);
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
