<script lang="ts">
	import {
		ActivityStatsCard,
		CategoryStatsCard,
		OverviewPieChart,
		PeriodSelector
	} from '$lib/components/stats';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
	import type { PageProps } from './$types';
	import { getActivityStats, getCategoryStats, getOverviewStats } from './stats.remote';

	let { data }: PageProps = $props();

	type PeriodType = 'day' | 'week' | 'month' | 'year';

	interface OverviewStats {
		totalDuration: number;
		totalSessions: number;
		categoriesWorkedOn: number;
		activitiesWorkedOn: number;
	}

	// State
	let selectedPeriod = $state<PeriodType>('day');
	let selectedDate = $state(today(getLocalTimeZone()));
	let loading = $state(false);
	let error = $state<string | null>(null);
	let categoryStats = $state<any[]>([]);
	let activityStats = $state<any[]>([]);
	let overviewStats = $state<OverviewStats>({
		totalDuration: 0,
		totalSessions: 0,
		categoriesWorkedOn: 0,
		activitiesWorkedOn: 0
	});

	function getPeriodStart(date: CalendarDate, period: PeriodType): CalendarDate {
		switch (period) {
			case 'day':
				return date;
			case 'week':
				const jsDate = date.toDate(getLocalTimeZone());
				const dayOfWeek = jsDate.getDay();
				const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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
				const jsDate = date.toDate(getLocalTimeZone());
				const dayOfWeek = jsDate.getDay();
				const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
				return date.add({ days: daysToAdd });
			case 'month':
				const nextMonth = date.month === 12 ? 1 : date.month + 1;
				const yearForNextMonth = date.month === 12 ? date.year + 1 : date.year;
				return new CalendarDate(yearForNextMonth, nextMonth, 1).subtract({ days: 1 });
			case 'year':
				return new CalendarDate(date.year, 12, 31);
		}
	}

	function formatDateForAPI(dateValue: CalendarDate): string {
		const year = dateValue.year;
		const month = String(dateValue.month).padStart(2, '0');
		const day = String(dateValue.day).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getPeriodLabel(date: CalendarDate, period: PeriodType): string {
		switch (period) {
			case 'day':
				return 'this day';
			case 'week':
				return 'this week';
			case 'month':
				return 'this month';
			case 'year':
				return 'this year';
		}
	}

	async function loadStats(): Promise<void> {
		if (!data.user) return;

		loading = true;
		error = null;
		try {
			const startDate = getPeriodStart(selectedDate, selectedPeriod);
			const endDate = getPeriodEnd(selectedDate, selectedPeriod);
			const startDateStr = formatDateForAPI(startDate);
			const endDateStr = formatDateForAPI(endDate);

			const [categoryData, activityData, overviewData] = await Promise.all([
				getCategoryStats({ userId: data.user.id, startDate: startDateStr, endDate: endDateStr }),
				getActivityStats({ userId: data.user.id, startDate: startDateStr, endDate: endDateStr }),
				getOverviewStats({ userId: data.user.id, startDate: startDateStr, endDate: endDateStr })
			]);

			categoryStats = categoryData;
			activityStats = activityData;
			overviewStats = overviewData;
		} catch (err) {
			error = 'Failed to load statistics. Please try again.';
			categoryStats = [];
			activityStats = [];
			overviewStats = {
				totalDuration: 0,
				totalSessions: 0,
				categoriesWorkedOn: 0,
				activitiesWorkedOn: 0
			};
		} finally {
			loading = false;
		}
	}

	function handlePeriodChange(period: PeriodType): void {
		selectedPeriod = period;
	}

	function handleDateChange(date: CalendarDate): void {
		selectedDate = date;
	}

	$effect(() => {
		loadStats();
	});
</script>

<svelte:head>
	<title>Ordo - Statistics</title>
</svelte:head>

<div class="grid h-full grid-rows-[1fr_auto]">
	<!-- Content area -->
	<div class="overflow-hidden">
		<ScrollArea class="h-full">
			<div class="container mx-auto max-w-4xl p-4">
				{#if loading}
					<div class="py-8 text-center">
						<p class="text-muted-foreground">Loading statistics...</p>
					</div>
				{:else if error}
					<div class="py-8 text-center">
						<p class="text-red-500">{error}</p>
					</div>
				{:else if overviewStats.totalSessions === 0}
					<div class="py-8 text-center">
						<p class="text-muted-foreground">No data recorded for this period.</p>
						<p class="mt-2 text-sm text-muted-foreground">
							Start tracking activities to see statistics here!
						</p>
					</div>
				{:else}
					<div class="space-y-6">
						<div class="grid gap-6 lg:grid-cols-3">
							<OverviewPieChart
								categories={categoryStats}
								period={getPeriodLabel(selectedDate, selectedPeriod)}
							/>
						</div>

						<div class="grid gap-6 lg:grid-cols-2">
							<CategoryStatsCard categories={categoryStats} />
							<ActivityStatsCard activities={activityStats} />
						</div>
					</div>
				{/if}
			</div>
		</ScrollArea>
	</div>

	<!-- Date navigation -->
	<div class="border-t bg-background/80 p-1.5 backdrop-blur-sm">
		<div class="container mx-auto max-w-4xl">
			<PeriodSelector
				{selectedPeriod}
				onPeriodChange={handlePeriodChange}
				{selectedDate}
				onDateChange={handleDateChange}
			/>
		</div>
	</div>
</div>
