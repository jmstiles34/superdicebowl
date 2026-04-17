<script lang="ts">
	import { buildKeyframes, HIT_DURATIONS, HIT_EASINGS } from '$lib/baseball/utils/hitZones';
	import type { HitType, Zone } from '$lib/baseball/types';

	let ballEl: HTMLDivElement;

	export function play(type: HitType, zone: Zone, onDone?: () => void): void {
		ballEl.getAnimations().forEach((a) => a.cancel());
		ballEl.style.opacity = '0';
		ballEl.style.transform = '';

		const anim = ballEl.animate(buildKeyframes(type, zone.dx, zone.dy), {
			duration: HIT_DURATIONS[type],
			easing: HIT_EASINGS[type],
			fill: 'forwards'
		});

		anim.addEventListener('finish', () => {
			ballEl.style.opacity = '0';
			onDone?.();
		});
	}
</script>

<div class="batted-ball" bind:this={ballEl}>
	<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
		<circle cx="5" cy="5" r="4.5" fill="#f5f0e5" stroke="#c8c0a8" stroke-width=".6" />
		<path
			d="M 2.5 1.5 Q 1.5 5 2.5 8.5"
			stroke="#c03838"
			stroke-width="1"
			fill="none"
			stroke-linecap="round"
		/>
		<path
			d="M 7.5 1.5 Q 8.5 5 7.5 8.5"
			stroke="#c03838"
			stroke-width="1"
			fill="none"
			stroke-linecap="round"
		/>
	</svg>
</div>

<style>
	.batted-ball {
		position: absolute;
		top: 677px;
		left: 487px;
		width: 10px;
		height: 10px;
		z-index: 500;
		pointer-events: none;
		opacity: 0;
		filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.85));
	}
</style>
