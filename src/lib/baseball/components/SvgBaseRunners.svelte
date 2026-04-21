<script lang="ts">
// ── SvgBaseRunners.svelte ────────────────────────────────────────────────────
// Manages visual runners on bases as SVG <g> elements.
// Uses CSS transitions for base-to-base movement and CSS keyframes for scoring.
//
// Exports: place(base), advanceAll(), clearAll(), syncToState()

	import { game } from '$lib/baseball/state/game.svelte';
	import { RUNNER_POS, SVG_POS } from '$lib/baseball/utils/svgCoords';
	import { SvelteMap } from 'svelte/reactivity';
	import type { BaseName, RunnerToken } from '$lib/baseball/types';
	import onFirstSvg from '$lib/images/onfirst.svg';
	import onSecondSvg from '$lib/images/onsecond.svg';

	const BASE_ORDER: BaseName[] = ['first', 'second', 'third'];

	let runners = $state<RunnerToken[]>([]);
	let nextId = 0;

	const baseToId = new SvelteMap<BaseName, number>();

	// Source images are 48×74. Scale for 1200×630 field.
	const IMG_W = 48;
	const IMG_H = 74;
	const RUNNER_SCALE = 0.82;

	function getRunnerBase(runnerId: number): BaseName | 'home' {
		for (const [base, id] of baseToId) {
			if (id === runnerId) return base;
		}
		return 'home';
	}

	function placeRunner(base: BaseName): void {
		// Start at home plate, then transition to the target base
		const pos = RUNNER_POS[base];
		const runner: RunnerToken = {
			id: nextId++,
			x: pos.x,
			y: pos.y,
			scoring: false
		};
		runners = [...runners, runner];
		baseToId.set(base, runner.id);
		game.bases[base] = true;
	}

	function advanceRunner(base: BaseName): void {
		const runnerId = baseToId.get(base);
		if (runnerId === undefined) return;
		const runner = runners.find((r) => r.id === runnerId);
		if (!runner) return;

		baseToId.delete(base);
		game.bases[base] = false;

		const ni = BASE_ORDER.indexOf(base) + 1;

		if (ni >= BASE_ORDER.length) {
			// Score — animate to home then flash
			runner.x = RUNNER_POS.home.x;
			runner.y = RUNNER_POS.home.y;
			setTimeout(() => {
				runner.scoring = true;
				setTimeout(() => {
					runners = runners.filter((r) => r.id !== runnerId);
				}, 560);
			}, 450);
		} else {
			const nextBase = BASE_ORDER[ni];
			if (baseToId.has(nextBase)) advanceRunner(nextBase);

			const pos = RUNNER_POS[nextBase];
			runner.x = pos.x;
			runner.y = pos.y;
			baseToId.set(nextBase, runnerId);
			game.bases[nextBase] = true;
		}
	}

	/** Place a new runner on the given base. */
	export function place(base: BaseName): void {
		if (!baseToId.has(base)) {
			placeRunner(base);
		}
	}

	/** Advance all runners simultaneously (3B first to avoid cascade conflicts). */
	export function advanceAll(): void {
		[...BASE_ORDER].reverse().forEach((b) => {
			if (baseToId.has(b)) advanceRunner(b);
		});
	}

	/** Remove all runners without scoring animation. */
	export function clearAll(): void {
		for (const b of BASE_ORDER) {
			baseToId.delete(b);
			game.bases[b] = false;
		}
		runners = [];
	}

	/**
	 * Sync visual runners to match game.bases state.
	 * Called after dice rolls update the engine state.
	 */
	export function syncToState(): void {
		for (const base of BASE_ORDER) {
			if (game.bases[base] && !baseToId.has(base)) {
				placeRunner(base);
			} else if (!game.bases[base] && baseToId.has(base)) {
				const id = baseToId.get(base)!;
				runners = runners.filter((r) => r.id !== id);
				baseToId.delete(base);
			}
		}
	}
</script>

<!-- Base indicator diamonds -->
{#each BASE_ORDER as base (base)}
	<rect
		class="base-diamond"
		class:occupied={game.bases[base]}
		x={SVG_POS[base].x - 7}
		y={SVG_POS[base].y - 7}
		width="14"
		height="14"
		transform="rotate(45, {SVG_POS[base].x}, {SVG_POS[base].y})"
	/>
	{#if game.bases[base]}
		<circle
			class="base-pulse"
			cx={SVG_POS[base].x}
			cy={SVG_POS[base].y}
			r="14"
		/>
	{/if}
{/each}

<!-- Runner sprites -->
{#each runners as runner (runner.id)}
	{@const base = getRunnerBase(runner.id)}
	<g
		class="svg-runner"
		class:scoring={runner.scoring}
		style:transform="translate({runner.x}px, {runner.y}px)"
	>
		<g transform="scale({RUNNER_SCALE})">
			<image
				href={base === 'first' ? onFirstSvg : onSecondSvg}
				x={-IMG_W / 2}
				y={-IMG_H / 2}
				width={IMG_W}
				height={IMG_H}
			/>
		</g>
	</g>
{/each}

<style>
	.base-diamond {
		fill: white;
		stroke: white;
		stroke-width: 1.5;
		transition: fill 0.15s, stroke 0.15s;
	}

	.base-diamond.occupied {
		fill: white;
		stroke: white;
	}

	.base-pulse {
		fill: none;
		stroke: #aaa;
		stroke-width: 1;
		opacity: 0;
		transform-box: fill-box;
		transform-origin: center;
		animation: svg-pulsate 1.2s ease-out infinite;
	}

	@keyframes svg-pulsate {
		0%   { transform: scale(1); opacity: 0; }
		50%  { opacity: 1; }
		100% { transform: scale(2.4); opacity: 0; }
	}

	.svg-runner {
		pointer-events: none;
		filter: drop-shadow(0 1px 3px rgba(0,0,0,.9));
		transition:
			transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
		animation: svg-r-appear 0.2s ease-out;
	}

	@keyframes svg-r-appear {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.svg-runner.scoring {
		animation: svg-r-score 0.55s ease-out forwards;
		transition: none;
	}

	@keyframes svg-r-score {
		0%   { opacity: 1; filter: drop-shadow(0 0 0 #f5c518); }
		40%  { opacity: 1; transform: scale(2.6); filter: drop-shadow(0 0 4px #f5c518); }
		100% { opacity: 0; transform: scale(0.4); }
	}
</style>
