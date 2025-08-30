import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite"
    }),
    emailAndPassword: {
        enabled: true
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,
    plugins: [
        sveltekitCookies(getRequestEvent)
    ]
});