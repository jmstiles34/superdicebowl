<script lang="ts">
    import { hexToRGB } from '$lib/utils/common'
    import { TEAM } from "$lib/constants/constants";
	import type { Team } from '$lib/types';

    export let awayTeam:Team;
    export let homeTeam:Team;
    export let possession:string;
    export let score:number[];

    let awayToRgb = hexToRGB(awayTeam.colors.primary);
    let homeToRgb = hexToRGB(homeTeam.colors.primary);
</script>

<div class="team-scores">
    <div class="team" style={`
        background-color: ${homeTeam.colors.primary};
        background-image: linear-gradient(to right, rgba(${homeToRgb.r},${homeToRgb.g},${homeToRgb.b}, 0.5) 0 100%), url(/logos/${homeTeam.hasOwnProperty('logo') ? `custom/${homeTeam.logo}` : homeTeam.name}.png);
    `}> 
        <div class="city-wrapper">
            {#if possession === TEAM.HOME}
                <div class="possession"></div>
            {/if}
            <div class="cityName">{homeTeam.city}</div>
            <div class="cityKey">{homeTeam.cityKey}</div>
        </div>
    </div>
    <div class="score">{score[0]}</div>
    <div class="team" style={`
        background-color: ${awayTeam.colors.primary};
        background-image: linear-gradient(to right, rgba(${awayToRgb.r},${awayToRgb.g},${awayToRgb.b}, 0.5) 0 100%), url(/logos/${awayTeam.hasOwnProperty('logo') ? `custom/${awayTeam.logo}` : awayTeam.name}.png);
    `}> 
        <div class="city-wrapper">
            {#if possession === TEAM.AWAY}
                <div class="possession"></div>
            {/if}
            <div class="cityName">{awayTeam.city}</div>
            <div class="cityKey">{awayTeam.cityKey}</div>
        </div>
    </div>
    <div class="score">{score[1]}</div>
</div>

<style>
    .team-scores {
        display: flex;
        color: var(--white);
        font-size: 1.5rem;
        font-weight: bold;
        white-space: nowrap;
        margin: 0 0 0.75rem 0.75rem;
    }
    .team {
        display: flex;
        justify-content: flex-end;
        width: 40%;
        padding: 0.25rem 0.75rem;
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
        width: 0.625rem;
        height: 0.625rem;
        padding: 0.563rem 0.688rem;
        border-radius: 50%;
        margin-right: 0.625rem;
        margin-top: 0.25rem;
        box-shadow: inset 0 3px #111, inset 0 -3px #555;
        background-color: var(--white)
    }
    .score {
        width: 10%;
        background-color: var(--white);
        color: var(--black);
        padding: 0.25rem 0.5rem;
        margin: auto 0;
    }
    @media (min-width: 52rem) {
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