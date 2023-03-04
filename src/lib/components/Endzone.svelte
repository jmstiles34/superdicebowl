<script lang="ts">
    import { DEFAULT_TEAM, NOOP, POSITION } from "$lib/constants/constants";
    import CustomHelmet from "$lib/components/CustomHelmet.svelte";
	import type { Team, Void } from "$lib/types";
    
    export let hasBall = false;
    export let inFieldGoalRange = false;
    export let position = POSITION.LEFT;
    export let team:Team = DEFAULT_TEAM;
    export let toggleFieldGoal:Void;
    const {primary, secondary, faceMask, helmet, stripe, trim} = team.colors;

    $: allowFieldGoal = hasBall && inFieldGoalRange;
</script>

<div class="endZone" style={`background-color: ${primary};`}>        
    {#if team.hasOwnProperty('logo')}
        <div 
            class={`helmetLogo helmetTop rotate${position}`}
            class:flipLeft={position === POSITION.LEFT}>
            <CustomHelmet 
                bg={primary}
                faceMask={faceMask} 
                helmet={helmet}
                stripe={stripe}
                trim={trim}
                logo={team.logo}
                height={55}
                width={55} 
            />
        </div>
    {:else}
        <img 
            alt={`${team.city} ${team.name} Helmet`} 
            class={`helmetLogo helmetTop rotate${position}`}
            class:flipLeft={position === POSITION.LEFT}
            src={`/helmets/${team.name}.png`}
        />
    {/if}
    
    <div 
        class={`name rotate${position}`}
        style={`color: ${secondary};`}>
        {team.name}
    </div>

    {#if team.hasOwnProperty('logo')}
        <div 
            class={`helmetLogo helmetBottom rotate${position}`}
            class:flipRight={position === POSITION.RIGHT}>
            <CustomHelmet 
                bg={primary}
                faceMask={faceMask} 
                helmet={helmet}
                stripe={stripe}
                trim={trim}
                logo={team.logo}
                height={55}
                width={55} 
            />
        </div>
    {:else}
        <img 
            alt={`${team.city} ${team.name} Helmet`} 
            class={`helmetLogo helmetBottom rotate${position}`}
            class:flipRight={position === POSITION.RIGHT}
            src={`/helmets/${team.name}.png`}
        />
    {/if}

    <div 
        class="goalPost"
        class:right={position === POSITION.RIGHT}
        class:clickable={allowFieldGoal}
        on:click={allowFieldGoal ? () => toggleFieldGoal() : NOOP}
        on:keydown={allowFieldGoal ? () => toggleFieldGoal() : NOOP}
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
        width: 10%;
        border: 2px solid var(--white);
        background-color: var(--yellow);
    }
    .goalPost {
        display: flex;
        flex-direction: column;
        position: absolute;
        align-items: center;
        height: 25%;
        width: 10px;
        top: 50%;
        left: 0;
        transform: translate(-50%, -50%);
    }
    .goalPost.right {
        left: unset;
        right: -11px;
    }
    .post {
        width: 9px;
        height: 9px;
        -webkit-border-radius: 50%;
        -moz-border-radius: 50%;
        border-radius: 50%;
        background-color: var(--yellow);
    }
    .bar{
        width: 4px;
        height: 100%;
        background-color: var(--yellow);
    }
    .helmetLogo {
        position: absolute;
        height: 50px;
        width: 50px;        
        left: 50%;
    }
    .helmetTop {
        top: 10%;
    }
    .helmetBottom {
        top: 90%;
    }
    .name {
        font-weight: bold;
        text-transform: uppercase;
        font-family: var(--mono);
        font-size: 40px;
        position: absolute;
        top: 50%;
        left: 50%;
    }
    .rotateLeft {
        transform:  translateX(-50%) translateY(-50%) rotate(-90deg); 
    }
    .rotateRight {
        transform:  translateX(-50%) translateY(-50%) rotate(90deg);
    }
    .flipLeft {
        transform:  translateX(-50%) translateY(-50%) rotate(-90deg) scale(-1, 1);
    }
    .flipRight {
        transform:  translateX(-50%) translateY(-50%) rotate(90deg) scale(-1, 1);
    }
    .pulse {
        animation: pulse-animation 2s infinite;
    }
    @keyframes pulse-animation {
        0% {
            box-shadow: 0 0 0 0px rgba(255, 215, 0, 0.2);
        }
        100% {
            box-shadow: 0 0 0 20px rgba(255, 215, 0, 0);
        }
    }
</style>