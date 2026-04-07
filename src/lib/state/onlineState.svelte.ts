import { onlineSignOut, restoreOnlineSession } from '$lib/online/onlineAuth';
import { supabase } from '$lib/online/supabaseClient';

export interface OnlineProfile {
	id: string;
	username: string;
}

class OnlineState {
	profile: OnlineProfile | null = $state(null);
	unreadCount: number = $state(0);
	initialized = $state(false);
	isOnline = $derived(this.profile !== null);

	initialize = async () => {
		const session = await restoreOnlineSession();
		if (session) {
			this.profile = { id: session.userId, username: session.username };
			await this.refreshUnreadCount();
		}
		this.initialized = true;
	};

	setProfile = (profile: OnlineProfile) => {
		this.profile = profile;
	};

	refreshUnreadCount = async () => {
		if (!this.profile) return;
		const { count } = await supabase
			.from('notifications')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', this.profile.id)
			.eq('read', false);
		this.unreadCount = count ?? 0;
	};

	signOut = async () => {
		await onlineSignOut();
		this.profile = null;
		this.unreadCount = 0;
	};
}

export const onlineState = new OnlineState();
