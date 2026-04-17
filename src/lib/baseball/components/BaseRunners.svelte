<script lang="ts">
	import { game } from '$lib/baseball/state/game.svelte';
	import type { BaseName, RunnerToken } from '$lib/baseball/types';

	const RUNNER_POS: Record<BaseName | 'home', { top: number; left: number }> = {
		first: { top: 440, left: 707 },
		second: { top: 222, left: 485 },
		third: { top: 441, left: 263 },
		home: { top: 666, left: 485 }
	};

	const BASE_IDS: Record<BaseName, string> = {
		first: 'first-base',
		second: 'second-base',
		third: 'third-base'
	};

	const BASE_ORDER: BaseName[] = ['first', 'second', 'third'];

	let runners = $state<RunnerToken[]>([]);
	let nextId = 0;

	const baseToId = new Map<BaseName, number>();

	function placeRunner(base: BaseName): void {
		const pos = RUNNER_POS[base];
		const runner: RunnerToken = {
			id: nextId++,
			top: pos.top,
			left: pos.left,
			scoring: false
		};
		runners.push(runner);
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
			runner.top = RUNNER_POS.home.top;
			runner.left = RUNNER_POS.home.left;
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
			runner.top = pos.top;
			runner.left = pos.left;
			baseToId.set(nextBase, runnerId);
			game.bases[nextBase] = true;
		}
	}

	/** Place a new runner on the given base. Used by the game engine after hits/walks. */
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
	 * Called after dice rolls update the engine state — places/removes
	 * runners to match, then triggers advance animations.
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

{#each BASE_ORDER as base}
	<div class="base" class:occupied={game.bases[base]} id={BASE_IDS[base]}>
		<div class="pulse"></div>
	</div>
{/each}

{#each runners as runner (runner.id)}
	<div
		class="runner"
		class:scoring={runner.scoring}
		style:top="{runner.top}px"
		style:left="{runner.left}px"
	>
		<svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
			<rect x="3" y="0" width="6" height="3" fill="#1a3a8a" />
			<rect x="1" y="3" width="10" height="3" fill="#1a3a8a" />
			<rect x="2" y="6" width="8" height="4" fill="#eeeeee" />
			<rect x="2" y="10" width="3" height="3" fill="#1a2060" />
			<rect x="7" y="10" width="3" height="3" fill="#1a2060" />
			<rect x="2" y="13" width="3" height="3" fill="#111111" />
			<rect x="7" y="13" width="3" height="3" fill="#111111" />
		</svg>
	</div>
{/each}

<style>
	.base {
		position: absolute;
		height: 13px;
		width: 13px;
		transform: rotate(-45deg);
		border: 2px solid white;
		background-color: white;
		z-index: 100;
		transition:
			background-color 0.15s,
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.base.occupied {
		background-color: #f5c518;
		border-color: #f5c518;
		box-shadow: 0 0 8px rgba(245, 197, 24, 0.8);
	}

	:global(#first-base) {
		top: 450px;
		left: 706px;
	}
	:global(#second-base) {
		top: 231px;
		left: 484px;
	}
	:global(#third-base) {
		top: 450px;
		left: 262px;
	}

	.pulse {
		z-index: 1000;
		border: 1px solid #aaa;
		border-radius: 100%;
		margin: -9px;
		width: 29px;
		height: 29px;
		opacity: 0;
		pointer-events: none;
	}

	.base.occupied .pulse {
		animation: pulsate 1.2s ease-out infinite;
	}

	@keyframes pulsate {
		0% {
			transform: scale(1);
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: scale(2.4);
			opacity: 0;
		}
	}

	.runner {
		position: absolute;
		z-index: 160;
		pointer-events: none;
		filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.9));
		transition:
			top 0.45s cubic-bezier(0.4, 0, 0.2, 1),
			left 0.45s cubic-bezier(0.4, 0, 0.2, 1);
		animation: r-appear 0.2s ease-out;
	}

	@keyframes r-appear {
		from {
			opacity: 0;
			transform: scale(0.3);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.runner.scoring {
		animation: r-score 0.55s ease-out forwards;
		transition: none;
	}

	@keyframes r-score {
		0% {
			opacity: 1;
			transform: scale(1);
			filter: drop-shadow(0 0 0 #f5c518);
		}
		40% {
			opacity: 1;
			transform: scale(2.6);
			filter: drop-shadow(0 0 10px #f5c518);
		}
		100% {
			opacity: 0;
			transform: scale(0.4);
		}
	}
</style>
