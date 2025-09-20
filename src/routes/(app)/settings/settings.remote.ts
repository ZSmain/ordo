import { command } from '$app/server';
import { db } from '$lib/server/db';
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

// Delete user account and all associated data
export const deleteUserAccount = command(
	v.string(), // userId
	async (userId) => {
		try {
			// Start a transaction to delete all user data in the correct order
			await db.transaction(async (tx) => {
				// Delete time sessions (must be deleted first due to foreign key constraints)
				await tx.delete(timeSession).where(eq(timeSession.userId, userId));

				// Delete activities
				await tx.delete(activity).where(eq(activity.userId, userId));

				// Delete categories
				await tx.delete(category).where(eq(category.userId, userId));

				// Delete user sessions
				await tx.delete(session).where(eq(session.userId, userId));

				// Delete user accounts (auth accounts)
				await tx.delete(account).where(eq(account.userId, userId));

				// Get user email for verification cleanup
				const userData = await tx.select().from(user).where(eq(user.id, userId)).get();
				if (userData?.email) {
					// Delete user verification records
					await tx.delete(verification).where(eq(verification.identifier, userData.email));
				}

				// Finally, delete the user
				await tx.delete(user).where(eq(user.id, userId));
			});

			return { success: true };
		} catch (error) {
			console.error('Failed to delete account:', error);
		}
	}
);
