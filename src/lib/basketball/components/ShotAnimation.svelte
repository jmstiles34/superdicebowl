<script lang="ts">
	import { sleep } from '$lib/utils/common';

	type ShotType = 'two' | 'three';
	type ShotResult = 'made' | 'missed';

	let visible = $state(false);
	let ballX = $state(0);
	let ballY = $state(0);
	let ballScale = $state(1);
	let ballOpacity = $state(1);

	// Score popup state
	let scoreVisible = $state(false);
	let scoreText = $state('');
	let scoreX = $state(0);
	let scoreY = $state(0);
	let scoreAnimY = $state(0);
	let scoreOpacity = $state(1);
	let scoreScale = $state(1);
	let scorePoints = $state(0);

	// Hoop targets
	const LEFT_HOOP = { x: 110, y: 450 };
	const RIGHT_HOOP = { x: 1490, y: 450 };

	// Free throw line positions
	const LEFT_FT = { x: 420, y: 450 };
	const RIGHT_FT = { x: 1180, y: 450 };

	// Shooting zones by type and side
	// Away shoots right (offensive zone is right half), Home shoots left
	function pickStartPosition(
		shotType: ShotType,
		possession: string
	): { x: number; y: number } {
		const shootsRight = possession === 'Away';
		const rand = () => 0.3 + Math.random() * 0.4; // 0.3–0.7 for y variance

		if (shotType === 'three') {
			// Behind the 3-point arc
			if (shootsRight) {
				// Right half, behind arc (~x 950–1020)
				const angle = (Math.random() - 0.5) * 2.2; // -1.1 to 1.1 radians
				return {
					x: 1000 - Math.cos(angle) * 60,
					y: 450 + Math.sin(angle) * 250
				};
			}
			// Left half, behind arc (~x 580–640)
			const angle = (Math.random() - 0.5) * 2.2;
			return {
				x: 600 + Math.cos(angle) * 60,
				y: 450 + Math.sin(angle) * 250
			};
		}

		// Two-pointer: anywhere in the offensive zone (paint area or mid-range)
		if (shootsRight) {
			return {
				x: 1050 + Math.random() * 350,
				y: 200 + rand() * 500
			};
		}
		return {
			x: 200 + Math.random() * 350,
			y: 200 + rand() * 500
		};
	}

	export function shoot(
		shotType: ShotType,
		result: ShotResult,
		possession: string,
		onComplete: () => void
	) {
		const start = pickStartPosition(shotType, possession);
		const shootsRight = possession === 'Away';
		const hoop = shootsRight ? RIGHT_HOOP : LEFT_HOOP;
		const points = shotType === 'three' ? 3 : 2;

		// Miss lands near but not in the hoop
		const endX = result === 'made' ? hoop.x : hoop.x + (Math.random() - 0.5) * 80;
		const endY = result === 'made' ? hoop.y : hoop.y + (Math.random() - 0.5) * 80;

		ballX = start.x;
		ballY = start.y;
		ballScale = 1;
		ballOpacity = 1;
		visible = true;

		// Start the flight after a brief pause
		requestAnimationFrame(() => {
			const midX = (start.x + endX) / 2;
			const midY = Math.min(start.y, endY) - 120; // arc apex above both points

			animateFlight(start, { x: midX, y: midY }, { x: endX, y: endY }, result, onComplete, points);
		});
	}

	export function showAtFreeThrowLine(possession: string) {
		const shootsRight = possession === 'Away';
		const ft = shootsRight ? RIGHT_FT : LEFT_FT;
		ballX = ft.x;
		ballY = ft.y;
		ballScale = 1;
		ballOpacity = 1;
		visible = true;
	}

	export function hide() {
		visible = false;
	}

	export function freeThrow(
		result: ShotResult,
		possession: string,
		onComplete: () => void
	) {
		const shootsRight = possession === 'Away';
		const start = shootsRight ? RIGHT_FT : LEFT_FT;
		const hoop = shootsRight ? RIGHT_HOOP : LEFT_HOOP;

		const endX = result === 'made' ? hoop.x : hoop.x + (Math.random() - 0.5) * 80;
		const endY = result === 'made' ? hoop.y : hoop.y + (Math.random() - 0.5) * 80;

		ballX = start.x;
		ballY = start.y;
		ballScale = 1;
		ballOpacity = 1;
		visible = true;

		requestAnimationFrame(() => {
			const midX = (start.x + endX) / 2;
			const midY = Math.min(start.y, endY) - 80;

			animateFlight(start, { x: midX, y: midY }, { x: endX, y: endY }, result, onComplete, 1);
		});
	}

	async function showScorePopup(x: number, y: number, points: number) {
		scoreText = `+${points}`;
		scoreX = x;
		scoreY = y;
		scoreAnimY = 0;
		scoreOpacity = 1;
		scorePoints = points;
		scoreScale = 0.3;
		scoreVisible = true;

		// Pop in
		await sleep(16);
		scoreScale = points === 3 ? 1.4 : points === 2 ? 1.1 : 0.9;

		// Float upward and fade out
		const floatFrames = 40;
		const floatDuration = points === 3 ? 1400 : points === 2 ? 1100 : 900;
		const frameTime = floatDuration / floatFrames;

		for (let i = 1; i <= floatFrames; i++) {
			const t = i / floatFrames;
			scoreAnimY = -t * (points === 3 ? 180 : points === 2 ? 140 : 100);
			scoreOpacity = 1 - t * t; // ease-out fade
			if (points === 3) {
				// Dramatic pulse that settles
				scoreScale = 1.4 + Math.sin(t * Math.PI * 3) * 0.3 * (1 - t);
			}
			await sleep(frameTime);
		}

		scoreVisible = false;
	}

	async function animateFlight(
		start: { x: number; y: number },
		apex: { x: number; y: number },
		end: { x: number; y: number },
		result: ShotResult,
		onComplete: () => void,
		points: number = 0
	) {
		const totalFrames = 40;
		const duration = 800;
		const frameTime = duration / totalFrames;

		for (let i = 0; i <= totalFrames; i++) {
			const t = i / totalFrames;
			// Quadratic bezier: start → apex → end
			const u = 1 - t;
			ballX = u * u * start.x + 2 * u * t * apex.x + t * t * end.x;
			ballY = u * u * start.y + 2 * u * t * apex.y + t * t * end.y;

			// Scale: shrink at apex (ball is high), grow back at end
			// Minimum scale at t=0.5, full scale at t=0 and t=1
			const scaleFromArc = 1 - 0.5 * Math.sin(t * Math.PI);
			ballScale = 0.5 + scaleFromArc * 0.5;

			await sleep(frameTime);
		}

		// Brief pause at the end
		if (result === 'missed') {
			// Ball bounces away
			await sleep(200);
			ballOpacity = 0;
		} else {
			// Ball drops through
			await sleep(150);
			ballScale = 0.3;
			// Fire the score popup (don't await — it runs in parallel)
			showScorePopup(end.x, end.y, points);
			await sleep(200);
			ballOpacity = 0;
		}

		await sleep(100);
		visible = false;
		onComplete();
	}
</script>

{#if visible}
	<image
		href="/images/basketball.webp"
		x={ballX - 25 * ballScale}
		y={ballY - 25 * ballScale}
		width={50 * ballScale}
		height={50 * ballScale}
		opacity={ballOpacity}
		preserveAspectRatio="xMidYMid meet"
	/>
{/if}

{#if scoreVisible}
	<text
		x={scoreX}
		y={scoreY + scoreAnimY}
		text-anchor="middle"
		dominant-baseline="central"
		font-family="var(--font-heading, sans-serif)"
		font-weight="900"
		font-size={scorePoints === 3 ? 120 : scorePoints === 2 ? 90 : 70}
		fill={scorePoints === 3 ? '#FFD700' : scorePoints === 2 ? '#FFFFFF' : '#E0E0E0'}
		stroke={scorePoints === 3 ? '#FF6B00' : '#000000'}
		stroke-width={scorePoints === 3 ? 4 : 2}
		opacity={scoreOpacity}
		transform="scale({scoreScale}) translate({scoreX * (1 / scoreScale - 1)}, {(scoreY + scoreAnimY) * (1 / scoreScale - 1)})"
	>
		{scoreText}
	</text>
{/if}
