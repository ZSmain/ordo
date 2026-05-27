import { getAuthErrorMessage, isMissingSessionError } from '$lib/server/auth-actions';
import type { DrizzleClient } from '$lib/server/db';
import {
	account,
	activity,
	category,
	session,
	timeSession,
	user,
	verification
} from '$lib/server/db/schema';
import type { Actions } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

type TransactionClient = Parameters<Parameters<DrizzleClient['transaction']>[0]>[0];

export const actions: Actions = {
	signOut: async (event) => {
		try {
			await event.locals.auth.api.signOut({
				headers: event.request.headers
			});
		} catch (error) {
			if (!isMissingSessionError(error)) {
				return fail(400, {
					action: 'signOut',
					message: getAuthErrorMessage(error, 'Sign out failed')
				});
			}
		}

		throw redirect(303, '/login');
	},
	deleteAccount: async (event) => {
		const userId = event.locals.user?.id;
		const userEmail = event.locals.user?.email;

		if (!userId) {
			throw redirect(303, '/login');
		}

		try {
			await event.locals.db.transaction(async (tx: TransactionClient) => {
				await tx.delete(timeSession).where(eq(timeSession.userId, userId));
				await tx.delete(activity).where(eq(activity.userId, userId));
				await tx.delete(category).where(eq(category.userId, userId));
				await tx.delete(session).where(eq(session.userId, userId));
				await tx.delete(account).where(eq(account.userId, userId));

				if (userEmail) {
					await tx.delete(verification).where(eq(verification.identifier, userEmail));
				}

				await tx.delete(user).where(eq(user.id, userId));
			});
		} catch (error) {
			console.error('Failed to delete account:', error);
			return fail(500, {
				action: 'deleteAccount',
				message: getAuthErrorMessage(error, 'Failed to delete account')
			});
		}

		try {
			await event.locals.auth.api.signOut({
				headers: event.request.headers
			});
		} catch (error) {
			if (!isMissingSessionError(error)) {
				console.error('Sign out after account deletion failed:', error);
			}
		}

		throw redirect(303, '/login');
	}
};
