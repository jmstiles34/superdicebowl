<script lang="ts">
	import { DEFAULT_TEAM, HELMET_SIZE, NOOP, POSITION } from '$lib/constants/constants';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import type { Team, Void } from '$lib/types';
	import '@fontsource/bebas-neue';

	export let hasBall = false;
	export let inFieldGoalRange = false;
	export let position = POSITION.LEFT;
	export let team: Team = DEFAULT_TEAM;
	export let toggleFieldGoal: Void;
	const { primary, secondary, faceMask, helmet, stripe, trim } = team.colors;

	$: allowFieldGoal = hasBall && inFieldGoalRange;

	function removeTranslate(tf: string = '') {
		const translateIndex = tf.indexOf('translate(');
		if (translateIndex === -1) return tf;

		const closingParenIndex = tf.indexOf(')', translateIndex);

		return tf.substring(0, translateIndex) + tf.substring(closingParenIndex + 1);
	}
</script>

<div class="endZone" style={`background-color: ${primary};`}>
	<div class="endZoneElements">
		<div />
		<div class={`helmetLogo rotate${position}`} class:flipLeft={position === POSITION.LEFT}>
			<CustomHelmet
				bg={primary}
				{faceMask}
				{helmet}
				{stripe}
				{trim}
				logo={team.logo}
				logoFlip={position === POSITION.LEFT && team.logoFixed}
				logoTransform={removeTranslate(team.logoTransform) || ''}
				setTransform={NOOP}
				size={HELMET_SIZE.SMALL}
			/>
		</div>

		<div class="name-container">
			<div
				class={`name`}
				class:flipName={position === POSITION.RIGHT}
				style={`color: ${secondary};`}
			>
				{team.name}
			</div>
		</div>

		<div class={`helmetLogo rotate${position}`} class:flipRight={position === POSITION.RIGHT}>
			<CustomHelmet
				bg={primary}
				{faceMask}
				{helmet}
				{stripe}
				{trim}
				logo={team.logo}
				logoFlip={position === POSITION.RIGHT && team.logoFixed}
				logoTransform={removeTranslate(team.logoTransform) || ''}
				setTransform={NOOP}
				size={HELMET_SIZE.SMALL}
			/>
		</div>
		<div />
	</div>
	<div
		class="goalPost"
		class:right={position === POSITION.RIGHT}
		class:clickable={allowFieldGoal}
		on:click={allowFieldGoal ? () => toggleFieldGoal() : NOOP}
		on:keydown={allowFieldGoal ? () => toggleFieldGoal() : NOOP}
		role="button"
		tabindex="0"
	>
		<div class="post" class:pulse={allowFieldGoal} />
		<div class="bar" class:pulse={allowFieldGoal} />
		<div class="post" class:pulse={allowFieldGoal} />
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
	.endZoneElements {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 0.5em 3em auto 3em 0.5em;
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
	.bar {
		width: 0.25rem;
		height: 100%;
		background-color: var(--yellow);
	}
	.helmetLogo {
		display: flex;
		justify-content: center;
		margin: auto;
		height: 3rem;
		width: 3rem;
	}
	.name-container {
		display: flex;
		justify-content: center;
	}
	.name {
		font-weight: 700;
		font-family: 'Bebas Neue';
		font-size: clamp(1.5rem, -0.0909rem + 6.3636vw, 5rem);
		transform: rotate(180deg);
		writing-mode: vertical-lr;
		margin: auto 0;
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

	@media (max-width: 40rem) {
		.endZoneElements {
			grid-template-rows: 0.25em 2em auto 2em 0.25em;
			gap: 0.15em;
		}
		.helmetLogo {
			height: 2rem;
			width: 2rem;
		}
	}
	@media (min-width: 60rem) {
		.endZoneElements {
			grid-template-rows: 0.25em 4em auto 4em 0.25em;
			gap: 0.15em;
		}
		.helmetLogo {
			height: 4rem;
			width: 4rem;
		}
	}
</style>
