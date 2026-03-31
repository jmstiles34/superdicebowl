import { generateSalt, hashPassword } from '$lib/auth/passwordUtils';
import { db, type UserRecord } from '$lib/db/database';

export type UserResult = { success: true; user: UserRecord } | { success: false; error: string };

export async function createUser(username: string, password: string): Promise<UserResult> {
	const usernameLower = username.trim().toLowerCase();

	const existing = await db.users.where('usernameLower').equals(usernameLower).first();
	if (existing) {
		return { success: false, error: 'Username is already taken' };
	}

	const salt = generateSalt();
	const passwordHash = await hashPassword(password, salt);

	const id = await db.users.add({
		username: username.trim(),
		usernameLower,
		passwordHash,
		salt,
		createdAt: Date.now()
	});

	const user = await db.users.get(id);
	if (!user) {
		return { success: false, error: 'Failed to create account' };
	}

	return { success: true, user };
}

export async function findUserByUsername(username: string): Promise<UserRecord | undefined> {
	return db.users.where('usernameLower').equals(username.trim().toLowerCase()).first();
}

export async function deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
	try {
		await db.sessions.where('userId').equals(userId).delete();
		await db.users.delete(userId);
		return { success: true };
	} catch {
		return { success: false, error: 'Failed to delete account' };
	}
}
