import { Howl, type Howl as THowl } from 'howler';

export const createSound = (file: string): THowl => {
	return new Howl({
		src: [file]
	});
};

export const playSound = (sfx: Howl, volume: number) => {
	if (volume > 0) {
		sfx.volume(volume / 100);
		sfx.play();
	}
};
