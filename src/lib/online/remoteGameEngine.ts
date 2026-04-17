// Barrel re-export: football remote game engine
// During migration, all existing imports continue to work unchanged.
// Once imports are updated to use $lib/football/online/remoteGameEngine directly,
// this file can be removed.

export {
	deriveTurn,
	isActionableState,
	markRemoteGameComplete,
	notifyGameOver,
	notifyYourTurn,
	pushGameState,
	subscribeToGame
} from '$lib/football/online/remoteGameEngine';
