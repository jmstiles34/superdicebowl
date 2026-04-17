// Barrel re-export: shared + football types
// During migration, all existing imports continue to work unchanged.
// Once imports are updated to use $lib/shared/ and $lib/football/ directly,
// this file can be removed.

export type { DiceRoll, Play, PlaySummary } from '$lib/football/types';
export type { Logo, Modal, SaveTeam, SportEngine, SportType, Team, Void } from '$lib/shared/types';
