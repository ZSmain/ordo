import { command, query } from '$app/server';
import { error } from '@sveltejs/kit';
import {
	getCategoriesForActivityIds,
	hydrateActivitiesWithCategories
} from '$lib/server/activity-catalog';
import { getRemoteContext } from '$lib/server/remote';
import { activity, timeSession } from '$lib/server/db/schema';
import { and, desc, eq, gte, isNotNull, lt } from 'drizzle-orm';
import * as v from 'valibot';

// Get all activities with their categories for the current user (for manual session entry)
export const getActivitiesForUser = query(async () => {
	const { db, user } = getRemoteContext();
	const userId = user.id;

	// Get all non-archived activities for the user
	const activities: Array<{ id: number; name: string; icon: string }> = await db
		.select({
			id: activity.id,
			name: activity.name,
			icon: activity.icon
		})
		.from(activity)
		.where(and(eq(activity.userId, userId), eq(activity.archived, false)))
		.orderBy(desc(activity.favorite), activity.name)
		.all();

	if (activities.length === 0) {
		return [];
	}

	const categoriesByActivityId = await getCategoriesForActivityIds(
		db,
		activities.map((item) => item.id)
	);

	return hydrateActivitiesWithCategories(activities, categoriesByActivityId);
});

// Create a manual session (for logging past activities)
export const createManualSession = command(
	v.object({
		activityId: v.pipe(v.number(), v.minValue(1, 'Activity ID must be valid')),
		startedAt: v.pipe(v.string(), v.isoTimestamp('Start time must be a valid ISO timestamp')),
		stoppedAt: v.pipe(v.string(), v.isoTimestamp('End time must be a valid ISO timestamp')),
		notes: v.optional(
			v.pipe(
				v.string('Notes must be a string'),
				v.maxLength(500, 'Notes must be 500 characters or less')
			)
		)
	}),
	async ({ activityId, startedAt, stoppedAt, notes }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const startDate = new Date(startedAt);
		const endDate = new Date(stoppedAt);

		// Validate that end time is after start time
		if (endDate <= startDate) {
			throw new Error('End time must be after start time');
		}

		// Validate that start time is not in the future
		if (startDate > new Date()) {
			throw new Error('Start time cannot be in the future');
		}

		// Calculate duration in seconds
		const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

		// Verify the activity belongs to the user
		const existingActivity = await db
			.select({ id: activity.id })
			.from(activity)
			.where(and(eq(activity.id, activityId), eq(activity.userId, userId)))
			.get();

		if (!existingActivity) {
			error(404, 'Activity not found');
		}

		// Create the session
		const newSession = await db
			.insert(timeSession)
			.values({
				activityId,
				userId,
				startedAt: startDate,
				stoppedAt: endDate,
				duration,
				isActive: false,
				notes: notes || null
			})
			.returning()
			.get();

		// Refresh the sessions query for the date
		const sessionDateStr = startDate.toISOString().split('T')[0];
		await getSessionsForDate({ date: sessionDateStr }).refresh();

		return newSession;
	}
);

// Get all completed sessions for a specific date
export const getSessionsForDate = query(
	v.object({
		date: v.string() // YYYY-MM-DD format
	}),
	async ({ date }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const startOfDay = new Date(date + 'T00:00:00.000Z');
		const endOfDay = new Date(date + 'T23:59:59.999Z');

		// Get all sessions for the day
		const sessions: Array<{
			id: number;
			startedAt: Date;
			stoppedAt: Date | null;
			duration: number | null;
			notes: string | null;
			activityId: number;
			activityName: string;
			activityIcon: string;
		}> = await db
			.select({
				id: timeSession.id,
				startedAt: timeSession.startedAt,
				stoppedAt: timeSession.stoppedAt,
				duration: timeSession.duration,
				notes: timeSession.notes,
				activityId: activity.id,
				activityName: activity.name,
				activityIcon: activity.icon
			})
			.from(timeSession)
			.innerJoin(activity, eq(timeSession.activityId, activity.id))
			.where(
				and(
					eq(timeSession.userId, userId),
					gte(timeSession.startedAt, startOfDay),
					lt(timeSession.startedAt, endOfDay),
					isNotNull(timeSession.stoppedAt) // Only completed sessions
				)
			)
			.orderBy(timeSession.startedAt)
			.all();

		const categoriesByActivityId = await getCategoriesForActivityIds(db, [
			...new Set(sessions.map((session: (typeof sessions)[number]) => session.activityId))
		]);

		return sessions.map((session: (typeof sessions)[number]) => ({
			id: session.id,
			startedAt: session.startedAt,
			stoppedAt: session.stoppedAt,
			duration: session.duration,
			notes: session.notes,
			activity: {
				id: session.activityId,
				name: session.activityName,
				icon: session.activityIcon
			},
			categories: categoriesByActivityId.get(session.activityId) ?? []
		}));
	}
);

// Update a session's start and end times
export const updateSession = command(
	v.object({
		sessionId: v.pipe(v.number(), v.minValue(1, 'Session ID must be valid')),
		startedAt: v.pipe(v.string(), v.isoTimestamp('Start time must be a valid ISO timestamp')),
		stoppedAt: v.pipe(v.string(), v.isoTimestamp('End time must be a valid ISO timestamp'))
	}),
	async ({ sessionId, startedAt, stoppedAt }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const startDate = new Date(startedAt);
		const endDate = new Date(stoppedAt);

		// Validate that end time is after start time
		if (endDate <= startDate) {
			throw new Error('End time must be after start time');
		}

		// Calculate duration in seconds
		const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

		// Verify the session belongs to the user
		const existingSession = await db
			.select({ id: timeSession.id })
			.from(timeSession)
			.where(and(eq(timeSession.id, sessionId), eq(timeSession.userId, userId)))
			.get();

		if (!existingSession) {
			error(404, 'Session not found');
		}

		// Update the session
		await db
			.update(timeSession)
			.set({
				startedAt: startDate,
				stoppedAt: endDate,
				duration,
				updatedAt: new Date()
			})
			.where(eq(timeSession.id, sessionId));

		// Refresh the sessions query for both start and end dates
		// (in case the session was moved to a different date)
		const startDateStr = startDate.toISOString().split('T')[0];
		const endDateStr = endDate.toISOString().split('T')[0];

		await getSessionsForDate({ date: startDateStr }).refresh();

		// If the session spans different dates, refresh both
		if (startDateStr !== endDateStr) {
			await getSessionsForDate({ date: endDateStr }).refresh();
		}

		return { success: true };
	}
);

// Delete a session
export const deleteSession = command(
	v.object({
		sessionId: v.pipe(v.number(), v.minValue(1, 'Session ID must be valid'))
	}),
	async ({ sessionId }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		// Verify the session belongs to the user and get session details for cache invalidation
		const existingSession = await db
			.select({
				id: timeSession.id,
				startedAt: timeSession.startedAt
			})
			.from(timeSession)
			.where(and(eq(timeSession.id, sessionId), eq(timeSession.userId, userId)))
			.get();

		if (!existingSession) {
			error(404, 'Session not found');
		}

		// Get the date for cache invalidation before deleting
		const sessionDate = existingSession.startedAt.toISOString().split('T')[0];

		// Delete the session
		await db.delete(timeSession).where(eq(timeSession.id, sessionId));

		// Refresh the sessions query for the date this session was on
		await getSessionsForDate({ date: sessionDate }).refresh();

		return { success: true };
	}
);
