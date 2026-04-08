export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const PBKDF2_ITERATIONS = 100_000;
export const SALT_LENGTH = 16;
export const HASH_LENGTH = 32;

export const PASSWORD_RULES = [
	{ label: 'At least 8 characters', test: (p: string) => p.length >= PASSWORD_MIN_LENGTH },
	{ label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
	{ label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
	{ label: 'One number', test: (p: string) => /\d/.test(p) }
];

export const REGISTER_BENEFITS = [
	'Create and manage your own teams',
	'Save game history and statistics',
	'Pause and resume games',
	'Complete a season',
	'Works 100% offline',
	'Online optional for playing against friends'
];
