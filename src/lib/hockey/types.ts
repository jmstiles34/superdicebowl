export interface HockeyDiceRoll {
	id: number;
	isPenalty?: boolean;
	isTurnover?: boolean;
	isShot?: boolean;
	isPowerPlayShot?: boolean;
	isGoal?: boolean;
	description: string[];
}

export interface HockeyPlay {
	team: string;
	diceId: number;
	description: string;
	goalsScored: number;
	isPenalty: boolean;
	isTurnover: boolean;
	isShot: boolean;
}
