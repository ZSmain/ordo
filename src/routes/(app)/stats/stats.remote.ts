import { query } from '$app/server';
import { db } from '$lib/server/db';
import { activity, category, timeSession } from '$lib/server/db/schema';
import { and, eq, gte, isNotNull, lt, sql, sum } from 'drizzle-orm';
import * as v from 'valibot';

export const getCategoryStats = query(
    v.object({
        userId: v.string(),
        startDate: v.string(),
        endDate: v.string()
    }),
    async ({ userId, startDate, endDate }) => {
        const start = new Date(startDate + 'T00:00:00.000Z');
        const end = new Date(endDate + 'T23:59:59.999Z');

        const categoryStats = await db
            .select({
                categoryId: category.id,
                categoryName: category.name,
                categoryColor: category.color,
                categoryIcon: category.icon,
                totalDuration: sum(timeSession.duration).as('totalDuration'),
                sessionCount: sql<number>`count(${timeSession.id})`.as('sessionCount')
            })
            .from(timeSession)
            .innerJoin(activity, eq(timeSession.activityId, activity.id))
            .innerJoin(category, eq(activity.categoryId, category.id))
            .where(
                and(
                    eq(timeSession.userId, userId),
                    gte(timeSession.startedAt, start),
                    lt(timeSession.startedAt, end),
                    isNotNull(timeSession.stoppedAt)
                )
            )
            .groupBy(category.id, category.name, category.color, category.icon)
            .orderBy(sql`totalDuration DESC`)
            .all();

        return categoryStats.map((stat) => ({
            ...stat,
            totalDuration: Number(stat.totalDuration || 0),
            sessionCount: Number(stat.sessionCount)
        }));
    }
);

export const getActivityStats = query(
    v.object({
        userId: v.string(),
        startDate: v.string(),
        endDate: v.string()
    }),
    async ({ userId, startDate, endDate }) => {
        const start = new Date(startDate + 'T00:00:00.000Z');
        const end = new Date(endDate + 'T23:59:59.999Z');

        const activityStats = await db
            .select({
                activityId: activity.id,
                activityName: activity.name,
                activityIcon: activity.icon,
                categoryId: category.id,
                categoryName: category.name,
                categoryColor: category.color,
                categoryIcon: category.icon,
                totalDuration: sum(timeSession.duration).as('totalDuration'),
                sessionCount: sql<number>`count(${timeSession.id})`.as('sessionCount')
            })
            .from(timeSession)
            .innerJoin(activity, eq(timeSession.activityId, activity.id))
            .innerJoin(category, eq(activity.categoryId, category.id))
            .where(
                and(
                    eq(timeSession.userId, userId),
                    gte(timeSession.startedAt, start),
                    lt(timeSession.startedAt, end),
                    isNotNull(timeSession.stoppedAt)
                )
            )
            .groupBy(
                activity.id,
                activity.name,
                activity.icon,
                category.id,
                category.name,
                category.color,
                category.icon
            )
            .orderBy(category.name, sql`totalDuration DESC`)
            .all();

        return activityStats.map((stat) => ({
            ...stat,
            totalDuration: Number(stat.totalDuration || 0),
            sessionCount: Number(stat.sessionCount)
        }));
    }
);

export const getOverviewStats = query(
    v.object({
        userId: v.string(),
        startDate: v.string(),
        endDate: v.string()
    }),
    async ({ userId, startDate, endDate }) => {
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
            .innerJoin(category, eq(activity.categoryId, category.id))
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