/** Calendar date helpers for goal evaluation (UTC calendar days). */

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
	return DATE_KEY_RE.test(value);
}

/** Format a Date as YYYY-MM-DD in UTC. */
export function toDateKey(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/** Parse YYYY-MM-DD into a UTC midnight Date. */
export function parseDateKey(dateKey: string): Date {
	if (!isDateKey(dateKey)) {
		throw new Error(`Invalid date key: ${dateKey}`);
	}
	return new Date(`${dateKey}T00:00:00.000Z`);
}

export function addDays(dateKey: string, days: number): string {
	const date = parseDateKey(dateKey);
	return toDateKey(
		new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days))
	);
}

/** Tomorrow's calendar date in UTC (goal changes take effect tomorrow). */
export function tomorrowDateKey(now: Date = new Date()): string {
	const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	return toDateKey(new Date(today.getTime() + 24 * 60 * 60 * 1000));
}

export function todayDateKey(now: Date = new Date()): string {
	return toDateKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));
}

/**
 * Monday–Sunday week containing `dateKey`.
 * Returns inclusive start (Monday) and end (Sunday) date keys.
 */
export function weekBounds(dateKey: string): { start: string; end: string } {
	const date = parseDateKey(dateKey);
	// getUTCDay: 0=Sun … 6=Sat → days since Monday
	const day = date.getUTCDay();
	const daysSinceMonday = day === 0 ? 6 : day - 1;
	const start = addDays(dateKey, -daysSinceMonday);
	const end = addDays(start, 6);
	return { start, end };
}

/** Calendar month containing `dateKey` (1st … last day). */
export function monthBounds(dateKey: string): { start: string; end: string } {
	const date = parseDateKey(dateKey);
	const start = toDateKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
	const end = toDateKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
	return { start, end };
}

/** Inclusive list of date keys from start to end. */
export function eachDateKey(start: string, end: string): string[] {
	if (start > end) return [];
	const keys: string[] = [];
	let cursor = start;
	while (cursor <= end) {
		keys.push(cursor);
		cursor = addDays(cursor, 1);
	}
	return keys;
}
