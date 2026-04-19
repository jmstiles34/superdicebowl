<script lang="ts">
// ── SvgBattedBall.svelte ─────────────────────────────────────────────────────
// Baseball after being hit. Uses WAAPI animate() on an SVG <g> element.
// Positioned at home plate; buildKeyframes provides translate+scale offsets.
//
// Exposed: play(type, zone, onDone?)

	import { buildKeyframes, HIT_DURATIONS, HIT_EASINGS } from '$lib/baseball/utils/hitZones';
	import { SVG_POS, toSvgOffset } from '$lib/baseball/utils/svgCoords';
	import type { HitType, Zone } from '$lib/baseball/types';

	let ballEl: SVGGElement;

	const hx = SVG_POS.home.x;
	const hy = SVG_POS.home.y;

	export function play(type: HitType, zone: Zone, onDone?: () => void): void {
		ballEl.getAnimations().forEach((a) => a.cancel());
		ballEl.style.opacity = '0';

		const svg = toSvgOffset(zone.dx, zone.dy);
		const keyframes = buildKeyframes(type, svg.dx, svg.dy);

		// Offset all transforms by home plate position
		const offsetKeyframes = keyframes.map((kf) => {
			const t = kf.transform as string;
			// buildKeyframes produces: translate(dx, dy) scale(s)
			// We need to prepend the home plate origin
			const rewritten = t.replace(
				/translate\(([^)]+)\)/,
				(_, inner) => {
					const [x, y] = inner.split(',').map((v: string) => parseFloat(v));
					return `translate(${hx + x}px, ${hy + y}px)`;
				}
			);
			return { ...kf, transform: rewritten };
		});

		const anim = ballEl.animate(offsetKeyframes, {
			duration: HIT_DURATIONS[type],
			easing: HIT_EASINGS[type],
			fill: 'forwards'
		});

		anim.addEventListener('finish', () => {
			ballEl.style.opacity = '0';
			anim.cancel();
			onDone?.();
		});
	}
</script>

<g class="svg-batted-ball" bind:this={ballEl}>
	<circle cx="0" cy="0" r="10" fill="#f5f0e5" stroke="#c8c0a8" stroke-width="1"/>
	<path d="M -6 -8 Q -8 0 -6 8" stroke="#c03838" stroke-width="1.5" fill="none" stroke-linecap="round"/>
	<path d="M 6 -8 Q 8 0 6 8" stroke="#c03838" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</g>

<style>
	.svg-batted-ball {
		opacity: 0;
		filter: drop-shadow(0 0 6px rgba(255,255,255,.85));
		pointer-events: none;
	}
</style>
