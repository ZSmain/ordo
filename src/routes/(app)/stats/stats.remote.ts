import {
	dailyGoalHitsForRange,
	evaluateMonth,
	evaluateWeek,
	getActiveGoal,
	monthBounds,
	toDateKey,
	todayDateKey,
	weekBounds,
	type PeriodGoalSummary
} from '#lib/goals/index.js';
import { requireOwnedActivity } from '#lib/server/access.js';
import {
	getCategoriesForActivityId,
	getCategoriesForActivityIds,
	UNCATEGORIZED_ACTIVITY_CATEGORY
} from '#lib/server/activity-catalog.js';
import { activity, activityCategory, category, timeSession } from '#lib/server/db/schema.js';
import { getGoalHistoryEntries } from '#lib/server/goals.js';
import { getRemoteContext } from '#lib/server/remote-context.js';
import { query } from '$app/server';
import { and, countDistinct, eq, gt, gte, isNotNull, lt, sql, sum } from 'drizzle-orm';
import * as v from 'valibot';

/** Date keys describe UTC calendar days. The range is end-exclusive. */
function getSessionRange(startDate: string, endDate: string) {
	const start = new Date(`${startDate}T00:00:00.000Z`);
	const end = new Date(`${endDate}T00:00:00.000Z`);
	end.setUTCDate(end.getUTCDate() + 1);
	return { start, end };
}

function periodSummaryPayload(summary: PeriodGoalSummary) {
	return {
		start: summary.start,
		end: summary.end,
		durationSeconds: summary.durationSeconds,
		goalMinutes: summary.goalMinutes,
		goalHit: summary.goalHit,
		dailyHits: summary.dailyHits,
		dailyGoalDays: summary.dailyGoalDays
	};
}

export const getCategoryStats = query(
	v.object({
		startDate: v.string(),
		endDate: v.string()
	}),
	async ({ startDate, endDate }) => {
		const { db, user } = getRemoteContext();
		const userId = user.id;
		const { start, end } = getSessionRange(startDate, endDate);

		const sessions: Array<{
			sessionId: number;
			duration: number | null;
			activityId: number;
		}> = await db
			.select({
				sessionId: timeSession.id,
				duration: timeSession.duration,
				activityId: activity.id
			})
			.from(timeSession)
			.innerJoin(activity, eq(timeSession.activityId, activity.id))
			.where(
				and(
					eq(timeSession.userId, userId),
					gte(timeSession.startedAt, start),
					lt(timeSession.startedAt, end),
					isNotNull(timeSession.stoppedAt),
					gt(timeSession.duration, 0)
				)
			)
			.all();

		const categoriesByActivityId = await getCategoriesForActivityIds(db, [
			...new Set(sessions.map((session: (typeof sessions)[number]) => session.activityId))
		]);

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
			const sessionCategories =
				categoriesForActivity.length > 0
					? categoriesForActivity
					: [UNCATEGORIZED_ACTIVITY_CATEGORY];
			// A session can belong to several categories. Split its duration evenly so the
			// category totals still add up to the tracked time, but count the session once
			// for every category it actually involved.
			const durationPerCategory = (session.duration ?? 0) / sessionCategories.length;

			sessionCategories.forEach(({ id, name, color, icon }) => {
				let stats = categoryStatsMap.get(id);
				if (!stats) {
					stats = {
						categoryId: id,
						categoryName: name,
						categoryColor: color,
						categoryIcon: icon,
						totalDuration: 0,
						sessionCount: 0
					};
					categoryStatsMap.set(id, stats);
				}

				stats.totalDuration += durationPerCategory;
				stats.sessionCount += 1;
			});
		});

		return Array.from(categoryStatsMap.values()).sort((a, b) => b.totalDuration - a.totalDuration);
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
		const { start, end } = getSessionRange(startDate, endDate);

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
					isNotNull(timeSession.stoppedAt),
					gt(timeSession.duration, 0)
				)
			)
			.groupBy(activity.id, activity.name, activity.icon)
			.orderBy(sql`totalDuration DESC`)
			.all();

		const activityIds = activityStats.map(
			(stat: (typeof activityStats)[number]) => stat.activityId
		);
		const categoriesByActivityId = await getCategoriesForActivityIds(db, activityIds);

		return activityStats.map((stat: (typeof activityStats)[number]) => {
			const categories = categoriesByActivityId.get(stat.activityId) ?? [];

			return {
				...stat,
				categories: categories.map((cat) => ({
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
		const { start, end } = getSessionRange(startDate, endDate);

		const sessionResult = await db
			.select({
				totalDuration: sum(timeSession.duration).as('totalDuration'),
				totalSessions: sql<number>`count(${timeSession.id})`.as('totalSessions'),
				activitiesWorkedOn: countDistinct(timeSession.activityId).as('activitiesWorkedOn')
			})
			.from(timeSession)
			.where(
				and(
					eq(timeSession.userId, userId),
					gte(timeSession.startedAt, start),
					lt(timeSession.startedAt, end),
					isNotNull(timeSession.stoppedAt),
					gt(timeSession.duration, 0)
				)
			)
			.get();

		const categoryResult = await db
			.select({
				// Uncategorized activities count as one bucket so the overview agrees with
				// the category breakdown.
				categoriesWorkedOn: sql<number>`count(distinct coalesce(${category.id}, 0))`.as(
					'categoriesWorkedOn'
				)
			})
			.from(timeSession)
			.leftJoin(activityCategory, eq(timeSession.activityId, activityCategory.activityId))
			.leftJoin(category, eq(activityCategory.categoryId, category.id))
			.where(
				and(
					eq(timeSession.userId, userId),
					gte(timeSession.startedAt, start),
					lt(timeSession.startedAt, end),
					isNotNull(timeSession.stoppedAt),
					gt(timeSession.duration, 0)
				)
			)
			.get();

		return {
			totalDuration: Number(sessionResult?.totalDuration || 0),
			totalSessions: Number(sessionResult?.totalSessions || 0),
			categoriesWorkedOn: Number(categoryResult?.categoriesWorkedOn || 0),
			activitiesWorkedOn: Number(sessionResult?.activitiesWorkedOn || 0)
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

		await requireOwnedActivity(db, userId, activityId);

		const { start, end } = getSessionRange(startDate, endDate);

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

		await requireOwnedActivity(db, userId, activityId);

		const dateFilters = [];
		if (startDate) {
			const start = new Date(startDate + 'T00:00:00.000Z');
			dateFilters.push(gte(timeSession.startedAt, start));
		}
		if (endDate) {
			const end = new Date(endDate + 'T00:00:00.000Z');
			end.setUTCDate(end.getUTCDate() + 1);
			dateFilters.push(lt(timeSession.startedAt, end));
		}

		const today = todayDateKey();
		const weekStart = weekBounds(today).start;
		const monthStart = monthBounds(today).start;
		const goalSummaryStart = weekStart < monthStart ? weekStart : monthStart;
		const goalSummaryRange = getSessionRange(goalSummaryStart, today);

		const [sessions, goalHistory, goalSessionsForSummary] = await Promise.all([
			db
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
						gt(timeSession.duration, 0),
						...dateFilters
					)
				)
				.orderBy(sql`${timeSession.startedAt} ASC`)
				.all(),
			getGoalHistoryEntries(db, activityId),
			db
				.select({
					startedAt: timeSession.startedAt,
					duration: timeSession.duration
				})
				.from(timeSession)
				.where(
					and(
						eq(timeSession.userId, userId),
						eq(timeSession.activityId, activityId),
						isNotNull(timeSession.stoppedAt),
						gt(timeSession.duration, 0),
						gte(timeSession.startedAt, goalSummaryRange.start),
						lt(timeSession.startedAt, goalSummaryRange.end)
					)
				)
				.all()
		]);

		const sessionsForGoals = sessions.map((session: (typeof sessions)[number]) => ({
			startedAt: session.startedAt,
			duration: session.duration,
			isActive: false as const
		}));

		const goalSessions = goalSessionsForSummary.map(
			(session: (typeof goalSessionsForSummary)[number]) => ({
				startedAt: session.startedAt,
				duration: session.duration,
				isActive: false as const
			})
		);

		const goalHitsStart =
			startDate ?? (sessions[0] ? toDateKey(new Date(sessions[0].startedAt)) : today);
		const goalHitsEnd = endDate ?? today;
		const includeYearInLabels = goalHitsStart.slice(0, 4) !== goalHitsEnd.slice(0, 4);

		const goalSummary = {
			activeGoal: getActiveGoal(goalHistory, today),
			week: periodSummaryPayload(evaluateWeek(goalHistory, goalSessions, today, today)),
			month: periodSummaryPayload(evaluateMonth(goalHistory, goalSessions, today, today)),
			/** dateKey → hit (true) / miss (false). Days without a daily goal are omitted. */
			dailyGoalHits: dailyGoalHitsForRange(
				goalHistory,
				sessionsForGoals,
				goalHitsStart,
				goalHitsEnd,
				today
			)
		};

		if (sessions.length === 0) {
			return {
				chartData: [],
				totalDuration: 0,
				totalSessions: 0,
				shortestSession: null,
				averageSession: null,
				longestSession: null,
				firstSession: null,
				lastSession: null,
				goalSummary
			};
		}

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
					label = date.toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						...(includeYearInLabels ? { year: '2-digit' as const } : {}),
						timeZone: 'UTC'
					});
					break;
				}
				case 'weekly': {
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
					label = includeYearInLabels ? `W${weekNum} '${String(year).slice(-2)}` : `W${weekNum}`;
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

		const chartData = Object.values(chartDataMap)
			.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
			.map(({ label, duration, bucketKey }) => ({ label, duration, bucketKey }));

		const durations = sessions
			.map((s: (typeof sessions)[number]) => s.duration || 0)
			.filter((d: number) => d > 0);
		const totalDuration = durations.reduce((sum: number, d: number) => sum + d, 0);
		const totalSessions = sessions.length;

		const shortestSession = durations.length > 0 ? Math.min(...durations) : null;
		const longestSession = durations.length > 0 ? Math.max(...durations) : null;
		const averageSession =
			durations.length > 0 ? Math.round(totalDuration / durations.length) : null;

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
			lastSession,
			goalSummary
		};
	}
);
