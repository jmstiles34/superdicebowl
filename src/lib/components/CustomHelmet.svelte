<script lang="ts">
	import Moveable from 'svelte-moveable';
	import { HELMET_SIZE, NOOP } from '$lib/constants/constants';

	export let bg = '#2e2e2e';
	export let faceMask = '#d8d8d8';
	export let helmet = '#4682b4';
	export let stripe = '#ffffff';
	export let trim = '#002244';
	export let logo: string | null = null;
	export let logoFlip: boolean = false;
	export let title: string = 'Custom Football Helmet';
	export let size: string = HELMET_SIZE.LARGE;
	export let logoTransform: string;
	export let setTransform: (t: string) => void;
	export let canCustomize: boolean = false;
	let moveable: HTMLElement | null;
	let target: HTMLElement;

	const width = {
		[HELMET_SIZE.SMALL]: 48,
		[HELMET_SIZE.LARGE]: 250
	};

	let screenSize: number;
	let logoImgWidth = width[size] / 2.5;

	$: if (screenSize && size === HELMET_SIZE.SMALL) {
		if (screenSize >= 960) {
			logoImgWidth = 64 / 2.5;
		}
		if (screenSize <= 640) {
			logoImgWidth = 32 / 2.5;
		}
		if (screenSize < 960 && screenSize > 640) {
			logoImgWidth = 48 / 2.5;
		}
	}

	/* function onResize({ target, width, height, delta }) {
		delta[0] && (target.style.width = `${width}px`);
		delta[1] && (target.style.height = `${height}px`);
	} */

	function onTransform(transform: string) {
		setTransform(transform);
		//console.log(transform);
	}
</script>

<svelte:window bind:innerWidth={screenSize} />

<div {title}>
	<div>
		<svg
			class:small={size === HELMET_SIZE.SMALL}
			class:large={size === HELMET_SIZE.LARGE}
			version="1.2"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 320 320"
		>
			<title>{title}</title>
			<style>
				.s0 {
					fill: #000000;
					stroke: #000000;
					stroke-linecap: round;
					stroke-linejoin: round;
					stroke-width: 0;
				}
				.s1 {
					fill: #f15f2b;
					stroke: #000000;
					stroke-linecap: round;
					stroke-linejoin: round;
					stroke-width: 0;
				}
				.s2 {
					fill: #ffffff;
					stroke: #000000;
					stroke-linecap: round;
					stroke-linejoin: round;
					stroke-width: 0;
				}
				.s3 {
					fill: #959595;
					stroke: #000000;
					stroke-linecap: round;
					stroke-linejoin: round;
					stroke-width: 0;
				}
				.s4 {
					fill: #2e2e2e;
					stroke: #000000;
					stroke-linecap: round;
					stroke-linejoin: round;
					stroke-width: 0;
				}
				.s5 {
					fill: #2e2e2e;
					stroke: #000000;
					stroke-linecap: round;
					stroke-linejoin: round;
					stroke-width: 0;
				}
			</style>
			<path
				id="outline"
				class="s0"
				d="m199.4 243.8c-3.8 0.4-4.9 12.3-25.3 18.9-45.1 14.4-66.8-21-75.8-30.5-30.8-32.5-69.9-8.1-76.6-22.6-1.9-4.1 2.8 3.7-0.2-37.9-1-13.4-1.7-38.4 4.2-60.9 5.4-20.5 23-59.8 73.2-76.6 34.6-11.6 74.9-8.5 107 8.9 22.1 11.9 34.8 26.6 44 40.6 15.3 23.5 16.3 46.5 16.9 47.3 1.1 1.3 9.3 0 13.3 1 0.6 1.7 3.7 27.1 2.1 30.4-3.1 6.3-9.6 3.9-11 4.1-2.2 0.3-4.8 7.9-15.9 1.1-8.9 0-18.1 0.5-19.3 2-0.6 0.8-0.3 4 0.8 24.7 1.4 24.7 0.6 24 1.6 25.2 3.8 4.4 52.8 12.5 56.3 15.7 4.3 4.1 2.4 31.7-4.1 59.7-2.6 11.2-1.6 17-18.8 14.9-20.9-2.5-33.4-15.5-38.7-28-3.7-8.8-2.7-16.7-4.1-23.2-0.6-0.4-29-14.9-29.6-14.8z"
			/>
			<path
				id="filler"
				class="s0"
				style={`fill: ${helmet}`}
				d="M 26.621 178.45 c 0.604 11.473 -1.666 -37.632 4.116 -59.682 c 5.292 -20.09 22.54 -58.604 71.736 -75.068 c 33.908 -11.368 73.402 -8.33 104.86 8.722 c 21.658 11.662 34.104 26.068 43.12 39.788 c 14.994 23.03 15.974 45.57 16.562 46.354 c 5.059 13.66 -4.704 7.742 -24.547 8.556 c -8.722 0 -148.017 -201.007 -192.897 45.056 z"
			/>
			<path
				id="stripe"
				fill-rule="evenodd"
				class="s2"
				style={`fill: ${stripe}`}
				d="m 265.7 267.3 m 20.6 -7.9 m -57.5 -32.8 m -173.7 -15 m 171 -37.6 m 26.2 -72.1 c -9.5 -23.1 -25.3 -36.1 -30 -39.9 c -37.5 -30 -75.3 -28.1 -88.2 -27.3 c -25.7 1.7 -87.5 18.1 -100.2 81.4 c -8.4 42.4 0.9 66.6 -1.8 69.8 c -0.4 0.4 -2.9 0.5 -5.4 -0.1 c -1.8 -7 -4.9 -45.9 1.9 -72.6 c 6.2 -24.1 18.3 -42.1 34 -55.8 c 30.5 -26.5 84 -38.9 133.6 -17.7 c 43.5 18.5 77.2 67.4 69.5 111.3 c -1.6 -0.1 -3.7 0 -4.2 -0.6 c -2.1 -2.1 3 -19.3 -9.2 -48.5"
			/>
			<path
				id="helmet"
				class="s1"
				style={`fill: ${helmet}`}
				d="m198.9 190.6c-4.1 2.2-8.7 6.9-8.7 7.1-0.1 2.3 15.5 12.3 6.9 21.6-9 9.9-12.8-0.1-23.2-8.5-0.1 0-0.5-0.2-5.2 4 4.2 2.9 30.6 16.7 32 17.2 3-5 0.7-9.3 4.3-28.8-2.8-5.8-5-11.2-6.1-12.6"
			/>
			<path
				id="helmet"
				fill-rule="evenodd"
				class="s1"
				style={`fill: ${helmet}`}
				d="m195.8 242.6c-5.1 14.5-34.3 22.6-55.9 16.5-21.5-6-23.9-13.4-37.4-27.5-24.8-25.9-33.6-17.3-44.9-22.1-2.6-14.5-19.8-9.6-20.8-44.8-0.5-19.1-1.2-46.2 11.7-72.5 22.5-45.7 76.5-58.6 116.6-51.1 73.7 13.8 90.8 79.1 88.7 106.8-27.7 4.1-15.2-7.8-48.4 18.7-1.4 1.2-23.3 18.5-23.8 18.9-0.3-0.4-1.1-1.3-2.1-1.3-0.3 0-13.9 11.3-14.1 11.7-0.7 1.4 0.5 1.5-0.2 2.8-2.2 4.1-21.2 12.3-13 19.5 1.5 1.3 39.7 20 43.6 24.4zm-49.3-43.8c17.7-6.2 11.4-32.5-6-32.5-25.1 0.2-20.9 38 3.1 33.3q1.5-0.3 2.9-0.8z"
			/>
			<path
				id="trim"
				class="s5"
				style={`fill: ${trim}`}
				d="m 246.5 104 c -9 -22.4 -24.1 -35 -28.5 -38.6 c -35.6 -29.1 -71.5 -27.3 -83.8 -26.5 c -24.4 1.7 -83.1 17.6 -95.2 78.9 c -8 41 0.9 64.5 -1.7 67.6 c -0.4 0.4 -2.8 0.5 -5.1 -0.1 c -1.7 -6.8 -4.7 -44.5 1.8 -70.3 c 5.9 -23.4 17.4 -40.8 32.3 -54.1 c 28.9 -25.7 79.8 -37.7 126.9 -17.1 c 41.3 17.9 73.3 65.3 65.8 106.2 c -1.5 -0.1 -3.5 0 -4 -0.6 c -2 -2 2.9 -18.7 -8.7 -47"
			/>

			<path
				id="cutout"
				class="s4"
				d="m 265.7 267.3 c 16.6 3.3 18.4 2.2 19.4 3.4 c 0.7 0.9 -3 22.5 -5.7 27.4 c -24.2 5.5 -42.1 -31.9 -37.3 -35.9 c 1.1 -1 1.8 0.8 23.6 5.1 z m 20.6 -7.9 c -4.5 0.8 -39 -6.5 -44.8 -9.2 c -0.8 -2.1 -1.6 -16.3 -1.3 -18.9 c 3.3 -0.2 2.2 0.6 22.4 5.9 c 22.8 6 23.4 4.5 24.4 5.5 c 1 1 0.3 13.9 -0.7 16.7 z m -57.5 -32.8 c 0.6 1 0.5 3 1.4 19.1 c -2.3 -0.2 -2.9 -0.5 -25.5 -12.8 c 0.1 -3.4 1.7 -25.2 3.5 -28.1 c 18.4 23.7 19.4 19.7 20.6 21.8 z m 171 -37.6 c 0.2 0.7 3.3 33.7 2 38.1 c -5.7 -3.3 -15.4 -19.4 -15.6 -22.7 c -0.1 -2.9 8 -13.9 13.6 -15.4"
			/>
			<path
				id="bg"
				class="s4"
				style={`fill: ${bg}`}
				d="m 265.7 267.3c 16.6 3.3 18.4 2.2 19.4 3.4 c 0.7 0.9 -3 22.5 -5.7 27.4 c -24.2 5.5 -42.1 -31.9 -37.3 -35.9 c 1.1 -1 1.8 0.8 23.6 5.1 z m 20.6 -7.9 c -4.5 0.8 -39 -6.5 -44.8 -9.2 c -0.8 -2.1 -1.6 -16.3 -1.3 -18.9 c 3.3 -0.2 2.2 0.6 22.4 5.9 c 22.8 6 23.4 4.5 24.4 5.5 c 1 1 0.3 13.9 -0.7 16.7 z m -57.5 -32.8 c 0.6 1 0.5 3 1.4 19.1 c -2.3 -0.2 -2.9 -0.5 -25.5 -12.8 c 0.1 -3.4 1.7 -25.2 3.5 -28.1 c 18.4 23.7 19.4 19.7 20.6 21.8 z m -173.7 -15 z m 171 -37.6 c 0.2 0.7 3.3 33.7 2 38.1 c -5.7 -3.3 -15.4 -19.4 -15.6 -22.7 c -0.1 -2.9 8 -13.9 13.6 -15.4"
			/>

			<path
				id="rear_pad"
				fill-rule="evenodd"
				class="s2"
				d="m 265.7 267.3 m 20.6 -7.9 m -57.5 -32.8 m -173.7 -15 C 48.3 214.2 27 212.7 25 208.3 c -1.1 -2.2 1.2 -2 1.4 -20.7 c 1.1 0 10.3 -0.2 11.5 -0.2 c 1.1 1.2 1.2 1.2 6 7 c 0.3 0.3 1.8 2.3 11.3 13.9 c 0 3.6 -0.1 2.8 -0.1 3.3"
			/>

			<path id="snap" class="s0" d="m106.1 222.5c-9.9-2-8-18.1 3.5-15.9 10.6 2 7 18-3.5 15.9z" />
			<path id="snap" class="s0" d="m148.9 251.7c-10-2-8.1-18.1 3.5-15.9 10.5 2 7 18-3.5 15.9z" />
			<path
				id="facemask"
				class="s3"
				style={`fill: ${faceMask}`}
				d="m284.9 306.6c2.8-2.7 7.6-30.4 8.7-38.2 1.3-9.8 2.1-28.6 0.2-31-3.4-4.4-47.2-6.7-66.3-20.6-19-13.8-19.5-39.4-26.1-41.4-9.6 3.2 10.8 37.2 22 45.9 15.1 11.7 61.1 19.2 64.9 20.8 0.6 4-0.1 19.7-1.1 20.4-2.7 2.3-41.7-6.7-57-12.5-21.6-8.3-61.4-33.9-64.3-33.6-0.9 0.1-3.2 2.1-4.6 3.8 4.4 2.8 55.6 30.4 56.7 31 32.8 17.1 66.2 15.2 68.6 18.7 0.7 1.1-4.2 29.5-6.9 31.2-1.5 1-17.4 0-28.6-10.3-13.6-12.3-11.1-26.5-13.3-28.7-0.3-0.2-3.8-1.6-5.5-1.7-4.5 28.9 33.7 55 51.5 46.9 0.5-0.2 1-0.7 1.1-0.7z"
			/>
			<path
				id="facemask"
				class="s3"
				style={`fill: ${faceMask}`}
				d="m237.3 241.7c-0.1-4.4-0.3-8.5-0.4-9.2-0.3-1.2-0.8-1.5-4.2-2.8-2.5-0.9-2.5-0.5-1.7 11.1 0.5 7 0.4 6.9 2.1 7.4 0.3 0.1 1.3 0.5 2.1 0.8 0.9 0.4 1.7 0.6 1.9 0.7 0.3 0 0.4-1.8 0.2-8z"
			/>
			<path
				id="facemask"
				class="s3"
				style={`fill: ${faceMask}`}
				d="m167.8 203.3c-1.3 0.6-13.9 10.1-14 12.3-0.1 1.4 1.9 3.5 3.1 3.6 1.5 0 14.5-11 15.1-11.5-3.3-4.3-4.1-4.3-4.2-4.4z"
			/>
			<path
				id="facemask"
				class="s3"
				style={`fill: ${faceMask}`}
				d="m236 215.4c0-1.4-0.2-4.9-0.3-7.8-0.2-2.9-0.4-9.4-0.6-14.3-0.2-5-0.4-9.9-0.5-10.9-0.1-1-0.3-5.1-0.5-9.1-0.1-4-0.4-9.5-0.5-12-0.3-4.3-0.4-4.8-1.1-5.7-1-1.4-2.3-1.6-3.6-0.8-2 1.2-2 2.1-1.2 16 0.2 2.6 0.3 7.4 0.3 10.7 0.1 3.4 0.2 7 0.4 8.1 0.3 2.1 0.8 10.8 1.1 19.1 0 2.6 0.2 5.1 0.2 5.5 0.2 0.7 3.7 3.2 4.9 3.5 1.4 0.4 1.5 0.3 1.4-2.3z"
			/>
			<path
				id="facemask"
				class="s3"
				style={`fill: ${faceMask}`}
				d="m196 180.6c-2.8 1.2-10.1 7.3-11.8 9.4 0.7 1.1-0.6-0.3 3.8 4.8 10.2-7.7 8.9-7 9.8-8.3-0.6-2.7 0 0.6-1.8-5.9z"
			/>
			<path
				id="helmet"
				class="s3"
				style={`fill: ${helmet}`}
				d="m208.9 181.8c-0.1 0.4 1 3.1 1.9 4.2 14.5-19.2 15.9-10.9 13.7-17.1-10.6 8.2-15.6 12.5-15.6 12.9z"
			/>
			<path
				id="facemask"
				class="s3"
				style={`fill: ${faceMask}`}
				d="m209.7 177.6c0.8-0.7 1.8-1.5 2.2-1.9 8.4-7 9.1-7.6 10.2-8.5 0.3-0.4 1-1 1.5-1.3 0.9-0.7 0.9-0.7 0.8-4 0-1.8-0.1-3.3-0.2-3.4-0.2-0.2-1.5 0.3-2.3 0.9-0.4 0.3-0.8 0.7-1 0.8-0.2 0.2-0.9 0.8-1.7 1.3-0.7 0.6-1.6 1.4-2 1.7-0.3 0.3-1.2 1-1.9 1.5-0.8 0.5-1.6 1.1-1.7 1.3-0.2 0.1-1.2 0.9-2.2 1.7-1 0.7-2.2 1.7-2.7 2.2-0.5 0.4-1.6 1.3-2.5 1.9-0.9 0.7-1.6 1.3-1.6 1.4 0 0.1 0.4 0.6 0.9 1.1 0.5 0.6 1.3 1.8 1.7 2.8 0.5 1 0.9 1.8 0.9 1.8 0.1 0 0.8-0.6 1.6-1.3z"
			/>
			<path
				id="facemask"
				class="s3"
				style={`fill: ${faceMask}`}
				d="m266.5 162.8c-8.6 5.7-7.2 4.7-7.8 5.3 5.2 2.7 8.5 0.8 10.7-1.5-1.3-3.1-2.4-3.5-2.9-3.8z"
			/>
			<path
				id="helmet"
				class="s3"
				style={`fill: ${helmet}`}
				d="m236.7 162.9c-1 3.1 0 4.6 0.3 4.7 0.8 0.4 4.3-1.3 7.8-1.7 9.2-1.1 12.2 0.9 16.8-3.1-3.4-0.8-20.3-1.7-24.9 0.1z"
			/>
			<path
				id="strap"
				class="s2"
				d="m278.5 134.9c-4.8-0.4-3.4-0.3-4.9 0-0.4 2-0.4 0-0.3 17.3 5.9 2.3 9.9 9-2.1 11.8 5.1 3.2 8.5 0.1 9.5-2.1 1.6-3.4-1.8-25.5-2.2-27z"
			/>
			<path
				id="facemask"
				class="s3"
				style={`fill: ${faceMask}`}
				d="m235.4 153.8c0 0.1-0.5 1.4 1.3 5.7 37.7-0.5 39.8 3.6 39.2-1.8-0.5-4.9-30-5.1-40.5-3.9z"
			/>
			<path
				id="strap"
				class="s2"
				d="m267.8 151.6c1.9 0.4 2 0.5 2.4 0.2 0.6-0.5 0.6-8.6 0.6-9.8 0.1-8.8 0.7-7.1-3.1-7.3 0 3.7 0 4 0.1 16.9z"
			/>
			<path
				id="strap"
				fill-rule="evenodd"
				class="s2"
				d="m188.1 219.6c-0.3-0.1-0.7-0.2-1.1-0.2-0.8 0-3.5-2.7-7.4-7.2-1.3-1.4-2.7-3-3.2-3.6-0.4-0.5-2.4-2.8-4.4-5.1l-3.5-4 1.5-1.4c3.5-3.1 4.7-4.1 7-6 1.3-1.1 2.6-2 2.8-2 0.3 0 2.6 2.5 6.5 7.2 1.4 1.6 2.8 3.3 3.2 3.8 0.4 0.4 1.3 1.4 2 2.3 3.7 4.1 5.5 6.9 5.5 8.5 0 1-1 4.1-1.3 4.1-0.2 0-0.3 0.2-0.3 0.4 0 0.4-1.2 1.3-2.8 2.3-1.3 0.8-4 1.3-4.5 0.9zm-4.7-7.3c0.6 0.7 1.3 5.5 5.6 5.7 3.5 0.1 5.8-3.1 5.8-5.5 0-3.9-4.1-5.2-4.8-5.8-0.5-0.5-1.5-2.8-2.8-3.5-1.2-0.6-3.4-0.5-4-0.2-1.5 0.5-4.3 3.6-2.6 6.8 0.8 1.5 2.4 2 2.8 2.5z"
			/>
			<path
				id="screw"
				class="s3"
				d="m190.9 215.2c0.7-0.2 0.7-0.2 0.1-0.4-0.3-0.2-0.8-0.5-1.1-0.7-0.3-0.3-0.8-0.4-1.3-0.3-0.9 0.2-1.2-0.2-0.8-0.9 0.2-0.5 0.1-0.9-0.8-2.5-0.1-0.1-0.3 0-0.6 0.2-0.7 0.7-0.5 2.6 0.4 3.7 0.9 1.1 2.4 1.5 4.1 0.9z"
			/>
			<path
				id="screw"
				class="s3"
				d="m192.7 213.3c0.3-0.5 0.3-1.8-0.1-2.7-0.2-0.3-0.9-0.9-1.6-1.4-1.2-0.7-1.5-0.7-2.3-0.4l-0.9 0.4 0.8 0.6c0.5 0.4 1.3 0.7 1.8 0.7 0.8 0 0.9 0.1 0.8 0.9-0.1 0.9 0.5 2.3 0.9 2.3 0.1 0 0.4-0.2 0.6-0.4z"
			/>
			<path
				id="screw"
				class="s3"
				d="m185.1 208.8c0.1-0.3 0.7-0.8 1.3-1.2 1.5-0.9 1.5-1.9 0.1-2.8-1.4-0.8-2.2-0.7-3.4 0.5-1.3 1.3-1.4 2.2-0.3 3.3 0.9 1 1.8 1.1 2.3 0.2z"
			/>
			<path
				id="snap2"
				fill-rule="evenodd"
				class="s3"
				d="m153.8 246.8c-0.3 0.1-1.2 1.4-2.6 1.7-3.1 0.6-3.3-1.8-4.4-2.2-1.4-0.5-0.8 0.9-1.8 0-0.3-0.2-0.4-3.2-0.1-3.9 0.3-0.8 2.5-3.2 4.2-3.7 0.4-0.2 1.5-0.3 2.3-0.1 1.8 0.4 3.8 2.8 4.6 3.5 0 2.3 0 3.7 0 4.6-2.1-0.3-1.4-0.3-2.2 0.1zm-5.2-2.5c0.6-0.8 1-0.9 2.1-0.9 0.9 0 1.4 0.1 1.5 0.4 0.1 0.3 0.4 0.5 0.6 0.5 0.5 0 0.5 0 0.1-1.1q-0.3-1-1.4-1.5c-1.1-0.5-1.3-0.5-2.1 0-1.1 0.5-1.9 1.7-1.9 2.7 0 1 0.1 1 1.1-0.1z"
			/>
			<path
				id="snap1"
				fill-rule="evenodd"
				class="s3"
				d="m111.5 217.6c-0.3 0.1-1.1 1.4-2.6 1.6-3 0.6-3.2-1.7-4.3-2.1-1.4-0.5-0.9 0.9-1.9 0-0.3-0.3-0.3-3.2 0-4 0.2-0.7 2.4-3.1 4.1-3.7 0.5-0.1 1.6-0.2 2.3 0 1.8 0.4 3.9 2.8 4.7 3.5 0 2.3 0 3.7 0 4.6-2.1-0.4-1.4-0.4-2.3 0.1zm-5.2-2.5c0.7-0.8 1-0.9 2.2-0.9 0.9 0 1.4 0.1 1.5 0.4 0.1 0.3 0.4 0.5 0.6 0.5 0.5 0 0.5 0 0.1-1.2q-0.3-0.9-1.5-1.4c-1-0.5-1.2-0.5-2.1-0.1-1.1 0.6-1.9 1.8-1.9 2.8 0 1 0.2 1 1.1-0.1z"
			/>
		</svg>
	</div>
	{#if logo}
		<div
			on:click={canCustomize ? () => (moveable = target) : NOOP}
			on:keydown={canCustomize ? () => (moveable = target) : NOOP}
			on:dblclick={canCustomize ? () => (moveable = null) : NOOP}
			role="button"
			tabindex="0"
			class="logoContainer"
			class:small={size === HELMET_SIZE.SMALL}
			class:large={size === HELMET_SIZE.LARGE}
		>
			<img
				alt={`${logo} Logo`}
				bind:this={target}
				class="target"
				src={`/logos/custom/${logo}.webp`}
				style={`
					width: ${logoImgWidth}px; 
					transform: ${logoFlip ? logoTransform.replace('scale(', 'scale(-') : logoTransform}
				`}
				class:flipRight={logoFlip}
			/>
		</div>
		{#if canCustomize}
			<Moveable
				target={moveable}
				origin={true}
				edge={false}
				draggable={true}
				on:drag={({ detail }) => onTransform(detail.transform)}
				throttleDrag={0}
				keepRatio={false}
				renderDirections={['nw', 'ne', 'sw', 'se', 'n', 'w', 's', 'e']}
				throttleScale={0}
				rotatable={true}
				scalable={false}
				snappable={true}
				bounds={{ left: 0, top: 0, right: 0, bottom: 0, position: 'css' }}
				on:scale={({ detail }) => onTransform(detail.transform)}
				throttleRotate={0}
				on:rotate={({ detail }) => onTransform(detail.transform)}
				warpable={true}
				on:warp={({ detail }) => onTransform(detail.transform)}
			/>
		{/if}
	{/if}
</div>

<style>
	.logoContainer {
		position: absolute;
		top: 0;
	}
	.target {
		top: 14%;
		left: 20%;
	}
	.flipRight {
		transform: scale(-1, 1);
	}
	.small {
		width: 3rem;
		height: 3rem;
	}
	.large {
		width: 15.625rem;
		height: 15.625rem;
	}

	@media (max-width: 40rem) {
		.small {
			width: 2rem;
			height: 2rem;
		}
	}
	@media (min-width: 60rem) {
		.small {
			width: 4rem;
			height: 4rem;
		}
	}
</style>
