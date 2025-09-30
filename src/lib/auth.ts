import { getRequestEvent } from "$app/server";
import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type DrizzleClient } from "$lib/server/db";
import { env } from "$env/dynamic/private";

export function getAuth(db: DrizzleClient) {
    const sanitizedBaseUrl = env.BETTER_AUTH_URL?.replace(/\/$/, "");

    return betterAuth({
        database: drizzleAdapter(db, {
            provider: "sqlite",
        }),
        secret: env.BETTER_AUTH_SECRET!,
        baseURL: sanitizedBaseUrl,
        emailAndPassword: {
            enabled: true,
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