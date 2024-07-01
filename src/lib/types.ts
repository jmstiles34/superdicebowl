export interface DiceRoll {
	id: number;
	autoFirstDown?: boolean | false;
	description: string[];
	isPenalty?: boolean | false;
	isTurnover?: boolean | false;
	yards: number | number[];
}

interface Colors {
	primary: string;
	secondary: string;
	faceMask?: string;
	helmet?: string;
	stripe?: string;
	trim?: string;
}

export interface Play {
	team: string;
	diceRoll: number;
	action: string;
	description: string;
	points: number;
	yards: number;
	penaltyYards: number;
	isFirstdown: boolean;
}

export interface PlaySummary {
	team: string;
	description: string;
	homeScore: number;
	awayScore: number;
}

export interface Team {
	id: string;
	city: string;
	cityKey: string;
	colors: Colors;
	isCustom?: boolean;
	fieldLogo: string;
	logo: string;
	logoFixed: boolean;
	logoLeft: string;
	logoTransform: string;
	name: string;
}

export interface Logo {
	name: string;
	file: string;
}

export type Modal = (value: string) => void;

export type SaveTeam = (a: Team) => void;

export type Void = () => void;
