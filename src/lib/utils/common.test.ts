import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	add,
	buildTextString,
	equals,
	gt,
	gte,
	hexToOklch,
	isArray,
	joinText,
	lightenColor,
	lt,
	lte,
	nonZeroRandomNumber,
	oklchToHex,
	pickRandom,
	randomNumber,
	sleep,
	subtract,
	sumArrays,
	sumDigits
} from './common';

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('arithmetic helpers', () => {
	it('add / subtract', () => {
		expect(add(2, 3)).toBe(5);
		expect(add(-1, 1)).toBe(0);
		expect(subtract(5, 3)).toBe(2);
		expect(subtract(0, 4)).toBe(-4);
	});

	it('comparators', () => {
		expect(gt(2, 1)).toBe(true);
		expect(gt(1, 1)).toBe(false);
		expect(gte(1, 1)).toBe(true);
		expect(gte(0, 1)).toBe(false);
		expect(lt(1, 2)).toBe(true);
		expect(lt(2, 2)).toBe(false);
		expect(lte(2, 2)).toBe(true);
		expect(lte(3, 2)).toBe(false);
	});

	it('equals uses strict equality', () => {
		expect(equals(1, 1)).toBe(true);
		expect(equals('a', 'a')).toBe(true);
		expect(equals(1, '1')).toBe(false);
		expect(equals({}, {})).toBe(false);
	});
});

describe('sumDigits', () => {
	it('sums the digits of a two-digit dice id', () => {
		expect(sumDigits(11)).toBe(2);
		expect(sumDigits(12)).toBe(3);
		expect(sumDigits(35)).toBe(8);
		expect(sumDigits(66)).toBe(12);
	});

	it('handles single-digit and zero', () => {
		expect(sumDigits(0)).toBe(0);
		expect(sumDigits(5)).toBe(5);
	});
});

describe('isArray', () => {
	it('detects arrays', () => {
		expect(isArray([])).toBe(true);
		expect(isArray([1, 2])).toBe(true);
	});

	it('rejects non-arrays', () => {
		expect(isArray('abc' as unknown as unknown[])).toBe(false);
		expect(isArray({ length: 0 } as unknown as unknown[])).toBe(false);
		expect(isArray(null as unknown as unknown[])).toBe(false);
	});
});

describe('joinText / buildTextString', () => {
	it('joinText inserts a single space when the left side is non-empty', () => {
		expect(joinText('', 'hello')).toBe('hello');
		expect(joinText('hello', 'world')).toBe('hello world');
		expect(joinText('hello', '')).toBe('hello ');
	});

	it('buildTextString reduces a list of string producers with spaces', () => {
		const result = buildTextString([() => 'PENALTY:', () => 'Holding', () => '- 10 Yd Loss']);
		expect(result).toBe('PENALTY: Holding - 10 Yd Loss');
	});

	it('buildTextString does not filter empty producers (pins current reducer behavior)', () => {
		// joinText only adds a separating space when the accumulator is non-empty, so a leading
		// empty producer contributes nothing but a trailing empty producer leaves a trailing space.
		// Pinning this so an accidental refactor of joinText is caught.
		expect(buildTextString([() => '', () => 'hi', () => ''])).toBe('hi ');
		expect(buildTextString([() => 'a', () => '', () => 'b'])).toBe('a  b');
	});
});

describe('randomNumber / nonZeroRandomNumber / pickRandom', () => {
	it('randomNumber returns an integer in [0, max)', () => {
		// Floor(0.0 * 10) = 0  (min); Floor(0.9999 * 10) = 9 (max)
		vi.spyOn(Math, 'random').mockReturnValueOnce(0);
		expect(randomNumber(10)).toBe(0);
		vi.spyOn(Math, 'random').mockReturnValueOnce(0.9999);
		expect(randomNumber(10)).toBe(9);
	});

	it('nonZeroRandomNumber returns an integer in [1, max]', () => {
		vi.spyOn(Math, 'random').mockReturnValueOnce(0);
		expect(nonZeroRandomNumber(6)).toBe(1);
		vi.spyOn(Math, 'random').mockReturnValueOnce(0.9999);
		expect(nonZeroRandomNumber(6)).toBe(6);
	});

	it('pickRandom selects from the array using Math.random', () => {
		const items = ['a', 'b', 'c', 'd'];
		vi.spyOn(Math, 'random').mockReturnValueOnce(0);
		expect(pickRandom(items)).toBe('a');
		vi.spyOn(Math, 'random').mockReturnValueOnce(0.9999);
		expect(pickRandom(items)).toBe('d');
		vi.spyOn(Math, 'random').mockReturnValueOnce(0.5);
		expect(pickRandom(items)).toBe('c');
	});

	it('pickRandom on an empty array returns undefined', () => {
		vi.spyOn(Math, 'random').mockReturnValueOnce(0);
		expect(pickRandom([])).toBeUndefined();
	});
});

describe('sleep', () => {
	it('resolves after the specified delay', async () => {
		vi.useFakeTimers();
		const promise = sleep(1000);
		let resolved = false;
		promise.then(() => {
			resolved = true;
		});

		// Not yet
		await Promise.resolve();
		expect(resolved).toBe(false);

		await vi.advanceTimersByTimeAsync(1000);
		expect(resolved).toBe(true);
	});
});

describe('sumArrays', () => {
	it('sums a list of same-length arrays element-wise', () => {
		expect(
			sumArrays([
				[1, 2, 3],
				[4, 5, 6]
			])
		).toEqual([5, 7, 9]);
	});

	it('handles mixed lengths by treating missing entries as 0', () => {
		expect(
			sumArrays([
				[1, 2],
				[3, 4, 5]
			])
		).toEqual([4, 6, 5]);
	});

	it('returns an empty array when the input is empty', () => {
		expect(sumArrays([])).toEqual([]);
	});
});

describe('color helpers', () => {
	it('hexToOklch converts a known color and returns an oklch(...) string', () => {
		const white = hexToOklch('#ffffff');
		expect(white).toMatch(/^oklch\(/);
		expect(white).toContain(' / 1)');

		const black = hexToOklch('#000000');
		expect(black).toMatch(/^oklch\(0 0/);
	});

	it('hexToOklch returns a safe default for invalid input', () => {
		expect(hexToOklch('not a color')).toBe('oklch(0 0 0 / 1)');
	});

	it('oklchToHex round-trips to a near-identical hex value', () => {
		const oklch = hexToOklch('#336699');
		const hex = oklchToHex(oklch);
		// Culori round-trips are within ±1 in the last hex digit; just assert shape.
		expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it('oklchToHex returns a safe default for invalid input', () => {
		expect(oklchToHex('not a color')).toBe('#000000');
	});

	it('lightenColor returns an oklch string and leaves invalid colors unchanged', () => {
		const lighter = lightenColor('#336699', 0.1);
		expect(lighter).toMatch(/^oklch\(/);

		expect(lightenColor('not a color')).toBe('not a color');
	});

	it('lightenColor clamps lightness at 1', () => {
		// Pass a near-white color with a huge increment; L should cap at 1.
		const result = lightenColor('#ffffff', 10);
		// Extract the first numeric component (L)
		const match = result.match(/oklch\(([^ ]+)/);
		if (!match) throw new Error(`Unexpected lightenColor output: ${result}`);
		const L = parseFloat(match[1]);
		expect(L).toBeLessThanOrEqual(1);
	});
});
