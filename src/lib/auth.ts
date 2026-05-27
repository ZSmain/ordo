import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import type { DrizzleClient } from '$lib/server/db';
import { passwordHasher } from '$lib/server/password';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';
import { sveltekitCookies } from 'better-auth/svelte-kit';

const authConfig = {
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
		password: passwordHasher
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
} satisfies Omit<Parameters<typeof betterAuth>[0], 'database'>;

export function createAuth(db: DrizzleClient) {
	return betterAuth({
		...authConfig,
		database: drizzleAdapter(db, { provider: 'sqlite' })
	});
}

/**
 * DO NOT USE!
 *
 * This instance is used by the `better-auth` CLI for schema generation only.
 * To access auth at runtime, use `event.locals.auth`.
 */
export const auth = createAuth(null!);

export type BetterAuth = ReturnType<typeof createAuth>;
