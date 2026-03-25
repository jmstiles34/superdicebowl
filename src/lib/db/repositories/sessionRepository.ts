import { SESSION_DURATION_MS } from '$lib/constants/auth';
import { db, type SessionRecord, type UserRecord } from '$lib/db/database';

export async function createSession(userId: number): Promise<SessionRecord> {
	const token = crypto.randomUUID();
	const expiresAt = Date.now() + SESSION_DURATION_MS;

	// Remove any existing sessions for this user
	await db.sessions.where('userId').equals(userId).delete();

	const id = await db.sessions.add({ userId, token, expiresAt });
	return { id, userId, token, expiresAt };
}

export async function getValidSession(): Promise<{
	session: SessionRecord;
	user: UserRecord;
} | null> {
	const sessions = await db.sessions.toArray();
	const now = Date.now();

	for (const session of sessions) {
		if (session.expiresAt > now) {
			const user = await db.users.get(session.userId);
			if (user) return { session, user };
		}
		// Clean up expired or orphaned sessions
		if (session.id) await db.sessions.delete(session.id);
	}

	return null;
}

export async function deleteSession(token: string): Promise<void> {
	await db.sessions.where('token').equals(token).delete();
}

export async function deleteSessionsByUser(userId: number): Promise<void> {
	await db.sessions.where('userId').equals(userId).delete();
}
