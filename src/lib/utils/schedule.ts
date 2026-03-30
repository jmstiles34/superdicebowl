import type { SeasonMatchup, SeasonWeek } from '$lib/db/database';
import type { Team } from '$lib/types';

/**
 * Generate a round-robin schedule using the circle method.
 * Fix team[0] in place, rotate the rest each round.
 */
export function generateSchedule(
	teams: Team[],
	totalWeeks: number,
	userTeamId: string
): SeasonWeek[] {
	const n = teams.length;
	const ids = teams.map((t) => t.id);
	const weeks: SeasonWeek[] = [];

	// Generate one full cycle of n-1 rounds
	const cycle = generateCycle(ids);

	for (let w = 0; w < totalWeeks; w++) {
		const cycleIndex = Math.floor(w / (n - 1));
		const roundIndex = w % (n - 1);
		const round = cycle[roundIndex];

		const matchups: SeasonMatchup[] = round.map(([a, b]) => {
			// Flip home/away on odd cycles for balance
			const [homeId, awayId] = cycleIndex % 2 === 0 ? [a, b] : [b, a];
			return {
				homeTeamId: homeId,
				awayTeamId: awayId,
				status: 'pending' as const,
				homeScore: 0,
				awayScore: 0,
				isUserGame: homeId === userTeamId || awayId === userTeamId
			};
		});

		weeks.push({
			weekNumber: w + 1,
			matchups
		});
	}

	// Alternate user's home/away each week
	let userHome = true;
	for (const week of weeks) {
		for (const m of week.matchups) {
			if (m.isUserGame) {
				if (userHome) {
					// Ensure user is home
					if (m.homeTeamId !== userTeamId) {
						[m.homeTeamId, m.awayTeamId] = [m.awayTeamId, m.homeTeamId];
					}
				} else {
					// Ensure user is away
					if (m.awayTeamId !== userTeamId) {
						[m.homeTeamId, m.awayTeamId] = [m.awayTeamId, m.homeTeamId];
					}
				}
				userHome = !userHome;
			}
		}
	}

	return weeks;
}

/**
 * Circle method: fix ids[0], rotate ids[1..n-1] each round.
 * Returns n-1 rounds, each with n/2 pairings.
 */
function generateCycle(ids: string[]): [string, string][][] {
	const n = ids.length;
	const rounds: [string, string][][] = [];
	const rotating = ids.slice(1);

	for (let r = 0; r < n - 1; r++) {
		const round: [string, string][] = [];
		const current = [ids[0], ...rotating];

		for (let i = 0; i < n / 2; i++) {
			round.push([current[i], current[n - 1 - i]]);
		}

		rounds.push(round);

		// Rotate: move last element to the front of the rotating array
		rotating.unshift(rotating.pop()!);
	}

	return rounds;
}
