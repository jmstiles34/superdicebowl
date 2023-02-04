import { writable } from "svelte/store";
import { BALL_KICKOFF, DEFAULT_GAME, GAME_ACTION, OPPOSITE_TEAM } from '$lib/constants/constants';
import { setFirstDownMarker } from "$lib/utils/game";

export interface gStore {
    type: 'prepareKickoff' | 'reset' | 'restrictDice' | 'saveCoinToss' | 'turnover' | 'updateGame' | null,
    action: string,
    awayScore: number,
    ballIndex: number,
    currentDown: number,
    firstDownIndex: number,
    homeScore: number,
    lastPlay: string,
    missedKick: boolean,
    modalContent: string,
    possession: string,
    restrictDice: boolean,
    showModal: boolean,
    yardsToGo: number | string;
};

const _game = writable<gStore>({
    type: null,
    ...DEFAULT_GAME
});

export const game = {
    subscribe: _game.subscribe,
    set: _game.set,
    update: _game.update,
    reset: () => {
        _game.update(() => {
            return {type: null, ...DEFAULT_GAME};
        })
    },
    prepareKickoff: () => {
        _game.update((self: gStore) => {
            self.type = 'prepareKickoff';
            self.missedKick = false;
            self.possession = OPPOSITE_TEAM[self.possession];
            self.firstDownIndex = -1;
            self.currentDown = 1;
            self.yardsToGo = 10;
            self.ballIndex = BALL_KICKOFF[self.possession];
            self.action = GAME_ACTION.KICKOFF;
            self.restrictDice = false;
            return self;
        })
    },
    restrictDice: (isRestricted = false) => {
        _game.update((self: gStore) => {
            self.type = 'restrictDice';
            self.restrictDice = isRestricted
            return self;
        })
    },
    saveCoinToss: (team:string) => {
        _game.update((self: gStore) => {
            self.type = 'saveCoinToss';
            self.possession = team;
            self.ballIndex = BALL_KICKOFF[team];
            self.showModal = false;
            return self;
        })
    },
    turnover: (ballIndex:number) => {
        _game.update((self: gStore) => {
            const newPos = OPPOSITE_TEAM[self.possession];
            self.type = 'turnover';
            self.missedKick = false,
            self.currentDown = 1,
            self.firstDownIndex = setFirstDownMarker(ballIndex, newPos),
            self.ballIndex = ballIndex,
            self.yardsToGo = 10,
            self.possession = newPos,
            self.action = GAME_ACTION.OFFENSE,
            self.restrictDice = false;
            return self;
        })
    },
    updateGame: (props:Record<string, unknown>) => {
        _game.update((self: gStore) => {
            self.type = 'updateGame';
            return {...self, ...props};
        })
    }
};