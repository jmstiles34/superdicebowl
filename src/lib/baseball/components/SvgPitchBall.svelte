<script lang="ts">
// ── SvgPitchBall.svelte ──────────────────────────────────────────────────────
// Baseball that travels from the pitcher's plate to home plate.
// Rendered as an SVG <g> inside the field SVG. Uses WAAPI for animation.
//
// Old canvas: translate(2px, 221px) over 0.65s
// SVG space:  translate(0.5, 55) — scaled by 0.25
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
			{ opacity: 1, transform: T(0, 0.35) },
			{ opacity: 1, transform: T(10, 0.45), offset: 0.18 },
			{ opacity: 1, transform: T(36, 0.7), offset: 0.65 },
			{ opacity: 1, transform: T(50, 0.9), offset: 0.90 },
			{ opacity: 0, transform: T(55, 1.0) }
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
	<circle cx="0" cy="0" r="3.5" fill="#f5f0e5" stroke="#c8c0a8" stroke-width=".3"/>
	<path d="M -2 -2.8 Q -2.8 0 -2 2.8" stroke="#c03838" stroke-width=".5" fill="none" stroke-linecap="round"/>
	<path d="M 2 -2.8 Q 2.8 0 2 2.8" stroke="#c03838" stroke-width=".5" fill="none" stroke-linecap="round"/>
</g>

<style>
	.svg-pitch-ball {
		opacity: 0;
		filter: drop-shadow(0 0 2px rgba(255,255,255,.85));
		pointer-events: none;
	}
</style>
