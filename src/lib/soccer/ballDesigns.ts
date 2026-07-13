import { DEFAULT_BALL_DESIGN } from '$lib/soccer/constants';

// Registry of selectable soccer-ball skins. Each design is an avif image with a
// webp fallback, paired by filename (e.g. `soccer-ball-02.avif` /
// `.webp`). Field.svelte renders the chosen design and cycles to the next one
// on click; the choice is persisted as `settings.ballDesign`.
//
// Enumerated at build time via import.meta.glob so dropping a new
// `soccer-ball-NN.{avif,webp}` pair into $lib/images/balls adds it to the
// rotation automatically — no code change needed.

export type BallDesign = {
	key: string; // filename without extension, e.g. 'soccer-ball-02'
	avif: string;
	webp: string;
};

const avifs = import.meta.glob('$lib/images/balls/*.avif', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

const webps = import.meta.glob('$lib/images/balls/*.webp', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

function keyFor(path: string): string {
	return (path.split('/').pop() ?? '').replace(/\.(avif|webp)$/, '');
}

// Build the design list from the avif set, matching each to its webp sibling.
// Sorted by key so the cycle order is stable (soccer-ball-01, -02, …).
export const BALL_DESIGNS: BallDesign[] = Object.keys(avifs)
	.map((avifPath) => {
		const key = keyFor(avifPath);
		const webpPath = Object.keys(webps).find((p) => keyFor(p) === key);
		return webpPath ? { key, avif: avifs[avifPath], webp: webps[webpPath] } : null;
	})
	.filter((d): d is BallDesign => d !== null)
	.sort((a, b) => a.key.localeCompare(b.key));

// Resolve a design by key, falling back to the default (or the first available
// design) so a stale/unknown preference never leaves the ball unrendered.
export function ballDesignFor(key: string): BallDesign {
	return (
		BALL_DESIGNS.find((d) => d.key === key) ??
		BALL_DESIGNS.find((d) => d.key === DEFAULT_BALL_DESIGN) ??
		BALL_DESIGNS[0]
	);
}

// The next design in the rotation, wrapping around to the start.
export function nextBallDesign(key: string): string {
	if (BALL_DESIGNS.length === 0) return key;
	const i = BALL_DESIGNS.findIndex((d) => d.key === key);
	return BALL_DESIGNS[(i + 1) % BALL_DESIGNS.length].key;
}

// The previous design in the rotation, wrapping around to the end.
export function prevBallDesign(key: string): string {
	if (BALL_DESIGNS.length === 0) return key;
	const i = BALL_DESIGNS.findIndex((d) => d.key === key);
	const from = i === -1 ? 0 : i;
	return BALL_DESIGNS[(from - 1 + BALL_DESIGNS.length) % BALL_DESIGNS.length].key;
}
