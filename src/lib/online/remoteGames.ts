import { DEFAULT_GAME, OPPOSITE_TEAM } from '$lib/constants/constants';
import type { GameStateSnapshot } from '$lib/db/database';
import type { Team } from '$lib/types';
import type { Profile } from './friends';
import { supabase } from './supabaseClient';

export interface RemoteGame {
	id: string;
	homeUserId: string;
	awayUserId: string;
	homeTeam: Team;
	awayTeam: Team | null;
	status: 'pending_team_select' | 'in_progress' | 'completed' | 'declined';
	currentTurn: 'home' | 'away';
	gameState: GameStateSnapshot | null;
	winScore: number;
	homeProfile: Profile;
	awayProfile: Profile;
	createdAt: string;
	updatedAt: string;
}

export async function createChallenge(
	homeUserId: string,
	awayUserId: string,
	homeTeam: Team,
	winScore: number
): Promise<{ success: boolean; gameId?: string; error?: string }> {
	const { data, error } = await supabase
		.from('remote_games')
		.insert({
			home_user_id: homeUserId,
			away_user_id: awayUserId,
			home_team: homeTeam,
			win_score: winScore,
			status: 'pending_team_select'
		})
		.select('id')
		.single();

	if (error || !data) {
		return { success: false, error: 'Failed to create challenge' };
	}

	await supabase.from('notifications').insert({
		user_id: awayUserId,
		from_user_id: homeUserId,
		type: 'game_invite',
		game_id: data.id,
		data: { homeTeamName: `${homeTeam.city} ${homeTeam.name}`, winScore }
	});

	return { success: true, gameId: data.id };
}

export async function acceptChallenge(
	gameId: string,
	awayTeam: Team,
	homeUserId: string,
	awayUserId: string
): Promise<void> {
	const possession = Math.random() < 0.5 ? 'Home' : 'Away';
	const currentTurn: 'home' | 'away' = possession === 'Home' ? 'away' : 'home';

	const gameState: GameStateSnapshot = {
		...DEFAULT_GAME,
		action: 'Place Kickoff',
		possession
	};

	await supabase
		.from('remote_games')
		.update({
			away_team: awayTeam,
			status: 'in_progress',
			current_turn: currentTurn,
			game_state: gameState,
			updated_at: new Date().toISOString()
		})
		.eq('id', gameId);

	// Notify whoever kicks first that it's their turn
	const notifyUserId = currentTurn === 'home' ? homeUserId : awayUserId;
	await supabase.from('notifications').insert({
		user_id: notifyUserId,
		from_user_id: awayUserId,
		type: 'your_turn',
		game_id: gameId
	});
}

export async function declineChallenge(gameId: string): Promise<void> {
	await supabase
		.from('remote_games')
		.update({ status: 'declined', updated_at: new Date().toISOString() })
		.eq('id', gameId);
}

export async function getRemoteGame(gameId: string): Promise<RemoteGame | null> {
	const { data } = await supabase
		.from('remote_games')
		.select(
			`id, home_user_id, away_user_id, home_team, away_team,
			 status, current_turn, game_state, win_score, created_at, updated_at,
			 home_profile:home_user_id(id, username),
			 away_profile:away_user_id(id, username)`
		)
		.eq('id', gameId)
		.single();

	if (!data) return null;
	return mapRemoteGame(data);
}

export async function getRemoteGames(userId: string): Promise<RemoteGame[]> {
	const { data } = await supabase
		.from('remote_games')
		.select(
			`id, home_user_id, away_user_id, home_team, away_team,
			 status, current_turn, game_state, win_score, created_at, updated_at,
			 home_profile:home_user_id(id, username),
			 away_profile:away_user_id(id, username)`
		)
		.or(`home_user_id.eq.${userId},away_user_id.eq.${userId}`)
		.neq('status', 'declined')
		.order('updated_at', { ascending: false });

	if (!data) return [];
	return data.map(mapRemoteGame);
}

// Lazy forfeit: called when loading a game. If the current player hasn't moved in 7 days,
// the game is forfeited. Returns the updated game (status = 'completed') if forfeited.
export async function checkAndApplyForfeit(game: RemoteGame): Promise<RemoteGame> {
	if (game.status !== 'in_progress') return game;

	const daysSinceUpdate = (Date.now() - new Date(game.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
	if (daysSinceUpdate < 7) return game;

	const forfeitUserId = game.currentTurn === 'home' ? game.homeUserId : game.awayUserId;
	const winnerUserId = game.currentTurn === 'home' ? game.awayUserId : game.homeUserId;

	await supabase
		.from('remote_games')
		.update({ status: 'completed', updated_at: new Date().toISOString() })
		.eq('id', game.id);

	await supabase.from('notifications').insert([
		{
			user_id: forfeitUserId,
			from_user_id: winnerUserId,
			type: 'game_over',
			game_id: game.id,
			data: { result: 'forfeit_loss' }
		},
		{
			user_id: winnerUserId,
			from_user_id: forfeitUserId,
			type: 'game_over',
			game_id: game.id,
			data: { result: 'forfeit_win' }
		}
	]);

	return { ...game, status: 'completed' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRemoteGame(d: any): RemoteGame {
	return {
		id: d.id,
		homeUserId: d.home_user_id,
		awayUserId: d.away_user_id,
		homeTeam: d.home_team as Team,
		awayTeam: d.away_team as Team | null,
		status: d.status,
		currentTurn: d.current_turn,
		gameState: d.game_state as GameStateSnapshot | null,
		winScore: d.win_score,
		homeProfile: d.home_profile as Profile,
		awayProfile: d.away_profile as Profile,
		createdAt: d.created_at,
		updatedAt: d.updated_at
	};
}
