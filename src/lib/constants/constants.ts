// Barrel re-export: shared + football constants
// During migration, all existing imports continue to work unchanged.
// Once imports are updated to use $lib/shared/ and $lib/football/ directly,
// this file can be removed.

export {
	BALL_ENDZONE,
	BALL_EXTRA_POINT,
	BALL_FIELD_GOAL,
	BALL_KICK_GOOD,
	BALL_KICKOFF,
	BALL_ONSIDE_KICK,
	BALL_PUNT,
	BALL_SAFETY,
	BALL_TOUCHBACK,
	BALL_TWO_POINT,
	CONVERSION,
	DEFAULT_GAME,
	DEFAULT_PLAY,
	DEFAULT_PLAY_SUMMARY,
	DEFAULT_SETTINGS,
	DOWN,
	EXTRA_POINT_SUCCESS,
	FIELD_GOAL_ROLL,
	FIELD_GOAL_YARDS,
	FOURTH_DOWN,
	GAME_ACTION,
	INTERCEPTION_ROLLS,
	KICKOFF_RETURN_ACTION,
	KICKOFF_RETURN_YARDS,
	POINTS,
	TURNOVER_ONSIDE_KICK,
	YARD_INTERVAL
} from '$lib/football/constants';
export {
	DEFAULT_TEAM,
	DICE_COLORS,
	GAME_MODE,
	NOOP,
	OPPOSITE_TEAM,
	POSITION,
	TEAM
} from '$lib/shared/constants';
