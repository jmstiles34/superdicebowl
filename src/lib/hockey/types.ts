export type Period = 1 | 2 | 3;

export interface HockeyDiceRoll {
	id: number;
	isGoal?: boolean;
	isShotOnGoal?: boolean;
	isPenalty?: boolean;
	isPowerPlayGoal?: boolean;
	description: string[];
}

export interface HockeyPlay {
	team: string;
	diceRoll: number;
	action: string;
	description: string;
	goals: number;
	period: Period;
}
