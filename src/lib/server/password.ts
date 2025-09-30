import { env } from '$env/dynamic/private';

const DEFAULT_ITERATIONS = 75000;
const DEFAULT_KEY_LENGTH = 32; // bytes
const DEFAULT_SALT_LENGTH = 16; // bytes

const encoder = new TextEncoder();

const runtimeCrypto: Crypto | undefined =
	typeof globalThis !== 'undefined' && globalThis.crypto?.subtle
		? globalThis.crypto
		: undefined;

if (!runtimeCrypto?.subtle) {
	throw new Error('Web Crypto API is not available in the current environment.');
}

const cryptoSource = runtimeCrypto;
const subtle = cryptoSource.subtle;

const iterations = (() => {
	const raw = env.PASSWORD_HASH_ITERATIONS;
	if (!raw) return DEFAULT_ITERATIONS;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ITERATIONS;
})();

const keyLength = (() => {
	const raw = env.PASSWORD_HASH_KEY_LENGTH;
	if (!raw) return DEFAULT_KEY_LENGTH;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_KEY_LENGTH;
})();

const saltLength = (() => {
	const raw = env.PASSWORD_HASH_SALT_LENGTH;
	if (!raw) return DEFAULT_SALT_LENGTH;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SALT_LENGTH;
})();

const VERSION = 'pbkdf2-sha256';

const toBase64 = (bytes: Uint8Array) => {
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(bytes).toString('base64');
	}
	let binary = '';
	for (let i = 0; i < bytes.length; i += 1) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
};

const fromBase64 = (value: string) => {
	if (typeof Buffer !== 'undefined') {
		return new Uint8Array(Buffer.from(value, 'base64'));
	}
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

async function deriveKey(password: string, salt: Uint8Array, iterationCount = iterations) {
	const keyMaterial = await subtle.importKey(
		'raw',
		encoder.encode(password.normalize('NFKC')),
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	const derivedBits = await subtle.deriveBits(
		{
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt: salt.buffer as ArrayBuffer,
			iterations: iterationCount
		},
		keyMaterial,
		keyLength * 8
	);

	return new Uint8Array(derivedBits);
}

export async function hashPassword(password: string) {
	const salt = new Uint8Array(saltLength);
	cryptoSource.getRandomValues(salt);
	const key = await deriveKey(password, salt);
	return [VERSION, iterations.toString(10), toBase64(salt), toBase64(key)].join('$');
}

export async function verifyPassword(password: string, hash: string) {
	const [version, storedIterations, saltValue, keyValue] = hash.split('$');
	if (!version || !storedIterations || !saltValue || !keyValue) {
		return false;
	}
	if (version !== VERSION) {
		return false;
	}
	const iterationCount = Number.parseInt(storedIterations, 10);
	if (!Number.isFinite(iterationCount) || iterationCount <= 0) {
		return false;
	}
	const salt = fromBase64(saltValue);
	const expected = fromBase64(keyValue);
	const derived = await deriveKey(password, salt, iterationCount);
	if (derived.length !== expected.length) {
		return false;
	}
	let diff = 0;
	for (let i = 0; i < derived.length; i += 1) {
		diff |= derived[i] ^ expected[i];
	}
	return diff === 0;
}

export const passwordHasher = {
	hash: hashPassword,
	verify: async ({ password, hash }: { password: string; hash: string }) =>
		verifyPassword(password, hash)
};
