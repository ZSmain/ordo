import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import { type DrizzleClient } from "$lib/server/db";
import { passwordHasher } from "$lib/server/password";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";

function resolveBaseUrl(): string | undefined {
    const configured = env.BETTER_AUTH_URL?.replace(/\/$/, "");
    if (configured) {
        return configured;
    }

    const event = getRequestEvent();
    return event?.url.origin;
}

function resolveCookieDomain(baseURL: string | undefined): string | undefined {
    if (!baseURL) return undefined;

    try {
        const hostname = new URL(baseURL).hostname;
        if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
            return undefined;
        }
        return `.${hostname}`;
    } catch {
        return undefined;
    }
}

export function getAuth(db: DrizzleClient) {
    const baseURL = resolveBaseUrl();
    const cookieDomain = resolveCookieDomain(baseURL ?? env.BETTER_AUTH_URL);

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
        ...(cookieDomain
            ? {
                advanced: {
                    crossSubDomainCookies: {
                        enabled: true,
                        domain: cookieDomain
                    },
                    useSecureCookies: baseURL?.startsWith("https://") ?? true
                }
            }
            : {}),
        plugins: [sveltekitCookies(getRequestEvent)]
    });
}

export type BetterAuth = ReturnType<typeof getAuth>;