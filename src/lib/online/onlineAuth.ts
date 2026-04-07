import { validateUsername } from '$lib/auth/passwordUtils';
import { supabase } from './supabaseClient';

export type OnlineAuthResult =
	| { success: true; userId: string; username: string }
	| { success: false; error: string };

export async function onlineSignUp(
	email: string,
	password: string,
	username: string
): Promise<OnlineAuthResult> {
	const usernameCheck = validateUsername(username);
	if (!usernameCheck.valid) {
		return { success: false, error: usernameCheck.error };
	}

	const { data: existing } = await supabase
		.from('profiles')
		.select('id')
		.eq('username', username.trim())
		.maybeSingle();

	if (existing) {
		return { success: false, error: 'Username is already taken' };
	}

	const { data, error } = await supabase.auth.signUp({ email, password });

	if (error || !data.user) {
		return { success: false, error: error?.message ?? 'Failed to create account' };
	}

	const { error: profileError } = await supabase
		.from('profiles')
		.insert({ id: data.user.id, username: username.trim() });

	if (profileError) {
		return { success: false, error: 'Failed to create profile' };
	}

	return { success: true, userId: data.user.id, username: username.trim() };
}

export async function onlineSignIn(email: string, password: string): Promise<OnlineAuthResult> {
	const { data, error } = await supabase.auth.signInWithPassword({ email, password });

	if (error || !data.user) {
		return { success: false, error: 'Invalid email or password' };
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('username')
		.eq('id', data.user.id)
		.single();

	if (!profile) {
		return { success: false, error: 'Profile not found' };
	}

	return { success: true, userId: data.user.id, username: profile.username };
}

export async function onlineSignOut(): Promise<void> {
	await supabase.auth.signOut();
}

export async function deleteOnlineAccount(userId: string): Promise<void> {
	// Forfeit all in-progress games and notify opponents
	const { data: games } = await supabase
		.from('remote_games')
		.select('id, home_user_id, away_user_id')
		.or(`home_user_id.eq.${userId},away_user_id.eq.${userId}`)
		.eq('status', 'in_progress');

	if (games && games.length > 0) {
		for (const game of games) {
			const opponentId = game.home_user_id === userId ? game.away_user_id : game.home_user_id;

			await supabase
				.from('remote_games')
				.update({ status: 'completed', updated_at: new Date().toISOString() })
				.eq('id', game.id)
				.eq('status', 'in_progress');

			await supabase.from('notifications').insert({
				user_id: opponentId,
				from_user_id: userId,
				type: 'game_over',
				game_id: game.id,
				data: { result: 'forfeit_win' }
			});
		}
	}

	// Delete profile — cascades to friendships and notifications
	await supabase.from('profiles').delete().eq('id', userId);

	// Delete the auth user via RPC (requires the delete_user function in Supabase)
	await supabase.rpc('delete_user');

	await supabase.auth.signOut();
}

export async function autoSignIn(
	email: string,
	password: string
): Promise<{ userId: string; username: string } | null> {
	const { data, error } = await supabase.auth.signInWithPassword({ email, password });
	if (error || !data.user) return null;

	const { data: profile } = await supabase
		.from('profiles')
		.select('username')
		.eq('id', data.user.id)
		.single();

	if (!profile) return null;
	return { userId: data.user.id, username: profile.username };
}

export async function restoreOnlineSession(): Promise<{ userId: string; username: string } | null> {
	const { data } = await supabase.auth.getSession();
	if (!data.session) return null;

	const { data: profile } = await supabase
		.from('profiles')
		.select('username')
		.eq('id', data.session.user.id)
		.single();

	if (!profile) return null;

	return { userId: data.session.user.id, username: profile.username };
}
