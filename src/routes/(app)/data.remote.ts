import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { activity, category, insertActivitySchema, insertCategorySchema, timeSession } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
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

// Get currently active timer session for a user
export const getActiveSession = query(
    v.string(), // userId
    async (userId) => {
        const activeSession = await db.select()
            .from(timeSession)
            .innerJoin(activity, eq(timeSession.activityId, activity.id))
            .innerJoin(category, eq(activity.categoryId, category.id))
            .where(and(
                eq(timeSession.userId, userId),
                eq(timeSession.isActive, true)
            ))
            .get();

        if (!activeSession) {
            return null;
        }

        return {
            session: activeSession.time_session,
            activity: activeSession.activity,
            category: activeSession.category
        };
    }
);

// Start timer session with activity ID
export const startTimerSession = command(
    v.object({
        activityId: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
        userId: v.string()
    }),
    async ({ activityId, userId }) => {
        // First, stop any currently active sessions for this user
        const activeSessions = await db.select()
            .from(timeSession)
            .where(and(
                eq(timeSession.userId, userId),
                eq(timeSession.isActive, true)
            ))
            .all();

        // Stop all active sessions
        for (const session of activeSessions) {
            const stoppedAt = new Date();
            const durationSeconds = Math.round((stoppedAt.getTime() - session.startedAt.getTime()) / 1000);

            await db.update(timeSession)
                .set({
                    stoppedAt,
                    duration: durationSeconds,
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(eq(timeSession.id, session.id));
        }

        // Create new active session
        const newSession = await db.insert(timeSession)
            .values({
                activityId,
                userId,
                startedAt: new Date(),
                isActive: true,
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

        if (!session || session.stoppedAt || session.userId !== userId || !session.isActive) {
            throw new Error('Session not found, already stopped, not active, or unauthorized');
        }

        const stoppedAt = new Date();
        const durationSeconds = Math.round((stoppedAt.getTime() - session.startedAt.getTime()) / 1000);

        const updatedSession = await db.update(timeSession)
            .set({
                stoppedAt,
                duration: durationSeconds,
                isActive: false,
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

// Update an existing category
export const updateCategory = command(
    v.object({
        id: v.pipe(v.number(), v.minValue(1, 'Category ID must be a positive number')),
        name: v.optional(v.pipe(
            v.string("Category name must be a string"),
            v.minLength(1, "Category name is required"),
            v.maxLength(50, "Category name must be 50 characters or less")
        )),
        color: v.optional(v.pipe(
            v.string("Color must be a string"),
            v.regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g., #FF5733)")
        )),
        icon: v.optional(v.pipe(
            v.string("Icon must be a string"),
            v.minLength(1, "Icon is required"),
            v.maxLength(10, "Icon must be 10 characters or less")
        )),
        userId: v.string()
    }),
    async ({ id, userId, ...updateData }) => {
        // Only include defined fields in the update
        const fieldsToUpdate = Object.fromEntries(
            Object.entries(updateData).filter(([, value]) => value !== undefined)
        );

        if (Object.keys(fieldsToUpdate).length === 0) {
            throw new Error('No fields to update');
        }

        const updatedCategory = await db.update(category)
            .set({
                ...fieldsToUpdate,
                updatedAt: new Date(),
            })
            .where(eq(category.id, id))
            .returning()
            .get();

        if (!updatedCategory || updatedCategory.userId !== userId) {
            throw new Error('Category not found or unauthorized');
        }

        return updatedCategory;
    }
);

// Delete a category
export const deleteCategory = command(
    v.object({
        id: v.pipe(v.number(), v.minValue(1, 'Category ID must be a positive number')),
        userId: v.string()
    }),
    async ({ id, userId }) => {
        // First check if the category exists and belongs to the user
        const existingCategory = await db.select()
            .from(category)
            .where(eq(category.id, id))
            .get();

        if (!existingCategory || existingCategory.userId !== userId) {
            throw new Error('Category not found or unauthorized');
        }

        // Delete the category (activities will be cascaded due to foreign key constraint)
        const deletedCategory = await db.delete(category)
            .where(eq(category.id, id))
            .returning()
            .get();

        return deletedCategory;
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

// Update an existing activity
export const updateActivity = command(
    v.object({
        id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
        name: v.optional(v.pipe(
            v.string("Activity name must be a string"),
            v.minLength(1, "Activity name is required"),
            v.maxLength(100, "Activity name must be 100 characters or less")
        )),
        icon: v.optional(v.pipe(
            v.string("Icon must be a string"),
            v.minLength(1, "Icon is required"),
            v.maxLength(10, "Icon must be 10 characters or less")
        )),
        dailyGoal: v.optional(v.pipe(
            v.number("Daily goal must be a number"),
            v.minValue(1, "Daily goal must be at least 1 minute")
        )),
        weeklyGoal: v.optional(v.pipe(
            v.number("Weekly goal must be a number"),
            v.minValue(1, "Weekly goal must be at least 1 minute")
        )),
        monthlyGoal: v.optional(v.pipe(
            v.number("Monthly goal must be a number"),
            v.minValue(1, "Monthly goal must be at least 1 minute")
        )),
        archived: v.optional(v.boolean("Archived must be a boolean")),
        userId: v.string()
    }),
    async ({ id, userId, ...updateData }) => {
        // Only include defined fields in the update
        const fieldsToUpdate = Object.fromEntries(
            Object.entries(updateData).filter(([, value]) => value !== undefined)
        );

        if (Object.keys(fieldsToUpdate).length === 0) {
            throw new Error('No fields to update');
        }

        const updatedActivity = await db.update(activity)
            .set({
                ...fieldsToUpdate,
                updatedAt: new Date(),
            })
            .where(eq(activity.id, id))
            .returning()
            .get();

        if (!updatedActivity || updatedActivity.userId !== userId) {
            throw new Error('Activity not found or unauthorized');
        }

        return updatedActivity;
    }
);

// Archive/unarchive an activity
export const archiveActivity = command(
    v.object({
        id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
        archived: v.boolean("Archived must be a boolean"),
        userId: v.string()
    }),
    async ({ id, archived, userId }) => {
        const updatedActivity = await db.update(activity)
            .set({
                archived,
                updatedAt: new Date(),
            })
            .where(eq(activity.id, id))
            .returning()
            .get();

        if (!updatedActivity || updatedActivity.userId !== userId) {
            throw new Error('Activity not found or unauthorized');
        }

        return updatedActivity;
    }
);

// Delete an activity
export const deleteActivity = command(
    v.object({
        id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
        userId: v.string()
    }),
    async ({ id, userId }) => {
        // First check if the activity exists and belongs to the user
        const existingActivity = await db.select()
            .from(activity)
            .where(eq(activity.id, id))
            .get();

        if (!existingActivity || existingActivity.userId !== userId) {
            throw new Error('Activity not found or unauthorized');
        }

        // Delete the activity (time sessions will be cascaded due to foreign key constraint)
        const deletedActivity = await db.delete(activity)
            .where(eq(activity.id, id))
            .returning()
            .get();

        return deletedActivity;
    }
);
