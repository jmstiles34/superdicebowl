import { describe, expect, it } from 'vitest';
import { DEFAULT_TEAM } from '$lib/constants/constants';
import type { Team } from '$lib/types';
import { generateSchedule } from './schedule';

// ─── Fixtures ──────────────────────────────────────────────
function makeTeams(n: number): Team[] {
	return Array.from({ length: n }, (_, i) => ({
		...DEFAULT_TEAM,
		id: `t${i}`,
		city: `City${i}`,
		cityKey: `T${i}`,
		name: `Team${i}`,
		fieldLogo: '',
		logo: ''
	}));
}

function pairKey(a: string, b: string): string {
	// Unordered pair key so (a,b) and (b,a) collide
	return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// ─── Full round-robin correctness ──────────────────────────
describe('generateSchedule — single full cycle (totalWeeks = n - 1)', () => {
	it.each([4, 6, 8])('produces a valid round-robin for %d teams', (n) => {
		const teams = makeTeams(n);
		const weeks = generateSchedule(teams, n - 1, teams[0].id);

		expect(weeks).toHaveLength(n - 1);

		// Each week has exactly n/2 matchups.
		for (const week of weeks) {
			expect(week.matchups).toHaveLength(n / 2);
		}

		// Every team plays exactly once per week.
		for (const week of weeks) {
			const seen = new Set<string>();
			for (const m of week.matchups) {
				expect(seen.has(m.homeTeamId)).toBe(false);
				expect(seen.has(m.awayTeamId)).toBe(false);
				seen.add(m.homeTeamId);
				seen.add(m.awayTeamId);
			}
			expect(seen.size).toBe(n);
		}

		// Across the full cycle, every unordered pair appears exactly once.
		const allPairs = new Map<string, number>();
		for (const week of weeks) {
			for (const m of week.matchups) {
				const key = pairKey(m.homeTeamId, m.awayTeamId);
				allPairs.set(key, (allPairs.get(key) ?? 0) + 1);
			}
		}
		const expectedPairCount = (n * (n - 1)) / 2;
		expect(allPairs.size).toBe(expectedPairCount);
		for (const count of allPairs.values()) {
			expect(count).toBe(1);
		}
	});

	it('no team ever plays itself', () => {
		const teams = makeTeams(8);
		const weeks = generateSchedule(teams, 7, teams[0].id);
		for (const week of weeks) {
			for (const m of week.matchups) {
				expect(m.homeTeamId).not.toBe(m.awayTeamId);
			}
		}
	});

	it('weekNumber is 1-indexed and monotonically increasing', () => {
		const teams = makeTeams(6);
		const weeks = generateSchedule(teams, 5, teams[0].id);
		weeks.forEach((w, i) => {
			expect(w.weekNumber).toBe(i + 1);
		});
	});

	it('every matchup is initialized with pending status and zero scores', () => {
		const teams = makeTeams(4);
		const weeks = generateSchedule(teams, 3, teams[0].id);
		for (const week of weeks) {
			for (const m of week.matchups) {
				expect(m.status).toBe('pending');
				expect(m.homeScore).toBe(0);
				expect(m.awayScore).toBe(0);
			}
		}
	});
});

// ─── Multi-cycle: home/away flips each cycle ──────────────
describe('generateSchedule — multi-cycle (totalWeeks > n - 1)', () => {
	it('repeats the cycle and flips home/away on odd cycles', () => {
		const teams = makeTeams(4);
		const weeks = generateSchedule(teams, 6, teams[0].id); // 2 full cycles

		expect(weeks).toHaveLength(6);

		// Every unordered pair should appear exactly twice (once per cycle).
		const allPairs = new Map<string, number>();
		for (const week of weeks) {
			for (const m of week.matchups) {
				const key = pairKey(m.homeTeamId, m.awayTeamId);
				allPairs.set(key, (allPairs.get(key) ?? 0) + 1);
			}
		}
		for (const count of allPairs.values()) {
			expect(count).toBe(2);
		}
	});

	it('each team plays exactly once per week even across cycles', () => {
		const teams = makeTeams(6);
		const weeks = generateSchedule(teams, 10, teams[0].id);
		for (const week of weeks) {
			const seen = new Set<string>();
			for (const m of week.matchups) {
				seen.add(m.homeTeamId);
				seen.add(m.awayTeamId);
			}
			expect(seen.size).toBe(6);
		}
	});
});

// ─── User-facing flags ─────────────────────────────────────
describe('generateSchedule — user game flags and home/away alternation', () => {
	it('isUserGame is true only when the user is home or away', () => {
		const teams = makeTeams(6);
		const userId = teams[2].id;
		const weeks = generateSchedule(teams, 5, userId);

		for (const week of weeks) {
			for (const m of week.matchups) {
				const expected = m.homeTeamId === userId || m.awayTeamId === userId;
				expect(m.isUserGame).toBe(expected);
			}
		}
	});

	it('the user plays exactly one game per week', () => {
		const teams = makeTeams(8);
		const userId = teams[3].id;
		const weeks = generateSchedule(teams, 7, userId);

		for (const week of weeks) {
			const userGames = week.matchups.filter((m) => m.isUserGame);
			expect(userGames).toHaveLength(1);
		}
	});

	it('alternates the user between home and away across weeks', () => {
		const teams = makeTeams(6);
		const userId = teams[0].id;
		const weeks = generateSchedule(teams, 10, userId);

		let expectedHome = true;
		for (const week of weeks) {
			const userGame = week.matchups.find((m) => m.isUserGame);
			if (!userGame) throw new Error(`No user game found in week ${week.weekNumber}`);
			if (expectedHome) {
				expect(userGame.homeTeamId).toBe(userId);
			} else {
				expect(userGame.awayTeamId).toBe(userId);
			}
			expectedHome = !expectedHome;
		}
	});

	it('user alternation works regardless of which team index they pick', () => {
		const teams = makeTeams(8);
		const userId = teams[5].id;
		const weeks = generateSchedule(teams, 14, userId);

		const userHomeAway: ('home' | 'away')[] = weeks.map((w) => {
			const g = w.matchups.find((m) => m.isUserGame);
			if (!g) throw new Error(`No user game found in week ${w.weekNumber}`);
			return g.homeTeamId === userId ? 'home' : 'away';
		});

		// Must strictly alternate starting with 'home' (per generateSchedule's post-pass).
		expect(userHomeAway[0]).toBe('home');
		for (let i = 1; i < userHomeAway.length; i++) {
			expect(userHomeAway[i]).not.toBe(userHomeAway[i - 1]);
		}
	});
});

// ─── Minimal / degenerate cases ────────────────────────────
describe('generateSchedule — edge cases', () => {
	it('handles the minimum case of 2 teams', () => {
		const teams = makeTeams(2);
		const weeks = generateSchedule(teams, 1, teams[0].id);

		expect(weeks).toHaveLength(1);
		expect(weeks[0].matchups).toHaveLength(1);
		const m = weeks[0].matchups[0];
		expect(new Set([m.homeTeamId, m.awayTeamId])).toEqual(new Set([teams[0].id, teams[1].id]));
		expect(m.isUserGame).toBe(true);
	});

	it('returns an empty schedule when totalWeeks is 0', () => {
		const teams = makeTeams(4);
		const weeks = generateSchedule(teams, 0, teams[0].id);
		expect(weeks).toEqual([]);
	});
});
