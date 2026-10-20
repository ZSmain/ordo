import {
	getActiveGoal,
	goalsEqual,
	normalizeGoalValues,
	todayDateKey,
	tomorrowDateKey,
	type GoalHistoryEntry,
	type GoalValues
} from '#lib/goals/index.js';
import { goalHistory } from '#lib/server/db/schema.js';
import type { ActivityGoalState } from '#lib/tracker/dtos.js';
import { and, eq, inArray } from 'drizzle-orm';

type AppDb = App.Locals['db'];

/** Subset of the DB client used by goal queries (satisfied by both db and txn). */
type DbExecutor = Pick<AppDb, 'select' | 'insert' | 'update' | 'delete'>;

type GoalHistoryRow = {
	id: number;
	activityId: number;
	dailyGoal: number | null;
	weeklyGoal: number | null;
	monthlyGoal: number | null;
	startDate: string;
};

export type DisplayGoals = ActivityGoalState;

export type GoalChangeInput = {
	dailyGoal?: number | null;
	weeklyGoal?: number | null;
	monthlyGoal?: number | null;
};

const EMPTY_GOALS: GoalValues = {
	dailyGoal: null,
	weeklyGoal: null,
	monthlyGoal: null
};

const NO_GOALS: DisplayGoals = {
	current: null,
	pending: null,
	effectiveDate: null
};

function toEntry(row: GoalHistoryRow): GoalHistoryEntry {
	return {
		startDate: row.startDate,
		dailyGoal: row.dailyGoal,
		weeklyGoal: row.weeklyGoal,
		monthlyGoal: row.monthlyGoal
	};
}

function toDisplayGoals(entries: GoalHistoryEntry[], now: Date): DisplayGoals {
	const today = todayDateKey(now);
	const tomorrow = tomorrowDateKey(now);
	const current = getActiveGoal(entries, today);
	const tomorrowEntry = entries.find((entry) => entry.startDate === tomorrow);
	if (!tomorrowEntry) {
		return { current, pending: null, effectiveDate: null };
	}
	const pending = normalizeGoalValues(tomorrowEntry);
	// A pending row identical to today is not a change (scheduleGoalChange
	// deletes such rows, but guard here for legacy data).
	if (goalsEqual(pending, current ?? EMPTY_GOALS)) {
		return { current, pending: null, effectiveDate: null };
	}
	return { current, pending, effectiveDate: tomorrow };
}

async function fetchGoalRows(
	executor: DbExecutor,
	activityIds: number[]
): Promise<GoalHistoryRow[]> {
	if (activityIds.length === 0) return [];
	return await executor
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
}

/**
 * Single read path for goal display. Returns the today-active goals
 * (`current`) plus any scheduled tomorrow change (`pending`) per activity.
 * Callers never see raw `goal_history` rows.
 */
export async function getDisplayGoals(
	db: AppDb,
	activityIds: number[],
	now = new Date()
): Promise<Map<number, DisplayGoals>> {
	const map = new Map<number, DisplayGoals>();
	for (const id of activityIds) {
		map.set(id, { ...NO_GOALS });
	}
	if (activityIds.length === 0) return map;

	const rows = await fetchGoalRows(db, activityIds);
	const entriesByActivity = new Map<number, GoalHistoryEntry[]>();
	for (const row of rows) {
		const list = entriesByActivity.get(row.activityId) ?? [];
		list.push(toEntry(row));
		entriesByActivity.set(row.activityId, list);
	}

	for (const [activityId, entries] of entriesByActivity) {
		map.set(activityId, toDisplayGoals(entries, now));
	}

	return map;
}

/**
 * History entries for goal evaluation (stats). Returns plain
 * `{ startDate, dailyGoal, weeklyGoal, monthlyGoal }` DTOs —
 * never raw DB rows with `id` / `activityId`.
 */
export async function getGoalHistoryEntries(
	db: AppDb,
	activityId: number
): Promise<GoalHistoryEntry[]> {
	const rows = await fetchGoalRows(db, [activityId]);
	return rows.map(toEntry);
}

/**
 * Persist a goal change that takes effect tomorrow. Read-then-write runs
 * inside a transaction so concurrent edits to the same activity serialize.
 * - Values matching tomorrow's baseline delete any pending row (revert).
 * - Otherwise a single tomorrow row is upserted.
 * Resolves to the activity's display goals after the change.
 */
export async function scheduleGoalChange(
	db: AppDb,
	activityId: number,
	goals: GoalChangeInput,
	now = new Date()
): Promise<DisplayGoals> {
	const next = normalizeGoalValues(goals);
	const startDate = tomorrowDateKey(now);
	const today = todayDateKey(now);

	return await db.transaction(async (tx: DbExecutor) => {
		const executor = tx;
		const rows = await fetchGoalRows(executor, [activityId]);
		const entries = rows.map(toEntry);
		const current = getActiveGoal(entries, today);
		const baselineEntries = entries.filter((entry) => entry.startDate !== startDate);
		const baseline = getActiveGoal(baselineEntries, startDate) ?? EMPTY_GOALS;
		const existingTomorrow = rows.find((row) => row.startDate === startDate);

		if (goalsEqual(next, baseline)) {
			if (existingTomorrow) {
				await executor
					.delete(goalHistory)
					.where(and(eq(goalHistory.activityId, activityId), eq(goalHistory.startDate, startDate)));
			}
			return { current, pending: null, effectiveDate: null } satisfies DisplayGoals;
		}

		if (existingTomorrow) {
			await executor
				.update(goalHistory)
				.set({
					dailyGoal: next.dailyGoal,
					weeklyGoal: next.weeklyGoal,
					monthlyGoal: next.monthlyGoal,
					updatedAt: new Date()
				})
				.where(eq(goalHistory.id, existingTomorrow.id));
		} else {
			await executor.insert(goalHistory).values({
				activityId,
				dailyGoal: next.dailyGoal,
				weeklyGoal: next.weeklyGoal,
				monthlyGoal: next.monthlyGoal,
				startDate
			});
		}

		return { current, pending: { ...next }, effectiveDate: startDate } satisfies DisplayGoals;
	});
}
