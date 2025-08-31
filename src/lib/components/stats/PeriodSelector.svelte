<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	type PeriodType = 'day' | 'week' | 'month' | 'year';

	interface Props {
		selectedPeriod: PeriodType;
		onPeriodChange: (period: PeriodType) => void;
		selectedDate: CalendarDate;
		onDateChange: (date: CalendarDate) => void;
	}

	let { selectedPeriod, onPeriodChange, selectedDate, onDateChange }: Props = $props();

	function handlePeriodChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onPeriodChange(target.value as PeriodType);
	}

	function goToPrevious() {
		switch (selectedPeriod) {
			case 'day':
				onDateChange(selectedDate.subtract({ days: 1 }));
				break;
			case 'week':
				onDateChange(selectedDate.subtract({ weeks: 1 }));
				break;
			case 'month':
				onDateChange(selectedDate.subtract({ months: 1 }));
				break;
			case 'year':
				onDateChange(selectedDate.subtract({ years: 1 }));
				break;
		}
	}

	function goToNext() {
		const nextDate = (() => {
			switch (selectedPeriod) {
				case 'day':
					return selectedDate.add({ days: 1 });
				case 'week':
					return selectedDate.add({ weeks: 1 });
				case 'month':
					return selectedDate.add({ months: 1 });
				case 'year':
					return selectedDate.add({ years: 1 });
			}
		})();

		const todayDate = today(getLocalTimeZone());

		// Don't allow navigation to future periods
		if (selectedPeriod === 'day' && nextDate.compare(todayDate) <= 0) {
			onDateChange(nextDate);
		} else if (selectedPeriod !== 'day') {
			// For week/month/year, allow if the period starts before or on today
			const periodStart = getPeriodStart(nextDate, selectedPeriod);
			if (periodStart.compare(todayDate) <= 0) {
				onDateChange(nextDate);
			}
		}
	}

	function canGoToNext() {
		const nextDate = (() => {
			switch (selectedPeriod) {
				case 'day':
					return selectedDate.add({ days: 1 });
				case 'week':
					return selectedDate.add({ weeks: 1 });
				case 'month':
					return selectedDate.add({ months: 1 });
				case 'year':
					return selectedDate.add({ years: 1 });
			}
		})();

		const todayDate = today(getLocalTimeZone());

		if (selectedPeriod === 'day') {
			return nextDate.compare(todayDate) <= 0;
		} else {
			// For week/month/year, allow if the period starts before or on today
			const periodStart = getPeriodStart(nextDate, selectedPeriod);
			return periodStart.compare(todayDate) <= 0;
		}
	}

	function getPeriodStart(date: CalendarDate, period: PeriodType): CalendarDate {
		switch (period) {
			case 'day':
				return date;
			case 'week':
				// Start of week (Monday)
				const jsDate = date.toDate(getLocalTimeZone());
				const dayOfWeek = jsDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
				const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0 days to subtract
				return date.subtract({ days: daysToSubtract });
			case 'month':
				return new CalendarDate(date.year, date.month, 1);
			case 'year':
				return new CalendarDate(date.year, 1, 1);
		}
	}

	function getPeriodEnd(date: CalendarDate, period: PeriodType): CalendarDate {
		switch (period) {
			case 'day':
				return date;
			case 'week':
				// End of week (Sunday)
				const jsDate = date.toDate(getLocalTimeZone());
				const dayOfWeek = jsDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
				const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // Sunday = 0 days to add
				return date.add({ days: daysToAdd });
			case 'month':
				// Last day of month
				const nextMonth = date.month === 12 ? 1 : date.month + 1;
				const yearForNextMonth = date.month === 12 ? date.year + 1 : date.year;
				return new CalendarDate(yearForNextMonth, nextMonth, 1).subtract({ days: 1 });
			case 'year':
				return new CalendarDate(date.year, 12, 31);
		}
	}

	function formatPeriodLabel(date: CalendarDate, period: PeriodType): string {
		const jsDate = new Date(date.year, date.month - 1, date.day);
		const todayDate = new Date();

		switch (period) {
			case 'day':
				if (jsDate.toDateString() === todayDate.toDateString()) {
					return 'Today';
				}
				const yesterday = new Date();
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

			case 'week':
				const weekStart = getPeriodStart(date, 'week');
				const weekEnd = getPeriodEnd(date, 'week');
				const startJS = new Date(weekStart.year, weekStart.month - 1, weekStart.day);
				const endJS = new Date(weekEnd.year, weekEnd.month - 1, weekEnd.day);

				if (weekStart.month === weekEnd.month) {
					return `${startJS.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endJS.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
				} else {
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

	function goToToday() {
		onDateChange(today(getLocalTimeZone()));
	}

	function isToday(): boolean {
		const todayDate = today(getLocalTimeZone());
		switch (selectedPeriod) {
			case 'day':
				return selectedDate.compare(todayDate) === 0;
			case 'week':
				const weekStart = getPeriodStart(selectedDate, 'week');
				const weekEnd = getPeriodEnd(selectedDate, 'week');
				return todayDate.compare(weekStart) >= 0 && todayDate.compare(weekEnd) <= 0;
			case 'month':
				return selectedDate.year === todayDate.year && selectedDate.month === todayDate.month;
			case 'year':
				return selectedDate.year === todayDate.year;
		}
	}
</script>

<div class="flex items-center justify-between">
	<Button variant="ghost" size="icon" onclick={goToPrevious}>
		<ChevronLeft class="size-4" />
	</Button>

	<div class="flex items-center gap-3">
		<select
			value={selectedPeriod}
			onchange={handlePeriodChange}
			class="flex h-8 w-20 items-center justify-center rounded-md border border-input bg-transparent px-2 py-1 text-xs font-medium shadow-sm ring-offset-background focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			<option value="day">Day</option>
			<option value="week">Week</option>
			<option value="month">Month</option>
			<option value="year">Year</option>
		</select>

		<span class="text-sm font-medium">
			{formatPeriodLabel(selectedDate, selectedPeriod)}
		</span>

		{#if !isToday()}
			<Badge variant="outline" class="cursor-pointer text-xs" onclick={goToToday}>Current</Badge>
		{/if}
	</div>

	<Button variant="ghost" size="icon" onclick={goToNext} disabled={!canGoToNext()}>
		<ChevronRight class="size-4" />
	</Button>
</div>
