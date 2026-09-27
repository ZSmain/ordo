const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
	return DATE_KEY_RE.test(value);
}

export function toDateKey(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

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

export function weekBounds(dateKey: string): { start: string; end: string } {
	const date = parseDateKey(dateKey);
	const day = date.getUTCDay();
	const daysSinceMonday = day === 0 ? 6 : day - 1;
	const start = addDays(dateKey, -daysSinceMonday);
	const end = addDays(start, 6);
	return { start, end };
}

export function monthBounds(dateKey: string): { start: string; end: string } {
	const date = parseDateKey(dateKey);
	const start = toDateKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
	const end = toDateKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
	return { start, end };
}

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
