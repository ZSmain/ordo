import { command, query, requested } from '$app/server';
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
	activityGoalFieldsSchema,
	category,
	insertActivitySchema,
	insertCategorySchema,
	timeSession
} from '$lib/server/db/schema';
import {
	activeGoalsForToday,
	latestGoalValues,
	loadGoalHistoryForActivities,
	setActivityGoalsEffectiveTomorrow
} from '$lib/server/goals';
import { getRemoteContext } from '$lib/server/remote';
import type { TrackerActivityGoals } from '$lib/tracker/activity-projection';
import { error } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';

const { ...insertCategoryEntries } = insertCategorySchema.entries;
const { ...insertActivityEntries } = insertActivitySchema.entries;
const optionalGoalMinutes = activityGoalFieldsSchema.entries.dailyGoal;

function sanitizeGoalMinutes(value: number | null | undefined): number | null {
	if (value == null || Number.isNaN(value) || value <= 0) return null;
	return value;
}

function sanitizeGoalFields(goals: {
	dailyGoal?: number | null;
	weeklyGoal?: number | null;
	monthlyGoal?: number | null;
}): TrackerActivityGoals {
	return {
		dailyGoal: sanitizeGoalMinutes(goals.dailyGoal),
		weeklyGoal: sanitizeGoalMinutes(goals.weeklyGoal),
		monthlyGoal: sanitizeGoalMinutes(goals.monthlyGoal)
	};
}

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

export const getCategoriesWithActivities = query(async () => {
	const { db, user } = getRemoteContext();
	const userId = user.id;

	const categories: SelectCategory[] = await db
		.select()
		.from(category)
		.where(eq(category.userId, userId))
		.all();

	const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

	type ActivityWithGoals = SelectActivity & TrackerActivityGoals & {
		latestGoals: TrackerActivityGoals | null;
	};
	type UserActivityWithCategories = ActivityWithCategories<ActivityWithGoals>;
	type UserCategoryWithActivities = CategoryWithActivities<UserActivityWithCategories>;

	if (sortedCategories.length === 0) {
		return [] as UserCategoryWithActivities[];
	}

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
	const [categoriesByActivityId, goalsByActivityId] = await Promise.all([
		getCategoriesForActivityIds(db, activityIds),
		loadGoalHistoryForActivities(db, activityIds)
	]);

	const activitiesWithGoals: ActivityWithGoals[] = sortedUserActivities.map((item) => {
		const history = goalsByActivityId.get(item.id) ?? [];
		const active = activeGoalsForToday(history);
		const latest = latestGoalValues(history);

		return {
			...item,
			dailyGoal: active?.dailyGoal ?? null,
			weeklyGoal: active?.weeklyGoal ?? null,
			monthlyGoal: active?.monthlyGoal ?? null,
			latestGoals: latest
		};
	});

	const activitiesWithCategories = hydrateActivitiesWithCategories(
		activitiesWithGoals,
		categoriesByActivityId
	);

	return groupActivitiesByCategory(sortedCategories, activitiesWithCategories);
});

export const getActiveSession = query(async () => {
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

export const startTimerSession = command(
	v.object({
		activityId: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number'))
	}),
	async ({ activityId }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		await ensureActivityBelongsToUser(db, userId, activityId);

		const activeSessions = await db
			.select()
			.from(timeSession)
			.where(and(eq(timeSession.userId, userId), eq(timeSession.isActive, true)))
			.all();

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

	await getCategoriesWithActivities().refresh();

	return newCategory;
});

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

		await getCategoriesWithActivities().refresh();

		return updatedCategory;
	}
);

export const deleteCategory = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Category ID must be a positive number'))
	}),
	async ({ id }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

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

		await getCategoriesWithActivities().refresh();

		return deletedCategory;
	}
);

export const createActivity = command(
	v.object({
		...insertActivityEntries,
		categoryIds: v.optional(v.array(v.number('Category ID must be a number'))),
		dailyGoal: optionalGoalMinutes,
		weeklyGoal: optionalGoalMinutes,
		monthlyGoal: optionalGoalMinutes
	}),
	async (activityData) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const { categoryIds, dailyGoal, weeklyGoal, monthlyGoal, ...activityFields } = activityData;
		const validatedCategoryIds = await ensureCategoriesBelongToUser(db, userId, categoryIds ?? []);

		// Create the activity (goals live in goal_history)
		const newActivity = await db
			.insert(activity)
			.values({
				...activityFields,
				userId
			})
			.returning()
			.get();

		if (validatedCategoryIds.length > 0) {
			const activityCategoryData: InsertActivityCategory[] = validatedCategoryIds.map(
				(categoryId) => ({
					activityId: newActivity.id,
					categoryId
				})
			);

			await db.insert(activityCategory).values(activityCategoryData);
		}

		// Goals take effect tomorrow
		await setActivityGoalsEffectiveTomorrow(
			db,
			newActivity.id,
			sanitizeGoalFields({ dailyGoal, weeklyGoal, monthlyGoal })
		);

		await getCategoriesWithActivities().refresh();

		return newActivity;
	}
);

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
		dailyGoal: optionalGoalMinutes,
		weeklyGoal: optionalGoalMinutes,
		monthlyGoal: optionalGoalMinutes,
		archived: v.optional(v.boolean('Archived must be a boolean')),
		categoryIds: v.optional(v.array(v.number('Category ID must be a number')))
	}),
	async ({ id, categoryIds, dailyGoal, weeklyGoal, monthlyGoal, ...updateData }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const goalsProvided =
			dailyGoal !== undefined || weeklyGoal !== undefined || monthlyGoal !== undefined;

		const fieldsToUpdate = Object.fromEntries(
			Object.entries(updateData).filter(([, value]) => value !== undefined)
		);

		if (Object.keys(fieldsToUpdate).length === 0 && !categoryIds && !goalsProvided) {
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

		if (validatedCategoryIds) {
			await db.delete(activityCategory).where(eq(activityCategory.activityId, id));

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

		// Goal changes take effect tomorrow (history table)
		if (goalsProvided) {
			await setActivityGoalsEffectiveTomorrow(
				db,
				id,
				sanitizeGoalFields({ dailyGoal, weeklyGoal, monthlyGoal })
			);
		}

		await getCategoriesWithActivities().refresh();

		return activityUpdate;
	}
);

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

		await getCategoriesWithActivities().refresh();

		return updatedActivity;
	}
);

export const deleteActivity = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number'))
	}),
	async ({ id }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

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

		await getCategoriesWithActivities().refresh();

		return deletedActivity;
	}
);
