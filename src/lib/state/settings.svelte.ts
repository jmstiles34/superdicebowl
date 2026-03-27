import { DEFAULT_SETTINGS, DEFAULT_TEAM, GAME_MODE } from '$lib/constants/constants';
import type { GameSettingsSnapshot } from '$lib/db/database';
import type { Team } from '$lib/types';

export type Theme = 'dark' | 'light';

export type Settings = {
	awayTeam: Team;
	homeTeam: Team;
	mode: string;
	winScore: number;
	volume: number;
	theme: Theme;
};

class SettingsState {
	awayTeam = $state(DEFAULT_TEAM);
	homeTeam = $state(DEFAULT_TEAM);
	mode = $state(GAME_MODE.HEAD_TO_HEAD);
	winScore = $state(30);
	volume = $state(75);
	theme: Theme = $state('dark');

	snapshotSettings = (): GameSettingsSnapshot =>
		$state.snapshot({
			awayTeam: this.awayTeam,
			homeTeam: this.homeTeam,
			mode: this.mode,
			winScore: this.winScore
		});

	loadSnapshot = (snapshot: GameSettingsSnapshot) => {
		this.awayTeam = snapshot.awayTeam;
		this.homeTeam = snapshot.homeTeam;
		this.mode = snapshot.mode;
		this.winScore = snapshot.winScore;
	};

	resetSettings = () => {
		this.awayTeam = DEFAULT_SETTINGS.awayTeam;
		this.homeTeam = DEFAULT_SETTINGS.homeTeam;
		this.mode = DEFAULT_SETTINGS.mode;
	};

	loadPreferences = (prefs: { volume: number; theme: Theme; defaultWinScore: number }) => {
		this.volume = prefs.volume;
		this.theme = prefs.theme;
		this.winScore = prefs.defaultWinScore;
	};
}

export const settings = new SettingsState();
