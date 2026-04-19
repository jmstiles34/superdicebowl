// ── SVG coordinate constants + conversion helpers ────────────────────────────
//
// The field is rendered from field.svg with a native viewBox of 0 0 1200 630.
// All exported positions are in that coordinate space.

import type { BaseName } from '$lib/baseball/types';

// Landmark coordinates extracted from the labeled paths in field.svg
const POS = {
	home: { x: 607, y: 516 },
	pitcher: { x: 606, y: 355 },
	first: { x: 857, y: 412 },
	second: { x: 607, y: 203 },
	third: { x: 345, y: 412 }
} as const;

/** Base and landmark positions in SVG coordinate space. */
export const SVG_POS = POS;

/** Runner positions — offset slightly from the base center for visibility. */
export const RUNNER_POS: Record<BaseName | 'home', { x: number; y: number }> = {
	first: { x: SVG_POS.first.x + 8, y: SVG_POS.first.y - 35 },
	second: { x: SVG_POS.second.x, y: SVG_POS.second.y - 38 },
	third: { x: SVG_POS.third.x - 8, y: SVG_POS.third.y - 35 },
	home: { x: SVG_POS.home.x, y: SVG_POS.home.y - 28 }
};

const SCALE = 0.97;

/** Convert an old-canvas dx/dy offset to SVG units. */
export function toSvgOffset(dx: number, dy: number): { dx: number; dy: number } {
	return { dx: dx * SCALE, dy: dy * SCALE };
}
