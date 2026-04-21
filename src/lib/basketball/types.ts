export type Quarter = 1 | 2 | 3 | 4;

export interface BasketballDiceRoll {
	id: number;
	points?: number;
	isTurnover?: boolean;
	isFoul?: boolean;
	isFreeThrow?: boolean;
	isThreePointer?: boolean;
	description: string[];
}

export interface BasketballPlay {
	team: string;
	diceRoll: number;
	action: string;
	description: string;
	points: number;
	quarter: Quarter;
}
