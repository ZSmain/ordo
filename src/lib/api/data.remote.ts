import {
	requireOwnedActivity,
	requireOwnedCategories,
	requireOwnedCategory
} from '#lib/server/access.js';
import {
	getCategoriesForActivityId,
	getCategoriesForActivityIds,
	getRepresentativeCategory,
	groupActivitiesByCategory
} from '#lib/server/activity-catalog.js';
import type { GoalValues } from '#lib/goals/index.js';
import type { InsertActivityCategory } from '#lib/server/db/schema.js';
import {
	activity,
	activityCategory,
	activityGoalFieldsSchema,
	category,
	insertActivitySchema,
	insertCategorySchema,
	timeSession
} from '#lib/server/db/schema.js';
import {
	toActiveSessionDto,
	toActivityDto,
	toCategoryDto,
	toStartedSessionDto,
	toStoppedSessionDto
} from '#lib/server/mappers.js';
import { getDisplayGoals, scheduleGoalChange } from '#lib/server/goals.js';
import { getRemoteContext } from '#lib/server/remote-context.js';
import {
	startActiveSession as persistStartedSession,
	stopActiveSession as persistStoppedSession
} from '#lib/server/sessions.js';
import type { ActivityDto, CategoryWithActivitiesDto } from '#lib/tracker/dtos.js';
import { command, query, requested } from '$app/server';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
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
}): GoalValues {
	return {
		dailyGoal: sanitizeGoalMinutes(goals.dailyGoal),
		weeklyGoal: sanitizeGoalMinutes(goals.weeklyGoal),
		monthlyGoal: sanitizeGoalMinutes(goals.monthlyGoal)
	};
}

export const getCategoriesWithActivities = query(async () => {
	const { db, user } = getRemoteContext();
	const userId = user.id;

	const categoryRows = await db
		.select({
			id: category.id,
			name: category.name,
			color: category.color,
			icon: category.icon
		})
		.from(category)
		.where(eq(category.userId, userId))
		.all();

	const sortedCategories = [...categoryRows].sort((a, b) => a.name.localeCompare(b.name));

	if (sortedCategories.length === 0) {
		return [] as CategoryWithActivitiesDto[];
	}

	const activityRows = await db
		.select({
			id: activity.id,
			name: activity.name,
			icon: activity.icon,
			favorite: activity.favorite,
			archived: activity.archived
		})
		.from(activity)
		.where(eq(activity.userId, userId))
		.all();

	if (activityRows.length === 0) {
		return sortedCategories.map((cat) => ({
			...cat,
			activities: [] as ActivityDto[]
		})) satisfies CategoryWithActivitiesDto[];
	}

	const sortedUserActivities = [...activityRows].sort(
		(a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name)
	);

	const activityIds = sortedUserActivities.map((item) => item.id);
	const [categoriesByActivityId, displayGoalsByActivityId] = await Promise.all([
		getCategoriesForActivityIds(db, activityIds),
		getDisplayGoals(db, activityIds)
	]);

	const activities: ActivityDto[] = sortedUserActivities.map((item) =>
		toActivityDto(
			item,
			displayGoalsByActivityId.get(item.id) ?? {
				current: null,
				pending: null,
				effectiveDate: null
			},
			categoriesByActivityId.get(item.id) ?? []
		)
	);

	return groupActivitiesByCategory(sortedCategories, activities);
});

export const getActiveSession = query(async () => {
	const { db, user } = getRemoteContext();
	const userId = user.id;

	const activeSession = await db
		.select({
			sessionId: timeSession.id,
			sessionActivityId: timeSession.activityId,
			sessionStartedAt: timeSession.startedAt,
			sessionIsActive: timeSession.isActive,
			activityId: activity.id,
			activityName: activity.name,
			activityIcon: activity.icon
		})
		.from(timeSession)
		.innerJoin(activity, eq(timeSession.activityId, activity.id))
		.where(and(eq(timeSession.userId, userId), eq(timeSession.isActive, true)))
		.get();

	if (!activeSession) {
		return null;
	}

	const activityCategories = await getCategoriesForActivityId(db, activeSession.activityId);

	return toActiveSessionDto(
		{
			id: activeSession.sessionId,
			activityId: activeSession.sessionActivityId,
			startedAt: activeSession.sessionStartedAt,
			isActive: activeSession.sessionIsActive
		},
		{
			id: activeSession.activityId,
			name: activeSession.activityName,
			icon: activeSession.activityIcon
		},
		getRepresentativeCategory(activityCategories).name
	);
});

export const startTimerSession = command(
	v.object({
		activityId: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number'))
	}),
	async ({ activityId }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const newSession = await persistStartedSession(db, userId, { activityId });

		await requested(getActiveSession, 1).refreshAll();

		return toStartedSessionDto(newSession);
	}
);

export const stopTimerSession = command(
	v.object({
		sessionId: v.pipe(v.number(), v.minValue(1, 'Session ID must be a positive number'))
	}),
	async ({ sessionId }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const updatedSession = await persistStoppedSession(db, userId, { sessionId });

		await requested(getActiveSession, 1).refreshAll();

		return toStoppedSessionDto(updatedSession);
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

	return toCategoryDto(newCategory);
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

		return toCategoryDto(updatedCategory);
	}
);

export const deleteCategory = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Category ID must be a positive number'))
	}),
	async ({ id }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		await requireOwnedCategory(db, userId, id);

		const deletedCategory = await db
			.delete(category)
			.where(and(eq(category.id, id), eq(category.userId, userId)))
			.returning()
			.get();

		await getCategoriesWithActivities().refresh();

		return toCategoryDto(deletedCategory);
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
		const validatedCategoryIds = await requireOwnedCategories(db, userId, categoryIds ?? []);

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
		const goals = await scheduleGoalChange(
			db,
			newActivity.id,
			sanitizeGoalFields({ dailyGoal, weeklyGoal, monthlyGoal })
		);

		await getCategoriesWithActivities().refresh();

		const categories = await getCategoriesForActivityId(db, newActivity.id);

		return toActivityDto(newActivity, goals, categories);
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

		const existingActivity = await requireOwnedActivity(db, userId, id);

		const validatedCategoryIds = categoryIds
			? await requireOwnedCategories(db, userId, categoryIds)
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

		// Goal changes take effect tomorrow (history table). Always resolve the
		// unified display goals so the response never carries stale goal state.
		const goals = goalsProvided
			? await scheduleGoalChange(db, id, sanitizeGoalFields({ dailyGoal, weeklyGoal, monthlyGoal }))
			: ((await getDisplayGoals(db, [id])).get(id) ?? {
					current: null,
					pending: null,
					effectiveDate: null
				});

		await getCategoriesWithActivities().refresh();

		const categories = await getCategoriesForActivityId(db, id);

		return toActivityDto(activityUpdate, goals, categories);
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

		return { id: updatedActivity.id };
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

		return { id: updatedActivity.id };
	}
);

export const deleteActivity = command(
	v.object({
		id: v.pipe(v.number(), v.minValue(1, 'Activity ID must be a positive number'))
	}),
	async ({ id }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		await requireOwnedActivity(db, userId, id);

		const deletedActivity = await db
			.delete(activity)
			.where(and(eq(activity.id, id), eq(activity.userId, userId)))
			.returning()
			.get();

		await getCategoriesWithActivities().refresh();

		return { id: deletedActivity.id };
	}
);
