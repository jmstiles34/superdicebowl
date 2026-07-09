import Dexie, { type Table } from 'dexie';
import type { Play } from '$lib/football/types';
import type { SportType, Team } from '$lib/shared/types';

export interface UserRecord {
	id?: number;
	username: string;
	usernameLower: string;
	passwordHash: string;
	salt: string;
	createdAt: number;
	onlineAccountId?: string;
	onlineEmail?: string;
	onlinePassword?: string;
}

export interface SessionRecord {
	id?: number;
	userId: number;
	token: string;
	expiresAt: number;
}

// ── Football snapshot types ──────────────────────────────────

export interface FootballGameStateSnapshot {
	sport: 'football';
	action: string;
	ballIndex: number;
	currentDown: number;
	diceId: number;
	firstDownIndex: number;
	lastPlay: string;
	missedKick: boolean;
	missedTwoPoint: boolean;
	modalContent: string | null;
	onsideKick: boolean;
	playLog: Play[];
	possession: string;
	restrictDice: boolean;
	yardsToGo: number | string;
	stateVersion?: number;
}

export interface FootballGameSettingsSnapshot {
	sport: 'football';
	awayTeam: Team;
	homeTeam: Team;
	mode: string;
	winScore: number;
}

// ── Baseball snapshot types (placeholder for Phase 8) ─────────

export interface BaseballGameStateSnapshot {
	sport: 'baseball';
	action: string;
	lastPlay: string;
	modalContent: string | null;
	possession: string;
	restrictDice: boolean;
	playLog: unknown[];
	inning: number;
	half: 'top' | 'bottom';
	outs: number;
	balls: number;
	strikes: number;
	bases: [boolean, boolean, boolean];
	scores: {
		vis: (number | null)[];
		hom: (number | null)[];
	};
	totals: {
		vis: { r: number; h: number; e: number };
		hom: { r: number; h: number; e: number };
	};
}

export interface BaseballGameSettingsSnapshot {
	sport: 'baseball';
	awayTeam: Team;
	homeTeam: Team;
	mode: string;
	innings: number;
}

// ── Hockey snapshot types ────────────────────────────────────

export interface HockeyGameStateSnapshot {
	sport: 'hockey';
	action: string;
	lastPlay: string;
	modalContent: string | null;
	possession: string;
	restrictDice: boolean;
	playLog: unknown[];
	diceId: number;
	scores: {
		away: number;
		home: number;
	};
	shotsOnGoal: {
		away: number;
		home: number;
	};
	powerPlay: boolean;
}

export interface HockeyGameSettingsSnapshot {
	sport: 'hockey';
	awayTeam: Team;
	homeTeam: Team;
	mode: string;
	winScore: number;
}

// ── Basketball snapshot types ────────────────────────────────

export interface BasketballGameStateSnapshot {
	sport: 'basketball';
	action: string;
	lastPlay: string;
	modalContent: string | null;
	possession: string;
	restrictDice: boolean;
	playLog: unknown[];
	diceId: number;
	scores: {
		away: number;
		home: number;
	};
	fouls: {
		away: number;
		home: number;
	};
	freeThrowsRemaining: number;
	freeThrowsScored: number;
}

export interface BasketballGameSettingsSnapshot {
	sport: 'basketball';
	awayTeam: Team;
	homeTeam: Team;
	mode: string;
	winScore: number;
}

// ── Soccer snapshot types ────────────────────────────────────

export interface SoccerGameStateSnapshot {
	sport: 'soccer';
	action: string;
	lastPlay: string;
	modalContent: string | null;
	possession: string;
	restrictDice: boolean;
	playLog: unknown[];
	ballSection: number;
	scores: {
		away: number;
		home: number;
	};
	powerChipHolder: string;
	diceReduction: {
		away: number;
		home: number;
	};
	pendingShot: 'shot' | 'freeKick' | null;
}

export interface SoccerGameSettingsSnapshot {
	sport: 'soccer';
	awayTeam: Team;
	homeTeam: Team;
	mode: string;
	winScore: number;
}

// ── Discriminated unions ─────────────────────────────────────

/**
 * Legacy snapshots (pre-v8) lack a `sport` field. During migration they
 * get `sport: 'football'` added, but TypeScript needs to accept both
 * shapes when reading from the DB.
 */
export type GameStateSnapshot =
	| FootballGameStateSnapshot
	| BaseballGameStateSnapshot
	| HockeyGameStateSnapshot
	| BasketballGameStateSnapshot
	| SoccerGameStateSnapshot;
export type GameSettingsSnapshot =
	| FootballGameSettingsSnapshot
	| BaseballGameSettingsSnapshot
	| HockeyGameSettingsSnapshot
	| BasketballGameSettingsSnapshot
	| SoccerGameSettingsSnapshot;

/**
 * Legacy type alias: most existing code was written against the football
 * shape before the discriminated union existed. This alias lets those
 * call sites keep compiling without changes.
 *
 * @deprecated Import FootballGameStateSnapshot directly for new code.
 */
export type LegacyGameStateSnapshot = Omit<FootballGameStateSnapshot, 'sport'> & {
	sport?: 'football';
};

export interface GameRecord {
	id?: number;
	userId: number;
	sport: SportType;
	status: 'in_progress' | 'completed';
	gameState: GameStateSnapshot;
	gameSettings: GameSettingsSnapshot;
	createdAt: number;
	updatedAt: number;
}

export interface CustomTeamRecord {
	id?: number;
	userId: number;
	teamData: Team;
	createdAt: number;
	updatedAt: number;
}

export type MowPattern = 'none' | 'crosscut' | 'stripes' | 'diamonds' | 'arcs' | 'checkerboard';

export interface UserPreferencesRecord {
	id?: number;
	userId: number;
	volume: number;
	speed: number;
	theme: 'dark' | 'light';
	defaultWinScore: number;
	mowPattern?: MowPattern;
	// Selected soccer-ball skin (filename without extension). See
	// lib/soccer/ballDesigns.ts. Optional/non-indexed → no schema bump needed.
	ballDesign?: string;
}

export interface SeasonMatchup {
	homeTeamId: string;
	awayTeamId: string;
	status: 'pending' | 'in_progress' | 'completed';
	homeScore: number;
	awayScore: number;
	isUserGame: boolean;
	gameRecordId?: number;
}

export interface SeasonWeek {
	weekNumber: number;
	matchups: SeasonMatchup[];
}

export interface StandingsEntry {
	teamId: string;
	wins: number;
	losses: number;
	pointsFor: number;
	pointsAgainst: number;
}

export interface SeasonRecord {
	id?: number;
	userId: number;
	sport: SportType;
	status: 'in_progress' | 'completed';
	userTeamId: string;
	teams: Team[];
	schedule: SeasonWeek[];
	standings: StandingsEntry[];
	currentWeek: number;
	totalWeeks: number;
	winScore: number;
	createdAt: number;
	updatedAt: number;
}

class AppDatabase extends Dexie {
	users!: Table<UserRecord, number>;
	sessions!: Table<SessionRecord, number>;
	games!: Table<GameRecord, number>;
	customTeams!: Table<CustomTeamRecord, number>;
	userPreferences!: Table<UserPreferencesRecord, number>;
	seasons!: Table<SeasonRecord, number>;

	constructor() {
		super('superdicebowl');

		this.version(1).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token'
		});

		this.version(2).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token',
			games: '++id, userId, status, updatedAt'
		});

		this.version(3).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token',
			games: '++id, userId'
		});

		this.version(4).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token',
			games: '++id, userId',
			customTeams: '++id, userId'
		});

		this.version(5).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token',
			games: '++id, userId',
			customTeams: '++id, userId',
			userPreferences: '++id, &userId'
		});

		this.version(6).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token',
			games: '++id, userId',
			customTeams: '++id, userId',
			userPreferences: '++id, &userId',
			seasons: '++id, userId'
		});

		this.version(7).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token',
			games: '++id, userId',
			customTeams: '++id, userId',
			userPreferences: '++id, &userId',
			seasons: '++id, userId'
		});

		this.version(8)
			.stores({
				users: '++id, &usernameLower',
				sessions: '++id, userId, &token',
				games: '++id, userId, sport',
				customTeams: '++id, userId',
				userPreferences: '++id, &userId',
				seasons: '++id, userId, sport'
			})
			.upgrade((tx) => {
				// Backfill existing records with sport: 'football'
				return Promise.all([
					tx
						.table('games')
						.toCollection()
						.modify((game) => {
							if (!game.sport) game.sport = 'football';
							if (game.gameState && !game.gameState.sport) game.gameState.sport = 'football';
							if (game.gameSettings && !game.gameSettings.sport)
								game.gameSettings.sport = 'football';
						}),
					tx
						.table('seasons')
						.toCollection()
						.modify((season) => {
							if (!season.sport) season.sport = 'football';
						})
				]);
			});

		this.version(9).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token',
			games: '++id, userId, sport',
			customTeams: '++id, userId',
			userPreferences: '++id, &userId',
			seasons: '++id, userId, sport'
		});

		// v10: hockey + basketball sport types added to SportType union.
		// No index changes — sport column already supports arbitrary strings.
		this.version(10).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token',
			games: '++id, userId, sport',
			customTeams: '++id, userId',
			userPreferences: '++id, &userId',
			seasons: '++id, userId, sport'
		});

		// v11: soccer sport type added to SportType union.
		// No index changes — sport column already supports arbitrary strings.
		this.version(11).stores({
			users: '++id, &usernameLower',
			sessions: '++id, userId, &token',
			games: '++id, userId, sport',
			customTeams: '++id, userId',
			userPreferences: '++id, &userId',
			seasons: '++id, userId, sport'
		});
	}
}

export const db = new AppDatabase();
