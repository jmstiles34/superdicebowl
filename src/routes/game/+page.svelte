<script lang="ts">
    import { DEFAULT_SETTINGS, DISPLAY, EMPTY_TEAM, TEAM } from '$lib/constants/constants';
    import type { GameSettings } from '$lib/types';
    //import { settings } from '../stores/Settings'
    import Settings from '$lib/screens/Settings.svelte';
    import Game from '$lib/screens/Game.svelte';
    import * as R from 'ramda';

    let display:string = DISPLAY.SETTINGS;
    let gameSettings:GameSettings = DEFAULT_SETTINGS;

    function setDisplay(dis:string) {
        display = dis;
        
        if(dis === DISPLAY.SETTINGS){
            gameSettings = {
                ...gameSettings,
                homeTeam: EMPTY_TEAM,
                awayTeam: EMPTY_TEAM,
        }
        }
    }

    function setGameMode(e:CustomEvent) {
        gameSettings = {
            ...gameSettings,
            mode: e.detail
        }
    }

    function setTeam(e:CustomEvent) {
        const {detail} = e;
        gameSettings = {
            ...gameSettings,
            awayTeam: detail.type === TEAM.AWAY ? detail.team : gameSettings.awayTeam,
            homeTeam: detail.type === TEAM.HOME ? detail.team : gameSettings.homeTeam,
        }
    }

    function setWinScore (e:CustomEvent) {
        gameSettings = {
            ...gameSettings,
            winScore: e.detail,
        }
    }
</script>

<main>
    HEY DUDE!!!
    <!-- <Game {gameSettings} on:reset={() => setDisplay(DISPLAY.SETTINGS)} /> -->
</main>

<style>
    main {
		display: flex;
		flex-direction: column;
		justify-content: center;
        text-align: center;
		padding: 1rem;
		max-width: 1400px;
		margin: 0 auto;
	}
</style>