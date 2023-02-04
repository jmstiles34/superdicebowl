<script lang="ts">
	import { game } from '$lib/stores/Game'
    import { settings } from '$lib/stores/Settings'
    import * as R from 'ramda';
    import { hexToRGB } from '$lib/utils/common'
    import { TEAM } from "$lib/constants/constants";

    let awayToRgb = hexToRGB($settings.awayTeam.primaryColor);
    let homeToRgb = hexToRGB($settings.homeTeam.primaryColor);
</script>

<div class="team-scores">
    <div class="team" style={`
        background-color: ${$settings.homeTeam.primaryColor};
        background-image: linear-gradient(to right, rgba(${homeToRgb.r},${homeToRgb.g},${homeToRgb.b}, 0.5) 0 100%), url(/logos/${$settings.homeTeam.name}.png);
    `}> 
        <div class="city-wrapper">
            {#if R.equals($game.possession, TEAM.HOME)}
                <div class="possession"></div>
            {/if}
            <div class="cityName">{$settings.homeTeam.city}</div>
            <div class="cityKey">{$settings.homeTeam.cityKey}</div>
        </div>
    </div>
    <div class="score">{$game.homeScore}</div>
    <div class="team" style={`
        background-color: ${$settings.awayTeam.primaryColor};
        background-image: linear-gradient(to right, rgba(${awayToRgb.r},${awayToRgb.g},${awayToRgb.b}, 0.5) 0 100%), url(/logos/${$settings.awayTeam.name}.png);
    `}> 
        <div class="city-wrapper">
            {#if R.equals($game.possession, TEAM.AWAY)}
                <div class="possession"></div>
            {/if}
            <div class="cityName">{$settings.awayTeam.city}</div>
            <div class="cityKey">{$settings.awayTeam.cityKey}</div>
        </div>
    </div>
    <div class="score">{$game.awayScore}</div>
</div>

<style>
    .team-scores {
        display: flex;
        color: var(--white);
        font-family: var(--mono);
        font-size: 24px;
        font-weight: bold;
        white-space: nowrap;
        margin: 0 0 20px 12px;
    }
    .team {
        display: flex;
        justify-content: flex-end;
        width: 40%;
        padding: 8px 12px 8px 12px;
        background-position: left;
        background-position-x: -20px;
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
        width: 10px;
        height: 10px;
        padding: 9px 11px;
        border-radius: 50%;
        margin-right: 10px;
        margin-top: 5px;
        box-shadow: inset 0 3px #111, inset 0 -3px #555;
        background-color: var(--white)
    }
    .score {
        width: 10%;
        background-color: var(--white);
        color: var(--black);
        text-align: center;
        margin: auto 0;
        padding: 8px;
    }
    @media (min-width: 835px) {
        .team {
            background-position-x: -30px;
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