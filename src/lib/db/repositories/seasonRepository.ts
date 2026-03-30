import { db, type SeasonRecord } from '$lib/db/database';
import { deleteGame } from '$lib/db/repositories/gameRepository';

export async function createSeason(
	userId: number,
	data: Omit<SeasonRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<SeasonRecord> {
	const now = Date.now();
	const id = await db.seasons.add({
		...data,
		userId,
		createdAt: now,
		updatedAt: now
	});
	return (await db.seasons.get(id))!;
}

export async function updateSeason(
	seasonId: number,
	updates: Partial<SeasonRecord>
): Promise<void> {
	await db.seasons.update(seasonId, {
		...updates,
		updatedAt: Date.now()
	});
}

export async function getSeasonsByUser(
	userId: number,
	status?: 'in_progress' | 'completed'
): Promise<SeasonRecord[]> {
	const seasons = await db.seasons.where('userId').equals(userId).toArray();
	const filtered = status ? seasons.filter((s) => s.status === status) : seasons;
	return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
}

async function deleteSeasonGames(season: SeasonRecord): Promise<void> {
	for (const week of season.schedule) {
		for (const m of week.matchups) {
			if (m.gameRecordId) {
				await deleteGame(m.gameRecordId);
			}
		}
	}
}

export async function deleteSeason(seasonId: number): Promise<void> {
	const season = await db.seasons.get(seasonId);
	if (season) {
		await deleteSeasonGames(season);
	}
	await db.seasons.delete(seasonId);
}

export async function deleteSeasonsByUser(
	userId: number,
	status?: 'in_progress' | 'completed'
): Promise<void> {
	const seasons = await getSeasonsByUser(userId, status);
	for (const s of seasons) {
		await deleteSeason(s.id!);
	}
}
