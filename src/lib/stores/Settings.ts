import { writable } from "svelte/store";
import { DEFAULT_SETTINGS } from '$lib/constants/constants';
import type { Team } from "$lib/types";

export interface sStore {
    type: 'reset' | 'updateMode' | 'updateScore' | 'updateAwayTeam' | 'updateHomeTeam' | null,
    homeTeam: Team,
    awayTeam: Team,
    mode: string;
    winScore: number,
};

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
            return {type: null, ...DEFAULT_SETTINGS};
        })
    },
    updateAwayTeam: (team:Team) => {
        _settings.update((self: sStore) => {
            self.type = 'updateScore';
            self.awayTeam = team;
            return self;
        })
    },
    updateHomeTeam: (team:Team) => {
        _settings.update((self: sStore) => {
            self.type = 'updateScore';
            self.homeTeam = team;
            return self;
        })
    },
    updateMode: (mode:string) => {
        _settings.update((self: sStore) => {
            self.type = 'updateMode';
            self.mode = mode;
            return self;
        })
    },
    updateScore: (score:number) => {
        _settings.update((self: sStore) => {
            self.type = 'updateScore';
            self.winScore = score;
            return self;
        })
    }
};