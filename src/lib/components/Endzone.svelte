<script lang="ts">
	import {
		DEFAULT_TEAM,
		NOOP,
		POSITION
	} from '$lib/constants/constants';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import type { Team, Void } from '$lib/types';
	import '@fontsource/bebas-neue';

	type EndZoneProps = {
		hasBall: boolean;
		inFieldGoalRange: boolean;
		position: string;
		team: Team;
		toggleFieldGoal: Void;
	};
	let {
		hasBall = false,
		inFieldGoalRange = false,
		position = POSITION.LEFT,
		team = DEFAULT_TEAM,
		toggleFieldGoal
	}: EndZoneProps = $props();

	const {
		primary = '',
		secondary = '',
		faceMask = '',
		helmet = '',
		stripe = '',
		trim = ''
	} = team.colors;

	let allowFieldGoal = $derived(hasBall && inFieldGoalRange);
</script>

<div class="endZone" style={`background-color: ${primary};`}>
	<div class="endZoneElements">
		<div></div>
		<div class={`helmetLogo rotate${position}`} class:flipLeft={position === POSITION.LEFT}>
			<CustomHelmet
				{faceMask}
				{helmet}
				{stripe}
				{trim}
				direction={position === POSITION.LEFT ? POSITION.LEFT : POSITION.RIGHT}
				logo={team.logo || ''}
				logoLeft={team.logoLeft || ''}
				logoFixed={(position === POSITION.LEFT && team.logoFixed) || false}
				logoX={team.logoX}
				logoY={team.logoY}
				logoWidth={team.logoWidth}
				logoHeight={team.logoHeight}
				logoRotation={team.logoRotation}
			/>
		</div>

		<div class="name-container">
			<div
				class="name"
				class:flipName={position === POSITION.RIGHT}
				style={`color: ${secondary};`}
			>
				{team.name}
			</div>
		</div>

		<div class={`helmetLogo rotate${position}`} class:flipRight={position === POSITION.RIGHT}>
			<CustomHelmet
				{faceMask}
				{helmet}
				{stripe}
				{trim}
				direction={position === POSITION.LEFT ? POSITION.RIGHT : POSITION.LEFT}
				logo={team.logo || ''}
				logoLeft={team.logoLeft || ''}
				logoFixed={(position === POSITION.RIGHT && team.logoFixed) || false}
				logoX={team.logoX}
				logoY={team.logoY}
				logoWidth={team.logoWidth}
				logoHeight={team.logoHeight}
				logoRotation={team.logoRotation}
			/>
		</div>
		<div></div>
	</div>
	<button
		class="goalPost"
		class:right={position === POSITION.RIGHT}
		class:clickable={allowFieldGoal}
		onclick={allowFieldGoal ? () => toggleFieldGoal() : NOOP}
		disabled={!allowFieldGoal}
		aria-label="Field Goal"
	>
		<div class="post" class:pulse={allowFieldGoal}></div>
		<div class="bar" class:pulse={allowFieldGoal}></div>
		<div class="post" class:pulse={allowFieldGoal}></div>
	</button>
</div>

<style>
	.clickable {
		cursor: pointer;
	}
	.endZone {
		border: 0.125rem solid var(--color-white);
		background-color: var(--color-yellow);
		container-type: size;
	}
	.endZoneElements {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 0.5em auto 1fr auto 0.5em;
		gap: 0.25em;
		height: 100%;
	}
	.goalPost {
		display: flex;
		flex-direction: column;
		position: absolute;
		align-items: center;
		height: 25%;
		width: 0.6rem;
		background: none;
		border: none;
		padding: 0;
		top: 50%;
		left: 0;
		transform: translate(-50%, -50%);
	}
	.goalPost.right {
		left: unset;
		right: -11px;
	}
	.post {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background-color: var(--color-yellow);
	}
	.bar {
		width: 0.5rem;
		height: 100%;
		background-color: var(--color-yellow);
	}
	.helmetLogo {
		display: flex;
		justify-content: center;
		margin: auto;
		height: clamp(2rem, 60cqi, 7rem);
		width: clamp(2rem, 60cqi, 7rem);
	}
	.name-container {
		display: flex;
		justify-content: center;
		overflow: hidden;
	}
	.name {
		font-weight: 700;
		font-family: 'Bebas Neue', sans-serif;
		font-size: clamp(1rem, 55cqb, 5rem);
		transform: rotate(180deg);
		writing-mode: vertical-lr;
		margin: auto 0;
		letter-spacing: 0.15em;
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
