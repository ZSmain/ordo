import { auth } from '$lib/auth';
import type { RequestEvent } from '@sveltejs/kit';

export const load = async (event: RequestEvent) => {
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    return {
        session
    };
};