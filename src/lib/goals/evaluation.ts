import { eachDateKey, monthBounds, toDateKey, weekBounds } from './dates';

/** Goal amounts in minutes. Null means no goal for that period. */
export type GoalValues = {
	dailyGoal: number | null;
	weeklyGoal: number | null;
	monthlyGoal: number | null;
};

export type GoalHistoryEntry = GoalValues & {
	startDate: string; // YYYY-MM-DD
};

export type SessionForGoals = {
	startedAt: Date | string;
	duration: number | null; // seconds
	isActive?: boolean | null;
};

export function goalsEqual(a: GoalValues, b: GoalValues): boolean {
	return (
		(a.dailyGoal ?? null) === (b.dailyGoal ?? null) &&
		(a.weeklyGoal ?? null) === (b.weeklyGoal ?? null) &&
		(a.monthlyGoal ?? null) === (b.monthlyGoal ?? null)
	);
}

export function hasAnyGoal(goals: GoalValues | null | undefined): boolean {
	if (!goals) return false;
	return goals.dailyGoal != null || goals.weeklyGoal != null || goals.monthlyGoal != null;
}

export function normalizeGoalValues(input: {
	dailyGoal?: number | null;
	weeklyGoal?: number | null;
	monthlyGoal?: number | null;
}): GoalValues {
	return {
		dailyGoal: input.dailyGoal ?? null,
		weeklyGoal: input.weeklyGoal ?? null,
		monthlyGoal: input.monthlyGoal ?? null
	};
}

function toGoalValues(entry: GoalHistoryEntry): GoalValues {
	return {
		dailyGoal: entry.dailyGoal ?? null,
		weeklyGoal: entry.weeklyGoal ?? null,
		monthlyGoal: entry.monthlyGoal ?? null
	};
}

/**
 * Active goal for a calendar date: most recent history entry with startDate <= dateKey.
 * Returns null when no goal has ever been set for that date (or all values are null).
 */
export function getActiveGoal(
	history: readonly GoalHistoryEntry[],
	dateKey: string
): GoalValues | null {
	return createActiveGoalLookup(history)(dateKey);
}

/** Sort once, then resolve active goals in O(n) total for sequential date walks. */
export function createActiveGoalLookup(
	history: readonly GoalHistoryEntry[]
): (dateKey: string) => GoalValues | null {
	const sorted = [...history].sort((a, b) => a.startDate.localeCompare(b.startDate));

	return (dateKey: string): GoalValues | null => {
		let best: GoalHistoryEntry | null = null;
		for (const entry of sorted) {
			if (entry.startDate > dateKey) break;
			best = entry;
		}
		if (!best || !hasAnyGoal(best)) return null;
		return toGoalValues(best);
	};
}

/** Latest history entry (by startDate), including future-dated pending goals. */
export function getLatestGoalEntry(
	history: readonly GoalHistoryEntry[]
): GoalHistoryEntry | null {
	if (history.length === 0) return null;
	return history.reduce((latest, entry) =>
		entry.startDate > latest.startDate ? entry : latest
	);
}

function sessionDateKey(session: SessionForGoals): string {
	const startedAt =
		typeof session.startedAt === 'string' ? new Date(session.startedAt) : session.startedAt;
	return toDateKey(startedAt);
}

/** Only stopped sessions count toward goals. */
export function isCountableSession(session: SessionForGoals): boolean {
	if (session.isActive === true) return false;
	if (session.duration == null || session.duration <= 0) return false;
	return true;
}

/** Map of dateKey → duration seconds for stopped sessions. */
export function durationByDate(sessions: readonly SessionForGoals[]): Map<string, number> {
	const map = new Map<string, number>();
	for (const session of sessions) {
		if (!isCountableSession(session)) continue;
		const key = sessionDateKey(session);
		map.set(key, (map.get(key) ?? 0) + (session.duration ?? 0));
	}
	return map;
}

/** Sum stopped-session duration (seconds) whose startedAt falls on dateKey. */
export function sumDurationOnDate(
	sessions: readonly SessionForGoals[],
	dateKey: string
): number {
	let total = 0;
	for (const session of sessions) {
		if (!isCountableSession(session)) continue;
		if (sessionDateKey(session) !== dateKey) continue;
		total += session.duration ?? 0;
	}
	return total;
}

/** Sum stopped-session duration (seconds) for inclusive [start, end] date keys. */
export function sumDurationInRange(
	sessions: readonly SessionForGoals[],
	start: string,
	end: string
): number {
	let total = 0;
	for (const session of sessions) {
		if (!isCountableSession(session)) continue;
		const key = sessionDateKey(session);
		if (key < start || key > end) continue;
		total += session.duration ?? 0;
	}
	return total;
}

/**
 * Whether a goal was met.
 * Returns null when no goal is set (no indicator).
 */
export function isGoalHit(
	durationSeconds: number,
	goalMinutes: number | null | undefined
): boolean | null {
	if (goalMinutes == null || goalMinutes <= 0) return null;
	return durationSeconds >= goalMinutes * 60;
}

/** Alias for daily evaluation call sites. */
export const isDailyGoalHit = isGoalHit;

export type DayGoalEvaluation = {
	dateKey: string;
	durationSeconds: number;
	dailyGoalMinutes: number | null;
	/** null = no goal set; true = hit; false = miss */
	goalHit: boolean | null;
};

export function evaluateDay(
	history: readonly GoalHistoryEntry[],
	sessions: readonly SessionForGoals[],
	dateKey: string
): DayGoalEvaluation {
	const active = getActiveGoal(history, dateKey);
	const durationSeconds = sumDurationOnDate(sessions, dateKey);
	const dailyGoalMinutes = active?.dailyGoal ?? null;

	return {
		dateKey,
		durationSeconds,
		dailyGoalMinutes,
		goalHit: isGoalHit(durationSeconds, dailyGoalMinutes)
	};
}

export type PeriodGoalSummary = {
	start: string;
	end: string;
	durationSeconds: number;
	goalMinutes: number | null;
	goalHit: boolean | null;
	/** Number of days in range with a daily goal that was hit. */
	dailyHits: number;
	/** Number of days in range that had a daily goal set. */
	dailyGoalDays: number;
};

/**
 * Evaluate a calendar-aligned period.
 * Period goal (weekly/monthly) uses the active goal on the period's first day.
 */
export function evaluatePeriod(
	history: readonly GoalHistoryEntry[],
	sessions: readonly SessionForGoals[],
	start: string,
	end: string,
	periodGoalMinutes: number | null
): PeriodGoalSummary {
	const durations = durationByDate(sessions);
	const activeGoal = createActiveGoalLookup(history);
	let durationSeconds = 0;
	let dailyHits = 0;
	let dailyGoalDays = 0;

	for (const dateKey of eachDateKey(start, end)) {
		const dayDuration = durations.get(dateKey) ?? 0;
		durationSeconds += dayDuration;
		const hit = isGoalHit(dayDuration, activeGoal(dateKey)?.dailyGoal);
		if (hit === null) continue;
		dailyGoalDays += 1;
		if (hit) dailyHits += 1;
	}

	return {
		start,
		end,
		durationSeconds,
		goalMinutes: periodGoalMinutes,
		goalHit: isGoalHit(durationSeconds, periodGoalMinutes),
		dailyHits,
		dailyGoalDays
	};
}

export function evaluateWeek(
	history: readonly GoalHistoryEntry[],
	sessions: readonly SessionForGoals[],
	dateKey: string
): PeriodGoalSummary {
	const { start, end } = weekBounds(dateKey);
	const active = getActiveGoal(history, start);
	return evaluatePeriod(history, sessions, start, end, active?.weeklyGoal ?? null);
}

export function evaluateMonth(
	history: readonly GoalHistoryEntry[],
	sessions: readonly SessionForGoals[],
	dateKey: string
): PeriodGoalSummary {
	const { start, end } = monthBounds(dateKey);
	const active = getActiveGoal(history, start);
	return evaluatePeriod(history, sessions, start, end, active?.monthlyGoal ?? null);
}

/**
 * Build per-day goal hit map for a range (for calendar overlay).
 * Days without a daily goal are omitted (no indicator).
 */
export function dailyGoalHitsForRange(
	history: readonly GoalHistoryEntry[],
	sessions: readonly SessionForGoals[],
	start: string,
	end: string
): Record<string, boolean> {
	const durations = durationByDate(sessions);
	const activeGoal = createActiveGoalLookup(history);
	const hits: Record<string, boolean> = {};

	for (const dateKey of eachDateKey(start, end)) {
		const hit = isGoalHit(durations.get(dateKey) ?? 0, activeGoal(dateKey)?.dailyGoal);
		if (hit !== null) {
			hits[dateKey] = hit;
		}
	}

	return hits;
}
