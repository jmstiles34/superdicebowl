<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';
	import { onlineState } from '$lib/state/onlineState.svelte';
	import { DEFAULT_TEAM } from '$lib/constants/constants';
	import { teamsData } from '$lib/data/data.json';
	import { getCustomTeamsByUser } from '$lib/db/repositories/customTeamRepository';
	import {
		searchProfiles,
		getFriendships,
		sendFriendRequest,
		acceptFriendRequest,
		declineFriendRequest,
		getNotifications,
		markNotificationRead,
		markAllNotificationsRead,
		deleteNotification,
		deleteAllNotifications,
		type Friendship,
		type OnlineNotification,
		type Profile
	} from '$lib/online/friends';
	import { createChallenge, acceptChallenge, declineChallenge } from '$lib/online/remoteGames';
	import type { Team } from '$lib/types';

	type Tab = 'notifications' | 'friends' | 'find';

	let activeTab = $state<Tab>('notifications');
	let friendships = $state<Friendship[]>([]);
	let notifications = $state<OnlineNotification[]>([]);
	let searchQuery = $state('');
	let searchResults = $state<Profile[]>([]);
	let searching = $state(false);
	let searchDebounce: ReturnType<typeof setTimeout>;
	let allTeams = $state<Team[]>([]);

	// Track pending actions for immediate feedback
	let pendingRequests = $state<Set<string>>(new Set());
	let processingIds = $state<Set<string>>(new Set());

	// Challenge flow (Friends tab)
	let challengingFriendship = $state<Friendship | null>(null);
	let challengeTeamId = $state('');
	let challengeWinScore = $state(30);
	let challengeLoading = $state(false);
	let challengeError = $state('');

	// Accept flow (Notifications tab)
	let acceptingNotification = $state<OnlineNotification | null>(null);
	let acceptTeamId = $state('');
	let acceptLoading = $state(false);
	let acceptError = $state('');

	$effect(() => {
		if (auth.initialized && !auth.isLoggedIn) goto('/login');
	});

	$effect(() => {
		if (onlineState.initialized && !onlineState.isOnline) goto('/account');
	});

	$effect(() => {
		if (onlineState.isOnline) loadAll();
	});

	onMount(async () => {
		let customTeams: Team[] = [];
		if (auth.currentUser?.id) {
			const records = await getCustomTeamsByUser(auth.currentUser.id);
			customTeams = records.map((r) => r.teamData);
		}
		allTeams = [...customTeams, ...teamsData];
	});

	async function loadAll() {
		if (!onlineState.profile) return;
		[friendships, notifications] = await Promise.all([
			getFriendships(onlineState.profile.id),
			getNotifications(onlineState.profile.id)
		]);
		onlineState.refreshUnreadCount();
	}

	let friends = $derived(friendships.filter((f) => f.status === 'accepted'));
	let pendingIncoming = $derived(
		friendships.filter((f) => f.status === 'pending' && f.addresseeId === onlineState.profile?.id)
	);
	let pendingSent = $derived(
		friendships.filter((f) => f.status === 'pending' && f.requesterId === onlineState.profile?.id)
	);
	let unreadNotifications = $derived(notifications.filter((n) => !n.read));
	let selectedChallengeTeam = $derived(
		allTeams.find((t) => t.id === challengeTeamId) ?? DEFAULT_TEAM
	);
	let selectedAcceptTeam = $derived(allTeams.find((t) => t.id === acceptTeamId) ?? DEFAULT_TEAM);

	// ── Search ────────────────────────────────────────────────
	function onSearchInput() {
		clearTimeout(searchDebounce);
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}
		searchDebounce = setTimeout(async () => {
			if (!onlineState.profile) return;
			searching = true;
			searchResults = await searchProfiles(searchQuery, onlineState.profile.id);
			searching = false;
		}, 300);
	}

	function friendshipStatusFor(profileId: string): 'none' | 'sent' | 'received' | 'friends' {
		const f = friendships.find(
			(x) =>
				(x.requesterId === profileId || x.addresseeId === profileId) && x.status !== 'declined'
		);
		if (!f) return 'none';
		if (f.status === 'accepted') return 'friends';
		if (f.requesterId === onlineState.profile?.id) return 'sent';
		return 'received';
	}

	// ── Friend requests ────────────────────────────────────────
	async function handleSendRequest(toProfileId: string) {
		if (!onlineState.profile) return;
		processingIds = new Set([...processingIds, toProfileId]);
		const result = await sendFriendRequest(onlineState.profile.id, toProfileId);
		processingIds = new Set([...processingIds].filter((id) => id !== toProfileId));
		if (result.success) {
			pendingRequests = new Set([...pendingRequests, toProfileId]);
			await loadAll();
		}
	}

	async function handleAcceptFriend(friendship: Friendship) {
		if (!onlineState.profile) return;
		processingIds = new Set([...processingIds, friendship.id]);
		await acceptFriendRequest(friendship.id, friendship.requesterId, onlineState.profile.id);
		processingIds = new Set([...processingIds].filter((id) => id !== friendship.id));
		await loadAll();
	}

	async function handleDeclineFriend(friendship: Friendship) {
		processingIds = new Set([...processingIds, friendship.id]);
		await declineFriendRequest(friendship.id);
		processingIds = new Set([...processingIds].filter((id) => id !== friendship.id));
		await loadAll();
	}

	// ── Challenge flow ─────────────────────────────────────────
	function openChallenge(friendship: Friendship) {
		challengingFriendship = friendship;
		challengeTeamId = '';
		challengeWinScore = 30;
		challengeError = '';
	}

	function cancelChallenge() {
		challengingFriendship = null;
		challengeTeamId = '';
		challengeError = '';
	}

	async function handleSendChallenge() {
		if (!onlineState.profile || !challengingFriendship || !challengeTeamId) return;
		challengeError = '';
		challengeLoading = true;
		const result = await createChallenge(
			onlineState.profile.id,
			challengingFriendship.profile.id,
			selectedChallengeTeam,
			challengeWinScore
		);
		challengeLoading = false;
		if (!result.success) {
			challengeError = result.error ?? 'Failed to send challenge';
			return;
		}
		cancelChallenge();
		await loadAll();
	}

	// ── Accept / decline game invite ──────────────────────────
	function navigateToGame(gameId: string) {
		goto(`/online/game/${gameId}`);
	}

	async function openAcceptFlow(n: OnlineNotification) {
		if (!n.read) {
			await markNotificationRead(n.id);
			notifications = notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x));
			onlineState.refreshUnreadCount();
		}
		acceptingNotification = n;
		acceptTeamId = '';
		acceptError = '';
	}

	function cancelAccept() {
		acceptingNotification = null;
		acceptTeamId = '';
		acceptError = '';
	}

	async function handleAcceptChallenge() {
		if (!onlineState.profile || !acceptingNotification?.gameId || !acceptTeamId) return;
		acceptError = '';
		acceptLoading = true;
		const gameId = acceptingNotification.gameId;
		await acceptChallenge(
			gameId,
			selectedAcceptTeam,
			acceptingNotification.fromUserId,
			onlineState.profile.id
		);
		acceptLoading = false;
		cancelAccept();
		navigateToGame(gameId);
	}

	async function handleDeclineChallenge(n: OnlineNotification) {
		if (!n.gameId) return;
		processingIds = new Set([...processingIds, n.id]);
		await declineChallenge(n.gameId);
		if (!n.read) await markNotificationRead(n.id);
		processingIds = new Set([...processingIds].filter((id) => id !== n.id));
		await loadAll();
	}

	async function handleMarkAllRead() {
		if (!onlineState.profile) return;
		await markAllNotificationsRead(onlineState.profile.id);
		await loadAll();
	}

	async function handleDeleteNotification(id: string) {
		await deleteNotification(id);
		notifications = notifications.filter((n) => n.id !== id);
		onlineState.refreshUnreadCount();
	}

	async function handleClearAll() {
		if (!onlineState.profile) return;
		await deleteAllNotifications(onlineState.profile.id);
		notifications = [];
		onlineState.refreshUnreadCount();
	}

	function notificationLabel(n: OnlineNotification): string {
		switch (n.type) {
			case 'friend_request':
				return `@${n.fromUsername} sent you a friend request`;
			case 'friend_accepted':
				return `@${n.fromUsername} accepted your friend request`;
			case 'game_invite':
				return `@${n.fromUsername} challenged you to a game`;
			case 'your_turn':
				return `It's your turn vs @${n.fromUsername}`;
			case 'game_over': {
				const result = (n.data as Record<string, string> | null)?.result;
				if (result === 'forfeit_win') return `@${n.fromUsername} forfeited — you win!`;
				if (result === 'forfeit_loss') return `Game vs @${n.fromUsername} forfeited (timeout)`;
				return `Your game vs @${n.fromUsername} is over`;
			}
			default:
				return `Notification from @${n.fromUsername}`;
		}
	}

	function formatRelativeTime(isoString: string): string {
		const diff = Date.now() - new Date(isoString).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}
</script>

{#if onlineState.isOnline}
	<div class="online-page">
		<div class="page-header">
			<h2>Online Play</h2>
			<span class="online-tag">@{onlineState.profile?.username}</span>
		</div>

		<div class="tab-row">
			<button
				class="tab"
				class:tab-selected={activeTab === 'notifications'}
				onclick={() => (activeTab = 'notifications')}
			>
				Notifications
				{#if unreadNotifications.length > 0}
					<span class="tab-badge">{unreadNotifications.length}</span>
				{/if}
			</button>
			<button
				class="tab"
				class:tab-selected={activeTab === 'friends'}
				onclick={() => (activeTab = 'friends')}
			>
				Friends
				{#if pendingIncoming.length > 0}
					<span class="tab-badge">{pendingIncoming.length}</span>
				{/if}
			</button>
			<button
				class="tab"
				class:tab-selected={activeTab === 'find'}
				onclick={() => (activeTab = 'find')}
			>
				Find Players
			</button>
		</div>

		<!-- ── Notifications tab ────────────────────────────────── -->
		{#if activeTab === 'notifications'}
			{#if notifications.length === 0}
				<p class="empty">No notifications yet.</p>
			{:else}
				<div class="notif-toolbar">
					{#if unreadNotifications.length > 0}
						<button class="notif-action-btn" onclick={handleMarkAllRead}>Mark all read</button>
					{/if}
					<button class="notif-action-btn danger" onclick={handleClearAll}>Clear all</button>
				</div>

				<div class="notification-list">
					{#each notifications as n (n.id)}
						<!-- Game invite: expandable accept/decline flow -->
						{#if n.type === 'game_invite' && !processingIds.has(n.id)}
							{#if acceptingNotification?.id === n.id}
								<div class="notif-card expanded">
									<p class="accept-prompt">
										<strong>@{n.fromUsername}</strong> challenged you — pick your team:
									</p>
									{#if n.data?.homeTeamName}
										<p class="opponent-team">
											They're playing as <strong>{n.data.homeTeamName}</strong>
											· Win score: {n.data.winScore}
										</p>
									{/if}
									<select class="team-dropdown" bind:value={acceptTeamId}>
										<option value="">Choose your team…</option>
										{#each allTeams as t}
											{#if t.id !== (n.data?.homeTeamId ?? '')}
												<option value={t.id}>{t.city} {t.name}</option>
											{/if}
										{/each}
									</select>
									{#if acceptError}
										<p class="form-error">{acceptError}</p>
									{/if}
									<div class="accept-actions">
										<button
											class="game-button small"
											disabled={!acceptTeamId || acceptLoading}
											onclick={handleAcceptChallenge}
										>
											{acceptLoading ? 'Accepting…' : 'Accept'}
										</button>
										<button
											class="decline-btn"
											disabled={acceptLoading}
											onclick={() => handleDeclineChallenge(n)}
										>
											Decline
										</button>
										<button class="cancel-link" onclick={cancelAccept}>Cancel</button>
									</div>
								</div>
							{:else}
								<div class="notif-row-wrap">
									<button
										class="notification-row"
										class:unread={!n.read}
										onclick={() => openAcceptFlow(n)}
									>
										<span class="notif-dot" class:visible={!n.read}></span>
										<div class="notif-body">
											<span class="notif-text">{notificationLabel(n)}</span>
											<span class="notif-time">{formatRelativeTime(n.createdAt)}</span>
										</div>
										<span class="notif-action-hint">Tap to respond</span>
									</button>
									<button class="notif-delete" onclick={() => handleDeleteNotification(n.id)} aria-label="Delete notification">×</button>
								</div>
							{/if}
						{:else}
							<!-- All other notification types: simple read-on-click row -->
							<div class="notif-row-wrap">
								<button
									class="notification-row"
									class:unread={!n.read}
									onclick={async () => {
										if (!n.read) {
											await markNotificationRead(n.id);
											notifications = notifications.map((x) =>
												x.id === n.id ? { ...x, read: true } : x
											);
											onlineState.refreshUnreadCount();
										}
										if ((n.type === 'your_turn' || n.type === 'game_over') && n.gameId) {
											navigateToGame(n.gameId);
										}
									}}
								>
									<span class="notif-dot" class:visible={!n.read}></span>
									<div class="notif-body">
										<span class="notif-text">{notificationLabel(n)}</span>
										<span class="notif-time">{formatRelativeTime(n.createdAt)}</span>
									</div>
									{#if (n.type === 'your_turn' || n.type === 'game_over') && n.gameId}
										<span class="notif-action-hint">View game</span>
									{/if}
								</button>
								<button class="notif-delete" onclick={() => handleDeleteNotification(n.id)} aria-label="Delete notification">×</button>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		{/if}

		<!-- ── Friends tab ──────────────────────────────────────── -->
		{#if activeTab === 'friends'}
			{#if pendingIncoming.length > 0}
				<div class="section">
					<h3 class="section-label">Requests</h3>
					<div class="friend-list">
						{#each pendingIncoming as f (f.id)}
							<div class="friend-row">
								<span class="friend-name">@{f.profile.username}</span>
								<div class="friend-actions">
									<button
										class="game-button small"
										disabled={processingIds.has(f.id)}
										onclick={() => handleAcceptFriend(f)}
									>
										Accept
									</button>
									<button
										class="decline-btn"
										disabled={processingIds.has(f.id)}
										onclick={() => handleDeclineFriend(f)}
									>
										Decline
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if friends.length > 0}
				<div class="section">
					<h3 class="section-label">Friends ({friends.length})</h3>
					<div class="friend-list">
						{#each friends as f (f.id)}
							{#if challengingFriendship?.id === f.id}
								<!-- Inline challenge form -->
								<div class="challenge-form">
									<p class="challenge-title">Challenge @{f.profile.username}</p>
									<div class="challenge-fields">
										<div class="field-group">
											<label class="field-label" for="challenge-team">Your team</label>
											<select id="challenge-team" class="team-dropdown" bind:value={challengeTeamId}>
												<option value="">Choose a team…</option>
												{#each allTeams as t}
													<option value={t.id}>{t.city} {t.name}</option>
												{/each}
											</select>
										</div>
										<div class="field-group">
											<label class="field-label" for="challenge-score">Win score</label>
											<select
												id="challenge-score"
												class="score-dropdown"
												bind:value={challengeWinScore}
											>
												{#each Array(99) as _, i}
													<option value={i + 1}>{i + 1}</option>
												{/each}
											</select>
										</div>
									</div>
									{#if challengeError}
										<p class="form-error">{challengeError}</p>
									{/if}
									<div class="challenge-actions">
										<button
											class="game-button small"
											disabled={!challengeTeamId || challengeLoading}
											onclick={handleSendChallenge}
										>
											{challengeLoading ? 'Sending…' : 'Send Challenge'}
										</button>
										<button class="cancel-link" onclick={cancelChallenge}>Cancel</button>
									</div>
								</div>
							{:else}
								<div class="friend-row">
									<span class="friend-name">@{f.profile.username}</span>
									<button class="game-button small" onclick={() => openChallenge(f)}>
										Challenge
									</button>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{:else if pendingIncoming.length === 0}
				<p class="empty">No friends yet. Search for players to add them.</p>
			{/if}

			{#if pendingSent.length > 0}
				<div class="section">
					<h3 class="section-label">Sent Requests</h3>
					<div class="friend-list">
						{#each pendingSent as f (f.id)}
							<div class="friend-row">
								<span class="friend-name">@{f.profile.username}</span>
								<span class="status-label">Pending</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		<!-- ── Find Players tab ─────────────────────────────────── -->
		{#if activeTab === 'find'}
			<div class="search-wrapper">
				<input
					type="search"
					class="search-input"
					placeholder="Search by username…"
					bind:value={searchQuery}
					oninput={onSearchInput}
					autocomplete="off"
				/>
			</div>

			{#if searching}
				<p class="empty">Searching…</p>
			{:else if searchQuery.trim() && searchResults.length === 0}
				<p class="empty">No players found.</p>
			{:else if searchResults.length > 0}
				<div class="friend-list">
					{#each searchResults as profile (profile.id)}
						{@const status = friendshipStatusFor(profile.id)}
						<div class="friend-row">
							<span class="friend-name">@{profile.username}</span>
							{#if status === 'friends'}
								<span class="status-label friends-label">Friends</span>
							{:else if status === 'sent'}
								<span class="status-label">Request sent</span>
							{:else if status === 'received'}
								<span class="status-label">Wants to be friends</span>
							{:else}
								<button
									class="game-button small"
									disabled={processingIds.has(profile.id)}
									onclick={() => handleSendRequest(profile.id)}
								>
									{processingIds.has(profile.id) ? '…' : 'Add Friend'}
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.online-page {
		max-width: 30rem;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
	.page-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	h2 {
		margin: 0;
	}
	h3 {
		margin: 0;
	}
	.online-tag {
		font-size: var(--text-sm);
		color: var(--color-text-brand);
		font-weight: var(--weight-semibold);
	}
	.tab-row {
		display: flex;
		width: 100%;
		margin-bottom: 1.5rem;
	}
	.tab {
		flex: 1;
		padding: 0.625rem;
		text-align: center;
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		background-color: var(--color-bg-surface);
		border-bottom: 2px solid var(--color-border-default);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
	}
	.tab:hover {
		color: var(--color-text-primary);
	}
	.tab-selected,
	.tab-selected:hover {
		color: var(--color-text-primary);
		font-weight: 600;
		border-bottom-color: var(--color-border-brand);
	}
	.tab-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.1rem;
		height: 1.1rem;
		padding: 0 0.25rem;
		background: var(--btn-danger-bg);
		color: var(--color-on-accent);
		font-size: 0.65rem;
		font-weight: var(--weight-bold);
		border-radius: 9999px;
	}
	.empty {
		color: var(--color-text-secondary);
		text-align: center;
		padding: 2rem 0;
		font-size: var(--text-sm);
	}
	/* Notifications */
	.notif-toolbar {
		display: flex;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}
	.notif-action-btn {
		font-size: var(--text-sm);
		color: var(--color-text-brand);
	}
	.notif-action-btn:hover {
		color: var(--color-text-secondary);
	}
	.notif-action-btn.danger {
		color: var(--color-text-secondary);
	}
	.notif-action-btn.danger:hover {
		color: var(--color-text-danger);
	}
	.notif-row-wrap {
		display: flex;
		align-items: stretch;
		gap: 0.25rem;
	}
	.notif-row-wrap .notification-row {
		flex: 1;
	}
	.notif-delete {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		color: var(--color-text-secondary);
		font-size: 1.1rem;
		border-radius: var(--radius-sm);
		transition: color var(--dur-fast) var(--ease-snes), background-color var(--dur-fast) var(--ease-snes);
	}
	.notif-delete:hover {
		color: var(--color-text-danger);
		background: var(--color-bg-surface);
	}
	.notification-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.notification-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-sm);
		text-align: left;
		width: 100%;
		cursor: pointer;
		transition: background-color var(--dur-fast) var(--ease-snes);
	}
	.notification-row:hover {
		background: var(--color-bg-elevated);
	}
	.notification-row.unread {
		border-color: var(--color-border-default);
	}
	.notif-dot {
		flex-shrink: 0;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: transparent;
	}
	.notif-dot.visible {
		background: var(--btn-primary-bg-hover);
	}
	.notif-body {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
	}
	.notif-text {
		font-size: var(--text-sm);
		color: var(--color-text-primary);
	}
	.notif-time {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}
	.notif-action-hint {
		font-size: var(--text-xs);
		color: var(--color-border-focus);
		white-space: nowrap;
	}
	/* Game invite accept card */
	.notif-card {
		padding: 0.75rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
	}
	.accept-prompt {
		font-size: var(--text-sm);
		color: var(--color-text-primary);
		margin-bottom: 0.5rem;
	}
	.opponent-team {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		margin-bottom: 0.75rem;
	}
	.accept-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}
	/* Friends */
	.section {
		margin-bottom: 1.5rem;
	}
	.section-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		margin-bottom: 0.5rem;
	}
	.friend-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.friend-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.75rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-sm);
	}
	.friend-name {
		font-size: var(--text-sm);
		color: var(--color-text-primary);
		font-weight: var(--weight-medium);
	}
	.friend-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.status-label {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}
	.friends-label {
		color: var(--color-text-brand);
	}
	.decline-btn {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}
	.decline-btn:hover {
		color: var(--color-text-danger);
	}
	/* Challenge form */
	.challenge-form {
		padding: 0.75rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
	}
	.challenge-title {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: 0.75rem;
	}
	.challenge-fields {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.field-group:first-child {
		flex: 1;
	}
	.field-label {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}
	.team-dropdown,
	.score-dropdown {
		padding: 0.4rem 0.6rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
		color: var(--color-text-primary);
		font-size: var(--text-sm);
	}
	.team-dropdown {
		width: 100%;
	}
	.score-dropdown {
		width: 5rem;
	}
	.team-dropdown:focus,
	.score-dropdown:focus {
		outline: none;
		border-color: var(--color-border-focus);
	}
	.challenge-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.form-error {
		font-size: var(--text-xs);
		color: var(--color-text-danger);
		margin-bottom: 0.5rem;
	}
	.cancel-link {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}
	.cancel-link:hover {
		color: var(--color-text-primary);
	}
	/* Search */
	.search-wrapper {
		margin-bottom: 1rem;
	}
	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
		color: var(--color-text-primary);
		font-size: var(--text-base);
	}
	.search-input:focus {
		outline: none;
		border-color: var(--color-border-focus);
		box-shadow: var(--focus-ring);
	}
	:global(.game-button.small) {
		padding: 0.3em 0.75em;
		font-size: var(--text-sm);
	}
</style>
