<script lang="ts">
	import {
		DEFAULT_TEAM,
		NOOP,
		POSITION
	} from '$lib/constants/constants';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import type { Team, Void } from '$lib/types';

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

	const primary = $derived(team.colors.primary ?? '');
	const secondary = $derived(team.colors.secondary ?? '');
	const faceMask = $derived(team.colors.faceMask ?? '');
	const helmet = $derived(team.colors.helmet ?? '');
	const stripe = $derived(team.colors.stripe ?? '');
	const trim = $derived(team.colors.trim ?? '');

	let allowFieldGoal = $derived(hasBall && inFieldGoalRange);
</script>

<div class="endZone" style={`background-color: ${primary};`}>
	<div class="endZoneElements">
		<div class={`helmetLogo rotate${position}`} class:flipLeft={position === POSITION.LEFT}>
			<CustomHelmet
				{faceMask}
				{helmet}
				{stripe}
				{trim}
				direction={position === POSITION.LEFT ? POSITION.LEFT : POSITION.RIGHT}
				logo={team.logo ?? ''}
				logoLeft={team.logoLeft ?? ''}
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
				logo={team.logo ?? ''}
				logoLeft={team.logoLeft ?? ''}
				logoFixed={(position === POSITION.RIGHT && team.logoFixed) || false}
				logoX={team.logoX}
				logoY={team.logoY}
				logoWidth={team.logoWidth}
				logoHeight={team.logoHeight}
				logoRotation={team.logoRotation}
			/>
		</div>
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
		border: 0.125rem solid var(--color-on-accent);
		background-color: var(--color-field-marking);
		container-type: size;
	}
	.endZoneElements {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr auto;
		gap: 0.25em;
		height: 100%;
		padding: 0.75em 0;
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
		transition: none;
	}
	.goalPost:active {
		transform: translate(-50%, -50%);
	}
	.goalPost.right {
		left: unset;
		right: -11px;
	}
	.post {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background-color: var(--color-field-marking);
		margin-block: -0.1rem;
		z-index: 1;
	}
	.bar {
		width: 0.4rem;
		height: 100%;
		background-color: var(--color-field-marking);
	}
	.helmetLogo {
		display: flex;
		justify-content: center;
		margin: auto;
		height: clamp(2rem, 60cqi, 7rem);
		width: clamp(2rem, 60cqi, 7rem);
	}
	.helmetLogo :global(.helmet-wrapper) {
		height: 100%;
	}
	.name-container {
		display: flex;
		justify-content: center;
		overflow: hidden;
		min-height: 0;
	}
	.name {
		font-weight: 700;
		font-family: var(--font-endzone);
		font-size: clamp(1rem, 55cqb, 5rem);
		text-transform: uppercase;
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
