import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { activity, activityCategory, category, timeSession } from '$lib/server/db/schema';
import { and, eq, gte, inArray, isNotNull, lt } from 'drizzle-orm';
import * as v from 'valibot';

// Get all completed sessions for a specific date
export const getSessionsForDate = query(
	v.object({
		userId: v.string(),
		date: v.string() // YYYY-MM-DD format
	}),
	async ({ userId, date }) => {
		const startOfDay = new Date(date + 'T00:00:00.000Z');
		const endOfDay = new Date(date + 'T23:59:59.999Z');

		// Get all sessions for the day
		const sessions = await db
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

		// Get all categories for the activities in these sessions
		const activityIds = [...new Set(sessions.map(s => s.activityId))];
		const activityCategories = activityIds.length > 0 ? await db
			.select({
				activityId: activityCategory.activityId,
				categoryId: category.id,
				categoryName: category.name,
				categoryColor: category.color,
				categoryIcon: category.icon
			})
			.from(activityCategory)
			.innerJoin(category, eq(activityCategory.categoryId, category.id))
			.where(inArray(activityCategory.activityId, activityIds))
			.all() : [];

		// Combine sessions with their categories
		return sessions.map(session => {
			const categories = activityCategories.filter(ac => ac.activityId === session.activityId);

			return {
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
				categories: categories.map(cat => ({
					id: cat.categoryId,
					name: cat.categoryName,
					color: cat.categoryColor,
					icon: cat.categoryIcon
				}))
			};
		});
	}
);

// Update a session's start and end times
export const updateSession = command(
	v.object({
		sessionId: v.pipe(v.number(), v.minValue(1, 'Session ID must be valid')),
		userId: v.string(),
		startedAt: v.pipe(v.string(), v.isoTimestamp('Start time must be a valid ISO timestamp')),
		stoppedAt: v.pipe(v.string(), v.isoTimestamp('End time must be a valid ISO timestamp'))
	}),
	async ({ sessionId, userId, startedAt, stoppedAt }) => {
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
			throw new Error('Session not found or does not belong to user');
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

		await getSessionsForDate({ userId, date: startDateStr }).refresh();

		// If the session spans different dates, refresh both
		if (startDateStr !== endDateStr) {
			await getSessionsForDate({ userId, date: endDateStr }).refresh();
		}

		return { success: true };
	}
);

// Delete a session
export const deleteSession = command(
	v.object({
		sessionId: v.pipe(v.number(), v.minValue(1, 'Session ID must be valid')),
		userId: v.string()
	}),
	async ({ sessionId, userId }) => {
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
			throw new Error('Session not found or does not belong to user');
		}

		// Get the date for cache invalidation before deleting
		const sessionDate = existingSession.startedAt.toISOString().split('T')[0];

		// Delete the session
		await db
			.delete(timeSession)
			.where(eq(timeSession.id, sessionId));

		// Refresh the sessions query for the date this session was on
		await getSessionsForDate({ userId, date: sessionDate }).refresh();

		return { success: true };
	}
);
