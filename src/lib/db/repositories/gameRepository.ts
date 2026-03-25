import { TEAM } from '$lib/constants/constants';
import {
	db,
	type GameRecord,
	type GameSettingsSnapshot,
	type GameStateSnapshot
} from '$lib/db/database';
import { getScoreByTeam } from '$lib/utils/game';

export async function createGame(
	userId: number,
	gameState: GameStateSnapshot,
	gameSettings: GameSettingsSnapshot
): Promise<GameRecord> {
	const now = Date.now();
	const id = await db.games.add({
		userId,
		status: 'in_progress',
		gameState,
		gameSettings,
		createdAt: now,
		updatedAt: now
	});
	return (await db.games.get(id))!;
}

export async function updateGameState(gameId: number, gameState: GameStateSnapshot): Promise<void> {
	await db.games.update(gameId, {
		gameState,
		updatedAt: Date.now()
	});
}

export async function completeGame(gameId: number, gameState: GameStateSnapshot): Promise<void> {
	await db.games.update(gameId, {
		gameState,
		status: 'completed',
		updatedAt: Date.now()
	});
}

export async function getGame(gameId: number): Promise<GameRecord | undefined> {
	return db.games.get(gameId);
}

export async function getGamesByUser(
	userId: number,
	status: 'in_progress' | 'completed'
): Promise<GameRecord[]> {
	const games = await db.games
		.where('userId')
		.equals(userId)
		.filter((g) => g.status === status)
		.toArray();
	return games.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteGame(gameId: number): Promise<void> {
	await db.games.delete(gameId);
}

export interface TeamRecord {
	wins: number;
	losses: number;
	total: number;
}

export async function getTeamRecord(userId: number, teamId: string): Promise<TeamRecord> {
	const completed = await db.games
		.where('userId')
		.equals(userId)
		.filter((g) => g.status === 'completed')
		.toArray();

	let wins = 0;
	let losses = 0;

	for (const game of completed) {
		const { homeTeam, awayTeam } = game.gameSettings;
		const isHome = homeTeam.id === teamId;
		const isAway = awayTeam.id === teamId;
		if (!isHome && !isAway) continue;

		const homeScore = getScoreByTeam(TEAM.HOME, game.gameState.playLog);
		const awayScore = getScoreByTeam(TEAM.AWAY, game.gameState.playLog);
		const homeWon = homeScore > awayScore;

		if ((isHome && homeWon) || (isAway && !homeWon)) {
			wins++;
		} else {
			losses++;
		}
	}

	return { wins, losses, total: wins + losses };
}
