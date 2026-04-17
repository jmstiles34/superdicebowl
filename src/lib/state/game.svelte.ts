// Barrel re-export: football game state
// During migration, all existing imports continue to work unchanged.
// Once imports are updated to use $lib/football/state/game.svelte directly,
// this file can be removed.

export { type Game, game } from '$lib/football/state/game.svelte';
