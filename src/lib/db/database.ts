import Dexie, { type Table } from 'dexie';
import type { Play, Team } from '$lib/types';

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

export interface GameStateSnapshot {
	action: string;
	ballIndex: number;
	currentDown: number;
	diceId: number;
	firstDownIndex: number;
	lastPlay: string;
	missedKick: boolean;
	modalContent: string | null;
	onsideKick: boolean;
	playLog: Play[];
	possession: string;
	restrictDice: boolean;
	yardsToGo: number | string;
}

export interface GameSettingsSnapshot {
	awayTeam: Team;
	homeTeam: Team;
	mode: string;
	winScore: number;
}

export interface GameRecord {
	id?: number;
	userId: number;
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

export interface UserPreferencesRecord {
	id?: number;
	userId: number;
	volume: number;
	speed: number;
	theme: 'dark' | 'light';
	defaultWinScore: number;
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
	}
}

export const db = new AppDatabase();
