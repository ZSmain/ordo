import { query } from '$app/server';
import { db } from '$lib/server/db';
import { activity, category, timeSession } from '$lib/server/db/schema';
import { and, eq, gte, isNotNull, lt } from 'drizzle-orm';
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

        const sessions = await db.select({
            id: timeSession.id,
            startedAt: timeSession.startedAt,
            stoppedAt: timeSession.stoppedAt,
            duration: timeSession.duration,
            notes: timeSession.notes,
            activity: {
                id: activity.id,
                name: activity.name,
                icon: activity.icon
            },
            category: {
                id: category.id,
                name: category.name,
                color: category.color,
                icon: category.icon
            }
        })
            .from(timeSession)
            .innerJoin(activity, eq(timeSession.activityId, activity.id))
            .innerJoin(category, eq(activity.categoryId, category.id))
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

        return sessions;
    }
);