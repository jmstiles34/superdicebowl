// ── Super Dice Bowl — hit zones + WAAPI keyframe builder ─────────────────────
//
// All dx/dy values are translate offsets IN #stadium LOCAL coordinate space,
// relative to #batted-ball's home position (top:677 left:487 — centered on
// home plate).  Negative dy = toward outfield (smaller top = farther away).

import type { HitType, SelectedHitType, Zone } from '$lib/baseball/types';

export const ZONES: Record<HitType, Zone[]> = {
	grounder: [
		{ dx: -190, dy: -185, label: 'SINGLE!' }, // left side of infield
		{ dx: 2, dy: -320, label: 'SINGLE!' }, // up the middle
		{ dx: 188, dy: -185, label: 'SINGLE!' } // right side of infield
	],
	liner: [
		{ dx: -290, dy: -375, label: 'DOUBLE!' }, // left gap
		{ dx: 2, dy: -520, label: 'SINGLE!' }, // up center
		{ dx: 265, dy: -375, label: 'DOUBLE!' } // right gap
	],
	flyball: [
		{ dx: -310, dy: -440, label: 'SINGLE!' }, // left field
		{ dx: 2, dy: -600, label: 'SINGLE!' }, // center field
		{ dx: 288, dy: -440, label: 'SINGLE!' } // right field
	],
	homerun: [
		{ dx: -392, dy: -790, label: 'HOME RUN!' }, // pull — left field wall
		{ dx: 2, dy: -840, label: 'HOME RUN!' }, // dead center
		{ dx: 382, dy: -790, label: 'HOME RUN!' } // oppo — right field wall
	]
};

const RANDOM_POOL: HitType[] = [
	'grounder',
	'grounder',
	'liner',
	'liner',
	'flyball',
	'flyball',
	'homerun'
];

export function pickHitType(): HitType {
	return RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
}

export function pickZone(type: HitType): Zone {
	const zones = ZONES[type];
	return zones[Math.floor(Math.random() * zones.length)];
}

export function resolveHitType(selected: SelectedHitType): HitType {
	return selected === 'random' ? pickHitType() : selected;
}

// ── WAAPI keyframe builder ────────────────────────────────────────────────────
// Each hit type has a distinct scale signature that fakes ball height:
//   grounder  — scale stays near 1, reads as ground-level
//   liner     — brief scale bump at midpoint (~1.28), slightly airborne
//   flyball   — big arc peak (~1.95) then shrinks on landing
//   homerun   — largest peak (~2.4), exits over the outfield wall

export function buildKeyframes(type: HitType, dx: number, dy: number): Keyframe[] {
	const T = (f: number, s: number): string => `translate(${dx * f}px, ${dy * f}px) scale(${s})`;

	switch (type) {
		case 'grounder':
			return [
				{ opacity: 1, transform: T(0, 1.1) },
				{ opacity: 1, transform: T(0.3, 0.96), offset: 0.28 },
				{ opacity: 1, transform: T(0.8, 0.87), offset: 0.8 },
				{ opacity: 0, transform: T(1.0, 0.82) }
			];
		case 'liner':
			return [
				{ opacity: 1, transform: T(0, 1.1) },
				{ opacity: 1, transform: T(0.45, 1.28), offset: 0.4 },
				{ opacity: 0, transform: T(1.0, 0.84) }
			];
		case 'flyball':
			return [
				{ opacity: 1, transform: T(0, 1.1) },
				{ opacity: 1, transform: T(0.32, 1.95), offset: 0.32 },
				{ opacity: 1, transform: T(0.72, 1.3), offset: 0.72 },
				{ opacity: 0, transform: T(1.0, 0.62) }
			];
		case 'homerun':
			return [
				{ opacity: 1, transform: T(0, 1.1) },
				{ opacity: 1, transform: T(0.26, 2.4), offset: 0.26 },
				{ opacity: 1, transform: T(0.55, 2.0), offset: 0.55 },
				{ opacity: 1, transform: T(0.8, 1.3), offset: 0.8 },
				{ opacity: 0, transform: T(1.0, 0.8) }
			];
		default: {
			const _exhaustive: never = type;
			throw new Error(`Unknown hit type: ${_exhaustive}`);
		}
	}
}

export const HIT_DURATIONS: Record<HitType, number> = {
	grounder: 500,
	liner: 520,
	flyball: 1200,
	homerun: 1450
};

export const HIT_EASINGS: Record<HitType, string> = {
	grounder: 'cubic-bezier(.3,0,.5,1)',
	liner: 'cubic-bezier(.15,0,.65,1)',
	flyball: 'ease-in-out',
	homerun: 'ease-in-out'
};
