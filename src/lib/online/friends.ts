import { supabase } from './supabaseClient';

export interface Profile {
	id: string;
	username: string;
}

export interface Friendship {
	id: string;
	requesterId: string;
	addresseeId: string;
	status: 'pending' | 'accepted' | 'declined';
	profile: Profile;
}

export interface OnlineNotification {
	id: string;
	type: 'friend_request' | 'friend_accepted' | 'game_invite' | 'your_turn' | 'game_over';
	fromUserId: string;
	fromUsername: string;
	gameId: string | null;
	read: boolean;
	data: Record<string, unknown> | null;
	createdAt: string;
}

export async function searchProfiles(query: string, currentUserId: string): Promise<Profile[]> {
	if (!query.trim()) return [];
	const { data } = await supabase
		.from('profiles')
		.select('id, username')
		.ilike('username', `%${query.trim()}%`)
		.neq('id', currentUserId)
		.limit(10);
	return data ?? [];
}

export async function getFriendships(userId: string): Promise<Friendship[]> {
	const { data } = await supabase
		.from('friendships')
		.select(
			`id, requester_id, addressee_id, status,
			 requester:requester_id(id, username),
			 addressee:addressee_id(id, username)`
		)
		.or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
		.neq('status', 'declined');

	if (!data) return [];

	return data.map((f) => {
		const isRequester = f.requester_id === userId;
		const profile = isRequester
			? (f.addressee as unknown as Profile)
			: (f.requester as unknown as Profile);
		return {
			id: f.id,
			requesterId: f.requester_id,
			addresseeId: f.addressee_id,
			status: f.status as Friendship['status'],
			profile
		};
	});
}

export async function sendFriendRequest(
	fromUserId: string,
	toUserId: string
): Promise<{ success: boolean; error?: string }> {
	const { error } = await supabase
		.from('friendships')
		.insert({ requester_id: fromUserId, addressee_id: toUserId });

	if (error) {
		return { success: false, error: 'Failed to send friend request' };
	}

	await supabase.from('notifications').insert({
		user_id: toUserId,
		from_user_id: fromUserId,
		type: 'friend_request'
	});

	return { success: true };
}

export async function acceptFriendRequest(
	friendshipId: string,
	requesterId: string,
	acceptorId: string
): Promise<void> {
	await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);

	await supabase.from('notifications').insert({
		user_id: requesterId,
		from_user_id: acceptorId,
		type: 'friend_accepted'
	});
}

export async function declineFriendRequest(friendshipId: string): Promise<void> {
	await supabase.from('friendships').update({ status: 'declined' }).eq('id', friendshipId);
}

export async function getNotifications(userId: string): Promise<OnlineNotification[]> {
	const { data } = await supabase
		.from('notifications')
		.select(
			`id, type, from_user_id, game_id, read, data, created_at,
			 from_profile:from_user_id(id, username)`
		)
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(30);

	if (!data) return [];

	return data.map((n) => {
		const fp = n.from_profile as unknown as Profile;
		return {
			id: n.id,
			type: n.type as OnlineNotification['type'],
			fromUserId: n.from_user_id,
			fromUsername: fp?.username ?? 'Unknown',
			gameId: n.game_id,
			read: n.read,
			data: n.data,
			createdAt: n.created_at
		};
	});
}

export async function markNotificationRead(notificationId: string): Promise<void> {
	await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
	await supabase
		.from('notifications')
		.update({ read: true })
		.eq('user_id', userId)
		.eq('read', false);
}

export async function deleteNotification(notificationId: string): Promise<void> {
	await supabase.from('notifications').delete().eq('id', notificationId);
}

export async function deleteAllNotifications(userId: string): Promise<void> {
	await supabase.from('notifications').delete().eq('user_id', userId);
}
