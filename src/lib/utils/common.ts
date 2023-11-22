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

export function gt(a: number, b: number) {
	return a > b;
}

export function gte(a: number, b: number) {
	return a >= b;
}

export function hexToRGB(hex: string) {
	const m: string[] = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i) || [];
	return {
		r: parseInt(m[1], 16),
		g: parseInt(m[2], 16),
		b: parseInt(m[3], 16)
	};
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
