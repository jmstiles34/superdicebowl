import { DEFAULT_SETTINGS, DEFAULT_TEAM, GAME_MODE, TEAM } from '$lib/constants/constants';
import type { FootballGameSettingsSnapshot, MowPattern } from '$lib/db/database';
import type { Team } from '$lib/types';

export type Theme = 'dark' | 'light';

export type Settings = {
	awayTeam: Team;
	homeTeam: Team;
	mode: string;
	winScore: number;
	volume: number;
	theme: Theme;
	mowPattern?: MowPattern;
};

class SettingsState {
	awayTeam = $state(DEFAULT_TEAM);
	homeTeam = $state(DEFAULT_TEAM);
	mode = $state(GAME_MODE.HEAD_TO_HEAD);
	userTeam = $state(TEAM.HOME);
	winScore = $state(30);
	volume = $state(75);
	speed = $state(1);
	theme: Theme = $state('dark');
	mowPattern: MowPattern = $state('crosscut');

	snapshotSettings = (): FootballGameSettingsSnapshot =>
		$state.snapshot({
			sport: 'football' as const,
			awayTeam: this.awayTeam,
			homeTeam: this.homeTeam,
			mode: this.mode,
			winScore: this.winScore
		});

	loadSnapshot = (snapshot: FootballGameSettingsSnapshot) => {
		this.awayTeam = snapshot.awayTeam;
		this.homeTeam = snapshot.homeTeam;
		this.mode = snapshot.mode;
		this.winScore = snapshot.winScore;
	};

	resetSettings = () => {
		this.awayTeam = DEFAULT_SETTINGS.awayTeam;
		this.homeTeam = DEFAULT_SETTINGS.homeTeam;
		this.mode = DEFAULT_SETTINGS.mode;
		this.userTeam = TEAM.HOME;
	};

	loadPreferences = (prefs: {
		volume: number;
		speed?: number;
		theme: Theme;
		defaultWinScore: number;
		mowPattern?: MowPattern;
	}) => {
		this.volume = prefs.volume;
		this.speed = prefs.speed ?? 1;
		this.theme = prefs.theme;
		this.winScore = prefs.defaultWinScore;
		this.mowPattern = prefs.mowPattern ?? 'crosscut';
	};
}

export const settings = new SettingsState();
