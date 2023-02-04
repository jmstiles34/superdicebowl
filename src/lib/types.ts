import type { sStore } from "./stores/Settings";

export interface DiceRoll {
    id: number;
    autoFirstDown?: boolean | false,
    description: string[],
    isPenalty?: boolean | false,
    isTurnover?: boolean | false,
    yards: number,
};

export interface Game {
    action: string,
    awayScore: number,
    awayTeam: Team,
    ballIndex: number,
    currentDown: number,
    diceRollData: DiceRoll[],
    firstDownIndex: number,
    homeScore: number,
    homeTeam: Team, 
    lastPlay: string,
    missedKick: boolean,
    mode: string,
    modalContent: string,
    possession: string,
    restrictDice: boolean,
    showModal: boolean,
    winScore: number,
    yardsToGo: number | string;
};

export interface GameSettings {
    awayTeam: Team,
    homeTeam: Team,
    mode: string,
    winScore: number,
}

export interface Team {
    id: number,
    city: string,
    cityKey: string,
    name: string,
    primaryColor: string,
    secondaryColor: string,
}

export type Modal = (value: string) => void;

export type SaveTeam = (a: Team) => void;