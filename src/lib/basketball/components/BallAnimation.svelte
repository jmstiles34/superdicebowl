<script lang="ts">
	import { sleep } from '$lib/utils/common';

	type Pos = { x: number; y: number };

	// ── Court geometry (viewBox 40 40 1520 820) ──────────────
	// Away attacks right hoop (x≈1490), Home attacks left (x≈110)

	const CENTER_COURT: Pos = { x: 800, y: 450 };

	function offensiveZonePos(possession: string): Pos {
		if (possession === 'Away') {
			// Right half: x 950–1350, y 200–700
			return { x: 950 + Math.random() * 400, y: 200 + Math.random() * 500 };
		}
		// Left half: x 250–650, y 200–700
		return { x: 250 + Math.random() * 400, y: 200 + Math.random() * 500 };
	}

	function transitionPos(possession: string): Pos {
		// Near half court on the new possessor's side
		if (possession === 'Away') {
			return { x: 850 + Math.random() * 150, y: 250 + Math.random() * 400 };
		}
		return { x: 600 + Math.random() * 150, y: 250 + Math.random() * 400 };
	}

	// ── Ball state ───────────────────────────────────────────
	let ballX = $state(800);
	let ballY = $state(450);
	let visible = $state(false);
	let bouncing = $state(false);
	let animVersion = 0;

	// ── Animation ────────────────────────────────────────────
	async function slideTo(target: Pos, durationMs: number): Promise<void> {
		const myVersion = ++animVersion;
		const startX = ballX;
		const startY = ballY;
		const frames = Math.max(1, Math.round(durationMs / 16));

		for (let i = 1; i <= frames; i++) {
			if (animVersion !== myVersion) return;
			const t = i / frames;
			const eased = 1 - (1 - t) * (1 - t); // ease-out quad
			ballX = startX + (target.x - startX) * eased;
			ballY = startY + (target.y - startY) * eased;
			await sleep(16);
		}
		if (animVersion !== myVersion) return;
		ballX = target.x;
		ballY = target.y;
	}

	// ── Public API ───────────────────────────────────────────

	/** Show the ball at center court then slide to the attacking zone. */
	export function init(possession: string) {
		ballX = CENTER_COURT.x;
		ballY = CENTER_COURT.y;
		visible = true;
		bouncing = true;
		slideTo(offensiveZonePos(possession), 600);
	}

	/** Move to a new spot in the same attacking zone (e.g. non-shot foul, kept possession). */
	export function move(possession: string) {
		bouncing = true;
		slideTo(offensiveZonePos(possession), 500);
	}

	/** Possession changed — slide through transition zone to new attacking zone. */
	export async function changePossession(newPossession: string) {
		bouncing = true;
		visible = true;
		await slideTo(transitionPos(newPossession), 600);
		slideTo(offensiveZonePos(newPossession), 500);
	}

	/** Hide the ball (ShotAnimation takes over). */
	export function hide() {
		visible = false;
		bouncing = false;
	}

	/** Show the ball at a specific position without animation. */
	export function show(possession: string) {
		const pos = offensiveZonePos(possession);
		ballX = pos.x;
		ballY = pos.y;
		visible = true;
		bouncing = true;
	}
</script>

{#if visible}
	<g transform="translate({ballX}, {ballY})">
		<g class:bouncing>
			<image
				href="/images/basketball.webp"
				x="-25"
				y="-25"
				width="50"
				height="50"
				preserveAspectRatio="xMidYMid meet"
			/>
		</g>
	</g>
{/if}

<style>
	.bouncing {
		animation: ball-bounce 0.65s ease-in-out infinite;
		transform-origin: 0px 0px;
	}

	@keyframes ball-bounce {
		0%, 100% {
			transform: translateY(0) scaleY(1) scaleX(1);
		}
		35% {
			transform: translateY(-20px) scaleY(1.08) scaleX(0.95);
		}
		55% {
			transform: translateY(-18px) scaleY(1.06) scaleX(0.96);
		}
		85% {
			transform: translateY(3px) scaleY(0.88) scaleX(1.08);
		}
	}
</style>
