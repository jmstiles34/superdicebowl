<script lang="ts">
	import '@fontsource/abril-fatface';
	import { fieldData } from '$lib/data/data.json';
	import { BALL_KICK_GOOD, POSITION, TEAM, YARD_INTERVAL } from '$lib/constants/constants';
	import EndZone from '$lib/components/Endzone.svelte';
	import { randomNumber } from '$lib/utils/common';
	import { getLogoUrl } from '$lib/utils/logoPreloader';
	import type { Team, Void } from '$lib/types';

	type FieldProps = {
		awayTeam: Team;
		ballIndex: number;
		downToGo: string;
		firstDownIndex: number;
		homeTeam: Team;
		inFieldGoalRange: boolean;
		missedKick: boolean;
		missedTwoPoint: boolean;
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
		missedTwoPoint,
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
		<img
			alt={`${homeTeam.city} ${homeTeam.name} Logo`}
			src={getLogoUrl(homeTeam.fieldLogo)}
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
				style:rotate={onsideKick || missedTwoPoint ? '3turn' : 'initial'}
				style:transition={onsideKick || missedTwoPoint
					? 'left 0.5s ease-in-out, top 0.5s ease-in-out, rotate 0.5s ease-in-out'
					: 'left 0.5s ease-in-out, top 0.5s ease-in-out, rotate 0s ease-in-out'}
			>
				<img alt="Football" src="/images/football.webp" />
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
			var(--color-field-stripe-a) 10%,
			var(--color-field-stripe-a) 13.99%,
			var(--color-field-stripe-b) 14%,
			var(--color-field-stripe-b) 17.99%,
			var(--color-field-stripe-a) 18%,
			var(--color-field-stripe-a) 21.99%,
			var(--color-field-stripe-b) 22%,
			var(--color-field-stripe-b) 25.99%,
			var(--color-field-stripe-a) 26%,
			var(--color-field-stripe-a) 29.99%,
			var(--color-field-stripe-b) 30%,
			var(--color-field-stripe-b) 33.99%,
			var(--color-field-stripe-a) 34%,
			var(--color-field-stripe-a) 37.99%,
			var(--color-field-stripe-b) 38%,
			var(--color-field-stripe-b) 41.99%,
			var(--color-field-stripe-a) 42%,
			var(--color-field-stripe-a) 45.99%,
			var(--color-field-stripe-b) 46%,
			var(--color-field-stripe-b) 49.99%,
			var(--color-field-stripe-a) 50%,
			var(--color-field-stripe-a) 53.99%,
			var(--color-field-stripe-b) 54%,
			var(--color-field-stripe-b) 57.99%,
			var(--color-field-stripe-a) 58%,
			var(--color-field-stripe-a) 61.99%,
			var(--color-field-stripe-b) 62%,
			var(--color-field-stripe-b) 65.99%,
			var(--color-field-stripe-a) 66%,
			var(--color-field-stripe-a) 69.99%,
			var(--color-field-stripe-b) 70%,
			var(--color-field-stripe-b) 73.99%,
			var(--color-field-stripe-a) 74%,
			var(--color-field-stripe-a) 77.99%,
			var(--color-field-stripe-b) 78%,
			var(--color-field-stripe-b) 81.99%,
			var(--color-field-stripe-a) 82%,
			var(--color-field-stripe-a) 85.99%,
			var(--color-field-stripe-b) 86%,
			var(--color-field-stripe-b) 89.99%,
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
			filter: drop-shadow(3px 6px 8px oklch(0 0 0 / 0.5));
		}
	}
	.yardsAway {
		border-top: 2px solid var(--color-on-accent);
		border-bottom: 2px solid var(--color-on-accent);
		border-left: 1px solid var(--color-on-accent);
	}
	.yardsHome {
		border-top: 2px solid var(--color-on-accent);
		border-bottom: 2px solid var(--color-on-accent);
		border-right: 1px solid var(--color-on-accent);
	}
	.fieldNumber {
		position: absolute;
		color: var(--color-on-accent);
		font-size: clamp(0.625rem, 0.3rem + 3vw, 1.85rem);
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
	}
	.downToGo {
		position: absolute;
		white-space: nowrap;
		opacity: 0;
		transform: translate(-50%);
		z-index: 10;
		color: var(--color-field-marking);
		font-size: clamp(1rem, 0.75rem + 1.5vw, 1.35rem);
		font-family: var(--font-body);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wide);
		text-shadow: 1px 1px 0 oklch(0 0 0 / 0.7);
		top: 53%;
		filter: drop-shadow(2px 4px 4px oklch(0 0 0 / 0.5));
	}
	.showDownDistance {
		opacity: 1;
		transition-property: opacity;
		transition-duration: 0.5s;
		transition-delay: 0.75s;
	}
	.firstDownLeft {
		border-right: 2px solid var(--color-field-marking);
	}
	.firstDownRight {
		border-left: 2px solid var(--color-field-marking);
	}
	.hashes {
		position: absolute;
		left: 15%;
		right: 0;
		height: 3%;
		background: linear-gradient(to right, var(--color-on-accent) 25%, transparent 25%);
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

	/* ── Mobile landscape ────────────────────────────────────── */
	@media (max-height: 500px) and (orientation: landscape) {
		.field-wrapper {
			height: 100%;
		}

		.field-grid {
			min-height: unset;
			height: 100%;
		}

		.fieldNumber {
			font-size: clamp(0.5rem, 0.3rem + 2vw, 1.25rem);
		}

		.upper.fieldNumber {
			top: 0.75rem;
		}

		.lower.fieldNumber {
			bottom: 0.75rem;
		}

		.football {
			width: 3.5%;
		}

		.downToGo {
			font-size: clamp(0.7rem, 0.5rem + 1vw, 1rem);
		}
	}
</style>
