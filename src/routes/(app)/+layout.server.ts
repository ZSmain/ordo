import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export const load = async (event: RequestEvent) => {
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    // If user is not authenticated, redirect to login
    if (!session) {
        throw redirect(302, '/login');
    }

    return {
        session,
        user: session.user
    };
};