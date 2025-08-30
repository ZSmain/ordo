import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { activity, category, insertActivitySchema, insertCategorySchema, timeSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

// Return all categories with their activities for the current user
export const getCategoriesWithActivities = query(
    v.string(), // userId
    async (userId) => {
        const categories = await db.select().from(category).where(eq(category.userId, userId)).all();
        const activities = await db.select().from(activity).where(eq(activity.userId, userId)).all();

        const categoriesWithActivities = categories.map(cat => {
            const categoryActivities = activities.filter(act => act.categoryId === cat.id);
            return {
                ...cat,
                activities: categoryActivities
            };
        });

        return categoriesWithActivities;
    }
);

// Start timer session with activity ID
export const startTimerSession = command(
    v.object({
        activityId: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
        userId: v.string()
    }),
    async ({ activityId, userId }) => {
        const newSession = await db.insert(timeSession)
            .values({
                activityId,
                userId,
                startedAt: new Date(),
            })
            .returning()
            .get();

        return newSession;
    }
);

// Stop session timer with session ID
export const stopTimerSession = command(
    v.object({
        sessionId: v.pipe(v.number(), v.minValue(1, 'Session ID must be a positive number')),
        userId: v.string()
    }),
    async ({ sessionId, userId }) => {
        const session = await db.select()
            .from(timeSession)
            .where(eq(timeSession.id, sessionId))
            .get();

        if (!session || session.stoppedAt || session.userId !== userId) {
            throw new Error('Session not found, already stopped, or unauthorized');
        }

        const stoppedAt = new Date();
        const durationSeconds = Math.round((stoppedAt.getTime() - session.startedAt.getTime()) / 1000);

        const updatedSession = await db.update(timeSession)
            .set({
                stoppedAt,
                duration: durationSeconds,
                updatedAt: new Date(),
            })
            .where(eq(timeSession.id, sessionId))
            .returning()
            .get();

        return updatedSession;
    }
);

// Create a new category
export const createCategory = command(
    v.object({
        ...insertCategorySchema.entries,
        userId: v.string()
    }),
    async (categoryData) => {
        const newCategory = await db.insert(category)
            .values(categoryData)
            .returning()
            .get();

        return newCategory;
    }
);

// Create a new activity
export const createActivity = command(
    v.object({
        ...insertActivitySchema.entries,
        userId: v.string()
    }),
    async (activityData) => {
        const newActivity = await db.insert(activity)
            .values(activityData)
            .returning()
            .get();

        return newActivity;
    }
);
