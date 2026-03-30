import { db, type UserPreferencesRecord } from '$lib/db/database';

const DEFAULTS: Omit<UserPreferencesRecord, 'id' | 'userId'> = {
	volume: 75,
	speed: 1,
	theme: 'dark',
	defaultWinScore: 30
};

export async function getPreferences(userId: number): Promise<UserPreferencesRecord> {
	const existing = await db.userPreferences.where('userId').equals(userId).first();
	if (existing) return existing;
	const id = await db.userPreferences.add({ ...DEFAULTS, userId });
	return (await db.userPreferences.get(id))!;
}

export async function savePreferences(
	userId: number,
	prefs: Partial<Pick<UserPreferencesRecord, 'volume' | 'speed' | 'theme' | 'defaultWinScore'>>
): Promise<void> {
	const existing = await db.userPreferences.where('userId').equals(userId).first();
	if (existing) {
		await db.userPreferences.update(existing.id!, prefs);
	} else {
		await db.userPreferences.add({ ...DEFAULTS, ...prefs, userId });
	}
}

export async function deletePreferences(userId: number): Promise<void> {
	await db.userPreferences.where('userId').equals(userId).delete();
}

const GUEST_KEY = 'sdb_preferences';

export function getGuestPreferences(): Omit<UserPreferencesRecord, 'id' | 'userId'> {
	try {
		const stored = localStorage.getItem(GUEST_KEY);
		if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
	} catch {
		// ignore
	}
	return { ...DEFAULTS };
}

export function saveGuestPreferences(
	prefs: Partial<Pick<UserPreferencesRecord, 'volume' | 'speed' | 'theme' | 'defaultWinScore'>>
): void {
	try {
		const current = getGuestPreferences();
		localStorage.setItem(GUEST_KEY, JSON.stringify({ ...current, ...prefs }));
	} catch {
		// ignore
	}
}
