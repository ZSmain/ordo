import { redirect } from '@sveltejs/kit';

export const load = async ({locals, request}) => {
    const session = await locals.auth.api.getSession({
        headers: request.headers
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