import type { Team } from '$lib/shared/types';

// The soccer roster is nations, described with country/nickname rather than
// the shared Team's city/name. Mapped into a Team at the load boundary
// (see TeamSelect) so settings, persistence, and shared UI stay unchanged.
export interface SoccerNation {
	id: string;
	country: string;
	countryKey: string;
	nickname: string;
	logo: string;
	colors: Team['colors'];
}

// A single die result is one of the four symbols.
export type SoccerSymbol = 'ball' | 'kick' | 'penalty' | 'redCard';

// A team's roll is its set of dice faces (normally 6, fewer under a red card).
export type SoccerRoll = SoccerSymbol[];

// The play a team's roll resolves to: the most-frequent symbol and how many
// dice showed it.
export interface TeamPlay {
	symbol: SoccerSymbol;
	count: number;
}

// Which side won a comparison of two rolls.
export type RollWinner = 'offense' | 'defense' | 'tie';

// The offensive category a winning play maps to.
export type SoccerOutcome =
	| 'ballMove'
	| 'shotOnGoal'
	| 'freeKick'
	| 'redCardAdvance'
	| 'clearMidline'
	| 'goal';

// One entry in the play-by-play log.
export interface SoccerPlay {
	team: string;
	description: string;
	symbol: SoccerSymbol;
	count: number;
	goalsScored: number;
	isShot: boolean;
	isRedCard: boolean;
	usedPowerChip: boolean;
}

// Flavor-text lookup, keyed by symbol + role, loaded from data.json.
export interface SoccerSymbolCopy {
	symbol: SoccerSymbol;
	offense: string[];
	defense: string[];
}
