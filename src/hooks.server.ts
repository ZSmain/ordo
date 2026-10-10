import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { env } from 'cloudflare:workers';
import { DATABASE_URL } from '$app/env/private';
import { createAuth } from '#lib/auth.js';
import { getDb } from '#lib/server/db/index.js';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	event.locals.db = getDb(env.ordo_db, DATABASE_URL);
	event.locals.auth = createAuth(event.locals.db);

	const { auth } = event.locals;
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
