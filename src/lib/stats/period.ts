import { CalendarDate, getDayOfWeek } from '@internationalized/date';

export type StatsPeriod = 'day' | 'week' | 'month' | 'year';

export function getPeriodStart(date: CalendarDate, period: StatsPeriod): CalendarDate {
	switch (period) {
		case 'day':
			return date;
		case 'week': {
			const daysSinceMonday = getDayOfWeek(date, 'en-US', 'mon');
			return date.subtract({ days: daysSinceMonday });
		}
		case 'month':
			return new CalendarDate(date.year, date.month, 1);
		case 'year':
			return new CalendarDate(date.year, 1, 1);
	}
}

export function getPeriodEnd(date: CalendarDate, period: StatsPeriod): CalendarDate {
	switch (period) {
		case 'day':
			return date;
		case 'week': {
			const daysSinceMonday = getDayOfWeek(date, 'en-US', 'mon');
			return date.add({ days: 6 - daysSinceMonday });
		}
		case 'month': {
			const nextMonth = date.month === 12 ? 1 : date.month + 1;
			const yearForNextMonth = date.month === 12 ? date.year + 1 : date.year;
			return new CalendarDate(yearForNextMonth, nextMonth, 1).subtract({ days: 1 });
		}
		case 'year':
			return new CalendarDate(date.year, 12, 31);
	}
}

export function toDateKey(date: CalendarDate): string {
	const year = date.year;
	const month = String(date.month).padStart(2, '0');
	const day = String(date.day).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function formatPeriodLabel(date: CalendarDate, period: StatsPeriod): string {
	const jsDate = new Date(date.year, date.month - 1, date.day);
	const todayDate = new Date();

	switch (period) {
		case 'day': {
			if (jsDate.toDateString() === todayDate.toDateString()) {
				return 'Today';
			}
			const yesterday = new Date(todayDate);
			yesterday.setDate(todayDate.getDate() - 1);
			if (jsDate.toDateString() === yesterday.toDateString()) {
				return 'Yesterday';
			}
			return jsDate.toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			});
		}
		case 'week': {
			const weekStart = getPeriodStart(date, 'week');
			const weekEnd = getPeriodEnd(date, 'week');
			const startJS = new Date(weekStart.year, weekStart.month - 1, weekStart.day);
			const endJS = new Date(weekEnd.year, weekEnd.month - 1, weekEnd.day);

			if (weekStart.year !== weekEnd.year) {
				return `${startJS.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endJS.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
			}

			return `${startJS.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endJS.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
		}
		case 'month':
			return jsDate.toLocaleDateString('en-US', {
				month: 'long',
				year: 'numeric'
			});
		case 'year':
			return date.year.toString();
	}
}
