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
}

export type Modal = (value: string) => void;

export type SaveTeam = (a: Team) => void;

export type Void = () => void;