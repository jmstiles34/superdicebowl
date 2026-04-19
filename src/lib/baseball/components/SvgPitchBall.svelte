<script lang="ts">
// ── SvgPitchBall.svelte ──────────────────────────────────────────────────────
// Baseball that travels from the pitcher's plate to home plate.
// Rendered as an SVG <g> inside the field SVG. Uses WAAPI for animation.
//
// Exposed: throwPitch(onArrive?) — guard prevents re-entry while in flight

	import { SVG_POS } from '$lib/baseball/utils/svgCoords';

	let ballEl: SVGGElement;
	let flying = false;

	const px = SVG_POS.pitcher.x;
	const py = SVG_POS.pitcher.y;

	// Translate helper — offsets from pitcher position
	function T(dy: number, s: number): string {
		return `translate(${px}px, ${py + dy}px) scale(${s})`;
	}

	export function throwPitch(onArrive?: () => void): void {
		if (flying) return;
		flying = true;

		const anim = ballEl.animate([
			{ opacity: 1, transform: T(0, 1.0) },
			{ opacity: 1, transform: T(29, 1.3), offset: 0.18 },
			{ opacity: 1, transform: T(105, 2.0), offset: 0.65 },
			{ opacity: 1, transform: T(145, 2.6), offset: 0.90 },
			{ opacity: 0, transform: T(161, 2.9) }
		], {
			duration: 650,
			easing: 'cubic-bezier(.2,0,.9,1)',
			fill: 'forwards'
		});

		anim.addEventListener('finish', () => {
			flying = false;
			// Reset to invisible
			ballEl.style.opacity = '0';
			anim.cancel();
			onArrive?.();
		});
	}
</script>

<g
	class="svg-pitch-ball"
	bind:this={ballEl}
>
	<circle cx="0" cy="0" r="10" fill="#f5f0e5" stroke="#c8c0a8" stroke-width="1"/>
	<path d="M -6 -8 Q -8 0 -6 8" stroke="#c03838" stroke-width="1.5" fill="none" stroke-linecap="round"/>
	<path d="M 6 -8 Q 8 0 6 8" stroke="#c03838" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</g>

<style>
	.svg-pitch-ball {
		opacity: 0;
		filter: drop-shadow(0 0 6px rgba(255,255,255,.85));
		pointer-events: none;
	}
</style>
