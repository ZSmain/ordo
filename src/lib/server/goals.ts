import {
	getActiveGoal,
	getLatestGoalEntry,
	goalsEqual,
	normalizeGoalValues,
	todayDateKey,
	tomorrowDateKey,
	type GoalHistoryEntry,
	type GoalValues
} from '$lib/goals';
import { goalHistory } from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

type AppDb = App.Locals['db'];

export type GoalHistoryRow = {
	id: number;
	activityId: number;
	dailyGoal: number | null;
	weeklyGoal: number | null;
	monthlyGoal: number | null;
	startDate: string;
};

const EMPTY_GOALS: GoalValues = {
	dailyGoal: null,
	weeklyGoal: null,
	monthlyGoal: null
};

function toEntry(row: GoalHistoryRow): GoalHistoryEntry {
	return {
		startDate: row.startDate,
		dailyGoal: row.dailyGoal,
		weeklyGoal: row.weeklyGoal,
		monthlyGoal: row.monthlyGoal
	};
}

function toRow(row: {
	id: number;
	activityId: number;
	dailyGoal: number | null;
	weeklyGoal: number | null;
	monthlyGoal: number | null;
	startDate: string;
}): GoalHistoryRow {
	return {
		id: row.id,
		activityId: row.activityId,
		dailyGoal: row.dailyGoal,
		weeklyGoal: row.weeklyGoal,
		monthlyGoal: row.monthlyGoal,
		startDate: row.startDate
	};
}

export async function loadGoalHistoryForActivities(
	db: AppDb,
	activityIds: number[]
): Promise<Map<number, GoalHistoryRow[]>> {
	const map = new Map<number, GoalHistoryRow[]>();
	if (activityIds.length === 0) return map;

	const rows = await db
		.select({
			id: goalHistory.id,
			activityId: goalHistory.activityId,
			dailyGoal: goalHistory.dailyGoal,
			weeklyGoal: goalHistory.weeklyGoal,
			monthlyGoal: goalHistory.monthlyGoal,
			startDate: goalHistory.startDate
		})
		.from(goalHistory)
		.where(inArray(goalHistory.activityId, activityIds))
		.all();

	for (const row of rows) {
		const list = map.get(row.activityId) ?? [];
		list.push(row);
		map.set(row.activityId, list);
	}

	return map;
}

export async function loadGoalHistoryForActivity(
	db: AppDb,
	activityId: number
): Promise<GoalHistoryRow[]> {
	return (await loadGoalHistoryForActivities(db, [activityId])).get(activityId) ?? [];
}

/** Display goals for the activity list: currently active for today. */
export function activeGoalsForToday(rows: GoalHistoryRow[], now = new Date()): GoalValues | null {
	return getActiveGoal(rows.map(toEntry), todayDateKey(now));
}

/** Goals shown in edit forms: latest entry including tomorrow's pending change. */
export function latestGoalValues(rows: GoalHistoryRow[]): GoalValues | null {
	const latest = getLatestGoalEntry(rows.map(toEntry));
	if (!latest) return null;
	return normalizeGoalValues(latest);
}

/**
 * Persist a goal change that takes effect tomorrow.
 * - If values match the baseline (active goal without a tomorrow entry), remove any
 *   pending tomorrow entry and no-op.
 * - Otherwise upsert a single history row for tomorrow.
 */
export async function setActivityGoalsEffectiveTomorrow(
	db: AppDb,
	activityId: number,
	goals: {
		dailyGoal?: number | null;
		weeklyGoal?: number | null;
		monthlyGoal?: number | null;
	},
	now = new Date()
): Promise<GoalHistoryRow | null> {
	const next = normalizeGoalValues(goals);
	const startDate = tomorrowDateKey(now);
	const history = await loadGoalHistoryForActivity(db, activityId);
	const existingTomorrow = history.find((row) => row.startDate === startDate);
	const baselineEntries = history.filter((row) => row.startDate !== startDate).map(toEntry);
	const baseline = getActiveGoal(baselineEntries, startDate) ?? EMPTY_GOALS;

	if (goalsEqual(next, baseline)) {
		if (existingTomorrow) {
			await db
				.delete(goalHistory)
				.where(and(eq(goalHistory.activityId, activityId), eq(goalHistory.startDate, startDate)));
		}
		return null;
	}

	if (existingTomorrow) {
		const updated = await db
			.update(goalHistory)
			.set({
				dailyGoal: next.dailyGoal,
				weeklyGoal: next.weeklyGoal,
				monthlyGoal: next.monthlyGoal,
				updatedAt: new Date()
			})
			.where(eq(goalHistory.id, existingTomorrow.id))
			.returning()
			.get();

		return updated ? toRow(updated) : null;
	}

	const inserted = await db
		.insert(goalHistory)
		.values({
			activityId,
			dailyGoal: next.dailyGoal,
			weeklyGoal: next.weeklyGoal,
			monthlyGoal: next.monthlyGoal,
			startDate
		})
		.returning()
		.get();

	return inserted ? toRow(inserted) : null;
}
