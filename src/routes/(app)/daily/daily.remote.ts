import { query } from '$app/server';
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
