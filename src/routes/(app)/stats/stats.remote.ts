import { query } from '$app/server';
import {
	getCategoriesForActivityId,
	getCategoriesForActivityIds,
	getRepresentativeCategory
} from '$lib/server/activity-catalog';
import { getRemoteContext } from '$lib/server/remote';
import { activity, activityCategory, category, timeSession } from '$lib/server/db/schema';
import { and, eq, gte, isNotNull, lt, sql, sum } from 'drizzle-orm';
import * as v from 'valibot';

export const getCategoryStats = query(
	v.object({
		startDate: v.string(),
		endDate: v.string()
	}),
	async ({ startDate, endDate }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const start = new Date(startDate + 'T00:00:00.000Z');
		const end = new Date(endDate + 'T23:59:59.999Z');

		// Get all sessions for the time period
		const sessions: Array<{
			sessionId: number;
			duration: number | null;
			activityId: number;
			activityName: string;
		}> = await db
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

		const categoriesByActivityId = await getCategoriesForActivityIds(db, [
			...new Set(sessions.map((session: (typeof sessions)[number]) => session.activityId))
		]);

		// Calculate category stats by distributing session time proportionally
		const categoryStatsMap = new Map<
			number,
			{
				categoryId: number;
				categoryName: string;
				categoryColor: string;
				categoryIcon: string;
				totalDuration: number;
				sessionCount: number;
			}
		>();

		sessions.forEach((session: (typeof sessions)[number]) => {
			const categoriesForActivity = categoriesByActivityId.get(session.activityId) ?? [];
			const categoryCount = categoriesForActivity.length;

			if (categoryCount === 0) return; // Skip activities without categories

			// Distribute the session duration proportionally among categories
			const durationPerCategory = (session.duration || 0) / categoryCount;
			const sessionCountPerCategory = 1 / categoryCount;

			categoriesForActivity.forEach(({ id, name, color, icon }) => {
				if (!categoryStatsMap.has(id)) {
					categoryStatsMap.set(id, {
						categoryId: id,
						categoryName: name,
						categoryColor: color,
						categoryIcon: icon,
						totalDuration: 0,
						sessionCount: 0
					});
				}

				const stats = categoryStatsMap.get(id)!;
				stats.totalDuration += durationPerCategory;
				stats.sessionCount += sessionCountPerCategory;
			});
		});

		const categoryStats = Array.from(categoryStatsMap.values())
			.map((stat) => ({
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
		startDate: v.string(),
		endDate: v.string()
	}),
	async ({ startDate, endDate }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const start = new Date(startDate + 'T00:00:00.000Z');
		const end = new Date(endDate + 'T23:59:59.999Z');

		// First get activity stats without category duplication
		const activityStats: Array<{
			activityId: number;
			activityName: string;
			activityIcon: string;
			totalDuration: number | null;
			sessionCount: number;
		}> = await db
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

		const activityIds = activityStats.map(
			(stat: (typeof activityStats)[number]) => stat.activityId
		);
		const categoriesByActivityId = await getCategoriesForActivityIds(db, activityIds);

		// Combine activity stats with their categories
		return activityStats.map((stat: (typeof activityStats)[number]) => {
			const categories = categoriesByActivityId.get(stat.activityId) ?? [];
			const primaryCategory = getRepresentativeCategory(categories);

			return {
				...stat,
				categoryId: primaryCategory.id,
				categoryName: primaryCategory.name,
				categoryColor: primaryCategory.color,
				categoryIcon: primaryCategory.icon,
				allCategories: categories.map((cat) => ({
					categoryId: cat.id,
					categoryName: cat.name,
					categoryColor: cat.color,
					categoryIcon: cat.icon
				})),
				totalDuration: Number(stat.totalDuration || 0),
				sessionCount: Number(stat.sessionCount)
			};
		});
	}
);

export const getOverviewStats = query(
	v.object({
		startDate: v.string(),
		endDate: v.string()
	}),
	async ({ startDate, endDate }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

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

export const getSessionsForActivity = query(
	v.object({
		activityId: v.number(),
		startDate: v.string(),
		endDate: v.string()
	}),
	async ({ activityId, startDate, endDate }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		const start = new Date(startDate + 'T00:00:00.000Z');
		const end = new Date(endDate + 'T23:59:59.999Z');

		// Get all sessions for this activity within the date range
		const sessions = await db
			.select({
				id: timeSession.id,
				startedAt: timeSession.startedAt,
				stoppedAt: timeSession.stoppedAt,
				duration: timeSession.duration,
				notes: timeSession.notes,
				activityId: activity.id,
				activityName: activity.name,
				activityIcon: activity.icon
			})
			.from(timeSession)
			.innerJoin(activity, eq(timeSession.activityId, activity.id))
			.where(
				and(
					eq(timeSession.userId, userId),
					eq(timeSession.activityId, activityId),
					gte(timeSession.startedAt, start),
					lt(timeSession.startedAt, end),
					isNotNull(timeSession.stoppedAt)
				)
			)
			.orderBy(sql`${timeSession.startedAt} DESC`)
			.all();

		const categories = await getCategoriesForActivityId(db, activityId);

		// Transform sessions to match SessionCard format
		return sessions.map((session: (typeof sessions)[number]) => ({
			id: session.id,
			startedAt: session.startedAt,
			stoppedAt: session.stoppedAt,
			duration: session.duration,
			notes: session.notes,
			activity: {
				id: session.activityId,
				name: session.activityName,
				icon: session.activityIcon
			},
			categories
		}));
	}
);

export const getActivityStatistics = query(
	v.object({
		activityId: v.number(),
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
		granularity: v.picklist(['daily', 'weekly', 'monthly'])
	}),
	async ({ activityId, startDate, endDate, granularity }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;

		// Build date filters - if no dates provided, get all sessions
		const dateFilters = [];
		if (startDate) {
			const start = new Date(startDate + 'T00:00:00.000Z');
			dateFilters.push(gte(timeSession.startedAt, start));
		}
		if (endDate) {
			const end = new Date(endDate + 'T23:59:59.999Z');
			dateFilters.push(lt(timeSession.startedAt, end));
		}

		// Get all sessions for this activity within the date range
		const sessions = await db
			.select({
				id: timeSession.id,
				startedAt: timeSession.startedAt,
				stoppedAt: timeSession.stoppedAt,
				duration: timeSession.duration
			})
			.from(timeSession)
			.where(
				and(
					eq(timeSession.userId, userId),
					eq(timeSession.activityId, activityId),
					isNotNull(timeSession.stoppedAt),
					...dateFilters
				)
			)
			.orderBy(sql`${timeSession.startedAt} ASC`)
			.all();

		if (sessions.length === 0) {
			return {
				chartData: [],
				totalDuration: 0,
				totalSessions: 0,
				shortestSession: null,
				averageSession: null,
				longestSession: null,
				firstSession: null,
				lastSession: null
			};
		}

		// Calculate aggregated chart data based on granularity
		const chartDataMap: Record<
			string,
			{ label: string; duration: number; sortKey: string; bucketKey: string }
		> = {};

		sessions.forEach((session: (typeof sessions)[number]) => {
			const date = new Date(session.startedAt);
			let key: string;
			let label: string;
			let sortKey: string;

			switch (granularity) {
				case 'daily': {
					const year = date.getUTCFullYear();
					const month = String(date.getUTCMonth() + 1).padStart(2, '0');
					const day = String(date.getUTCDate()).padStart(2, '0');
					key = `${year}-${month}-${day}`;
					sortKey = key;
					// Format as "Nov 24"
					label = date.toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						timeZone: 'UTC'
					});
					break;
				}
				case 'weekly': {
					// Get ISO week number and year
					const tempDate = new Date(
						Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
					);
					const dayNum = tempDate.getUTCDay() || 7;
					tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
					const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
					const weekNum = Math.ceil(
						((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
					);
					const year = tempDate.getUTCFullYear();
					key = `${year}-W${String(weekNum).padStart(2, '0')}`;
					sortKey = key;
					label = `W${weekNum}`;
					break;
				}
				case 'monthly': {
					const year = date.getUTCFullYear();
					const month = String(date.getUTCMonth() + 1).padStart(2, '0');
					key = `${year}-${month}`;
					sortKey = key;
					label = date.toLocaleDateString('en-US', {
						month: 'short',
						year: '2-digit',
						timeZone: 'UTC'
					});
					break;
				}
			}

			if (!chartDataMap[key]) {
				chartDataMap[key] = { label, duration: 0, sortKey, bucketKey: key };
			}
			chartDataMap[key].duration += session.duration || 0;
		});

		// Convert to sorted array (only entries with data)
		const chartData = Object.values(chartDataMap)
			.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
			.map(({ label, duration, bucketKey }) => ({ label, duration, bucketKey }));

		// Calculate statistics
		const durations = sessions
			.map((s: (typeof sessions)[number]) => s.duration || 0)
			.filter((d: number) => d > 0);
		const totalDuration = durations.reduce((sum: number, d: number) => sum + d, 0);
		const totalSessions = sessions.length;

		const shortestSession = durations.length > 0 ? Math.min(...durations) : null;
		const longestSession = durations.length > 0 ? Math.max(...durations) : null;
		const averageSession =
			durations.length > 0 ? Math.round(totalDuration / durations.length) : null;

		// First and last session times
		const firstSession = sessions[0]?.startedAt || null;
		const lastSession = sessions[sessions.length - 1]?.startedAt || null;

		return {
			chartData,
			totalDuration,
			totalSessions,
			shortestSession,
			averageSession,
			longestSession,
			firstSession,
			lastSession
		};
	}
);
