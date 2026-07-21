import { Howl, type Howl as THowl } from 'howler';

export const createSound = (file: string): THowl => {
	return new Howl({
		src: [file]
	});
};

// A looping sound for background ambience (e.g. crowd chants). Starts silent so
// callers can set the volume reactively before playing.
export const createLoopSound = (file: string): THowl => {
	return new Howl({
		src: [file],
		loop: true,
		volume: 0
	});
};

export const playSound = (sfx: Howl, volume: number) => {
	if (volume > 0) {
		sfx.volume(volume / 100);
		sfx.play();
	}
};
