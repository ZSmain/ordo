import { command } from '$app/server';
import { error } from '@sveltejs/kit';
import { getRemoteContext } from '$lib/server/remote';
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
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

type TransactionClient = Parameters<Parameters<DrizzleClient['transaction']>[0]>[0];

export const deleteUserAccount = command(async () => {
	const { db, user: currentUser } = getRemoteContext();
	const userId = currentUser.id;

	try {
		await db.transaction(async (tx: TransactionClient) => {
			// Delete time sessions (must be deleted first due to foreign key constraints)
			await tx.delete(timeSession).where(eq(timeSession.userId, userId));

			await tx.delete(activity).where(eq(activity.userId, userId));

			await tx.delete(category).where(eq(category.userId, userId));

			await tx.delete(session).where(eq(session.userId, userId));

			await tx.delete(account).where(eq(account.userId, userId));

			if (currentUser.email) {
				await tx.delete(verification).where(eq(verification.identifier, currentUser.email));
			}

			await tx.delete(user).where(eq(user.id, userId));
		});

		return { success: true };
	} catch (cause) {
		console.error('Failed to delete account:', cause);
		error(500, 'Failed to delete account');
	}
});
