import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import {
	activity,
	activityCategory,
	category,
	insertActivitySchema,
	insertCategorySchema,
	timeSession
} from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import * as v from 'valibot';

// Return all categories with their activities for the current user
export const getCategoriesWithActivities = query(
	v.string(), // userId
	async (userId) => {
		// Get all categories for the user
		const categories = await db.select().from(category).where(eq(category.userId, userId)).all();

		// Get all activities with their associated categories in a single optimized query
		const activitiesWithCategories = await db
			.select({
				activity: activity,
				category: category
			})
			.from(activity)
			.leftJoin(activityCategory, eq(activity.id, activityCategory.activityId))
			.leftJoin(category, eq(activityCategory.categoryId, category.id))
			.where(eq(activity.userId, userId))
			.orderBy(activity.id, category.id)
			.all();

		// Group activities by their ID and collect their categories
		const activitiesMap = new Map();

		for (const item of activitiesWithCategories) {
			const activityId = item.activity.id;

			if (!activitiesMap.has(activityId)) {
				activitiesMap.set(activityId, {
					...item.activity,
					categories: []
				});
			}

			// Add category if it exists and isn't already in the list
			if (item.category) {
				const activity = activitiesMap.get(activityId);
				if (!activity.categories.find((c: typeof item.category) => c.id === item.category!.id)) {
					activity.categories.push(item.category);
				}
			}
		}

		// Convert map to array and group by category
		const activities = Array.from(activitiesMap.values());

		// Group activities by category
		const categoriesWithActivities = categories.map((cat) => {
			const categoryActivities = activities.filter((activity) =>
				activity.categories.some((c: typeof cat) => c.id === cat.id)
			);

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
		// First get the active session with activity
		const activeSession = await db
			.select({
				timeSession: timeSession,
				activity: activity
			})
			.from(timeSession)
			.innerJoin(activity, eq(timeSession.activityId, activity.id))
			.where(and(eq(timeSession.userId, userId), eq(timeSession.isActive, true)))
			.get();

		if (!activeSession) {
			return null;
		}

		// Then get the categories for this activity
		const activityCategories = await db
			.select({
				categoryData: category
			})
			.from(activityCategory)
			.leftJoin(category, eq(activityCategory.categoryId, category.id))
			.where(eq(activityCategory.activityId, activeSession.activity.id))
			.all();

		// Use the first category if available, otherwise provide a default category
		const categoryData =
			activityCategories.length > 0 && activityCategories[0].categoryData
				? activityCategories[0].categoryData
				: { name: 'Uncategorized' };

		return {
			session: activeSession.timeSession,
			activity: activeSession.activity,
			category: categoryData
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
		// Use a transaction to ensure both stopping old sessions and creating new one succeed or fail together
		const newSession = await db.transaction(async (tx) => {
			// First, stop any currently active sessions for this user
			const activeSessions = await tx
				.select()
				.from(timeSession)
				.where(and(eq(timeSession.userId, userId), eq(timeSession.isActive, true)))
				.all();

			// Stop all active sessions
			for (const session of activeSessions) {
				const stoppedAt = new Date();
				const durationSeconds = Math.round(
					(stoppedAt.getTime() - session.startedAt.getTime()) / 1000
				);

				await tx
					.update(timeSession)
					.set({
						stoppedAt,
						duration: durationSeconds,
						isActive: false,
						updatedAt: new Date()
					})
					.where(eq(timeSession.id, session.id));
			}

			// Create new active session
			const newSession = await tx
				.insert(timeSession)
				.values({
					activityId,
					userId,
					startedAt: new Date(),
					isActive: true
				})
				.returning()
				.get();

			return newSession;
		});

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
		const session = await db.select().from(timeSession).where(eq(timeSession.id, sessionId)).get();

		if (!session || session.stoppedAt || session.userId !== userId || !session.isActive) {
			throw new Error('Session not found, already stopped, not active, or unauthorized');
		}

		const stoppedAt = new Date();
		const durationSeconds = Math.round((stoppedAt.getTime() - session.startedAt.getTime()) / 1000);

		const updatedSession = await db
			.update(timeSession)
			.set({
				stoppedAt,
				duration: durationSeconds,
				isActive: false,
				updatedAt: new Date()
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
		const newCategory = await db.insert(category).values(categoryData).returning().get();

		return newCategory;
	}
);

// Update an existing category
export const updateCategory = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Category ID must be a positive number')),
		name: v.optional(
			v.pipe(
				v.string('Category name must be a string'),
				v.minLength(1, 'Category name is required'),
				v.maxLength(50, 'Category name must be 50 characters or less')
			)
		),
		color: v.optional(
			v.pipe(
				v.string('Color must be a string'),
				v.regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
			)
		),
		icon: v.optional(
			v.pipe(
				v.string('Icon must be a string'),
				v.minLength(1, 'Icon is required'),
				v.maxLength(10, 'Icon must be 10 characters or less')
			)
		),
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

		const updatedCategory = await db
			.update(category)
			.set({
				...fieldsToUpdate,
				updatedAt: new Date()
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
		const existingCategory = await db.select().from(category).where(eq(category.id, id)).get();

		if (!existingCategory || existingCategory.userId !== userId) {
			throw new Error('Category not found or unauthorized');
		}

		// Delete the category (activities will be cascaded due to foreign key constraint)
		const deletedCategory = await db.delete(category).where(eq(category.id, id)).returning().get();

		return deletedCategory;
	}
);

// Create a new activity
export const createActivity = command(
	v.object({
		...insertActivitySchema.entries,
		userId: v.string(),
		categoryIds: v.optional(v.array(v.number('Category ID must be a number')))
	}),
	async (activityData) => {
		const { categoryIds, ...activityFields } = activityData;

		// Create the activity
		const newActivity = await db.insert(activity).values(activityFields).returning().get();

		// If categoryIds are provided, create the activity-category relationships
		if (categoryIds && categoryIds.length > 0) {
			const activityCategoryData = categoryIds.map((categoryId) => ({
				activityId: newActivity.id,
				categoryId,
				userId: activityFields.userId
			}));

			await db.insert(activityCategory).values(activityCategoryData);
		}

		return newActivity;
	}
);

// Update an existing activity
export const updateActivity = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
		name: v.optional(
			v.pipe(
				v.string('Activity name must be a string'),
				v.minLength(1, 'Activity name is required'),
				v.maxLength(100, 'Activity name must be 100 characters or less')
			)
		),
		icon: v.optional(
			v.pipe(
				v.string('Icon must be a string'),
				v.minLength(1, 'Icon is required'),
				v.maxLength(10, 'Icon must be 10 characters or less')
			)
		),
		dailyGoal: v.optional(
			v.pipe(
				v.number('Daily goal must be a number'),
				v.minValue(1, 'Daily goal must be at least 1 minute')
			)
		),
		weeklyGoal: v.optional(
			v.pipe(
				v.number('Weekly goal must be a number'),
				v.minValue(1, 'Weekly goal must be at least 1 minute')
			)
		),
		monthlyGoal: v.optional(
			v.pipe(
				v.number('Monthly goal must be a number'),
				v.minValue(1, 'Monthly goal must be at least 1 minute')
			)
		),
		archived: v.optional(v.boolean('Archived must be a boolean')),
		userId: v.string(),
		categoryIds: v.optional(v.array(v.number('Category ID must be a number')))
	}),
	async ({ id, userId, categoryIds, ...updateData }) => {
		// Only include defined fields in the update
		const fieldsToUpdate = Object.fromEntries(
			Object.entries(updateData).filter(([, value]) => value !== undefined)
		);

		if (Object.keys(fieldsToUpdate).length === 0 && !categoryIds) {
			throw new Error('No fields to update');
		}

		// Use a transaction to update both activity and its categories
		const updatedActivity = await db.transaction(async (tx) => {
			// Update the activity
			const activityUpdate = await tx
				.update(activity)
				.set({
					...fieldsToUpdate,
					updatedAt: new Date()
				})
				.where(eq(activity.id, id))
				.returning()
				.get();

			if (!activityUpdate || activityUpdate.userId !== userId) {
				throw new Error('Activity not found or unauthorized');
			}

			// Update categories if provided
			if (categoryIds) {
				// First, delete existing category relationships
				await tx.delete(activityCategory).where(eq(activityCategory.activityId, id));

				// Then, create new category relationships
				if (categoryIds.length > 0) {
					const activityCategoryData = categoryIds.map((categoryId) => ({
						activityId: id,
						categoryId,
						userId
					}));

					await tx.insert(activityCategory).values(activityCategoryData);
				}
			}

			return activityUpdate;
		});

		return updatedActivity;
	}
);

// Archive/unarchive an activity
export const archiveActivity = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
		archived: v.boolean('Archived must be a boolean'),
		userId: v.string()
	}),
	async ({ id, archived, userId }) => {
		const updatedActivity = await db
			.update(activity)
			.set({
				archived,
				updatedAt: new Date()
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
		const existingActivity = await db.select().from(activity).where(eq(activity.id, id)).get();

		if (!existingActivity || existingActivity.userId !== userId) {
			throw new Error('Activity not found or unauthorized');
		}

		// Delete the activity (time sessions will be cascaded due to foreign key constraint)
		const deletedActivity = await db.delete(activity).where(eq(activity.id, id)).returning().get();

		return deletedActivity;
	}
);
