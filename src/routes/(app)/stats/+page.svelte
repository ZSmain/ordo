<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		ActivityStatisticsDrawer,
		ActivityStatsCard,
		CategoryStatsCard,
		OverviewPieChart,
		OverviewStatsCard,
		PeriodSelector
	} from '#lib/components/stats/index.js';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.js';
	import {
		formatPeriodLabel,
		getPeriodEnd,
		getPeriodStart,
		toDateKey,
		type StatsPeriod
	} from '#lib/stats/period.js';
	import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
	import type { PageProps } from './$types';
	import { getActivityStats, getCategoryStats, getOverviewStats } from './stats.remote';

	let { data }: PageProps = $props();

	let selectedPeriod = $state<StatsPeriod>('day');
	let selectedDate = $state(today(getLocalTimeZone()));

	let statisticsDrawerOpen = $state(false);
	let selectedActivity = $state<{ id: number; name: string; icon: string } | null>(null);

	function handleActivityClick(activity: { id: number; name: string; icon: string }) {
		selectedActivity = activity;
		statisticsDrawerOpen = true;
	}

	const periodLabel = $derived(formatPeriodLabel(selectedDate, selectedPeriod));

	const statsParams = $derived.by(() => {
		if (!data.user) return null;
		const startDate = getPeriodStart(selectedDate, selectedPeriod);
		const endDate = getPeriodEnd(selectedDate, selectedPeriod);
		return {
			startDate: toDateKey(startDate),
			endDate: toDateKey(endDate)
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

	const categoryStats = $derived(categoryStatsQuery?.current ?? []);
	const activityStats = $derived(activityStatsQuery?.current ?? []);
	const overviewStats = $derived(overviewStatsQuery?.current ?? null);

	const statsLoading = $derived(
		!overviewStatsQuery ||
			overviewStatsQuery.loading ||
			categoryStatsQuery?.loading === true ||
			activityStatsQuery?.loading === true
	);

	const statsError = $derived(
		overviewStatsQuery?.error ?? categoryStatsQuery?.error ?? activityStatsQuery?.error
	);

	function handlePeriodChange(period: StatsPeriod): void {
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
	<div class="overflow-hidden">
		<ScrollArea class="h-full">
			<div class="container mx-auto max-w-4xl p-4">
				{#if statsLoading}
					<div class="py-8 text-center">
						<p class="text-muted-foreground">Loading statistics...</p>
					</div>
				{:else if statsError}
					<div class="py-8 text-center">
						<p class="text-destructive">{statsError.message || 'Failed to load statistics.'}</p>
					</div>
				{:else if !overviewStats || overviewStats.totalSessions === 0}
					<div class="py-8 text-center">
						<p class="text-muted-foreground">No data recorded for this period.</p>
						<p class="mt-2 text-sm text-muted-foreground">
							<a href={resolve('/(app)')} class="text-primary underline-offset-4 hover:underline"
								>Start tracking activities</a
							> to see statistics here!
						</p>
					</div>
				{:else}
					<div class="space-y-6">
						<OverviewStatsCard stats={overviewStats} period={periodLabel} />

						<div class="grid gap-6 lg:grid-cols-2">
							<OverviewPieChart
								categories={categoryStats}
								totalDuration={overviewStats.totalDuration}
								totalSessions={overviewStats.totalSessions}
								period={periodLabel}
							/>
							<CategoryStatsCard
								categories={categoryStats}
								totalDuration={overviewStats.totalDuration}
							/>
						</div>

						<ActivityStatsCard activities={activityStats} onActivityClick={handleActivityClick} />
					</div>
				{/if}
			</div>
		</ScrollArea>
	</div>

	<div class="border-t p-1.5">
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

{#if data.user}
	<ActivityStatisticsDrawer
		bind:open={statisticsDrawerOpen}
		activity={selectedActivity}
		onOpenChange={(open) => (statisticsDrawerOpen = open)}
	/>
{/if}
