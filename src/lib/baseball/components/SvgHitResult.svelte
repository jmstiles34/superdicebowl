<script lang="ts">
// ── SvgHitResult.svelte ──────────────────────────────────────────────────────
// Overlay text that flashes the hit result (SINGLE!, HOME RUN!, etc.).
// Rendered as SVG <text> with a stroked outline for readability.
//
// Exposed: show(label) — triggers the pop-and-fade animation

	let label  = $state('');
	let active = $state(false);

	export function show(text: string): void {
		label  = text;
		active = false;
		requestAnimationFrame(() => { active = true; });
	}
</script>

{#if active}
	<g
		class="svg-hit-result"
		onanimationend={() => { active = false; }}
	>
		<!-- Stroke outline for readability (rendered behind fill) -->
		<text
			x="600"
			y="350"
			text-anchor="middle"
			dominant-baseline="middle"
			class="result-outline"
		>{label}</text>
		<!-- Fill text on top -->
		<text
			x="600"
			y="350"
			text-anchor="middle"
			dominant-baseline="middle"
			class="result-fill"
		>{label}</text>
	</g>
{/if}

<style>
	.svg-hit-result {
		pointer-events: none;
		transform-box: fill-box;
		transform-origin: center;
		animation: svg-result-pop .9s ease-out forwards;
	}

	.result-outline {
		font-size: 60px;
		font-weight: 900;
		font-family: var(--font-body, system-ui);
		letter-spacing: 0.05em;
		fill: none;
		stroke: oklch(0 0 0);
		stroke-width: 8px;
		stroke-linejoin: round;
		paint-order: stroke;
	}

	.result-fill {
		font-size: 60px;
		font-weight: 900;
		font-family: var(--font-body, system-ui);
		letter-spacing: 0.05em;
		fill: var(--color-text-gold, #f5c518);
	}

	@keyframes svg-result-pop {
		0%   { opacity: 1; transform: scale(.65); }
		22%  { opacity: 1; transform: scale(1.12); }
		60%  { opacity: 1; transform: scale(1.0); }
		100% { opacity: 0; transform: scale(.85); }
	}
</style>
