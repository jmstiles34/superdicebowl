export const TEAM = {
  AWAY: "Away",
  HOME: "Home",
}

export const OPPOSITE_TEAM = {
  [TEAM.AWAY]: "Home",
  [TEAM.HOME]: "Away",
}

export const BALL_TWO_POINT = {
  [TEAM.HOME]: 19.5,
  [TEAM.AWAY]: .5
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

export const BALL_TOUCHDOWN = {
  [TEAM.HOME]: 21,
  [TEAM.AWAY]: -1
}

export const CONVERSION = {
  EXTRA_POINT_ATTEMPT: "Extra Point Attempt (4+)",
  TWO_POINT_ATTEMPT: "Two-point Attempt (8+)"
}

export const GAME_ACTION = {
  EXTRA_POINT: "Extra Point",
  FIELD_GOAL: "Field Goal",
  FIELD_GOAL_MISS: "Field Goal Missed",
  FIELD_GOAL_MADE: "Field Goal Made",
  GAME_OVER: "Game Over",
  KICKOFF: "Receive Kickoff",
  OFFENSE: "Offense",
  PLACE_EXTRA_POINT: "Prepare Extra Point",
  PLACE_KICKOFF: "Prepare Kickoff",
  PLACE_TWO_POINT: "Prepare Two Point",
  PUNT: "Punt",
  TOUCHDOWN: "Touchdown",
  TWO_POINT: "Two Point Attempt",
}

export const MODAL_CONTENT = {
  COIN_TOSS: "Coin Toss",
  FOURTH_DOWN: "Fourth Down",
  POINT_OPTION: "Point Option",
};

export const DEFAULT_GAME = {
    action: GAME_ACTION.KICKOFF,
    awayScore: 0,
    ballIndex: 10,
    currentDown: 1,
    diceRollData: [],
    firstDownIndex: -1,
    homeScore: 0,
    lastPlay: "",
    missedKick: false,
    modalContent: MODAL_CONTENT.COIN_TOSS,
    possession: TEAM.HOME,
    restrictDice: false,
    showModal: false,
    yardsToGo: 10,
}

export const DICE_COLORS = ["blue", "red", "orange", "purple", "green"];

export const DISPLAY = {
  SETTINGS: "settings",
  PLAYING: "playing",
}

export const DOWN: {[key: number]: string} = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
}

export const EMPTY_TEAM = {
  id: 0,
  city: "",
  cityKey: "",
  name: "",
  primaryColor: "",
  secondaryColor: "",
}

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

export const NEXT_ACTION = {
  [GAME_ACTION.EXTRA_POINT]: GAME_ACTION.PLACE_KICKOFF,
  [GAME_ACTION.FIELD_GOAL_MISS]: GAME_ACTION.OFFENSE,
  [GAME_ACTION.FIELD_GOAL_MADE]: GAME_ACTION.KICKOFF,
  [GAME_ACTION.KICKOFF]: GAME_ACTION.OFFENSE,
  [GAME_ACTION.PLACE_EXTRA_POINT]: GAME_ACTION.EXTRA_POINT,
  [GAME_ACTION.PLACE_KICKOFF]: GAME_ACTION.KICKOFF,
  [GAME_ACTION.PLACE_TWO_POINT]: GAME_ACTION.TWO_POINT,
  [GAME_ACTION.PUNT]: GAME_ACTION.OFFENSE,
  [GAME_ACTION.TWO_POINT]: GAME_ACTION.PLACE_KICKOFF,
}

export const NOOP = () => {
  // do nothing
}

export const POINTS = {
  TWO_POINT: 2,
  EXTRA_POINT: 1,
  FIELD_GOAL: 3,
  TOUCHDOWN: 6,
}

export const POSITION = {
  LEFT: "Left",
  RIGHT: "Right",
  TOP: "Top",
  BOTTOM: "Bottom",
}

export const INTERCEPTION_YARDS = [20, 25, 30, 35, 40];

export const TRICK_PLAY_YARDS = [30, 35, 40, 45, 50, 55, 60, 65, 70];

export const YARD_INTERVAL = 5;

export const DEFAULT_SETTINGS = {
  homeTeam: EMPTY_TEAM,
  awayTeam: EMPTY_TEAM,
  mode: GAME_MODE.SOLO,
  winScore: 50,
}