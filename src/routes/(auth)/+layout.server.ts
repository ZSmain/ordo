import { redirect } from '@sveltejs/kit';

export const load = async ({locals, request}) => {
	const session = await locals.auth.api.getSession({
		headers: request.headers
	});

	console.log("Layout server session:", session);

	// If user is already authenticated, redirect to home
	if (session) {
		throw redirect(302, '/');
	}

	return {};
};
