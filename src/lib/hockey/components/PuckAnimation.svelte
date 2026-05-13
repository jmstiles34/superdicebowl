<script lang="ts">
	import { sleep } from '$lib/utils/common';
	import { game } from '$lib/hockey/state/game.svelte';

	type Pos = { x: number; y: number };

	type Props = {
		awayLogo?: string;
		homeLogo?: string;
	};

	let { awayLogo = '', homeLogo = '' }: Props = $props();

	// ── Rink geometry (viewBox 0 0 1060 620) ────────────────
	// Away attacks right (goal at x≈978), Home attacks left (goal at x≈82)
	// Blue lines: x=307 (left), x=753 (right). Ice y: 10–590.

	const RIGHT_NET: Pos  = { x: 950, y: 300 };
	const LEFT_NET: Pos   = { x: 110, y: 300 };
	const CENTER_ICE: Pos = { x: 530, y: 300 };

	function attackingZonePos(possession: string): Pos {
		if (possession === 'Away') {
			// Right end zone: x 800–940, y 110–490
			return { x: 800 + Math.random() * 140, y: 110 + Math.random() * 380 };
		}
		// Left end zone: x 120–260, y 110–490
		return { x: 120 + Math.random() * 140, y: 110 + Math.random() * 380 };
	}

	function breakoutPos(possession: string): Pos {
		// Neutral zone leaning toward the new possessor's attacking direction
		if (possession === 'Away') {
			return { x: 560 + Math.random() * 100, y: 130 + Math.random() * 340 };
		}
		return { x: 400 - Math.random() * 100, y: 130 + Math.random() * 340 };
	}

	function netPos(possession: string): Pos {
		const net = possession === 'Away' ? RIGHT_NET : LEFT_NET;
		return {
			x: net.x + (Math.random() - 0.5) * 20,
			y: net.y + (Math.random() - 0.5) * 50
		};
	}

	// ── Puck state ───────────────────────────────────────────
	let puckX = $state(530);
	let puckY = $state(300);
	let visible = $state(false);
	let animVersion = 0;
	let currentPossession = $state('Away');

	// ── Animation ────────────────────────────────────────────
	async function slideTo(target: Pos, durationMs: number): Promise<void> {
		const myVersion = ++animVersion;
		const startX = puckX;
		const startY = puckY;
		const frames = Math.max(1, Math.round(durationMs / 16));

		for (let i = 1; i <= frames; i++) {
			if (animVersion !== myVersion) return;
			const t = i / frames;
			const eased = 1 - (1 - t) * (1 - t); // ease-out quad
			puckX = startX + (target.x - startX) * eased;
			puckY = startY + (target.y - startY) * eased;
			await sleep(16);
		}
		if (animVersion !== myVersion) return;
		puckX = target.x;
		puckY = target.y;
	}

	// ── Public API ───────────────────────────────────────────

	/** Place puck at center ice then slide to the first possessor's attacking zone. */
	export function init(possession: string) {
		currentPossession = possession;
		puckX = 530;
		puckY = 300;
		visible = true;
		slideTo(attackingZonePos(possession), 600);
	}

	/** Possession unchanged — move to a new spot in the same attacking zone. */
	export function pass(possession: string) {
		currentPossession = possession;
		slideTo(attackingZonePos(possession), 500);
	}

	/** Possession switched — slide to the new team's breakout position. */
	export function turnover(newPossession: string) {
		currentPossession = newPossession;
		slideTo(breakoutPos(newPossession), 950);
	}

	/** Puck slides toward the attacked net; stays there during the save modal. */
	export function shotOnGoal(possession: string) {
		currentPossession = possession;
		slideTo(netPos(possession), 550);
	}

	/** Called after save roll resolves. Animates based on outcome. */
	export async function saveResult(result: 'save' | 'goal', newPossession: string) {
		if (result === 'goal') {
			// Brief pause while the net celebration registers, then faceoff at center
			await sleep(450);
			await slideTo(CENTER_ICE, 700);
			currentPossession = newPossession; // logo switches at center ice faceoff
			await sleep(400);
			slideTo(attackingZonePos(newPossession), 650);
		} else {
			// Puck bounces back into play — slide to breakout zone
			currentPossession = newPossession;
			slideTo(breakoutPos(newPossession), 650);
		}
	}

	/** Direct goal (no save modal) — possession already switched. */
	export async function goal(newPossession: string) {
		await sleep(350);
		await slideTo(CENTER_ICE, 700);
		currentPossession = newPossession; // logo switches at center ice faceoff
		await sleep(400);
		slideTo(attackingZonePos(newPossession), 650);
	}

	/** Penalty — possession switched, power play begins. */
	export function penalty(newPossession: string) {
		currentPossession = newPossession;
		slideTo(attackingZonePos(newPossession), 750);
	}
</script>

{#if visible}
	<defs>
		<filter id="puck-shadow" x="-40%" y="-40%" width="180%" height="180%">
			<feDropShadow dx="2" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.4" />
		</filter>
		<clipPath id="puck-logo-clip">
			<circle cx={puckX} cy={puckY} r="11" />
		</clipPath>
	</defs>
	{#if game.powerPlay}
		<radialGradient id="pp-glow" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="#facc15" stop-opacity="0.9" />
			<stop offset="60%" stop-color="#facc15" stop-opacity="0.4" />
			<stop offset="100%" stop-color="#facc15" stop-opacity="0" />
		</radialGradient>
		<circle
			cx={puckX}
			cy={puckY}
			r="22"
			fill="url(#pp-glow)"
		>
			<animate attributeName="r" values="22;40" dur="1.2s" repeatCount="indefinite" />
			<animate attributeName="opacity" values="1;0.15" dur="1.2s" repeatCount="indefinite" />
		</circle>
	{/if}
	<circle
		cx={puckX}
		cy={puckY}
		r="14"
		fill="#111"
		stroke="#3a3a3a"
		stroke-width="2"
		filter="url(#puck-shadow)"
	/>
	{#if awayLogo || homeLogo}
		{@const logo = currentPossession === 'Away' ? awayLogo : homeLogo}
		{#if logo}
			<image
				href={logo}
				x={puckX - 11}
				y={puckY - 11}
				width="22"
				height="22"
				clip-path="url(#puck-logo-clip)"
				opacity="0.85"
				preserveAspectRatio="xMidYMid meet"
			/>
		{/if}
	{/if}
	<!-- subtle highlight -->
	<ellipse
		cx={puckX - 4}
		cy={puckY - 4}
		rx="5"
		ry="3"
		fill="white"
		opacity="0.12"
	/>
{/if}
