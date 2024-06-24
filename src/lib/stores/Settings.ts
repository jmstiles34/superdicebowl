import { writable } from 'svelte/store';
import { DEFAULT_SETTINGS, DEFAULT_TEAM } from '$lib/constants/constants';
import type { Team } from '$lib/types';

export interface sStore {
	type:
		| 'reset'
		| 'resetTeams'
		| 'updateMode'
		| 'updateScore'
		| 'updateAwayTeam'
		| 'updateHomeTeam'
		| null;
	homeTeam: Team;
	awayTeam: Team;
	mode: string;
	winScore: number;
	volume: boolean;
}

const _settings = writable<sStore>({
	type: null,
	...DEFAULT_SETTINGS
});

export const settings = {
	subscribe: _settings.subscribe,
	set: _settings.set,
	update: _settings.update,
	reset: () => {
		_settings.update(() => {
			return { type: null, ...DEFAULT_SETTINGS };
		});
	},
	resetTeams: () => {
		_settings.update((self: sStore) => {
			self.type = 'resetTeams';
			self.awayTeam = DEFAULT_TEAM;
			self.homeTeam = DEFAULT_TEAM;
			return self;
		});
	},
	toggleVolume: () => {
		_settings.update((self: sStore) => {
			self.volume = !self.volume;
			return self;
		});
	},
	updateAwayTeam: (team: Team) => {
		_settings.update((self: sStore) => {
			self.type = 'updateAwayTeam';
			self.awayTeam = team;
			return self;
		});
	},
	updateHomeTeam: (team: Team) => {
		_settings.update((self: sStore) => {
			self.type = 'updateHomeTeam';
			self.homeTeam = team;
			return self;
		});
	},
	updateMode: (mode: string) => {
		_settings.update((self: sStore) => {
			self.type = 'updateMode';
			self.mode = mode;
			return self;
		});
	},
	updateScore: (score: number) => {
		_settings.update((self: sStore) => {
			self.type = 'updateScore';
			self.winScore = score;
			return self;
		});
	}
};
