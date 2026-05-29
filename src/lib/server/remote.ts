import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';

export function getRemoteContext() {
	const event = getRequestEvent();
	const user = event.locals.user;

	if (!user) {
		error(401, 'Unauthorized');
	}

	return {
		event,
		db: event.locals.db,
		user
	};
}
