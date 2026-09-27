import { redirect } from '@sveltejs/kit';

export const load = async ({locals, request}) => {
	const session = await locals.auth.api.getSession({
		headers: request.headers
	});

	if (session) {
		throw redirect(302, '/');
	}

	return {};
};
