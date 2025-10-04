import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import { type DrizzleClient } from "$lib/server/db";
import { passwordHasher } from "$lib/server/password";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";

function resolveBaseUrl(): string | undefined {
    const event = getRequestEvent();
    const requestOrigin = event?.url.origin;

    const configured = env.BETTER_AUTH_URL?.replace(/\/$/, "");

    if (!configured) {
        return requestOrigin;
    }

    if (!requestOrigin) {
        return configured;
    }

    try {
        const configuredOrigin = new URL(configured).origin;
        // Prefer the configured URL when it matches the current request host; otherwise fall back to the live origin.
        return configuredOrigin === requestOrigin ? configured : requestOrigin;
    } catch {
        return requestOrigin;
    }
}

export function getAuth(db: DrizzleClient) {
    const baseURL = resolveBaseUrl();

    return betterAuth({
        database: drizzleAdapter(db, {
            provider: "sqlite",
        }),
        secret: env.BETTER_AUTH_SECRET!,
        ...(baseURL ? { baseURL } : {}),
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