import { BASE_ORDER, MAX_BALLS, MAX_INNINGS, MAX_OUTS, MAX_STRIKES } from '$lib/baseball/constants';
import { diceData } from '$lib/baseball/data/data.json';
import type { BaseballDiceRoll, BaseName, Half } from '$lib/baseball/types';
import { randomNumber } from '$lib/utils/common';

// ── Dice lookup ──────────────────────────────────────────────

export function lookupDiceResult(diceId: number): BaseballDiceRoll | undefined {
	return (diceData as BaseballDiceRoll[]).find((d) => d.id === diceId);
}

export function pickDescription(descriptions: string[]): string {
	return descriptions[randomNumber(descriptions.length)];
}

// ── Runner advancement ───────────────────────────────────────

type Bases = Record<BaseName, boolean>;

interface AdvanceResult {
	bases: Bases;
	runsScored: number;
}

/**
 * Advance all existing runners by `runnerAdv` bases, then place batter
 * at base `batterAdv`. Runners are processed from 3rd → 1st to avoid
 * collision. Any runner reaching base 4+ scores a run.
 *
 * Chain displacement: if a runner lands on an occupied base, that runner
 * is pushed forward by 1 recursively.
 */
export function advanceRunners(bases: Bases, batterAdv: number, runnerAdv: number): AdvanceResult {
	// Home run shortcut: everyone scores
	if (batterAdv >= 4) {
		const runnersOn = BASE_ORDER.filter((b) => bases[b]).length;
		return {
			bases: { first: false, second: false, third: false },
			runsScored: runnersOn + 1 // runners + batter
		};
	}

	let runsScored = 0;
	// Work with numeric base positions: 1=first, 2=second, 3=third, 4+=home
	const runners: number[] = [];

	// Collect existing runners (3rd first so we process lead runners first)
	for (let i = BASE_ORDER.length - 1; i >= 0; i--) {
		if (bases[BASE_ORDER[i]]) {
			runners.push(i + 1); // 1-indexed base position
		}
	}

	// Advance each runner
	const newPositions: number[] = [];
	for (const pos of runners) {
		const newPos = pos + runnerAdv;
		if (newPos >= 4) {
			runsScored++;
		} else {
			newPositions.push(newPos);
		}
	}

	// Add batter
	if (batterAdv < 4) {
		newPositions.push(batterAdv);
	} else {
		runsScored++;
	}

	// Resolve collisions: sort descending, push forward if occupied
	newPositions.sort((a, b) => b - a);
	const finalPositions: number[] = [];

	for (const pos of newPositions) {
		let target = pos;
		while (finalPositions.includes(target)) {
			target++;
		}
		if (target >= 4) {
			runsScored++;
		} else {
			finalPositions.push(target);
		}
	}

	return {
		bases: {
			first: finalPositions.includes(1),
			second: finalPositions.includes(2),
			third: finalPositions.includes(3)
		},
		runsScored
	};
}

/**
 * Walk: batter goes to 1st. Only forced runners advance
 * (runner on 1st → 2nd, only if 1st was occupied; runner on 2nd → 3rd
 * only if pushed by the chain from 1st, etc.)
 */
export function processWalk(bases: Bases): AdvanceResult {
	let runsScored = 0;

	// Start with existing runners
	const occupied = [bases.first, bases.second, bases.third];

	// Force chain: batter goes to 1st, pushing forward any consecutive
	// occupied bases starting from 1st.
	// Find how far the force chain extends (consecutive from 1st)
	let forceEnd = 0; // 0 = only batter forced to 1st
	if (occupied[0]) {
		forceEnd = 1; // runner on 1st forced to 2nd
		if (occupied[1]) {
			forceEnd = 2; // runner on 2nd forced to 3rd
			if (occupied[2]) {
				forceEnd = 3; // runner on 3rd forced home → scores
			}
		}
	}

	const newBases: Bases = { first: true, second: false, third: false };

	// Place forced runners
	for (let i = 0; i < forceEnd; i++) {
		const newPos = i + 2; // 1st→2nd(2), 2nd→3rd(3), 3rd→home(4)
		if (newPos >= 4) {
			runsScored++;
		} else {
			const baseName = BASE_ORDER[newPos - 1];
			newBases[baseName] = true;
		}
	}

	// Preserve non-forced runners (those beyond the force chain)
	for (let i = forceEnd; i < 3; i++) {
		if (occupied[i]) {
			newBases[BASE_ORDER[i]] = true;
		}
	}

	return { bases: newBases, runsScored };
}

/**
 * Double play: batter is out (1 out). If runners on base, remove the
 * lead runner (closest to home) for a second out. If no runners,
 * only the batter is out.
 */
export function processDoublePlay(bases: Bases): { bases: Bases; outsRecorded: number } {
	let outsRecorded = 1; // batter is always out
	const newBases: Bases = { ...bases };

	// Remove lead runner (check 3rd → 2nd → 1st)
	for (let i = BASE_ORDER.length - 1; i >= 0; i--) {
		const base = BASE_ORDER[i];
		if (newBases[base]) {
			newBases[base] = false;
			outsRecorded++;
			break;
		}
	}

	return { bases: newBases, outsRecorded };
}

/**
 * Sacrifice fly: batter is out, but runners advance by `runnerAdv` bases.
 */
export function processSacrifice(bases: Bases, runnerAdv: number): AdvanceResult {
	let runsScored = 0;
	const runners: number[] = [];

	for (let i = BASE_ORDER.length - 1; i >= 0; i--) {
		if (bases[BASE_ORDER[i]]) {
			runners.push(i + 1);
		}
	}

	const newPositions: number[] = [];
	for (const pos of runners) {
		const newPos = pos + runnerAdv;
		if (newPos >= 4) {
			runsScored++;
		} else {
			newPositions.push(newPos);
		}
	}

	// Resolve collisions
	newPositions.sort((a, b) => b - a);
	const finalPositions: number[] = [];
	for (const pos of newPositions) {
		let target = pos;
		while (finalPositions.includes(target)) {
			target++;
		}
		if (target >= 4) {
			runsScored++;
		} else {
			finalPositions.push(target);
		}
	}

	return {
		bases: {
			first: finalPositions.includes(1),
			second: finalPositions.includes(2),
			third: finalPositions.includes(3)
		},
		runsScored
	};
}

// ── Game completion ──────────────────────────────────────────

interface GameOverResult {
	over: boolean;
	winner?: 'vis' | 'hom';
}

/**
 * Check if the game is over.
 * - After top of 9th with 3 outs: if home leads, skip bottom (home wins)
 * - After bottom of 9th with 3 outs: team with more runs wins
 * - Walk-off: bottom of 9th (or later), home takes the lead mid-inning
 */
export function isGameOver(
	inning: number,
	half: Half,
	outs: number,
	visRuns: number,
	homRuns: number
): GameOverResult {
	// Walk-off: bottom half, home takes the lead
	if (half === 'bottom' && inning >= MAX_INNINGS && homRuns > visRuns) {
		return { over: true, winner: 'hom' };
	}

	// Top of 9th complete: if home already leads, no need to play bottom
	if (half === 'top' && inning >= MAX_INNINGS && outs >= MAX_OUTS && homRuns > visRuns) {
		return { over: true, winner: 'hom' };
	}

	// Bottom of 9th complete
	if (half === 'bottom' && inning >= MAX_INNINGS && outs >= MAX_OUTS) {
		if (homRuns > visRuns) return { over: true, winner: 'hom' };
		if (visRuns > homRuns) return { over: true, winner: 'vis' };
		// Tie after 9 — in a dice game, we keep playing (extra innings)
		// For now, visitor wins ties (can be changed to extra innings later)
		return { over: true, winner: 'vis' };
	}

	return { over: false };
}

// ── Count logic (pure) ──────────────────────────────────────

export function isWalk(balls: number): boolean {
	return balls >= MAX_BALLS;
}

export function isStrikeout(strikes: number): boolean {
	return strikes >= MAX_STRIKES;
}

export function isInningOver(outs: number): boolean {
	return outs >= MAX_OUTS;
}
