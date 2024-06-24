<script lang="ts">
	import {
		DEFAULT_TEAM,
		HELMET_SIZE,
		HELMET_WIDTH,
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

	const setLogoWidth = (ss: number | undefined) => {
		if (ss) {
			if (ss <= 640) {
				return 48 / 4.2;
			}
			if (ss > 640 && ss < 900) {
				return 48 / 2.8;
			}
		}

		return 64 / 2.6;
	};
	let screenSize: number | undefined = $state(undefined);
	let logoWidth: number = $derived(setLogoWidth(screenSize));
	let scaledTransform = $derived(scaleTranslate(team.logoTransform, logoWidth));

	function scaleTranslate(tf: string = '', logoWidth: number) {
		/* console.log({ start: tf }); */
		const translateIndex = tf.indexOf('translate(');
		if (translateIndex === -1) return tf;

		const originalWidth = HELMET_WIDTH[HELMET_SIZE.LARGE] / 2.5;
		const scalePercent = (logoWidth / originalWidth).toFixed(2);
		const closingParenIndex = tf.indexOf(')', translateIndex);
		const translateNums = tf
			.substring(translateIndex + 10, closingParenIndex)
			.replaceAll('px', '')
			.split(', ');

		const translate = `translate(${parseFloat(translateNums[0]) * parseFloat(scalePercent)}px, ${
			parseFloat(translateNums[1]) * parseFloat(scalePercent)
		}px)`;
		/* console.log({
			end: (tf.substring(0, translateIndex + 10) + tf.substring(closingParenIndex)).replace(
				'translate()',
				translate
			)
		}); */
		return (tf.substring(0, translateIndex + 10) + tf.substring(closingParenIndex)).replace(
			'translate()',
			translate
		);
	}
</script>

<svelte:window bind:innerWidth={screenSize} />

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
				logoTransform={scaledTransform || ''}
				{logoWidth}
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
				{faceMask}
				{helmet}
				{stripe}
				{trim}
				direction={position === POSITION.LEFT ? POSITION.RIGHT : POSITION.LEFT}
				logo={team.logo || ''}
				logoLeft={team.logoLeft || ''}
				logoFixed={(position === POSITION.RIGHT && team.logoFixed) || false}
				logoTransform={scaledTransform || ''}
				{logoWidth}
				setTransform={NOOP}
				size={HELMET_SIZE.SMALL}
			/>
		</div>
		<div></div>
	</div>
	<div
		class="goalPost"
		class:right={position === POSITION.RIGHT}
		class:clickable={allowFieldGoal}
		onclick={allowFieldGoal ? () => toggleFieldGoal() : NOOP}
		onkeydown={allowFieldGoal ? () => toggleFieldGoal() : NOOP}
		role="button"
		tabindex="0"
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
		border: 0.125rem solid var(--color-white);
		background-color: var(--color-yellow);
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
		background-color: var(--color-yellow);
	}
	.bar {
		width: 0.25rem;
		height: 100%;
		background-color: var(--color-yellow);
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
		letter-spacing: 0.25rem;
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
