<script lang="ts">
// ── SvgBatter.svelte ─────────────────────────────────────────────────────────
// Batter sprite rendered from an external SVG image.
// Positioned near home plate in FieldSVG coordinate space.
// LH batter is mirrored via scale(-1, 1) around home plate center.
//
// Prop:    hand: BatterHand ('rh' | 'lh')
// Exposes: swing() — plays the bat swing animation once

	import type { BatterHand } from '$lib/baseball/types';
	import { SVG_POS } from '$lib/baseball/utils/svgCoords';
	import batterSvg from '$lib/images/batter.svg';

	let { hand = 'rh' }: { hand?: BatterHand } = $props();

	let swinging = $state(false);

	// Source image is 50×75. Scale to fit the 1200×630 field.
	const IMG_W = 50;
	const IMG_H = 75;
	const SCALE = 0.62;

	const SW = IMG_W * SCALE; // ~31
	const SH = IMG_H * SCALE; // ~46.5

	// Position batter in the batter's box beside home plate.
	// RH batter stands to the left of home plate (third-base side).
	// LH: right of home plate (first-base side).
	const rhX = SVG_POS.home.x - SW - 6;
	const lhX = SVG_POS.home.x + SW + 6;
	const by = SVG_POS.home.y - SH + 10;

	export function swing(): void {
		swinging = false;
		requestAnimationFrame(() => {
			swinging = true;
			setTimeout(() => { swinging = false; }, 350);
		});
	}
</script>

<g
	class="svg-batter"
	transform="translate({hand === 'lh' ? lhX : rhX}, {by})"
>
	<g transform="scale({hand === 'lh' ? -SCALE : SCALE}, {SCALE})">
		<g class="batter-anim" class:swinging>
			<image href={batterSvg} width={IMG_W} height={IMG_H} />
		</g>
	</g>
</g>

<style>
	.svg-batter {
		filter: drop-shadow(0 1px 3px rgba(0,0,0,.8));
	}

	/* Subtle idle sway */
	.batter-anim {
		transform-origin: 25px 75px;
		animation: batter-idle 2s ease-in-out infinite;
	}
	@keyframes batter-idle {
		0%,100% { transform: translateY(0); }
		50%     { transform: translateY(-1.5px); }
	}

	/* Swing: forward lunge pivoting around the feet */
	.batter-anim.swinging {
		animation: batter-swing .2s ease-out forwards;
	}
	@keyframes batter-swing {
		0%   { transform: rotate(0deg); }
		60%  { transform: rotate(10deg); }
		100% { transform: rotate(7deg); }
	}
</style>
