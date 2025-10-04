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
        let request = event.request;

        if (isPreviewHost && configuredHostname && configuredBase) {
            const baseUrl = new URL(configuredBase);
            const canonicalUrl = new URL(event.request.url);
            canonicalUrl.protocol = baseUrl.protocol;
            canonicalUrl.host = baseUrl.host;

            const rehostedRequest = new Request(canonicalUrl.toString(), request);
            const headers = new Headers(rehostedRequest.headers);
            headers.set("host", baseUrl.host);
            headers.set("origin", baseUrl.origin);
            headers.set(
                "referer",
                `${baseUrl.origin}${event.url.pathname}${event.url.search}`
            );

            request = new Request(rehostedRequest, { headers });
        }

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

        const response = await event.locals.auth.handler(request);

        if (
            configuredHostname &&
            event.url.hostname === configuredHostname &&
            event.url.pathname.startsWith("/api/auth/callback")
        ) {
            const previewOrigin = event.cookies.get("__auth_redirect_origin");
            if (previewOrigin && previewOrigin !== event.url.origin) {
                const location = response.headers.get("location") ?? "/";
                const fallbackBase = configuredBase ?? event.url.origin;
                const resolvedTarget = new URL(location, fallbackBase);
                const previewRedirect = new URL(
                    `${resolvedTarget.pathname}${resolvedTarget.search}${resolvedTarget.hash}`,
                    previewOrigin
                );

                if (cookieDomain) {
                    event.cookies.delete("__auth_redirect_origin", {
                        path: "/",
                        domain: cookieDomain
                    });
                }

                return Response.redirect(previewRedirect.toString(), 303);
            }
        }

        return response;
    }

    return svelteKitHandler({ event, resolve, auth: event.locals.auth, building });
};
