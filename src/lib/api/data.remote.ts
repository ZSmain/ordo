import { command, query, requested } from '$app/server';
import { error } from '@sveltejs/kit';
import {
	getCategoriesForActivityId,
	getCategoriesForActivityIds,
	getRepresentativeCategory,
	groupActivitiesByCategory,
	hydrateActivitiesWithCategories,
	type ActivityWithCategories,
	type CategoryWithActivities
} from '$lib/server/activity-catalog';
import { getRemoteContext } from '$lib/server/remote';
import type { InsertActivityCategory, SelectActivity, SelectCategory } from '$lib/server/db/schema';
import {
	activity,
	activityCategory,
	category,
	insertActivitySchema,
	insertCategorySchema,
	timeSession
} from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';

const { ...insertCategoryEntries } = insertCategorySchema.entries;
const { ...insertActivityEntries } = insertActivitySchema.entries;

async function ensureActivityBelongsToUser(
	db: ReturnType<typeof getRemoteContext>['db'],
	userId: string,
	activityId: number
) {
	const existingActivity = await db
		.select({ id: activity.id })
		.from(activity)
		.where(and(eq(activity.id, activityId), eq(activity.userId, userId)))
		.get();

	if (!existingActivity) {
		error(404, 'Activity not found');
	}
}

async function ensureCategoriesBelongToUser(
	db: ReturnType<typeof getRemoteContext>['db'],
	userId: string,
	categoryIds: number[]
) {
	if (categoryIds.length === 0) {
		return [] as number[];
	}

	const uniqueCategoryIds = [...new Set(categoryIds)];
	const existingCategories = await db
		.select({ id: category.id })
		.from(category)
		.where(and(eq(category.userId, userId), inArray(category.id, uniqueCategoryIds)))
		.all();

	if (existingCategories.length !== uniqueCategoryIds.length) {
		error(404, 'One or more categories were not found');
	}

	return uniqueCategoryIds;
}

// Return all categories with their activities for the current user
export const getCategoriesWithActivities = query(async () => {
	const { db, user } = getRemoteContext();
	const userId = user.id;

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
});

// Get currently active timer session for a user
export const getActiveSession = query(async () => {
	// First get the active session with activity
	const { db, user } = getRemoteContext();
	const userId = user.id;

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
});

// Start timer session with activity ID
export const startTimerSession = command(
	v.object({
		activityId: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number'))
	}),
	async ({ activityId }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		await ensureActivityBelongsToUser(db, userId, activityId);

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

		await requested(getActiveSession, 1).refreshAll();

		return newSession;
	}
);

// Stop session timer with session ID
export const stopTimerSession = command(
	v.object({
		sessionId: v.pipe(v.number(), v.minValue(1, 'Session ID must be a positive number'))
	}),
	async ({ sessionId }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const session = await db
			.select()
			.from(timeSession)
			.where(and(eq(timeSession.id, sessionId), eq(timeSession.userId, userId)))
			.get();

		if (!session || session.stoppedAt || !session.isActive) {
			error(404, 'Active session not found');
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

		await requested(getActiveSession, 1).refreshAll();

		return updatedSession;
	}
);

// Create a new category
export const createCategory = command(v.object(insertCategoryEntries), async (categoryData) => {
	const { db, user } = getRemoteContext();

	const newCategory = await db
		.insert(category)
		.values({
			...categoryData,
			userId: user.id
		})
		.returning()
		.get();

	// Refresh the categories query to update UI
	await getCategoriesWithActivities().refresh();

	return newCategory;
});

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
		)
	}),
	async ({ id, ...updateData }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

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
			.where(and(eq(category.id, id), eq(category.userId, userId)))
			.returning()
			.get();

		if (!updatedCategory) {
			error(404, 'Category not found');
		}

		// Refresh the categories query to update UI
		await getCategoriesWithActivities().refresh();

		return updatedCategory;
	}
);

// Delete a category
export const deleteCategory = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Category ID must be a positive number'))
	}),
	async ({ id }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		// First check if the category exists and belongs to the user
		const existingCategory = await db
			.select()
			.from(category)
			.where(and(eq(category.id, id), eq(category.userId, userId)))
			.get();

		if (!existingCategory) {
			error(404, 'Category not found');
		}

		// Delete the category (activities will be cascaded due to foreign key constraint)
		const deletedCategory = await db
			.delete(category)
			.where(and(eq(category.id, id), eq(category.userId, userId)))
			.returning()
			.get();

		// Refresh the categories query to update UI
		await getCategoriesWithActivities().refresh();

		return deletedCategory;
	}
);

// Create a new activity
export const createActivity = command(
	v.object({
		...insertActivityEntries,
		categoryIds: v.optional(v.array(v.number('Category ID must be a number')))
	}),
	async (activityData) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		// Destructure categoryIds from activityData
		const { categoryIds, ...activityFields } = activityData;
		const validatedCategoryIds = await ensureCategoriesBelongToUser(db, userId, categoryIds ?? []);

		// Create the activity
		const newActivity = await db
			.insert(activity)
			.values({
				...activityFields,
				userId
			})
			.returning()
			.get();

		// If categoryIds are provided, create the activity-category relationships
		if (validatedCategoryIds.length > 0) {
			const activityCategoryData: InsertActivityCategory[] = validatedCategoryIds.map(
				(categoryId) => ({
					activityId: newActivity.id,
					categoryId
				})
			);

			await db.insert(activityCategory).values(activityCategoryData);
		}

		// Refresh the categories query to update UI
		await getCategoriesWithActivities().refresh();

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
		categoryIds: v.optional(v.array(v.number('Category ID must be a number')))
	}),
	async ({ id, categoryIds, ...updateData }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		// Only include defined fields in the update
		const fieldsToUpdate = Object.fromEntries(
			Object.entries(updateData).filter(([, value]) => value !== undefined)
		);

		if (Object.keys(fieldsToUpdate).length === 0 && !categoryIds) {
			throw new Error('No fields to update');
		}

		const existingActivity = await db
			.select()
			.from(activity)
			.where(and(eq(activity.id, id), eq(activity.userId, userId)))
			.get();

		if (!existingActivity) {
			error(404, 'Activity not found');
		}

		const validatedCategoryIds = categoryIds
			? await ensureCategoriesBelongToUser(db, userId, categoryIds)
			: null;

		// Update the activity
		const activityUpdate =
			Object.keys(fieldsToUpdate).length > 0
				? await db
						.update(activity)
						.set({
							...fieldsToUpdate,
							updatedAt: new Date()
						})
						.where(and(eq(activity.id, id), eq(activity.userId, userId)))
						.returning()
						.get()
				: existingActivity;

		// Update categories if provided
		if (validatedCategoryIds) {
			// First, delete existing category relationships
			await db.delete(activityCategory).where(eq(activityCategory.activityId, id));

			// Then, create new category relationships
			if (validatedCategoryIds.length > 0) {
				const activityCategoryData: InsertActivityCategory[] = validatedCategoryIds.map(
					(categoryId) => ({
						activityId: id,
						categoryId
					})
				);

				await db.insert(activityCategory).values(activityCategoryData);
			}
		}

		// Refresh the categories query to update UI
		await getCategoriesWithActivities().refresh();

		return activityUpdate;
	}
);

// Archive/unarchive an activity
export const setActivityFavorite = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
		favorite: v.boolean('Favorite must be a boolean')
	}),
	async ({ id, favorite }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const updatedActivity = await db
			.update(activity)
			.set({
				favorite,
				updatedAt: new Date()
			})
			.where(and(eq(activity.id, id), eq(activity.userId, userId)))
			.returning()
			.get();

		if (!updatedActivity) {
			error(404, 'Activity not found');
		}

		await getCategoriesWithActivities().refresh();

		return updatedActivity;
	}
);

// Archive/unarchive an activity
export const archiveActivity = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number')),
		archived: v.boolean('Archived must be a boolean')
	}),
	async ({ id, archived }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const updatedActivity = await db
			.update(activity)
			.set({
				archived,
				updatedAt: new Date()
			})
			.where(and(eq(activity.id, id), eq(activity.userId, userId)))
			.returning()
			.get();

		if (!updatedActivity) {
			error(404, 'Activity not found');
		}

		// Refresh the categories query to update UI
		await getCategoriesWithActivities().refresh();

		return updatedActivity;
	}
);

// Delete an activity
export const deleteActivity = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number'))
	}),
	async ({ id }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		// First check if the activity exists and belongs to the user
		const existingActivity = await db
			.select()
			.from(activity)
			.where(and(eq(activity.id, id), eq(activity.userId, userId)))
			.get();

		if (!existingActivity) {
			error(404, 'Activity not found');
		}

		// Delete the activity (time sessions will be cascaded due to foreign key constraint)
		const deletedActivity = await db
			.delete(activity)
			.where(and(eq(activity.id, id), eq(activity.userId, userId)))
			.returning()
			.get();

		// Refresh the categories query to update UI
		await getCategoriesWithActivities().refresh();

		return deletedActivity;
	}
);
