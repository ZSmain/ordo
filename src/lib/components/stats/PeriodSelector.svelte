<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		formatPeriodLabel,
		getPeriodEnd,
		getPeriodStart,
		type StatsPeriod
	} from '#lib/stats/period.js';
	import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	type PeriodType = StatsPeriod;

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

		if (selectedPeriod === 'day' && nextDate.compare(todayDate) <= 0) {
			onDateChange(nextDate);
		} else if (selectedPeriod !== 'day') {
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
			const periodStart = getPeriodStart(nextDate, selectedPeriod);
			return periodStart.compare(todayDate) <= 0;
		}
	}

	function goToToday() {
		onDateChange(today(getLocalTimeZone()));
	}

	function isToday(): boolean {
		const todayDate = today(getLocalTimeZone());
		switch (selectedPeriod) {
			case 'day': {
				return selectedDate.compare(todayDate) === 0;
			}
			case 'week': {
				const weekStart = getPeriodStart(selectedDate, 'week');
				const weekEnd = getPeriodEnd(selectedDate, 'week');
				return todayDate.compare(weekStart) >= 0 && todayDate.compare(weekEnd) <= 0;
			}
			case 'month': {
				return selectedDate.year === todayDate.year && selectedDate.month === todayDate.month;
			}
			case 'year': {
				return selectedDate.year === todayDate.year;
			}
		}
	}
</script>

<div class="flex items-center justify-between">
	<Button variant="outline" size="icon" onclick={goToPrevious}>
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

	<Button variant="outline" size="icon" onclick={goToNext} disabled={!canGoToNext()}>
		<ChevronRight class="size-4" />
	</Button>
</div>
