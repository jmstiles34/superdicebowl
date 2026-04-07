import { validatePassword, validateUsername, verifyPassword } from '$lib/auth/passwordUtils';
import type { UserRecord } from '$lib/db/database';
import { migrateFromLocalStorage } from '$lib/db/repositories/customTeamRepository';
import { deletePreferences, getPreferences } from '$lib/db/repositories/preferencesRepository';
import {
	createSession,
	deleteSession,
	getValidSession
} from '$lib/db/repositories/sessionRepository';
import { createUser, deleteUser, findUserByUsername } from '$lib/db/repositories/userRepository';
import { autoSignIn, deleteOnlineAccount } from '$lib/online/onlineAuth';
import { onlineState } from '$lib/state/onlineState.svelte';
import { settings } from '$lib/state/settings.svelte';

type AuthResult = { success: true } | { success: false; error: string };

class AuthState {
	currentUser: UserRecord | null = $state(null);
	sessionToken: string | null = $state(null);
	initialized = $state(false);
	isLoggedIn = $derived(this.currentUser !== null);

	initialize = async () => {
		const result = await getValidSession();
		if (result) {
			this.currentUser = result.user;
			this.sessionToken = result.session.token;
			await migrateFromLocalStorage(result.user.id!);
			const prefs = await getPreferences(result.user.id!);
			settings.loadPreferences(prefs);
			await this.tryOnlineSignIn(result.user);
		}
		this.initialized = true;
	};

	login = async (username: string, password: string): Promise<AuthResult> => {
		const user = await findUserByUsername(username);
		if (!user) {
			return { success: false, error: 'Invalid username or password' };
		}

		const valid = await verifyPassword(password, user.salt, user.passwordHash);
		if (!valid) {
			return { success: false, error: 'Invalid username or password' };
		}

		const session = await createSession(user.id!);
		this.currentUser = user;
		this.sessionToken = session.token;
		await migrateFromLocalStorage(user.id!);
		const prefs = await getPreferences(user.id!);
		settings.loadPreferences(prefs);
		await this.tryOnlineSignIn(user);
		return { success: true };
	};

	register = async (username: string, password: string): Promise<AuthResult> => {
		const usernameCheck = validateUsername(username);
		if (!usernameCheck.valid) {
			return { success: false, error: usernameCheck.error };
		}

		const passwordCheck = validatePassword(password);
		if (!passwordCheck.valid) {
			return { success: false, error: passwordCheck.failures[0] };
		}

		const result = await createUser(username, password);
		if (!result.success) {
			return { success: false, error: result.error };
		}

		const session = await createSession(result.user.id!);
		this.currentUser = result.user;
		this.sessionToken = session.token;
		await migrateFromLocalStorage(result.user.id!);
		const prefs = await getPreferences(result.user.id!);
		settings.loadPreferences(prefs);
		return { success: true };
	};

	tryOnlineSignIn = async (user: UserRecord) => {
		if (!user.onlineEmail || !user.onlinePassword) return;
		const session = await autoSignIn(user.onlineEmail, user.onlinePassword);
		if (session) {
			onlineState.setProfile({ id: session.userId, username: session.username });
			onlineState.refreshUnreadCount();
		}
	};

	logout = async () => {
		if (this.sessionToken) {
			await deleteSession(this.sessionToken);
		}
		await onlineState.signOut();
		this.currentUser = null;
		this.sessionToken = null;
	};

	deleteAccount = async (): Promise<AuthResult> => {
		if (!this.currentUser?.id) {
			return { success: false, error: 'No account to delete' };
		}

		if (this.currentUser.onlineAccountId) {
			await deleteOnlineAccount(this.currentUser.onlineAccountId);
		}

		await deletePreferences(this.currentUser.id);
		const result = await deleteUser(this.currentUser.id);
		if (!result.success) {
			return { success: false, error: result.error ?? 'Failed to delete account' };
		}

		this.currentUser = null;
		this.sessionToken = null;
		return { success: true };
	};
}

export const auth = new AuthState();
