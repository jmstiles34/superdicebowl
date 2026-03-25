import { DEFAULT_SETTINGS, DEFAULT_TEAM, GAME_MODE } from '$lib/constants/constants';
import type { GameSettingsSnapshot } from '$lib/db/database';
import type { Team } from '$lib/types';

export type Settings = {
	awayTeam: Team;
	homeTeam: Team;
	mode: string;
	winScore: number;
	volume: boolean;
};

class SettingsState {
	awayTeam = $state(DEFAULT_TEAM);
	homeTeam = $state(DEFAULT_TEAM);
	mode = $state(GAME_MODE.HEAD_TO_HEAD);
	winScore = $state(30);
	volume = $state(true);

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
		this.winScore = DEFAULT_SETTINGS.winScore;
		this.volume = DEFAULT_SETTINGS.volume;
	};
}

export const settings = new SettingsState();
