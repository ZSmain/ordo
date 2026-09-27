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

export const getActivitiesForUser = query(async () => {
	const { db, user } = getRemoteContext();
	const userId = user.id;

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

		if (endDate <= startDate) {
			throw new Error('End time must be after start time');
		}

		if (startDate > new Date()) {
			throw new Error('Start time cannot be in the future');
		}

		const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

		const existingActivity = await db
			.select({ id: activity.id })
			.from(activity)
			.where(and(eq(activity.id, activityId), eq(activity.userId, userId)))
			.get();

		if (!existingActivity) {
			error(404, 'Activity not found');
		}

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

		const sessionDateStr = startDate.toISOString().split('T')[0];
		await getSessionsForDate({ date: sessionDateStr }).refresh();

		return newSession;
	}
);

export const getSessionsForDate = query(
	v.object({
		date: v.string()
	}),
	async ({ date }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const startOfDay = new Date(date + 'T00:00:00.000Z');
		const endOfDay = new Date(date + 'T23:59:59.999Z');

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
					isNotNull(timeSession.stoppedAt)
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

		if (endDate <= startDate) {
			throw new Error('End time must be after start time');
		}

		const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

		const existingSession = await db
			.select({ id: timeSession.id })
			.from(timeSession)
			.where(and(eq(timeSession.id, sessionId), eq(timeSession.userId, userId)))
			.get();

		if (!existingSession) {
			error(404, 'Session not found');
		}

		await db
			.update(timeSession)
			.set({
				startedAt: startDate,
				stoppedAt: endDate,
				duration,
				updatedAt: new Date()
			})
			.where(eq(timeSession.id, sessionId));

		const startDateStr = startDate.toISOString().split('T')[0];
		const endDateStr = endDate.toISOString().split('T')[0];

		await getSessionsForDate({ date: startDateStr }).refresh();

		if (startDateStr !== endDateStr) {
			await getSessionsForDate({ date: endDateStr }).refresh();
		}

		return { success: true };
	}
);

export const deleteSession = command(
	v.object({
		sessionId: v.pipe(v.number(), v.minValue(1, 'Session ID must be valid'))
	}),
	async ({ sessionId }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

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

		const sessionDate = existingSession.startedAt.toISOString().split('T')[0];

		await db.delete(timeSession).where(eq(timeSession.id, sessionId));

		await getSessionsForDate({ date: sessionDate }).refresh();

		return { success: true };
	}
);
