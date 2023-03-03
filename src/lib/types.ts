export interface DiceRoll {
    id: number;
    autoFirstDown?: boolean | false,
    description: string[],
    isPenalty?: boolean | false,
    isTurnover?: boolean | false,
    yards: number | number[],
};

export interface Team {
    id: number,
    city: string,
    cityKey: string,
    name: string,
    primaryColor: string,
    secondaryColor: string,
    isCustom?: boolean;
    faceMask?: string;
    helmet?: string;
    logo?: string;
    stripe?: string;
    trim?: string;
}

/* export interface CustomTeam extends Team {
    isCustom: boolean;
    faceMask: string;
    helmet: string;
    logo: string;
    stripe: string;
    trim: string;
} */

export type Modal = (value: string) => void;

export type SaveTeam = (a: Team) => void;

export type Void = () => void;