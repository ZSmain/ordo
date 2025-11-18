import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import type { DrizzleClient } from "$lib/server/db";
import { passwordHasher } from "$lib/server/password";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";

export function getAuth(db: DrizzleClient, origin?: string) {
    const event = getRequestEvent();
    const baseUrl = env.BETTER_AUTH_URL ?? origin ?? event?.url.origin ?? env.CF_PAGES_URL;

    console.log("getAuth baseUrl:", baseUrl);

    return betterAuth({
        baseUrl,
        database: drizzleAdapter(db, { provider: "sqlite" }),
        emailAndPassword: {
            enabled: true,
            password: passwordHasher,
        },
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
            }
        },
        plugins: [sveltekitCookies(getRequestEvent)]
    });
}

export type BetterAuth = ReturnType<typeof getAuth>;