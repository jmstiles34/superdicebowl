<script lang="ts">
// ── SvgBatter.svelte ─────────────────────────────────────────────────────────
// Pixel-art batter sprite rendered as an SVG <g>.
// Positioned near home plate in FieldSVG coordinate space.
// LH batter is mirrored via scale(-1, 1) around home plate center.
//
// Prop:    hand: BatterHand ('rh' | 'lh')
// Exposes: swing() — plays the bat swing animation once

	import type { BatterHand } from '$lib/baseball/types';
	import { SVG_POS } from '$lib/baseball/utils/svgCoords';

	let { hand = 'rh' }: { hand?: BatterHand } = $props();

	let swinging = $state(false);

	// Pixel scale: original sprite is 30×36 at scale(0.35) ≈ 10.5×12.6 SVG units.
	const SPRITE_SCALE = 0.35;

	// Sprite dimensions after scaling
	const SW = 30 * SPRITE_SCALE; // ~10.5
	const SH = 36 * SPRITE_SCALE; // ~12.6

	// Position batter in the batter's box beside home plate.
	// RH batter stands to the left of home plate (third-base side).
	// Offset so feet are at home plate level and body is beside the plate.
	// RH: left of home plate (third-base side), LH: right of home plate (first-base side)
	const rhX = SVG_POS.home.x - SW - 2;
	const lhX = SVG_POS.home.x + 4;
	const by = SVG_POS.home.y - SH + 3;

	export function swing(): void {
		swinging = false;
		requestAnimationFrame(() => {
			swinging = true;
			setTimeout(() => { swinging = false; }, 300);
		});
	}
</script>

<g
	class="svg-batter"
	transform="translate({hand === 'lh' ? lhX : rhX}, {by})"
>
	<g transform="scale({hand === 'lh' ? -SPRITE_SCALE : SPRITE_SCALE}, {SPRITE_SCALE})" class="batter-sprite">
		<!-- Bat -->
		<g class="b-bat" class:swinging>
			<rect x="24" y="0" width="3" height="3" fill="#a06820"/>
			<rect x="27" y="0" width="3" height="3" fill="#7a4810"/>
			<rect x="27" y="3" width="3" height="3" fill="#7a4810"/>
			<rect x="27" y="6" width="3" height="3" fill="#7a4810"/>
			<rect x="24" y="9" width="3" height="3" fill="#7a4810"/>
			<rect x="18" y="9" width="3" height="3" fill="#1a1a1a"/>
			<rect x="21" y="9" width="3" height="3" fill="#1a1a1a"/>
		</g>
		<!-- Body -->
		<g class="b-body">
			<!-- Helmet -->
			<rect x="3"  y="0"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="6"  y="0"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="9"  y="0"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="12" y="0"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="0"  y="3"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="3"  y="3"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="6"  y="3"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="9"  y="3"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="12" y="3"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="15" y="3"  width="3" height="3" fill="#2547b0"/>
			<!-- Face -->
			<rect x="3"  y="6"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="6"  y="6"  width="3" height="3" fill="#1a3a8a"/>
			<rect x="9"  y="6"  width="3" height="3" fill="#d4956a"/>
			<rect x="12" y="6"  width="3" height="3" fill="#d4956a"/>
			<rect x="9"  y="9"  width="3" height="3" fill="#d4956a"/>
			<rect x="12" y="9"  width="3" height="3" fill="#d4956a"/>
			<!-- Jersey -->
			<rect x="0"  y="12" width="3" height="3" fill="#eeeeee"/>
			<rect x="3"  y="12" width="3" height="3" fill="#eeeeee"/>
			<rect x="6"  y="12" width="3" height="3" fill="#eeeeee"/>
			<rect x="9"  y="12" width="3" height="3" fill="#eeeeee"/>
			<rect x="12" y="12" width="3" height="3" fill="#eeeeee"/>
			<rect x="3"  y="15" width="3" height="3" fill="#cccccc"/>
			<rect x="6"  y="15" width="3" height="3" fill="#eeeeee"/>
			<rect x="9"  y="15" width="3" height="3" fill="#eeeeee"/>
			<rect x="12" y="15" width="3" height="3" fill="#eeeeee"/>
			<rect x="6"  y="18" width="3" height="3" fill="#eeeeee"/>
			<rect x="9"  y="18" width="3" height="3" fill="#eeeeee"/>
			<!-- Pants -->
			<rect x="6"  y="21" width="3" height="3" fill="#1a2060"/>
			<rect x="9"  y="21" width="3" height="3" fill="#1a2060"/>
			<rect x="3"  y="24" width="3" height="3" fill="#1a2060"/>
			<rect x="6"  y="24" width="3" height="3" fill="#1a2060"/>
			<rect x="15" y="24" width="3" height="3" fill="#1a2060"/>
			<rect x="3"  y="27" width="3" height="3" fill="#1a2060"/>
			<rect x="6"  y="27" width="3" height="3" fill="#1a2060"/>
			<rect x="15" y="27" width="3" height="3" fill="#1a2060"/>
			<!-- Shoes -->
			<rect x="3"  y="30" width="3" height="3" fill="#111111"/>
			<rect x="15" y="30" width="3" height="3" fill="#111111"/>
			<rect x="3"  y="33" width="3" height="3" fill="#111111"/>
			<rect x="15" y="33" width="3" height="3" fill="#111111"/>
		</g>
	</g>
</g>

<style>
	.svg-batter {
		filter: drop-shadow(0 0.5px 1px rgba(0,0,0,.8));
	}

	.batter-sprite {
		animation: batter-idle 2s ease-in-out infinite;
	}
	@keyframes batter-idle {
		0%,100% { transform: scale(0.35) translateX(0); }
		33%     { transform: scale(0.35) translateX(-1px) translateY(-1px); }
		66%     { transform: scale(0.35) translateX(.5px); }
	}

	/* Bat: idle waggle */
	.b-bat {
		transform-origin: 21px 10px;
		animation: bat-waggle 1.5s ease-in-out infinite;
	}
	@keyframes bat-waggle {
		0%,100% { transform: rotate(-9deg); }
		50%     { transform: rotate(8deg);  }
	}

	/* Bat: override with swing */
	.b-bat.swinging {
		animation: bat-swing .22s ease-in forwards;
	}
	@keyframes bat-swing {
		0%   { transform: rotate(-9deg); }
		100% { transform: rotate(-80deg) translateX(-6px); }
	}
</style>
