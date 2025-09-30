import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/db';
import { building } from '$app/environment';
import { getAuth } from '$lib/auth';

export const handle: Handle = sequence(Sentry.sentryHandle(), async ({ event, resolve }) => {
	event.locals.db = getDb(event.platform?.env?.DB, env.DATABASE_URL);
	event.locals.auth = getAuth(event.locals.db);

	return svelteKitHandler({ event, resolve, auth: event.locals.auth, building });
});

export const handleError = Sentry.handleErrorWithSentry();
