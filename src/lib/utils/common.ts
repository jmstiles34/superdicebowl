import * as R from 'ramda';

export function buildTextString(fns:{ (): string; }[]) {
	return fns.reduce((acc, fn) => {
		return joinText(acc, fn())
	}, '');
}

export function hexToRGB(hex:string) {
    const m:string[] = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i) || []
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}

export function joinText(a:string, b:string) {
	return `${a}${a.length ? ' ':''}${b}`;
}

export function pickRandom(array:unknown[]):unknown {
	const index = Math.floor(array.length * Math.random());
	return array[index];
}

export function randomNumber(max = 2) {
	return Math.floor(Math.random()*max);
}

export function removeSpaces(text:string) {
	return text.replaceAll(" ", "");
}

export function nonZeroRandomNumber(max = 2) {
	return Math.floor(Math.random()*max)+1;
}

export function shuffle(array: []) {
	return array.sort(() => Math.random() - 0.5);
}

export function sleep(ms:number) {
	return new Promise(fulfil => {
		setTimeout(fulfil, ms)
	});
}

export function sumDigits(num:number) {
	return R.toString(num).split("").reduce((acc, n) => {
		return acc + parseInt(n)
	}, 0);
};