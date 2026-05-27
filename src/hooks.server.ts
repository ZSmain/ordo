import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { createAuth } from '$lib/auth';
import { getDb } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	event.locals.db = getDb(event.platform?.env?.ordo_db, env.DATABASE_URL);
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
