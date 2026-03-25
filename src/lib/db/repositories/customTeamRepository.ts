import { type CustomTeamRecord, db } from '$lib/db/database';
import type { Team } from '$lib/types';

export async function createCustomTeam(userId: number, teamData: Team): Promise<CustomTeamRecord> {
	const now = Date.now();
	const id = await db.customTeams.add({ userId, teamData, createdAt: now, updatedAt: now });
	return (await db.customTeams.get(id))!;
}

export async function updateCustomTeam(recordId: number, teamData: Team): Promise<void> {
	await db.customTeams.update(recordId, { teamData, updatedAt: Date.now() });
}

export async function deleteCustomTeam(recordId: number): Promise<void> {
	await db.customTeams.delete(recordId);
}

export async function getCustomTeamsByUser(userId: number): Promise<CustomTeamRecord[]> {
	return db.customTeams.where('userId').equals(userId).toArray();
}

export async function getCustomTeamByTeamId(
	userId: number,
	teamId: string
): Promise<CustomTeamRecord | undefined> {
	const teams = await db.customTeams.where('userId').equals(userId).toArray();
	return teams.find((t) => t.teamData.id === teamId);
}

export async function migrateFromLocalStorage(userId: number): Promise<number> {
	const raw = localStorage.getItem('customTeams');
	if (!raw) return 0;

	const teams: Team[] = JSON.parse(raw);
	if (teams.length === 0) return 0;

	const existing = await getCustomTeamsByUser(userId);
	const existingIds = new Set(existing.map((r) => r.teamData.id));
	const now = Date.now();

	let migrated = 0;
	for (const teamData of teams) {
		if (!existingIds.has(teamData.id)) {
			await db.customTeams.add({ userId, teamData, createdAt: now, updatedAt: now });
			migrated++;
		}
	}

	if (migrated > 0) {
		localStorage.removeItem('customTeams');
	}

	return migrated;
}
