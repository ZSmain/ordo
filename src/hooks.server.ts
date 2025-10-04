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

    const configuredBase = env.BETTER_AUTH_URL?.replace(/\/$/, "");
    const configuredHostname = (() => {
        if (!configuredBase) return undefined;
        try {
            return new URL(configuredBase).hostname;
        } catch {
            return undefined;
        }
    })();
    const cookieDomain = configuredHostname && configuredHostname !== "localhost"
        ? `.${configuredHostname}`
        : undefined;

    if (event.url.pathname.startsWith("/api/auth")) {
        const isPreviewHost = configuredHostname && event.url.hostname !== configuredHostname;

        if (
            isPreviewHost &&
            cookieDomain &&
            event.url.pathname === "/api/auth/sign-in/social"
        ) {
            // Remember the preview origin so we can bounce back after Google's callback completes on the canonical host.
            event.cookies.set("__auth_redirect_origin", event.url.origin, {
                path: "/",
                domain: cookieDomain,
                httpOnly: true,
                sameSite: "lax",
                secure: event.url.protocol === "https:",
                maxAge: 60 * 10
            });
        }

        const response = await event.locals.auth.handler(event.request);

        if (
            configuredHostname &&
            event.url.hostname === configuredHostname &&
            event.url.pathname.startsWith("/api/auth/callback")
        ) {
            const previewOrigin = event.cookies.get("__auth_redirect_origin");
            if (previewOrigin && previewOrigin !== event.url.origin) {
                // If the flow started on a preview host, rewrite the post-auth redirect to send the user back there.
                const location = response.headers.get("location");
                if (location) {
                    const fallbackBase = configuredBase ?? event.url.origin;
                    const resolvedTarget = new URL(location, fallbackBase);
                    const previewRedirect = new URL(
                        `${resolvedTarget.pathname}${resolvedTarget.search}${resolvedTarget.hash}`,
                        previewOrigin
                    );
                    response.headers.set("location", previewRedirect.toString());
                }
            }

            if (cookieDomain && previewOrigin) {
                event.cookies.delete("__auth_redirect_origin", {
                    path: "/",
                    domain: cookieDomain
                });
            }
        }

        return response;
    }

    return svelteKitHandler({ event, resolve, auth: event.locals.auth, building });
};
