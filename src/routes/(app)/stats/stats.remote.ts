import { getRequestEvent, query } from '$app/server';
import { activity, activityCategory, category, timeSession } from '$lib/server/db/schema';
import { and, eq, gte, inArray, isNotNull, lt, sql, sum } from 'drizzle-orm';
import * as v from 'valibot';

export const getCategoryStats = query(
	v.object({
		userId: v.string(),
		startDate: v.string(),
		endDate: v.string()
	}),
	async ({ userId, startDate, endDate }) => {
		const { locals } = getRequestEvent();
		const db = locals.db;

		const start = new Date(startDate + 'T00:00:00.000Z');
		const end = new Date(endDate + 'T23:59:59.999Z');

		// Get all sessions for the time period
		const sessions = await db
			.select({
				sessionId: timeSession.id,
				duration: timeSession.duration,
				activityId: activity.id,
				activityName: activity.name
			})
			.from(timeSession)
			.innerJoin(activity, eq(timeSession.activityId, activity.id))
			.where(
				and(
					eq(timeSession.userId, userId),
					gte(timeSession.startedAt, start),
					lt(timeSession.startedAt, end),
					isNotNull(timeSession.stoppedAt)
				)
			)
			.all();

		// Get all activity-category relationships for these sessions
		const activityIds = [...new Set(sessions.map(s => s.activityId))];
		const activityCategories = activityIds.length > 0 ? await db
			.select({
				activityId: activityCategory.activityId,
				categoryId: category.id,
				categoryName: category.name,
				categoryColor: category.color,
				categoryIcon: category.icon
			})
			.from(activityCategory)
			.innerJoin(category, eq(activityCategory.categoryId, category.id))
			.where(inArray(activityCategory.activityId, activityIds))
			.all() : [];

		// Calculate category stats by distributing session time proportionally
		const categoryStatsMap = new Map<number, {
			categoryId: number;
			categoryName: string;
			categoryColor: string;
			categoryIcon: string;
			totalDuration: number;
			sessionCount: number;
		}>();

		sessions.forEach(session => {
			const categoriesForActivity = activityCategories.filter(ac => ac.activityId === session.activityId);
			const categoryCount = categoriesForActivity.length;

			if (categoryCount === 0) return; // Skip activities without categories

			// Distribute the session duration proportionally among categories
			const durationPerCategory = (session.duration || 0) / categoryCount;
			const sessionCountPerCategory = 1 / categoryCount;

			categoriesForActivity.forEach(({ categoryId, categoryName, categoryColor, categoryIcon }) => {
				if (!categoryStatsMap.has(categoryId)) {
					categoryStatsMap.set(categoryId, {
						categoryId,
						categoryName,
						categoryColor,
						categoryIcon,
						totalDuration: 0,
						sessionCount: 0
					});
				}

				const stats = categoryStatsMap.get(categoryId)!;
				stats.totalDuration += durationPerCategory;
				stats.sessionCount += sessionCountPerCategory;
			});
		});

		const categoryStats = Array.from(categoryStatsMap.values())
			.map(stat => ({
				...stat,
				totalDuration: Math.round(stat.totalDuration),
				sessionCount: Math.round(stat.sessionCount)
			}))
			.sort((a, b) => b.totalDuration - a.totalDuration);

		return categoryStats;
	}
);

export const getActivityStats = query(
	v.object({
		userId: v.string(),
		startDate: v.string(),
		endDate: v.string()
	}),
	async ({ userId, startDate, endDate }) => {
		const { locals } = getRequestEvent();
		const db = locals.db;

		const start = new Date(startDate + 'T00:00:00.000Z');
		const end = new Date(endDate + 'T23:59:59.999Z');

		// First get activity stats without category duplication
		const activityStats = await db
			.select({
				activityId: activity.id,
				activityName: activity.name,
				activityIcon: activity.icon,
				totalDuration: sum(timeSession.duration).as('totalDuration'),
				sessionCount: sql<number>`count(${timeSession.id})`.as('sessionCount')
			})
			.from(timeSession)
			.innerJoin(activity, eq(timeSession.activityId, activity.id))
			.where(
				and(
					eq(timeSession.userId, userId),
					gte(timeSession.startedAt, start),
					lt(timeSession.startedAt, end),
					isNotNull(timeSession.stoppedAt)
				)
			)
			.groupBy(activity.id, activity.name, activity.icon)
			.orderBy(sql`totalDuration DESC`)
			.all();

		// Get categories for each activity
		const activityIds = activityStats.map(stat => stat.activityId);
		const categoriesForActivities = activityIds.length > 0 ? await db
			.select({
				activityId: activityCategory.activityId,
				categoryId: category.id,
				categoryName: category.name,
				categoryColor: category.color,
				categoryIcon: category.icon
			})
			.from(activityCategory)
			.innerJoin(category, eq(activityCategory.categoryId, category.id))
			.where(inArray(activityCategory.activityId, activityIds))
			.all() : [];

		// Combine activity stats with their categories
		return activityStats.map((stat) => {
			const categories = categoriesForActivities.filter(cat => cat.activityId === stat.activityId);
			const primaryCategory = categories[0] || { categoryId: 0, categoryName: 'Uncategorized', categoryColor: '#gray', categoryIcon: '📂' };

			return {
				...stat,
				categoryId: primaryCategory.categoryId,
				categoryName: primaryCategory.categoryName,
				categoryColor: primaryCategory.categoryColor,
				categoryIcon: primaryCategory.categoryIcon,
				allCategories: categories,
				totalDuration: Number(stat.totalDuration || 0),
				sessionCount: Number(stat.sessionCount)
			};
		});
	}
);

export const getOverviewStats = query(
	v.object({
		userId: v.string(),
		startDate: v.string(),
		endDate: v.string()
	}),
	async ({ userId, startDate, endDate }) => {
		const { locals } = getRequestEvent();
		const db = locals.db;

		const start = new Date(startDate + 'T00:00:00.000Z');
		const end = new Date(endDate + 'T23:59:59.999Z');

		const overviewResult = await db
			.select({
				totalDuration: sum(timeSession.duration).as('totalDuration'),
				totalSessions: sql<number>`count(${timeSession.id})`.as('totalSessions'),
				categoriesWorkedOn: sql<number>`count(distinct ${category.id})`.as('categoriesWorkedOn'),
				activitiesWorkedOn: sql<number>`count(distinct ${activity.id})`.as('activitiesWorkedOn')
			})
			.from(timeSession)
			.innerJoin(activity, eq(timeSession.activityId, activity.id))
			.innerJoin(activityCategory, eq(activity.id, activityCategory.activityId))
			.innerJoin(category, eq(activityCategory.categoryId, category.id))
			.where(
				and(
					eq(timeSession.userId, userId),
					gte(timeSession.startedAt, start),
					lt(timeSession.startedAt, end),
					isNotNull(timeSession.stoppedAt)
				)
			)
			.get();

		return {
			totalDuration: Number(overviewResult?.totalDuration || 0),
			totalSessions: Number(overviewResult?.totalSessions || 0),
			categoriesWorkedOn: Number(overviewResult?.categoriesWorkedOn || 0),
			activitiesWorkedOn: Number(overviewResult?.activitiesWorkedOn || 0)
		};
	}
);
