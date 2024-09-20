import { Fireworks, type FireworksOptions } from '@fireworks-js/svelte';

export let fireworkShow: Fireworks;

export const options: FireworksOptions = {
	explosion: 3,
	opacity: 0.5,
	intensity: 15,
	sound: {
		enabled: true,
		files: [
			'/sfx/firework1.mp3',
			'/sfx/firework2.mp3',
			'/sfx/firework3.mp3',
			'/sfx/firework4.mp3',
			'/sfx/firework5.mp3'
		],
		volume: {
			min: 2,
			max: 4
		}
	}
};
