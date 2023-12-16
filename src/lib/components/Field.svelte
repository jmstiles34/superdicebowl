<script lang="ts">
	import '@fontsource/abril-fatface';
	import { fieldData } from '$lib/data/data.json';
	import { BALL_KICK_GOOD, POSITION, TEAM, YARD_INTERVAL } from '$lib/constants/constants';
	import EndZone from '$lib/components/Endzone.svelte';
	import { randomNumber } from '$lib/utils/common';
	import type { Team, Void } from '$lib/types';

	export let awayTeam: Team;
	export let ballIndex: number;
	export let downToGo: string;
	export let firstDownIndex: number;
	export let homeTeam: Team;
	export let inFieldGoalRange: boolean;
	export let missedKick: boolean;
	export let onsideKick: boolean;
	export let possession: string;
	export let showDownDistance: boolean;
	export let toggleFieldGoal: Void;

	$: ballPosition = (missedKick ? BALL_KICK_GOOD[possession] : ballIndex) * YARD_INTERVAL;
	let missDirection: string | undefined;
	$: if (missedKick) {
		missDirection = ['left', 'right'][randomNumber()];
	}
</script>

<div class="field-wrapper">
	<div class="fieldLogo">
		<img
			alt={`${homeTeam.city} ${homeTeam.name} Logo`}
			src={`/logos/${
				homeTeam.hasOwnProperty('isCustom') ? `custom/${homeTeam.logo}` : homeTeam.name
			}.webp`}
		/>
	</div>
	<div class="field-grid">
		<EndZone
			hasBall={possession === TEAM.AWAY}
			{inFieldGoalRange}
			position={POSITION.LEFT}
			team={homeTeam}
			{toggleFieldGoal}
		/>

		<div class="field">
			{#each fieldData as block, i}
				<div
					class:yardsHome={i <= 9}
					class:yardsAway={i > 9}
					class:firstDownLeft={i <= 9 && i === firstDownIndex}
					class:firstDownRight={i > 9 && i === firstDownIndex + 1}
				>
					<div class="hashes" />
					<div class={`upper fieldNumber flipV ${i % 2 ? 'number' : 'zero'}`}>
						{block.upperNumber}
					</div>
					<div class="first-mid hashes" />
					<div class="second-mid hashes" />
					<div class={`lower fieldNumber ${i % 2 ? 'number' : 'zero'}`}>
						{block.lowerNumber}
					</div>
					<div class="lower hashes" />
				</div>
			{/each}
			<div
				class="football"
				class:center={!missedKick}
				class:missLeft={missedKick && missDirection === 'left'}
				class:missRight={missedKick && missDirection === 'right'}
				style:left={`${ballPosition}%`}
				style:rotate={onsideKick ? '3turn' : 'initial'}
				style:transition={onsideKick
					? 'left 0.5s ease-in-out, top 0.5s ease-in-out, rotate 0.5s ease-in-out'
					: 'left 0.5s ease-in-out, top 0.5s ease-in-out, rotate 0s ease-in-out'}
			>
				<img alt="Football" src={`/images/football.webp`} />
			</div>
			<div class="downToGo" class:showDownDistance style:left={`${ballPosition}%`}>
				{downToGo}
			</div>
		</div>

		<EndZone
			hasBall={possession === TEAM.HOME}
			{inFieldGoalRange}
			position={POSITION.RIGHT}
			team={awayTeam}
			{toggleFieldGoal}
		/>
	</div>
</div>

<style>
	.field-wrapper {
		margin: 0 auto;
		background-color: var(--field);
	}

	.field-grid {
		display: grid;
		grid-template-columns: 10% auto 10%;
		min-height: 44vw;
	}

	.field {
		display: grid;
		grid-template-columns: repeat(20, 5%);
	}
	.fieldLogo {
		position: absolute;
		top: 50%;
		left: 50%;
		max-width: 16%;
		transform: translate(-50%, -50%);
	}
	.fieldLogo img {
		width: 100%;
		opacity: 0.8;
	}
	.football {
		position: absolute;
		transform: translate(-50%, -50%);
		top: 50%;
		left: 50%;
		z-index: 10;
		width: 4.5%;
	}
	.football img {
		width: 100%;
		transition: all 0.5s ease-in-out;
	}
	.yardsAway {
		border-top: 2px solid var(--color-white);
		border-bottom: 2px solid var(--color-white);
		border-left: 1px solid var(--color-white);
	}
	.yardsHome {
		border-top: 2px solid var(--color-white);
		border-bottom: 2px solid var(--color-white);
		border-right: 1px solid var(--color-white);
	}
	.fieldNumber {
		position: absolute;
		color: var(--color-white);
		font-size: clamp(0.5rem, 0.225rem + 2.4vw, 1.5rem);
		font-family: 'Abril Fatface', sans-serif;
		opacity: 0.95;
	}
	.upper.fieldNumber {
		top: 3.5rem;
	}
	.lower.fieldNumber {
		bottom: 3.5rem;
	}
	.number {
		right: 0.25rem;
	}
	.center {
		top: 50%;
	}
	.missRight {
		top: 30%;
	}
	.missLeft {
		top: 70%;
	}
	.zero {
		left: 0.25rem;
	}
	.flipV {
		transform: scale(-1, -1);
		-moz-transform: scale(-1, -1);
		-webkit-transform: scale(-1, -1);
		-o-transform: scale(-1 -1);
		-ms-transform: scale(-1, -1);
	}
	.downToGo {
		position: absolute;
		white-space: nowrap;
		opacity: 0;
		transform: translate(-50%);
		z-index: 10;
		color: var(--color-yellow);
		font-size: 1rem;
		font-family: inherit;
		top: 53%;
		filter: drop-shadow(0 0 0.4rem #125618) drop-shadow(0 0 0.4rem #125618);
	}
	.showDownDistance {
		opacity: 1;
		transition-property: opacity;
		transition-duration: 0.5s;
		transition-delay: 0.75s;
	}
	.firstDownLeft {
		border-right: 2px solid var(--color-yellow);
	}
	.firstDownRight {
		border-left: 2px solid var(--color-yellow);
	}
	.hashes {
		position: absolute;
		left: 15%;
		right: 0;
		height: 3%;
		background: -webkit-linear-gradient(left, var(--color-white) 25%, transparent 25%);
		background-size: 25% 100%;
	}
	.first-mid.hashes {
		top: 39.25%;
	}
	.second-mid.hashes {
		top: 59.25%;
	}
	.lower.hashes {
		bottom: 0;
	}
</style>
