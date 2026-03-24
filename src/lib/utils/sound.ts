import { Howl, type Howl as THowl } from 'howler';
import { settings } from '$lib/state/settings.svelte';

export const createSound = (file: string): THowl => {
	return new Howl({
		src: [file]
	});
};

export const playSound = (sfx: Howl, volumeOn: boolean) => {
	if (volumeOn) sfx.play();
};

export const toggleVolume = () => {
	settings.volume = !settings.volume;
};
