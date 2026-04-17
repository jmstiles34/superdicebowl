export interface DiceRoll {
	id: number;
	autoFirstDown?: boolean | false;
	description: string[];
	isPenalty?: boolean | false;
	isTurnover?: boolean | false;
	yards: number | number[];
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
