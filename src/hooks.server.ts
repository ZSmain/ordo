import { building, dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { getAuth } from "$lib/auth";
import { getDb } from "$lib/server/db";
import type { Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";

export const handle: Handle = async ({ event, resolve }) => {
    const platformEnv = event.platform?.env as
        | {
            ordo_db?: D1Database;
            DB?: D1Database;
            DATABASE_URL?: string;
        }
        | undefined;

    // In development mode, always use LibSQL with local file
    // In production, use D1 if available, otherwise fall back to LibSQL
    const database = dev ? undefined : (platformEnv?.ordo_db ?? platformEnv?.DB);
    const databaseUrl = platformEnv?.DATABASE_URL ?? env.DATABASE_URL;

    event.locals.db = getDb(database, databaseUrl);
    event.locals.auth = getAuth(event.locals.db);

    return svelteKitHandler({ event, resolve, auth: event.locals.auth, building });
};
