<script lang="ts">
    import { DEFAULT_TEAM, NOOP, POSITION } from "$lib/constants/constants";
    import CustomHelmet from "$lib/components/CustomHelmet.svelte";
	import type { Team, Void } from "$lib/types";
    import '@fontsource/bebas-neue';
    
    export let hasBall = false;
    export let inFieldGoalRange = false;
    export let position = POSITION.LEFT;
    export let team:Team = DEFAULT_TEAM;
    export let toggleFieldGoal:Void;
    const {primary, secondary, faceMask, helmet, stripe, trim} = team.colors;

    $: allowFieldGoal = hasBall && inFieldGoalRange;
</script>

<div class="endZone" style={`background-color: ${primary};`}>
    <div 
        class="endZoneElements"
        class:endZoneElementsRight={position === POSITION.RIGHT}
    >
        <div></div>
        <div 
            class={`helmetLogo rotate${position}`}
            class:flipLeft={position === POSITION.LEFT}
        >
            <CustomHelmet 
                bg={primary}
                faceMask={faceMask} 
                helmet={helmet}
                stripe={stripe}
                trim={trim}
                logo={team.logo}
                logoWidth={team.logoWidth || 2.5}
                logoPosition={team.logoPosition || [13, 20]}
                height={55}
                width={55} 
            />
        </div>       
        
        <div 
            class={`name`}
            class:flipName={position === POSITION.RIGHT}
            style={`color: ${secondary};`}>
            {team.name}
        </div>

        <div 
            class={`helmetLogo rotate${position}`}
            class:flipRight={position === POSITION.RIGHT}
        >
            <CustomHelmet 
                bg={primary}
                faceMask={faceMask} 
                helmet={helmet}
                stripe={stripe}
                trim={trim}
                logo={team.logo}
                logoWidth={team.logoWidth || 2.5}
                logoPosition={team.logoPosition || [13, 20]}
                height={55}
                width={55} 
            />
        </div>
        <div></div>
    </div>
    <div 
        class="goalPost"
        class:right={position === POSITION.RIGHT}
        class:clickable={allowFieldGoal}
        on:click={allowFieldGoal ? () => toggleFieldGoal() : NOOP}
        on:keydown={allowFieldGoal ? () => toggleFieldGoal() : NOOP}
        role="button"
        tabindex=0
    >
        <div class="post" class:pulse={allowFieldGoal}></div>
        <div class="bar" class:pulse={allowFieldGoal}></div>
        <div class="post" class:pulse={allowFieldGoal}></div>
    </div>
</div>

<style>
    .clickable {
        cursor: pointer;
    }
    .endZone {
        border: 0.125rem solid var(--white);
        background-color: var(--yellow);
    }
    .endZoneElements{
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 0.5em 3em auto 3em 0.5em;
        gap: 0.25em;
        height: 100%;
        width: 95%;
    }
    .endZoneElementsRight {
        margin-left: 0.4rem;
    }
    .goalPost {
        display: flex;
        flex-direction: column;
        position: absolute;
        align-items: center;
        height: 25%;
        width: 0.6rem;
        top: 50%;
        left: 0;
        transform: translate(-50%, -50%);
    }
    .goalPost.right {
        left: unset;
        right: -11px;
    }
    .post {
        width: 0.5rem;
        height: 0.5rem;
        -webkit-border-radius: 50%;
        -moz-border-radius: 50%;
        border-radius: 50%;
        background-color: var(--yellow);
    }
    .bar{
        width: .25rem;
        height: 100%;
        background-color: var(--yellow);
    }
    .helmetLogo {
        display: flex;
        justify-content: center;
        margin: auto;
        height: 100%;
        width: 3rem;     
    }
    .name {
        display: flex;
        font-weight:700;
        font-family: 'Bebas Neue';
        font-size: clamp(2.5rem, 1.2250rem + 4.5333vw, 3.35rem);
        transform: rotate(180deg);
        writing-mode: vertical-lr;
        justify-content: center;

    }
    .rotateLeft {
        transform: rotate(-90deg); 
    }
    .rotateRight {
        transform: rotate(90deg);
    }
    .flipLeft {
        transform: rotate(-90deg) scale(-1, 1);
    }
    .flipRight {
        transform: rotate(90deg) scale(-1, 1);
    }
    .flipName {
        transform: rotate(360deg);
    }
    .pulse {
        animation: pulse-animation 2s infinite;
    }
    @keyframes pulse-animation {
        0% {
            box-shadow: 0 0 0 0px rgba(255, 215, 0, 0.2);
        }
        100% {
            box-shadow: 0 0 0 1.25rem rgba(255, 215, 0, 0);
        }
    }
</style>