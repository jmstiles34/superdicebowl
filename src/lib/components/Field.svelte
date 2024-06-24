<script lang="ts">
	import '@fontsource/abril-fatface';
	import { fieldData } from '$lib/data/data.json';
	import { BALL_KICK_GOOD, POSITION, TEAM, YARD_INTERVAL } from '$lib/constants/constants';
	import EndZone from '$lib/components/Endzone.svelte';
	import { randomNumber } from '$lib/utils/common';
	import type { Team, Void } from '$lib/types';

	type FieldProps = {
		awayTeam: Team;
		ballIndex: number;
		downToGo: string;
		firstDownIndex: number;
		homeTeam: Team;
		inFieldGoalRange: boolean;
		missedKick: boolean;
		onsideKick: boolean;
		possession: string;
		showDownDistance: boolean;
		toggleFieldGoal: Void;
	};

	let {
		awayTeam,
		ballIndex,
		downToGo,
		firstDownIndex,
		homeTeam,
		inFieldGoalRange,
		missedKick,
		onsideKick,
		possession,
		showDownDistance,
		toggleFieldGoal
	}: FieldProps = $props();
	let ballPosition = $derived(
		(missedKick ? BALL_KICK_GOOD[possession] : ballIndex) * YARD_INTERVAL
	);

	let missDirection: string | undefined = $state();
	$effect(() => {
		if (missedKick) {
			missDirection = ['left', 'right'][randomNumber()];
		}
	});
</script>

<div class="field-wrapper">
	<div class="fieldLogo">
		<picture>
			<!-- <source type="image/avif" srcset={`/logos/${homeTeam.fieldLogo}.avif`} /> -->
			<img
				alt={`${homeTeam.city} ${homeTeam.name} Logo`}
				src={`/logos/${homeTeam.fieldLogo}.webp`}
			/>
		</picture>
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
					<div class="hashes"></div>
					<div class={`upper fieldNumber flipV ${i % 2 ? 'number' : 'zero'}`}>
						{block.upperNumber}
					</div>
					<div class="first-mid hashes"></div>
					<div class="second-mid hashes"></div>
					<div class={`lower fieldNumber ${i % 2 ? 'number' : 'zero'}`}>
						{block.lowerNumber}
					</div>
					<div class="lower hashes"></div>
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
		background-image: linear-gradient(
			90deg,
			white 0%,
			white 9.99%,
			var(--field-odd) 10%,
			var(--field-odd) 13.99%,
			var(--field-even) 14%,
			var(--field-even) 17.99%,
			var(--field-odd) 18%,
			var(--field-odd) 21.99%,
			var(--field-even) 22%,
			var(--field-even) 25.99%,
			var(--field-odd) 26%,
			var(--field-odd) 29.99%,
			var(--field-even) 30%,
			var(--field-even) 33.99%,
			var(--field-odd) 34%,
			var(--field-odd) 37.99%,
			var(--field-even) 38%,
			var(--field-even) 41.99%,
			var(--field-odd) 42%,
			var(--field-odd) 45.99%,
			var(--field-even) 46%,
			var(--field-even) 49.99%,
			var(--field-odd) 50%,
			var(--field-odd) 53.99%,
			var(--field-even) 54%,
			var(--field-even) 57.99%,
			var(--field-odd) 58%,
			var(--field-odd) 61.99%,
			var(--field-even) 62%,
			var(--field-even) 65.99%,
			var(--field-odd) 66%,
			var(--field-odd) 69.99%,
			var(--field-even) 70%,
			var(--field-even) 73.99%,
			var(--field-odd) 74%,
			var(--field-odd) 77.99%,
			var(--field-even) 78%,
			var(--field-even) 81.99%,
			var(--field-odd) 82%,
			var(--field-odd) 85.99%,
			var(--field-even) 86%,
			var(--field-even) 89.99%,
			white 40%
		);
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
		& img {
			width: 100%;
			opacity: 0.8;
		}
	}
	.football {
		position: absolute;
		transform: translate(-50%, -50%);
		top: 50%;
		left: 50%;
		z-index: 10;
		width: 4.5%;
		& img {
			width: 100%;
			transition: all 0.5s ease-in-out;
			filter: drop-shadow(3px 6px 8px hsl(0deg 0% 0% / 0.5));
		}
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
		filter: drop-shadow(2px 4px 4px hsl(0deg 0% 0% / 0.5));
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
