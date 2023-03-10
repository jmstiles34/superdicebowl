export const TEAM = {
  AWAY: "Away",
  HOME: "Home",
}

export const OPPOSITE_TEAM = {
  [TEAM.AWAY]: "Home",
  [TEAM.HOME]: "Away",
}

export const BALL_ENDZONE = {
  [TEAM.HOME]: 21,
  [TEAM.AWAY]: -1
}

export const BALL_EXTRA_POINT = {
  [TEAM.HOME]: 17,
  [TEAM.AWAY]: 3
}

export const BALL_FIELD_GOAL = {
  [TEAM.HOME]: 11,
  [TEAM.AWAY]: 9
}

export const BALL_KICK_GOOD = {
  [TEAM.HOME]: 22,
  [TEAM.AWAY]: -2
}

export const BALL_KICKOFF = {
  [TEAM.HOME]: 13,
  [TEAM.AWAY]: 7
}

export const BALL_ONSIDE_KICK = {
  [TEAM.HOME]: 11,
  [TEAM.AWAY]: 9
}

export const BALL_PUNT = {
  [TEAM.HOME]: 4,
  [TEAM.AWAY]: 16
}

export const BALL_SAFETY = {
  [TEAM.HOME]: -1,
  [TEAM.AWAY]: 21
}

export const BALL_TOUCHBACK = {
  [TEAM.HOME]: 5,
  [TEAM.AWAY]: 15
}

export const BALL_TWO_POINT = {
  [TEAM.HOME]: 19.5,
  [TEAM.AWAY]: .5
}

export const CONVERSION = {
  EXTRA_POINT_ATTEMPT: "Extra Point Attempt (4+)",
  TWO_POINT_ATTEMPT: "Two-point Attempt (8+)"
}

export const GAME_ACTION = {
  COIN_TOSS: "Coin Toss",
  EXTRA_POINT: "Extra Point",
  EXTRA_POINT_MADE: "Extra Point Made",
  EXTRA_POINT_MISS: "Extra Point Missed",
  FIELD_GOAL: "Field Goal",
  FIELD_GOAL_MADE: "Field Goal Made",
  FIELD_GOAL_MISS: "Field Goal Missed",
  FOURTH_DOWN: "Fourth Down",
  FOURTH_DOWN_OPTIONS: "Fourth Down Opts",
  FUMBLE: "Fumble",
  GAME_OVER: "Game Over",
  INTERCEPTION: "Interception",
  KICKOFF: "Receive Kickoff",
  KICKOFF_ONSIDE: "Kickoff - Onside",
  KICKOFF_RETURN: "Kickoff - Return",
  KICKOFF_TOUCHDOWN: "Kickoff - Touchdown",
  OFFENSE: "Offense",
  PLACE_EXTRA_POINT: "Place Extra Point",
  PLACE_KICKOFF: "Place Kickoff",
  PLACE_TWO_POINT: "Place Two Point",
  POINT_OPTION: "Point(s) Option",
  PUNT: "Punt",
  TOUCHBACK: "Touchback",
  TOUCHDOWN: "Touchdown",
  TURNOVER: "Turnover",
  TWO_POINT: "Two Point Attempt",
  TWO_POINT_MADE: "Two Point Success",
  TWO_POINT_MISS: "Two Point Fail",
}

export const DEFAULT_GAME = {
    action: GAME_ACTION.COIN_TOSS,
    ballIndex: 10,
    currentDown: 1,
    diceId: null,
    firstDownIndex: -1,
    lastPlay: "",
    missedKick: false,
    modalContent: null,
    onsideKick: false,
    possession: TEAM.HOME,
    restrictDice: false,
    score: [0,0],
    yardsToGo: 10,
  }
  
export const DEFAULT_TEAM = {
  id: "",
  city: "",
  cityKey: "",
  name: "",
  logoFlip: false,
  logoWidth: 2.5,
  logoPosition: [13, 20],
  colors: {
    primary: "",
    secondary: "",
  }
}

export const DICE_COLORS = ["blue", "red", "orange", "purple", "green"];

export const DOWN: {[key: number]: string} = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
}

export const EXTRA_POINT_SUCCESS = 4;

export const FIELD_GOAL_ROLL: {[key: number]: number} = {
  5: 4,
  10: 4,
  15: 4,
  20: 5,
  25: 6,
  30: 7,
  35: 8,
  40: 8,
  45: 9,
}

export const FIELD_GOAL_YARDS = 17

export const FOURTH_DOWN = {
  FIELD_GOAL: "Field Goal",
  GO_FOR_IT: "Go For It!",
  PUNT: "Punt"
}

export const GAME_MODE = {
  SOLO: "Solo",
  HEAD_TO_HEAD: "Head-to-Head",
}

export const DEFAULT_SETTINGS = {
  homeTeam: DEFAULT_TEAM,
  awayTeam: DEFAULT_TEAM,
  mode: GAME_MODE.SOLO,
  winScore: 50,
}

export const INTERCEPTION_ROLLS = [12,45];

export const KICKOFF_RETURN_ACTION = {
  11: GAME_ACTION.KICKOFF_ONSIDE,
  66: GAME_ACTION.KICKOFF_TOUCHDOWN
}

export const KICKOFF_RETURN_YARDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];

export const NOOP = () => {
  // do nothing
}

export const POINTS_EXTRA_POINT = {
  [TEAM.AWAY]: [0,1],
  [TEAM.HOME]: [1,0],
}

export const POINTS_FIELD_GOAL = {
  [TEAM.AWAY]: [0,3],
  [TEAM.HOME]: [3,0],
}

export const POINTS_TOUCHDOWN = {
  [TEAM.AWAY]: [0,6],
  [TEAM.HOME]: [6,0],
}

export const POINTS_TWO_POINT = {
  [TEAM.AWAY]: [0,2],
  [TEAM.HOME]: [2,0],
}

export const POSITION = {
  LEFT: "Left",
  RIGHT: "Right",
  TOP: "Top",
  BOTTOM: "Bottom",
}

export const TURNOVER_ONSIDE_KICK = "TURNOVER - Onside Kick";

export const YARD_INTERVAL = 5;