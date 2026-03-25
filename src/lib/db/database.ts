import Dexie, { type Table } from 'dexie';
import type { Play, Team } from '$lib/types';

export interface UserRecord {
	id?: number;
	username: string;
	usernameLower: string;
	passwordHash: string;
	salt: string;
	createdAt: number;
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

class AppDatabase extends Dexie {
	users!: Table<UserRecord, number>;
	sessions!: Table<SessionRecord, number>;
	games!: Table<GameRecord, number>;
	customTeams!: Table<CustomTeamRecord, number>;

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
	}
}

export const db = new AppDatabase();
