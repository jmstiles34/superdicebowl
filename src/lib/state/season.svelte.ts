import type { SeasonRecord, SeasonWeek, StandingsEntry } from '$lib/db/database';
import type { Team } from '$lib/types';

class SeasonState {
	activeSeasonId: number | null = $state(null);
	userTeamId = $state('');
	teams: Team[] = $state([]);
	schedule: SeasonWeek[] = $state([]);
	standings: StandingsEntry[] = $state([]);
	currentWeek = $state(1);
	totalWeeks = $state(0);
	winScore = $state(30);
	status: 'in_progress' | 'completed' = $state('in_progress');

	// Track active game navigation
	activeWeek: number | null = $state(null);
	activeMatchupIndex: number | null = $state(null);
	isSeasonGame = $state(false);

	get currentWeekData(): SeasonWeek | undefined {
		return this.schedule.find((w) => w.weekNumber === this.currentWeek);
	}

	get sortedStandings(): (StandingsEntry & { gamesBack: number })[] {
		const sorted = [...this.standings].sort((a, b) => {
			if (b.wins !== a.wins) return b.wins - a.wins;
			return b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst);
		});
		const leaderWins = sorted.length > 0 ? sorted[0].wins : 0;
		return sorted.map((s) => ({ ...s, gamesBack: leaderWins - s.wins }));
	}

	get isWeekComplete(): boolean {
		const week = this.currentWeekData;
		if (!week) return false;
		return week.matchups.every((m) => m.status === 'completed');
	}

	get isSeasonComplete(): boolean {
		return this.schedule.every((w) => w.matchups.every((m) => m.status === 'completed'));
	}

	getTeamById = (teamId: string): Team | undefined => {
		return this.teams.find((t) => t.id === teamId);
	};

	loadSeason = (record: SeasonRecord) => {
		this.activeSeasonId = record.id ?? null;
		this.userTeamId = record.userTeamId;
		this.teams = record.teams;
		this.schedule = record.schedule;
		this.standings = record.standings;
		this.currentWeek = record.currentWeek;
		this.totalWeeks = record.totalWeeks;
		this.winScore = record.winScore;
		this.status = record.status;
	};

	markMatchupInProgress = (weekNumber: number, matchupIndex: number, gameRecordId?: number) => {
		const week = this.schedule.find((w) => w.weekNumber === weekNumber);
		if (!week) return;
		const matchup = week.matchups[matchupIndex];
		if (!matchup) return;
		matchup.status = 'in_progress';
		if (gameRecordId !== undefined) matchup.gameRecordId = gameRecordId;
		this.schedule = [...this.schedule];
	};

	setMatchupGameRecordId = (weekNumber: number, matchupIndex: number, gameRecordId: number) => {
		const week = this.schedule.find((w) => w.weekNumber === weekNumber);
		if (!week) return;
		const matchup = week.matchups[matchupIndex];
		if (!matchup) return;
		matchup.gameRecordId = gameRecordId;
		this.schedule = [...this.schedule];
	};

	recordGameResult = (
		weekNumber: number,
		matchupIndex: number,
		homeScore: number,
		awayScore: number
	) => {
		const week = this.schedule.find((w) => w.weekNumber === weekNumber);
		if (!week) return;

		const matchup = week.matchups[matchupIndex];
		if (!matchup) return;

		matchup.status = 'completed';
		matchup.homeScore = homeScore;
		matchup.awayScore = awayScore;

		// Force reactivity
		this.schedule = [...this.schedule];

		this.recalcStandings();
	};

	recalcStandings = () => {
		const stats: Record<string, StandingsEntry> = {};
		for (const team of this.teams) {
			stats[team.id] = { teamId: team.id, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
		}

		for (const week of this.schedule) {
			for (const m of week.matchups) {
				if (m.status !== 'completed') continue;
				const home = stats[m.homeTeamId];
				const away = stats[m.awayTeamId];
				if (!home || !away) continue;

				home.pointsFor += m.homeScore;
				home.pointsAgainst += m.awayScore;
				away.pointsFor += m.awayScore;
				away.pointsAgainst += m.homeScore;

				if (m.homeScore > m.awayScore) {
					home.wins++;
					away.losses++;
				} else {
					away.wins++;
					home.losses++;
				}
			}
		}

		this.standings = Object.values(stats);
	};

	advanceWeek = () => {
		if (this.isWeekComplete && this.currentWeek < this.totalWeeks) {
			this.currentWeek++;
		}
		if (this.isWeekComplete && this.currentWeek === this.totalWeeks) {
			this.status = 'completed';
		}
	};

	snapshotSeason = (): Partial<SeasonRecord> => {
		return $state.snapshot({
			schedule: this.schedule,
			standings: this.standings,
			currentWeek: this.currentWeek,
			status: this.status
		});
	};

	resetSeason = () => {
		this.activeSeasonId = null;
		this.userTeamId = '';
		this.teams = [];
		this.schedule = [];
		this.standings = [];
		this.currentWeek = 1;
		this.totalWeeks = 0;
		this.winScore = 30;
		this.status = 'in_progress';
		this.activeWeek = null;
		this.activeMatchupIndex = null;
		this.isSeasonGame = false;
	};
}

export const season = new SeasonState();
