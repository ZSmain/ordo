<script lang="ts">
	import {
		ActivityStatisticsDrawer,
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

	// State for period selection
	let selectedPeriod = $state<PeriodType>('day');
	let selectedDate = $state(today(getLocalTimeZone()));

	// Activity statistics drawer state
	let statisticsDrawerOpen = $state(false);
	let selectedActivity = $state<{ id: number; name: string; icon: string } | null>(null);

	function handleActivityClick(activity: { id: number; name: string; icon: string }) {
		selectedActivity = activity;
		statisticsDrawerOpen = true;
	}

	function getPeriodStart(date: CalendarDate, period: PeriodType): CalendarDate {
		switch (period) {
			case 'day':
				return date;
			case 'week': {
				const jsDate = date.toDate(getLocalTimeZone());
				const dayOfWeek = jsDate.getDay();
				const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
				return date.subtract({ days: daysToSubtract });
			}
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
			case 'week': {
				const jsDate = date.toDate(getLocalTimeZone());
				const dayOfWeek = jsDate.getDay();
				const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
				return date.add({ days: daysToAdd });
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

	// Reactive queries that update when period/date changes
	const statsParams = $derived.by(() => {
		if (!data.user) return null;
		const startDate = getPeriodStart(selectedDate, selectedPeriod);
		const endDate = getPeriodEnd(selectedDate, selectedPeriod);
		return {
			userId: data.user.id,
			startDate: formatDateForAPI(startDate),
			endDate: formatDateForAPI(endDate)
		};
	});

	const categoryStatsQuery = $derived.by(() => {
		if (!statsParams) return null;
		return getCategoryStats(statsParams);
	});

	const activityStatsQuery = $derived.by(() => {
		if (!statsParams) return null;
		return getActivityStats(statsParams);
	});

	const overviewStatsQuery = $derived.by(() => {
		if (!statsParams) return null;
		return getOverviewStats(statsParams);
	});

	function handlePeriodChange(period: PeriodType): void {
		selectedPeriod = period;
	}

	function handleDateChange(date: CalendarDate): void {
		selectedDate = date;
	}
</script>

<svelte:head>
	<title>Ordo - Statistics</title>
</svelte:head>

<div class="grid h-full grid-rows-[1fr_auto]">
	<!-- Content area -->
	<div class="overflow-hidden">
		<ScrollArea class="h-full">
			<div class="container mx-auto max-w-4xl p-4">
				<svelte:boundary>
					{#snippet pending()}
						<div class="py-8 text-center">
							<p class="text-muted-foreground">Loading statistics...</p>
						</div>
					{/snippet}

					{#snippet failed()}
						<div class="py-8 text-center">
							<p class="text-red-500">Failed to load statistics. Please try again.</p>
						</div>
					{/snippet}

					{@const categoryStats = categoryStatsQuery?.current ?? []}
					{@const activityStats = activityStatsQuery?.current ?? []}
					{@const overviewStats = overviewStatsQuery?.current ?? {
						totalDuration: 0,
						totalSessions: 0,
						categoriesWorkedOn: 0,
						activitiesWorkedOn: 0
					}}

					{#if overviewStats.totalSessions === 0}
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
									activities={activityStats}
									period={getPeriodLabel(selectedDate, selectedPeriod)}
								/>
							</div>

							<div class="grid gap-6 lg:grid-cols-2">
								<CategoryStatsCard categories={categoryStats} />
								<ActivityStatsCard
									activities={activityStats}
									onActivityClick={handleActivityClick}
								/>
							</div>
						</div>
					{/if}
				</svelte:boundary>
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

<!-- Activity Statistics Drawer -->
{#if data.user}
	<ActivityStatisticsDrawer
		bind:open={statisticsDrawerOpen}
		activity={selectedActivity}
		userId={data.user.id}
		onOpenChange={(open) => (statisticsDrawerOpen = open)}
	/>
{/if}
