import convert from 'color-convert';
import type { HSL } from 'color-convert/conversions';

export function add(a: number, b: number) {
	return a + b;
}

export function buildTextString(fns: { (): string }[]) {
	return fns.reduce((acc, fn) => {
		return joinText(acc, fn());
	}, '');
}

export function equals(a: unknown, b: unknown) {
	return a === b;
}

export function formatHsl(code: number[]) {
	return `hsl(${code[0]} ${code[1]}% ${code[2]}% / 1)`;
}

export function gt(a: number, b: number) {
	return a > b;
}

export function gte(a: number, b: number) {
	return a >= b;
}

export function hexToHsl(hex: string) {
	return formatHsl(convert.hex.hsl(hex));
}

export function hexToRGB(hex: string) {
	const m: string[] = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i) || [];
	return {
		r: parseInt(m[1], 16),
		g: parseInt(m[2], 16),
		b: parseInt(m[3], 16)
	};
}

export function hslToHex(hsl: string) {
	const parts = hsl.replace('hsl(', '').split(' ');
	const degree = parseInt(parts[0]);
	const saturation = parseInt(parts[1]);
	const lightness = parseInt(parts[2]);

	return `#${convert.hsl.hex([degree, saturation, lightness])}`;
}

export const isArray = (x: unknown[]) => Array.isArray(x);

export function joinText(a: string, b: string) {
	return `${a}${a.length ? ' ' : ''}${b}`;
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

export function removeSpaces(text: string) {
	return text.replaceAll(' ', '');
}

export function shuffle(array: []) {
	return array.sort(() => Math.random() - 0.5);
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
			return acc + parseInt(n);
		}, 0);
}
