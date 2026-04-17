import type { Team } from '$lib/shared/types';

export const TEAM = {
	AWAY: 'Away',
	HOME: 'Home'
};

export const OPPOSITE_TEAM = {
	[TEAM.AWAY]: 'Home',
	[TEAM.HOME]: 'Away'
};

export const DEFAULT_TEAM: Team = {
	id: '',
	city: '',
	cityKey: '',
	name: '',
	fieldLogo: '',
	logo: '',
	logoFixed: false,
	logoLeft: '',
	colors: {
		primary: '#FFFFFF',
		secondary: ''
	}
};

export const DICE_COLORS = ['blue', 'red', 'orange', 'purple', 'green', 'gold'];

export const GAME_MODE = {
	SOLO: 'Solo',
	HEAD_TO_HEAD: 'Head-to-Head',
	SIMULATION: 'Simulation'
};

export const NOOP = () => {
	// do nothing
};

export const POSITION = {
	LEFT: 'Left',
	RIGHT: 'Right',
	TOP: 'Top',
	BOTTOM: 'Bottom'
};
