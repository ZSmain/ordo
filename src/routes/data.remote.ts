import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { activity, category, timeSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

// Return all categories with their activities
export const getCategoriesWithActivities = query(async () => {
    const categories = await db.select().from(category).all();
    const activities = await db.select().from(activity).all();
    
    const categoriesWithActivities = categories.map(cat => {
        const categoryActivities = activities.filter(act => act.categoryId === cat.id);
        return {
            ...cat,
            activities: categoryActivities
        };
    });
    
    return categoriesWithActivities;
});

// Command to start timer session with activity ID
export const startTimerSession = command(
    v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
    async (activityId) => {
        const newSession = await db.insert(timeSession)
            .values({
                activityId,
                startedAt: new Date(),
            })
            .returning()
            .get();
        
        return newSession;
    }
);

// Command to stop timer session with session ID
export const stopTimerSession = command(
    v.pipe(v.number(), v.minValue(1, 'Session ID must be a positive number')),
    async (sessionId) => {
        const session = await db.select()
            .from(timeSession)
            .where(eq(timeSession.id, sessionId))
            .get();
        
        if (!session || session.stoppedAt) {
            throw new Error('Session not found or already stopped');
        }
        
        const stoppedAt = new Date();
        const durationMinutes = Math.round((stoppedAt.getTime() - session.startedAt.getTime()) / (1000 * 60));
        
        const updatedSession = await db.update(timeSession)
            .set({
                stoppedAt,
                duration: durationMinutes,
                updatedAt: new Date(),
            })
            .where(eq(timeSession.id, sessionId))
            .returning()
            .get();
        
        return updatedSession;
    }
);
