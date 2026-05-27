import { command, getRequestEvent, query } from '$app/server';
import {
	getCategoriesForActivityId,
	getCategoriesForActivityIds,
	getRepresentativeCategory,
	groupActivitiesByCategory,
	hydrateActivitiesWithCategories,
	type ActivityWithCategories,
	type CategoryWithActivities
} from '$lib/server/activity-catalog';
import type { InsertActivityCategory, SelectActivity, SelectCategory } from '$lib/server/db/schema';
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
		const { locals } = getRequestEvent();
		const db = locals.db;

		// Get all categories for the user
		const categories: SelectCategory[] = await db
			.select()
			.from(category)
			.where(eq(category.userId, userId))
			.all();

		const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
		type UserActivityWithCategories = ActivityWithCategories<SelectActivity>;
		type UserCategoryWithActivities = CategoryWithActivities<UserActivityWithCategories>;

		if (sortedCategories.length === 0) {
			return [] as UserCategoryWithActivities[];
		}

		// Get all activities for the user first
		const userActivities: SelectActivity[] = await db
			.select()
			.from(activity)
			.where(eq(activity.userId, userId))
			.all();

		if (userActivities.length === 0) {
			return sortedCategories.map((cat) => ({
				...cat,
				activities: [] as UserActivityWithCategories[]
			})) satisfies UserCategoryWithActivities[];
		}

		const sortedUserActivities = [...userActivities].sort(
			(a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name)
		);

		const activityIds = sortedUserActivities.map((item) => item.id);
		const categoriesByActivityId = await getCategoriesForActivityIds(db, activityIds);
		const activitiesWithCategories = hydrateActivitiesWithCategories(
			sortedUserActivities,
			categoriesByActivityId
		);

		return groupActivitiesByCategory(sortedCategories, activitiesWithCategories);
	}
);

// Get currently active timer session for a user
export const getActiveSession = query(
	v.string(), // userId
	async (userId) => {
		// First get the active session with activity
		const { locals } = getRequestEvent();
		const db = locals.db;

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

		const activityCategories = await getCategoriesForActivityId(db, activeSession.activity.id);

		return {
			session: activeSession.timeSession,
			activity: activeSession.activity,
			category: {
				name: getRepresentativeCategory(activityCategories).name
			}
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
		const { locals } = getRequestEvent();
		const db = locals.db;

		// First, stop any currently active sessions for this user
		const activeSessions = await db
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

			await db
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
		const newSession = await db
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
	}
);

// Stop session timer with session ID
export const stopTimerSession = command(
	v.object({
		sessionId: v.pipe(v.number(), v.minValue(1, 'Session ID must be a positive number')),
		userId: v.string()
	}),
	async ({ sessionId, userId }) => {
		const { locals } = getRequestEvent();
		const db = locals.db;

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
		const { locals } = getRequestEvent();
		const db = locals.db;

		const newCategory = await db.insert(category).values(categoryData).returning().get();

		// Refresh the categories query to update UI
		await getCategoriesWithActivities(categoryData.userId).refresh();

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
		const { locals } = getRequestEvent();
		const db = locals.db;

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

		// Refresh the categories query to update UI
		await getCategoriesWithActivities(userId).refresh();

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
		const { locals } = getRequestEvent();
		const db = locals.db;

		// First check if the category exists and belongs to the user
		const existingCategory = await db.select().from(category).where(eq(category.id, id)).get();

		if (!existingCategory || existingCategory.userId !== userId) {
			throw new Error('Category not found or unauthorized');
		}

		// Delete the category (activities will be cascaded due to foreign key constraint)
		const deletedCategory = await db.delete(category).where(eq(category.id, id)).returning().get();

		// Refresh the categories query to update UI
		await getCategoriesWithActivities(userId).refresh();

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
		const { locals } = getRequestEvent();
		const db = locals.db;

		// Destructure categoryIds from activityData
		const { categoryIds, ...activityFields } = activityData;

		// Create the activity
		const newActivity = await db.insert(activity).values(activityFields).returning().get();

		// If categoryIds are provided, create the activity-category relationships
		if (categoryIds && categoryIds.length > 0) {
			const activityCategoryData: InsertActivityCategory[] = categoryIds.map((categoryId) => ({
				activityId: newActivity.id,
				categoryId
			}));

			await db.insert(activityCategory).values(activityCategoryData);
		}

		// Refresh the categories query to update UI
		await getCategoriesWithActivities(activityData.userId).refresh();

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
		const { locals } = getRequestEvent();
		const db = locals.db;

		// Only include defined fields in the update
		const fieldsToUpdate = Object.fromEntries(
			Object.entries(updateData).filter(([, value]) => value !== undefined)
		);

		if (Object.keys(fieldsToUpdate).length === 0 && !categoryIds) {
			throw new Error('No fields to update');
		}

		// Update the activity
		const activityUpdate = await db
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
			await db.delete(activityCategory).where(eq(activityCategory.activityId, id));

			// Then, create new category relationships
			if (categoryIds.length > 0) {
				const activityCategoryData = categoryIds.map((categoryId) => ({
					activityId: id,
					categoryId,
					userId
				}));

				await db.insert(activityCategory).values(activityCategoryData);
			}
		}

		// Refresh the categories query to update UI
		await getCategoriesWithActivities(userId).refresh();

		return activityUpdate;
	}
);

// Archive/unarchive an activity
export const setActivityFavorite = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
		favorite: v.boolean('Favorite must be a boolean'),
		userId: v.string()
	}),
	async ({ id, favorite, userId }) => {
		const { locals } = getRequestEvent();
		const db = locals.db;

		const updatedActivity = await db
			.update(activity)
			.set({
				favorite,
				updatedAt: new Date()
			})
			.where(eq(activity.id, id))
			.returning()
			.get();

		if (!updatedActivity || updatedActivity.userId !== userId) {
			throw new Error('Activity not found or unauthorized');
		}

		await getCategoriesWithActivities(userId).refresh();

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
		const { locals } = getRequestEvent();
		const db = locals.db;

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

		// Refresh the categories query to update UI
		await getCategoriesWithActivities(userId).refresh();

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
		const { locals } = getRequestEvent();
		const db = locals.db;

		// First check if the activity exists and belongs to the user
		const existingActivity = await db.select().from(activity).where(eq(activity.id, id)).get();

		if (!existingActivity || existingActivity.userId !== userId) {
			throw new Error('Activity not found or unauthorized');
		}

		// Delete the activity (time sessions will be cascaded due to foreign key constraint)
		const deletedActivity = await db.delete(activity).where(eq(activity.id, id)).returning().get();

		// Refresh the categories query to update UI
		await getCategoriesWithActivities(userId).refresh();

		return deletedActivity;
	}
);
