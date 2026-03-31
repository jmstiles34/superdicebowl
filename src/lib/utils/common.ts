import { converter, formatHex, parse } from 'culori';

export function add(a: number, b: number) {
	return a + b;
}

export function buildTextString(fns: (() => string)[]) {
	return fns.reduce((acc, fn) => {
		return joinText(acc, fn());
	}, '');
}

export function equals(a: unknown, b: unknown) {
	return a === b;
}

const toOklch = converter('oklch');

const round4 = (n: number) => Math.round(n * 10000) / 10000;
const round2 = (n: number) => Math.round(n * 100) / 100;

function toOklchComponents(color: NonNullable<ReturnType<typeof toOklch>>) {
	return {
		L: round4(color.l),
		C: round4(color.c || 0),
		H: round2(color.h || 0)
	};
}

export function gt(a: number, b: number) {
	return a > b;
}

export function gte(a: number, b: number) {
	return a >= b;
}

export function hexToOklch(hex: string) {
	const color = parse(hex);
	if (!color) return 'oklch(0 0 0 / 1)';
	const { L, C, H } = toOklchComponents(toOklch(color));
	return `oklch(${L} ${C} ${H} / 1)`;
}

export function oklchToHex(oklch: string) {
	const color = parse(oklch);
	if (!color) return '#000000';
	return formatHex(color);
}

export const isArray = (x: unknown[]) => Array.isArray(x);

export function joinText(a: string, b: string) {
	return `${a}${a.length ? ' ' : ''}${b}`;
}

export function lightenColor(color: string, num = 0.05) {
	const parsed = parse(color);
	if (!parsed) return color;
	const oklchColor = toOklch(parsed);
	const { C, H } = toOklchComponents(oklchColor);
	const L = Math.min(1, round4(oklchColor.l + num));
	const alpha = oklchColor.alpha;
	if (alpha !== undefined && alpha !== 1) {
		return `oklch(${L} ${C} ${H} / ${alpha})`;
	}
	return `oklch(${L} ${C} ${H})`;
}

export function lt(a: number, b: number) {
	return a < b;
}

export function lte(a: number, b: number) {
	return a <= b;
}

export function nonZeroRandomNumber(max = 2) {
	return Math.floor(Math.random() * max) + 1;
}

export function pickRandom(array: unknown[]): unknown {
	const index = Math.floor(array.length * Math.random());
	return array[index];
}

export function randomNumber(max = 2) {
	return Math.floor(Math.random() * max);
}

export function sleep(ms: number) {
	return new Promise((fulfill) => {
		setTimeout(fulfill, ms);
	});
}

export function subtract(a: number, b: number) {
	return a - b;
}

export function sumArrays(array: number[][]) {
	return array.reduce((acc, a) => {
		a.forEach((b, i) => {
			acc[i] = (acc[i] || 0) + b;
		});
		return acc;
	}, []);
}

export function sumDigits(num: number) {
	return num
		.toString()
		.split('')
		.reduce((acc, n) => {
			return acc + parseInt(n, 10);
		}, 0);
}
