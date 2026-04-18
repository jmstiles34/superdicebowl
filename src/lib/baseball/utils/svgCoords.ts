// ── SVG coordinate constants + conversion helpers ────────────────────────────
//
// The field geometry in FieldSVG.svelte lives inside a
// <g transform="scale(1.15) translate(-12, -15)"> group.
// SVG applies transforms right-to-left, so a local point (x, y) maps to
// outer SVG space as: ((x - 12) * 1.15, (y - 15) * 1.15).
//
// All exported positions are in OUTER SVG space so animation components
// (which render as siblings outside that group) align correctly.

import type { BaseName } from '$lib/baseball/types';

/** Apply the field group transform to convert local → outer SVG coords. */
function toOuter(x: number, y: number): { x: number; y: number } {
	return { x: (x - 12) * 1.15, y: (y - 15) * 1.15 };
}

// Local coordinates (inside the field <g> group) from the SVG source
const LOCAL = {
	home: { x: 155.5, y: 248 },
	pitcher: { x: 155.5, y: 193.4 },
	first: { x: 210.7, y: 191 },
	second: { x: 155.5, y: 136 },
	third: { x: 100.3, y: 191 }
} as const;

/** Base and landmark positions in outer SVG coordinate space. */
export const SVG_POS = {
	home: toOuter(LOCAL.home.x, LOCAL.home.y),
	pitcher: toOuter(LOCAL.pitcher.x, LOCAL.pitcher.y),
	first: toOuter(LOCAL.first.x, LOCAL.first.y),
	second: toOuter(LOCAL.second.x, LOCAL.second.y),
	third: toOuter(LOCAL.third.x, LOCAL.third.y)
} as const;

/** Runner positions — offset slightly from the base center for visibility. */
export const RUNNER_POS: Record<BaseName | 'home', { x: number; y: number }> = {
	first: { x: SVG_POS.first.x + 2, y: SVG_POS.first.y - 10 },
	second: { x: SVG_POS.second.x, y: SVG_POS.second.y - 11 },
	third: { x: SVG_POS.third.x - 2, y: SVG_POS.third.y - 10 },
	home: { x: SVG_POS.home.x, y: SVG_POS.home.y - 8 }
};

const SCALE = 0.25;

/** Convert an old-canvas dx/dy offset to SVG units. */
export function toSvgOffset(dx: number, dy: number): { dx: number; dy: number } {
	return { dx: dx * SCALE, dy: dy * SCALE };
}
