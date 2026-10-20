import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { requireOwnedActivity, requireOwnedSession } from './access.js';
import { timeSession } from './db/schema.js';

type Db = App.Locals['db'];

/** Single duration formula for the whole session lifecycle. Floor so we never over-credit. */
export function calcDurationSeconds(start: Date, end: Date): number {
	return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

function assertValidRange(start: Date, end: Date, now: Date): void {
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		throw new Error('Start and end times must be valid dates');
	}

	if (end <= start) {
		throw new Error('End time must be after start time');
	}

	if (start > now) {
		throw new Error('Start time cannot be in the future');
	}

	if (end > now) {
		throw new Error('End time cannot be in the future');
	}
}

function assertTrackableActivity(activityRow: { archived: boolean }): void {
	if (activityRow.archived) {
		error(400, 'Cannot track time for an archived activity');
	}
}

export async function createManualSession(
	db: Db,
	userId: string,
	input: { activityId: number; start: Date; end: Date; notes?: string | null; now?: Date }
) {
	const now = input.now ?? new Date();
	assertValidRange(input.start, input.end, now);

	const ownedActivity = await requireOwnedActivity(db, userId, input.activityId);
	assertTrackableActivity(ownedActivity);

	return await db
		.insert(timeSession)
		.values({
			activityId: input.activityId,
			userId,
			startedAt: input.start,
			stoppedAt: input.end,
			duration: calcDurationSeconds(input.start, input.end),
			isActive: false,
			notes: input.notes || null
		})
		.returning()
		.get();
}

export async function rescheduleSession(
	db: Db,
	userId: string,
	input: { sessionId: number; start: Date; end: Date; now?: Date }
) {
	const now = input.now ?? new Date();
	assertValidRange(input.start, input.end, now);

	await requireOwnedSession(db, userId, input.sessionId);

	return await db
		.update(timeSession)
		.set({
			startedAt: input.start,
			stoppedAt: input.end,
			duration: calcDurationSeconds(input.start, input.end),
			isActive: false,
			updatedAt: now
		})
		.where(eq(timeSession.id, input.sessionId))
		.returning()
		.get();
}

export async function startActiveSession(
	db: Db,
	userId: string,
	input: { activityId: number; now?: Date }
) {
	const now = input.now ?? new Date();

	const ownedActivity = await requireOwnedActivity(db, userId, input.activityId);
	assertTrackableActivity(ownedActivity);

	const activeSessions = await db
		.select()
		.from(timeSession)
		.where(and(eq(timeSession.userId, userId), eq(timeSession.isActive, true)))
		.all();

	for (const session of activeSessions) {
		await db
			.update(timeSession)
			.set({
				stoppedAt: now,
				duration: calcDurationSeconds(session.startedAt, now),
				isActive: false,
				updatedAt: now
			})
			.where(eq(timeSession.id, session.id));
	}

	return await db
		.insert(timeSession)
		.values({
			activityId: input.activityId,
			userId,
			startedAt: now,
			isActive: true
		})
		.returning()
		.get();
}

export async function stopActiveSession(
	db: Db,
	userId: string,
	input: { sessionId: number; now?: Date }
) {
	const now = input.now ?? new Date();

	const session = await requireOwnedSession(db, userId, input.sessionId);

	if (session.stoppedAt || !session.isActive) {
		error(404, 'Active session not found');
	}

	return await db
		.update(timeSession)
		.set({
			stoppedAt: now,
			duration: calcDurationSeconds(session.startedAt, now),
			isActive: false,
			updatedAt: now
		})
		.where(eq(timeSession.id, input.sessionId))
		.returning()
		.get();
}
