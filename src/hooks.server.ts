import { svelteKitHandler } from "better-auth/svelte-kit";
import type { Handle } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { getDb } from "$lib/server/db";
import { building } from "$app/environment";
import { getAuth } from "$lib/auth";

export const handle: Handle = async ({ event, resolve }) => {
    const platformEnv = event.platform?.env as
        | {
              ordo_db?: D1Database;
              DB?: D1Database;
              DATABASE_URL?: string;
          }
        | undefined;

    const database = platformEnv?.ordo_db ?? platformEnv?.DB;
    const databaseUrl = platformEnv?.DATABASE_URL ?? env.DATABASE_URL;

    event.locals.db = getDb(database, databaseUrl);
    event.locals.auth = getAuth(event.locals.db);

    return svelteKitHandler({ event, resolve, auth: event.locals.auth, building });
};
