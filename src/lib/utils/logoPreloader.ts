import { logos } from '$lib/data/logos.json';

let _supportsAvif: boolean | null = null;
const _preloaded = new Set<string>();

/**
 * Detect AVIF support by decoding a tiny AVIF image.
 * Result is cached after first call.
 */
export async function supportsAvif(): Promise<boolean> {
	if (_supportsAvif !== null) return _supportsAvif;

	if (typeof createImageBitmap === 'undefined') {
		_supportsAvif = false;
		return false;
	}

	// 1x1 AVIF image
	const avifData = new Uint8Array([
		0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0x00, 0x00, 0x00, 0x00,
		0x61, 0x76, 0x69, 0x66, 0x6d, 0x69, 0x66, 0x31, 0x6d, 0x69, 0x61, 0x66
	]);

	try {
		const blob = new Blob([avifData], { type: 'image/avif' });
		await createImageBitmap(blob);
		_supportsAvif = true;
	} catch {
		_supportsAvif = false;
	}

	return _supportsAvif;
}

/**
 * Returns the best logo URL for the given file name,
 * using AVIF when supported and falling back to WebP.
 */
export function getLogoUrl(file: string): string {
	if (_supportsAvif) {
		return `/logos/${file}.avif`;
	}
	return `/logos/${file}.webp`;
}

/**
 * Preload a single logo image into the browser cache.
 */
function preloadImage(url: string): Promise<void> {
	if (_preloaded.has(url)) return Promise.resolve();
	_preloaded.add(url);

	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve();
		img.onerror = () => resolve(); // don't block on missing files
		img.src = url;
	});
}

/**
 * Preload all core logos (the ones available to all users from logos.json).
 * Call once on app mount — detects AVIF support first, then preloads
 * in the best available format.
 */
export async function preloadCoreLogos(): Promise<void> {
	await supportsAvif();

	const urls = logos.map((l) => getLogoUrl(l.file));

	// Load in small batches to avoid saturating the connection
	const BATCH = 6;
	for (let i = 0; i < urls.length; i += BATCH) {
		await Promise.all(urls.slice(i, i + BATCH).map(preloadImage));
	}
}

/**
 * Preload a specific set of logos by file name.
 * Useful for preloading logos that aren't in the core set (e.g. field logos).
 */
export async function preloadLogos(files: string[]): Promise<void> {
	await supportsAvif();
	await Promise.all(files.map((f) => preloadImage(getLogoUrl(f))));
}
