import { GAME_ACTION, TEAM } from '$lib/constants/constants';
import type { GameStateSnapshot } from '$lib/db/database';
import { supabase } from './supabaseClient';

// Actions that require the active player to roll dice
const ROLL_ACTIONS = new Set([
	GAME_ACTION.OFFENSE,
	GAME_ACTION.KICKOFF,
	GAME_ACTION.PUNT,
	GAME_ACTION.FIELD_GOAL,
	GAME_ACTION.EXTRA_POINT,
	GAME_ACTION.TWO_POINT
]);

// Actions that require the active player to make a modal choice
const MODAL_ACTIONS = new Set([GAME_ACTION.FOURTH_DOWN_OPTIONS, GAME_ACTION.POINT_OPTION]);

/**
 * Returns true when the game is paused waiting for active player input.
 * Intermediate auto-resolving states (KICKOFF_KICK, TOUCHDOWN, etc.) return false.
 */
export function isActionableState(action: string): boolean {
	return ROLL_ACTIONS.has(action) || MODAL_ACTIONS.has(action);
}

/**
 * Derive whose turn it is from the current game snapshot.
 *
 * Most actions: the possessing team acts (rolls or decides).
 *
 * Some intermediate actions trigger animation chains that flip possession
 * (e.g. PLACE_KICKOFF → prepareKickoff). For those, we return the
 * OPPOSITE team so current_turn matches the post-chain state.
 */
const POSSESSION_FLIPS_IN_CHAIN = new Set([
	GAME_ACTION.PLACE_KICKOFF,
	GAME_ACTION.FIELD_GOAL_MADE,
	GAME_ACTION.FIELD_GOAL_MISS,
	GAME_ACTION.KICKOFF_ONSIDE
]);

export function deriveTurn(snapshot: GameStateSnapshot): 'home' | 'away' {
	const { action, possession } = snapshot;
	if (POSSESSION_FLIPS_IN_CHAIN.has(action)) {
		return possession === TEAM.HOME ? 'away' : 'home';
	}
	return possession === TEAM.HOME ? 'home' : 'away';
}

export async function pushGameState(
	gameId: string,
	snapshot: GameStateSnapshot,
	currentTurn: 'home' | 'away'
): Promise<boolean> {
	const { error } = await supabase
		.from('remote_games')
		.update({
			game_state: snapshot,
			current_turn: currentTurn,
			updated_at: new Date().toISOString()
		})
		.eq('id', gameId);

	if (error) {
		console.error('[remote] pushGameState failed:', error.message);
		return false;
	}
	return true;
}

/**
 * Marks the game completed. Returns true if this device was the one that
 * completed it (prevents duplicate game_over notifications).
 */
export async function markRemoteGameComplete(
	gameId: string,
	snapshot: GameStateSnapshot
): Promise<boolean> {
	const { data } = await supabase
		.from('remote_games')
		.update({
			game_state: snapshot,
			status: 'completed',
			updated_at: new Date().toISOString()
		})
		.eq('id', gameId)
		.eq('status', 'in_progress')
		.select('id');

	return Array.isArray(data) && data.length > 0;
}

export async function notifyYourTurn(
	gameId: string,
	toUserId: string,
	fromUserId: string
): Promise<void> {
	await supabase.from('notifications').insert({
		user_id: toUserId,
		from_user_id: fromUserId,
		type: 'your_turn',
		game_id: gameId
	});
}

export async function notifyGameOver(
	gameId: string,
	homeUserId: string,
	awayUserId: string
): Promise<void> {
	await supabase.from('notifications').insert([
		{ user_id: homeUserId, from_user_id: awayUserId, type: 'game_over', game_id: gameId },
		{ user_id: awayUserId, from_user_id: homeUserId, type: 'game_over', game_id: gameId }
	]);
}

export function subscribeToGame(
	gameId: string,
	onUpdate: (snapshot: GameStateSnapshot, currentTurn: 'home' | 'away', updatedAt: string) => void
) {
	return supabase
		.channel(`remote_game:${gameId}`)
		.on(
			'postgres_changes',
			{ event: 'UPDATE', schema: 'public', table: 'remote_games', filter: `id=eq.${gameId}` },
			(payload) => {
				const row = payload.new as Record<string, unknown>;
				if (row.game_state) {
					onUpdate(
						row.game_state as GameStateSnapshot,
						row.current_turn as 'home' | 'away',
						row.updated_at as string
					);
				}
			}
		)
		.subscribe();
}
