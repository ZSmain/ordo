import { auth } from '$lib/auth';
import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const load = async (event: RequestEvent) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	// If user is already authenticated, redirect to home
	if (session) {
		throw redirect(302, '/');
	}

	return {};
};
