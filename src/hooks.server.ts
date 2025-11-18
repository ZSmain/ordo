import { building } from '$app/environment'
import { env } from '$env/dynamic/private'
import { getAuth } from '$lib/auth'
import { getDb } from '$lib/server/db'
import type { Handle } from '@sveltejs/kit'
import { svelteKitHandler } from 'better-auth/svelte-kit'

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.db = getDb(event.platform?.env?.ordo_db, env.DATABASE_URL)
    event.locals.auth = getAuth(event.locals.db, event.url.origin)

    const session = await event.locals.auth.api.getSession({
        headers: event.request.headers
    })

    if (session) {
        event.locals.session = session.session
        event.locals.user = session.user
    }

    return svelteKitHandler({ event, resolve, auth: event.locals.auth, building })
}