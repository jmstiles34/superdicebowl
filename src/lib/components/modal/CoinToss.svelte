<script lang="ts">
    import { randomNumber, sleep } from '$lib/utils/common'
	import { EMPTY_TEAM, NOOP, TEAM } from "$lib/constants/constants";
    type SetPos = (value: string) => void;
    export let homeTeam = EMPTY_TEAM;
    export let awayTeam = EMPTY_TEAM;
    export let setPossession:SetPos;

    let winStyle:string;

    async function handleCoinToss(num:number) {
        winStyle = num === 0 ? TEAM.HOME : TEAM.AWAY;
        await sleep(4000);
        setPossession(winStyle)
    }
</script>

<div>
    <h3>Coin Toss for Possession</h3>
</div>
<div class="game-mode">
    <div id="coin" class={winStyle} 
        on:click={winStyle ? NOOP : () => handleCoinToss(randomNumber())} 
        on:keydown={winStyle ? NOOP : () => handleCoinToss(randomNumber())}
    >
        <div 
            class="side-home" 
            style={`
                background-color: ${homeTeam.primaryColor};
                border: 1px solid ${homeTeam.secondaryColor};
            `}
        >
            <img 
                alt={`${homeTeam.city} ${homeTeam.name} Helmet`} 
                class={`helmetLogo`}
                src={`/logos/${homeTeam.name}.png`}/>
        </div>
        <div 
            class="side-away" 
            style={`
                background-color: ${awayTeam.primaryColor};
                border: 1px solid ${awayTeam.secondaryColor};
            `}
        >
            <img 
                alt={`${awayTeam.city} ${awayTeam.name} Helmet`} 
                class={`helmetLogo`}
                src={`/logos/${awayTeam.name}.png`}/>
        </div>
    </div>
</div>

<style>
    #coin {
        position: relative;
        margin: 0 auto;
        width: 100px;
        height: 100px;
        cursor: pointer;
    }
    #coin div {
        display: flex;
        justify-content: center;
        width: 100%;
        height: 100%;
        -webkit-border-radius: 50%;
        -moz-border-radius: 50%;
        border-radius: 50%;
        -webkit-box-shadow: inset 0 0 45px rgba(255,255,255,.3), 0 12px 20px -10px rgba(0,0,0,.4);
        -moz-box-shadow: inset 0 0 45px rgba(255,255,255,.3), 0 12px 20px -10px rgba(0,0,0,.4);
        box-shadow: inset 0 0 45px rgba(255,255,255,.3), 0 12px 20px -10px rgba(0,0,0,.4);
    }
    h3 {
        color: var(--black);
    }
    .helmetLogo {
        height: 85px;
        width: 85px;
        margin: auto 0;
    }
    #coin {
        transition: -webkit-transform 1s ease-in;
        -webkit-transform-style: preserve-3d;
        transform-style: preserve-3d;
    }
    #coin div {
        position: absolute;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
    }
    .side-home {
        z-index: 100;
    }
    .side-away {
        -webkit-transform: rotateY(-180deg);
        transform: rotateY(-180deg);

    }

    #coin.Home {
        -webkit-animation: flipHeads 3s ease-out forwards;
        -moz-animation: flipHeads 3s ease-out forwards;
        -o-animation: flipHeads 3s ease-out forwards;
        animation: flipHeads 3s ease-out forwards;
    }
    #coin.Away {
        -webkit-animation: flipTails 3s ease-out forwards;
        -moz-animation: flipTails 3s ease-out forwards;
        -o-animation: flipTails 3s ease-out forwards;
        animation: flipTails 3s ease-out forwards;
    }

    @keyframes flipHeads {
        from { -webkit-transform: rotateY(0); -moz-transform: rotateY(0); transform: rotateY(0); }
        to { -webkit-transform: rotateY(1800deg); -moz-transform: rotateY(1800deg); transform: rotateY(1800deg); }
    }
    @keyframes flipTails {
        from { -webkit-transform: rotateY(0); -moz-transform: rotateY(0); transform: rotateY(0); }
        to { -webkit-transform: rotateY(1980deg); -moz-transform: rotateY(1980deg); transform: rotateY(1980deg); }
    }
</style>