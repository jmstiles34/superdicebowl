import { writable } from "svelte/store";
import { EMPTY_TEAM, GAME_ACTION, GAME_MODE, MODAL_CONTENT, TEAM } from '../lib/constants/constants';

const GameStore = writable({
    action: GAME_ACTION.KICKOFF,
    awayScore: 0,
    awayTeam: EMPTY_TEAM,
    ballIndex: 0,
    currentDown: 1,
    downAndDistance: "1st & 10",
    diceRollData: [],
    firstDownIndex: -1,
    homeScore: 0,
    homeTeam: EMPTY_TEAM,
    lastPlay: "",
    modalContent: MODAL_CONTENT.COIN_TOSS,
    mode: GAME_MODE.HEAD_TO_HEAD,
    possession: TEAM.HOME,
    restrictDice: false,
    showModal: false
});

export default GameStore;