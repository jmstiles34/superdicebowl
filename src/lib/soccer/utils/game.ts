import { OPPOSITE_TEAM, TEAM } from '$lib/shared/constants';
import {
	ATTACK_DIR,
	BALL_MOVE_GOAL,
	BALL_MOVE_ONE,
	BALL_MOVE_TWO,
	DICE_PER_TEAM,
	DIE_FACES,
	FIELD_PLAY_MIN_X,
	FIELD_SECTION_WIDTH,
	FIELD_VIEWBOX_MIN_X,
	FIELD_VIEWBOX_WIDTH,
	HOME_HALF_MAX,
	LAST_SECTION,
	MIDLINE_ENTRY,
	MIN_DICE,
	PLAY_PRIORITY,
	SOCCER_SYMBOL
} from '$lib/soccer/constants';
import type { RollWinner, SoccerRoll, SoccerSymbol, TeamPlay } from '$lib/soccer/types';
import { randomNumber } from '$lib/utils/common';

// ── Rolling ──────────────────────────────────────────────────

export function rollDie(): SoccerSymbol {
	return DIE_FACES[randomNumber(DIE_FACES.length)] as SoccerSymbol;
}

export function rollDice(count: number): SoccerRoll {
	return Array.from({ length: Math.max(MIN_DICE, count) }, rollDie);
}

// Number of dice a team rolls given its red-card reduction.
export function effectiveDiceCount(reduction: number): number {
	return Math.max(MIN_DICE, DICE_PER_TEAM - reduction);
}

// ── Resolving a team's play ──────────────────────────────────

export function countSymbols(roll: SoccerRoll): Record<SoccerSymbol, number> {
	const counts: Record<SoccerSymbol, number> = {
		ball: 0,
		kick: 0,
		penalty: 0,
		redCard: 0
	};
	for (const face of roll) counts[face]++;
	return counts;
}

// The most-frequent symbol; intra-team ties broken by PLAY_PRIORITY.
export function bestPlay(roll: SoccerRoll): TeamPlay {
	const counts = countSymbols(roll);
	let best: SoccerSymbol = PLAY_PRIORITY[PLAY_PRIORITY.length - 1] as SoccerSymbol;
	let bestCount = -1;
	for (const symbol of PLAY_PRIORITY as SoccerSymbol[]) {
		if (counts[symbol] > bestCount) {
			best = symbol;
			bestCount = counts[symbol];
		}
	}
	return { symbol: best, count: bestCount };
}

// Compare the two teams' plays by matching-dice count. Ties are unresolved
// here — the engine breaks them with the power chip.
export function compareCounts(offense: TeamPlay, defense: TeamPlay): RollWinner {
	if (offense.count > defense.count) return 'offense';
	if (defense.count > offense.count) return 'defense';
	return 'tie';
}

// ── Field / roles ────────────────────────────────────────────

// The defending team is the one whose half currently holds the ball.
export function defenseTeam(section: number): string {
	return section <= HOME_HALF_MAX ? TEAM.HOME : TEAM.AWAY;
}

// The attacking (offense) team is the defender's opponent.
export function offenseTeam(section: number): string {
	return OPPOSITE_TEAM[defenseTeam(section)];
}

export function reachedGoal(section: number, team: string): boolean {
	return team === TEAM.HOME ? section > LAST_SECTION : section < 0;
}

function clampSection(section: number): number {
	return Math.min(LAST_SECTION, Math.max(0, section));
}

// The section a team occupies the moment it goes on offense (just past the
// midline into the opponent's half).
export function justPastMidline(team: string): number {
	return MIDLINE_ENTRY[team];
}

// The horizontal centre of a section as a percentage of the rendered
// pitch, for positioning the ball marker over the field.
export function sectionCenterPercent(section: number): number {
	const x = FIELD_PLAY_MIN_X + FIELD_SECTION_WIDTH * (section + 0.5);
	return ((x - FIELD_VIEWBOX_MIN_X) / FIELD_VIEWBOX_WIDTH) * 100;
}

// ── Ball Move resolution ─────────────────────────────────────

export interface BallMoveResult {
	goal: boolean;
	section: number;
}

// A Ball play by the winning team (offense advancing or defense clearing)
// moves the ball in that team's attack direction: 1 section at 4 balls,
// 2 at 5, an instant goal at 6, nothing below 4.
export function resolveBallMove(section: number, count: number, team: string): BallMoveResult {
	if (count >= BALL_MOVE_GOAL) return { goal: true, section };
	const delta = count === BALL_MOVE_TWO ? 2 : count === BALL_MOVE_ONE ? 1 : 0;
	const next = section + delta * ATTACK_DIR[team];
	if (reachedGoal(next, team)) return { goal: true, section: next };
	return { goal: false, section: clampSection(next) };
}

// When the defense wins a Kick / Penalty / Red Card, they clear the ball just
// past the midline — which flips them onto offense.
export function clearToMidline(defender: string): number {
	return justPastMidline(defender);
}

// A Red Card win by the offense advances the ball one section.
export function redCardAdvance(section: number, team: string): BallMoveResult {
	const next = section + ATTACK_DIR[team];
	if (reachedGoal(next, team)) return { goal: true, section: next };
	return { goal: false, section: clampSection(next) };
}

// ── Shot on Goal / Free Kick resolution ──────────────────────

export type ShotResult = 'goal' | 'save' | 'tie';

export function resolveShot(offenseBalls: number, defenseBalls: number): ShotResult {
	if (offenseBalls > defenseBalls) return 'goal';
	if (defenseBalls > offenseBalls) return 'save';
	return 'tie';
}

// ── Scoring / game end ───────────────────────────────────────

export function isGameOver(
	awayScore: number,
	homeScore: number,
	winScore: number
): { over: boolean; winner?: string } {
	if (awayScore >= winScore) return { over: true, winner: TEAM.AWAY };
	if (homeScore >= winScore) return { over: true, winner: TEAM.HOME };
	return { over: false };
}

// ── Team keys (for scores / reduction objects) ───────────────

export function teamKey(team: string): 'away' | 'home' {
	return team === TEAM.AWAY ? 'away' : 'home';
}

export function beginDisabled(ids: string[]): boolean {
	return ids.filter((id) => id !== '').length < 2;
}

// ── Power chip / AI heuristics (pure) ────────────────────────

// On a tie, the chip holder wins the roll if they spend the chip. The AI
// spends it when a goal is directly at stake (a shot/free-kick tie) or when
// it holds the chip on offense and can profit from winning; otherwise it
// hoards the chip for a shot later.
export function aiShouldUseChip(pendingShot: boolean, holderIsOffense: boolean): boolean {
	return pendingShot || holderIsOffense;
}

// The dice worth re-rolling: everything not already part of the best play,
// so a re-roll can only grow (or hold) the winning count.
export function aiRerollIndices(roll: SoccerRoll): number[] {
	const { symbol } = bestPlay(roll);
	return roll.reduce<number[]>((acc, face, i) => {
		if (face !== symbol) acc.push(i);
		return acc;
	}, []);
}

// The AI spends its chip to re-roll only when its play is weak (a bare
// majority of balls or fewer) and it is on offense trying to build an attack.
export function aiShouldReroll(play: TeamPlay, isOffense: boolean): boolean {
	return isOffense && play.symbol === SOCCER_SYMBOL.BALL && play.count <= 3;
}

// Apply chosen re-roll indices to a roll, returning a new roll.
export function applyReroll(roll: SoccerRoll, indices: number[]): SoccerRoll {
	const set = new Set(indices);
	return roll.map((face, i) => (set.has(i) ? rollDie() : face));
}
