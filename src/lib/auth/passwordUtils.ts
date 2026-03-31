import {
	HASH_LENGTH,
	PASSWORD_MAX_LENGTH,
	PASSWORD_RULES,
	PBKDF2_ITERATIONS,
	SALT_LENGTH,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_PATTERN
} from '$lib/constants/auth';

function toBase64(buffer: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

export function generateSalt(): string {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	return toBase64(salt.buffer);
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<ArrayBuffer> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);
	return crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
		keyMaterial,
		HASH_LENGTH * 8
	);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
	const hash = await deriveKey(password, fromBase64(salt));
	return toBase64(hash);
}

export async function verifyPassword(
	password: string,
	salt: string,
	storedHash: string
): Promise<boolean> {
	const hash = await hashPassword(password, salt);
	return hash === storedHash;
}

export function validatePassword(password: string): { valid: boolean; failures: string[] } {
	if (password.length > PASSWORD_MAX_LENGTH) {
		return { valid: false, failures: [`Must be ${PASSWORD_MAX_LENGTH} characters or fewer`] };
	}
	const failures = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label);
	return { valid: failures.length === 0, failures };
}

export function validateUsername(username: string): { valid: boolean; error: string } {
	const trimmed = username.trim();
	if (trimmed.length < USERNAME_MIN_LENGTH) {
		return { valid: false, error: `Must be at least ${USERNAME_MIN_LENGTH} characters` };
	}
	if (trimmed.length > USERNAME_MAX_LENGTH) {
		return { valid: false, error: `Must be ${USERNAME_MAX_LENGTH} characters or fewer` };
	}
	if (!USERNAME_PATTERN.test(trimmed)) {
		return { valid: false, error: 'Only letters, numbers, hyphens, and underscores' };
	}
	return { valid: true, error: '' };
}
