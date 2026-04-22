export interface BasketballDiceRoll {
	id: number;
	points: number;
	isFoul: boolean;
	isShot: boolean;
	isTurnover: boolean;
	freeThrows?: number;
	description: string[];
}

export interface BasketballPlay {
	team: string;
	diceId: number;
	description: string;
	pointsScored: number;
	isFoul: boolean;
	isTurnover: boolean;
}
