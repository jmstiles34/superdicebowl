// Barrel re-export: football remote games
// During migration, all existing imports continue to work unchanged.
// Once imports are updated to use $lib/football/online/remoteGames directly,
// this file can be removed.

export type { RemoteGame } from '$lib/football/online/remoteGames';
export {
	acceptChallenge,
	checkAndApplyForfeit,
	createChallenge,
	declineChallenge,
	getRemoteGame,
	getRemoteGames
} from '$lib/football/online/remoteGames';
