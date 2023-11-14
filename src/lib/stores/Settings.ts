import { writable } from 'svelte/store';
import { DEFAULT_SETTINGS } from '$lib/constants/constants';
import type { Team } from '$lib/types';
import { game } from '$lib/stores/Game';

export interface sStore {
  type: 'reset' | 'updateMode' | 'updateScore' | 'updateAwayTeam' | 'updateHomeTeam' | null;
  homeTeam: Team;
  awayTeam: Team;
  mode: string;
  winScore: number;
  volume: number;
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
  toggleVolume: () => {
    _settings.update((self: sStore) => {
      const newVolume = self.volume === 1 ? 0 : 1;
      game.updateVolume(newVolume);
      self.volume = newVolume;
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
