import { describe, expect, it } from 'vitest';
import {
	generateSalt,
	hashPassword,
	validatePassword,
	validateUsername,
	verifyPassword
} from './passwordUtils';

describe('generateSalt', () => {
	it('returns a base64 string', () => {
		const salt = generateSalt();
		expect(typeof salt).toBe('string');
		expect(salt.length).toBeGreaterThan(0);
	});

	it('returns unique values', () => {
		const salt1 = generateSalt();
		const salt2 = generateSalt();
		expect(salt1).not.toBe(salt2);
	});
});

describe('hashPassword', () => {
	it('returns a consistent hash for the same input', async () => {
		const salt = generateSalt();
		const hash1 = await hashPassword('TestPass1', salt);
		const hash2 = await hashPassword('TestPass1', salt);
		expect(hash1).toBe(hash2);
	});

	it('returns different hashes for different passwords', async () => {
		const salt = generateSalt();
		const hash1 = await hashPassword('TestPass1', salt);
		const hash2 = await hashPassword('TestPass2', salt);
		expect(hash1).not.toBe(hash2);
	});

	it('returns different hashes for different salts', async () => {
		const hash1 = await hashPassword('TestPass1', generateSalt());
		const hash2 = await hashPassword('TestPass1', generateSalt());
		expect(hash1).not.toBe(hash2);
	});
});

describe('verifyPassword', () => {
	it('returns true for correct password', async () => {
		const salt = generateSalt();
		const hash = await hashPassword('Correct1', salt);
		expect(await verifyPassword('Correct1', salt, hash)).toBe(true);
	});

	it('returns false for incorrect password', async () => {
		const salt = generateSalt();
		const hash = await hashPassword('Correct1', salt);
		expect(await verifyPassword('Wrong1234', salt, hash)).toBe(false);
	});
});

describe('validatePassword', () => {
	it('passes a strong password', () => {
		const result = validatePassword('Strong1a');
		expect(result.valid).toBe(true);
		expect(result.failures).toHaveLength(0);
	});

	it('fails a short password', () => {
		const result = validatePassword('Sh1');
		expect(result.valid).toBe(false);
		expect(result.failures).toContain('At least 8 characters');
	});

	it('fails without uppercase', () => {
		const result = validatePassword('nouppercase1');
		expect(result.valid).toBe(false);
		expect(result.failures).toContain('One uppercase letter');
	});

	it('fails without lowercase', () => {
		const result = validatePassword('NOLOWER123');
		expect(result.valid).toBe(false);
		expect(result.failures).toContain('One lowercase letter');
	});

	it('fails without a number', () => {
		const result = validatePassword('NoNumbers');
		expect(result.valid).toBe(false);
		expect(result.failures).toContain('One number');
	});

	it('fails a password exceeding max length', () => {
		const long = 'A'.repeat(129) + 'a1';
		const result = validatePassword(long);
		expect(result.valid).toBe(false);
	});

	it('can report multiple failures', () => {
		const result = validatePassword('abc');
		expect(result.valid).toBe(false);
		expect(result.failures.length).toBeGreaterThan(1);
	});
});

describe('validateUsername', () => {
	it('passes a valid username', () => {
		expect(validateUsername('Player_1').valid).toBe(true);
	});

	it('passes with hyphens', () => {
		expect(validateUsername('cool-player').valid).toBe(true);
	});

	it('fails when too short', () => {
		const result = validateUsername('ab');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('at least');
	});

	it('fails when too long', () => {
		const result = validateUsername('a'.repeat(25));
		expect(result.valid).toBe(false);
		expect(result.error).toContain('or fewer');
	});

	it('fails with spaces', () => {
		const result = validateUsername('has space');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('Only letters');
	});

	it('fails with special characters', () => {
		const result = validateUsername('user@name');
		expect(result.valid).toBe(false);
	});

	it('trims whitespace before validating', () => {
		expect(validateUsername('  Player1  ').valid).toBe(true);
	});
});
