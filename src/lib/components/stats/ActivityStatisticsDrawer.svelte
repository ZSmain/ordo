<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatDuration } from '$lib/time';
	import { Calendar, ChartBar, ChevronDown, Timer } from '@lucide/svelte';
	import { scaleBand, scaleQuantize } from 'd3-scale';
	import { BarChart } from 'layerchart';
	import { cubicInOut } from 'svelte/easing';
	import { getActivityStatistics } from '../../../routes/(app)/stats/stats.remote';

	interface ActivityInfo {
		id: number;
		name: string;
		icon: string;
	}

	interface CalendarChartPoint {
		label: string;
		duration: number;
		bucketKey: string;
		date: Date;
	}

	interface CalendarHeatmapCell {
		key: string;
		column: number;
		row: number;
		date: Date;
		duration: number;
		fill: string;
		border: string;
		tooltip: string;
		isActive: boolean;
	}

	interface CalendarHeatmapMonth {
		key: string;
		label: string;
		weekCount: number;
		cells: CalendarHeatmapCell[];
	}

	interface Props {
		open: boolean;
		activity: ActivityInfo | null;
		onOpenChange?: (open: boolean) => void;
	}

	let { open = $bindable(), activity, onOpenChange }: Props = $props();

	type PeriodType = 'year' | 'month' | 'week' | 'last7' | 'all';
	type GranularityType = 'daily' | 'weekly' | 'monthly';

	const periodOptions: { value: PeriodType; label: string }[] = [
		{ value: 'year', label: 'This Year' },
		{ value: 'month', label: 'This Month' },
		{ value: 'week', label: 'This Week' },
		{ value: 'last7', label: 'Last 7 Days' },
		{ value: 'all', label: 'All Time' }
	];

	const granularityOptions: Record<PeriodType, { value: GranularityType; label: string }[]> = {
		year: [
			{ value: 'daily', label: 'Daily' },
			{ value: 'weekly', label: 'Weekly' },
			{ value: 'monthly', label: 'Monthly' }
		],
		month: [
			{ value: 'daily', label: 'Daily' },
			{ value: 'weekly', label: 'Weekly' }
		],
		week: [{ value: 'daily', label: 'Daily' }],
		last7: [{ value: 'daily', label: 'Daily' }],
		all: [
			{ value: 'daily', label: 'Daily' },
			{ value: 'weekly', label: 'Weekly' },
			{ value: 'monthly', label: 'Monthly' }
		]
	};

	const defaultGranularity: Record<PeriodType, GranularityType> = {
		year: 'monthly',
		month: 'weekly',
		week: 'daily',
		last7: 'daily',
		all: 'monthly'
	};

	let selectedPeriod = $state<PeriodType>('year');
	let selectedGranularity = $state<GranularityType>('monthly');

	const chartConfig = {
		duration: { label: 'Time', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;
	const todayUtc = (() => {
		const now = new Date();
		return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
	})();
	const currentCalendarYear = todayUtc.getUTCFullYear();
	const calendarYearStart = new Date(Date.UTC(currentCalendarYear, 0, 1));
	const calendarYearStartKey = formatDate(calendarYearStart);
	const calendarYearTodayKey = formatDate(todayUtc);
	const calendarCellSize = 14;
	const calendarCellGap = 3;
	const calendarActiveColorRange = [
		'color-mix(in oklab, var(--color-duration) 22%, var(--background))',
		'color-mix(in oklab, var(--color-duration) 38%, var(--background))',
		'color-mix(in oklab, var(--color-duration) 54%, var(--background))',
		'color-mix(in oklab, var(--color-duration) 72%, var(--background))',
		'color-mix(in oklab, var(--color-duration) 92%, var(--background))'
	];
	const calendarInactiveFill = 'color-mix(in oklab, var(--muted) 86%, var(--background))';
	const calendarInactiveBorder = 'color-mix(in oklab, var(--border) 68%, transparent)';
	const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

	let effectiveGranularity = $derived.by(() => {
		const availableGranularities = granularityOptions[selectedPeriod];
		const isValid = availableGranularities.some((g) => g.value === selectedGranularity);
		return isValid ? selectedGranularity : defaultGranularity[selectedPeriod];
	});

	function getDateRange(period: PeriodType): { startDate?: string; endDate?: string } {
		const now = new Date();
		const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

		switch (period) {
			case 'year': {
				const startOfYear = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
				return {
					startDate: formatDate(startOfYear),
					endDate: formatDate(today)
				};
			}
			case 'month': {
				const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
				return {
					startDate: formatDate(startOfMonth),
					endDate: formatDate(today)
				};
			}
			case 'week': {
				const dayOfWeek = today.getUTCDay();
				const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
				const startOfWeek = new Date(
					Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - daysToSubtract)
				);
				return {
					startDate: formatDate(startOfWeek),
					endDate: formatDate(today)
				};
			}
			case 'last7': {
				const sevenDaysAgo = new Date(
					Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6)
				);
				return {
					startDate: formatDate(sevenDaysAgo),
					endDate: formatDate(today)
				};
			}
			case 'all':
			default:
				return {};
		}
	}

	function formatDate(date: Date): string {
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		const day = String(date.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getWeekOffset(start: Date, end: Date): number {
		const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
		return Math.floor((end.getTime() - start.getTime()) / millisecondsPerWeek);
	}

	function addUtcDays(date: Date, days: number): Date {
		return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
	}

	function startOfUtcWeek(date: Date): Date {
		return addUtcDays(date, -date.getUTCDay());
	}

	function endOfUtcWeek(date: Date): Date {
		return addUtcDays(startOfUtcWeek(date), 6);
	}

	function normalizeUtcDay(value: Date | string | null | undefined): Date | null {
		if (!value) return null;

		const date = typeof value === 'string' ? new Date(value) : value;
		if (Number.isNaN(date.getTime())) return null;

		return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	}

	function getMonthKey(date: Date): string {
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		return `${date.getUTCFullYear()}-${month}`;
	}

	function maxDate(left: Date, right: Date): Date {
		return left.getTime() >= right.getTime() ? left : right;
	}

	function minDate(left: Date, right: Date): Date {
		return left.getTime() <= right.getTime() ? left : right;
	}

	function formatCalendarMonthLabel(date: Date): string {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			timeZone: 'UTC'
		});
	}

	function formatCalendarCellTooltip(date: Date, duration: number): string {
		const dateLabel = date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		});

		return duration > 0 ? `${dateLabel}: ${formatDuration(duration)}` : `${dateLabel}: No activity`;
	}

	let statisticsQuery = $derived.by(() => {
		if (!open || !activity) return null;

		const { startDate, endDate } = getDateRange(selectedPeriod);
		return getActivityStatistics({
			activityId: activity.id,
			startDate,
			endDate,
			granularity: effectiveGranularity
		});
	});

	let activityLifetimeQuery = $derived.by(() => {
		if (!open || !activity) return null;

		return getActivityStatistics({
			activityId: activity.id,
			granularity: 'monthly'
		});
	});

	let calendarStatisticsQuery = $derived.by(() => {
		if (!open || !activity) return null;

		return getActivityStatistics({
			activityId: activity.id,
			startDate: calendarYearStartKey,
			endDate: calendarYearTodayKey,
			granularity: 'daily'
		});
	});

	let calendarChartData = $derived.by(() => {
		const chartData = calendarStatisticsQuery?.current?.chartData ?? [];

		return chartData
			.filter(
				(entry): entry is { label: string; duration: number; bucketKey: string } =>
					typeof entry.bucketKey === 'string' && entry.bucketKey.length === 10
			)
			.map(
				(entry) =>
					({
						...entry,
						date: new Date(`${entry.bucketKey}T00:00:00.000Z`)
					}) satisfies CalendarChartPoint
			);
	});

	let calendarMaxDuration = $derived.by(() =>
		calendarChartData.reduce(
			(maxDuration: number, entry: CalendarChartPoint) => Math.max(maxDuration, entry.duration),
			0
		)
	);

	let calendarMinPositiveDuration = $derived.by(() => {
		let minDuration = Number.POSITIVE_INFINITY;

		for (const entry of calendarChartData) {
			if (entry.duration > 0) {
				minDuration = Math.min(minDuration, entry.duration);
			}
		}

		return Number.isFinite(minDuration) ? minDuration : 0;
	});

	let calendarSummary = $derived(calendarStatisticsQuery?.current ?? null);
	let calendarRecordCount = $derived(calendarSummary?.totalSessions ?? 0);
	let calendarTrackedDuration = $derived(calendarSummary?.totalDuration ?? 0);
	let calendarActiveDays = $derived(calendarChartData.length);

	let calendarColorScale = $derived.by(() =>
		calendarMaxDuration > 0 && calendarMaxDuration !== calendarMinPositiveDuration
			? scaleQuantize<string>()
					.domain([calendarMinPositiveDuration, calendarMaxDuration])
					.range(calendarActiveColorRange)
			: null
	);

	function getCalendarCellFill(duration: number): string {
		if (duration <= 0) return calendarInactiveFill;
		if (!calendarColorScale) return calendarActiveColorRange[calendarActiveColorRange.length - 1];

		return calendarColorScale(duration);
	}

	function getCalendarCellBorder(duration: number): string {
		return duration > 0
			? 'color-mix(in oklab, var(--color-duration) 42%, var(--background))'
			: calendarInactiveBorder;
	}

	function formatDateTime(date: Date | string | null | undefined): string {
		if (!date) return '-';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let currentPeriodLabel = $derived(
		periodOptions.find((p) => p.value === selectedPeriod)?.label || 'This Year'
	);

	let currentGranularityLabel = $derived(
		granularityOptions[selectedPeriod].find((g) => g.value === effectiveGranularity)?.label ||
			'Daily'
	);

	function handlePeriodChange(period: PeriodType) {
		selectedPeriod = period;
		selectedGranularity = defaultGranularity[period];
	}

	function formatCalendarSummaryDate(date: Date | string | null | undefined): string {
		if (!date) return 'No activity yet';
		const value = typeof date === 'string' ? new Date(date) : date;
		if (Number.isNaN(value.getTime())) return 'No activity yet';

		return value.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		});
	}

	let calendarVisibleStart = $derived.by(() => {
		if (calendarChartData.length === 0) return null;

		const lifetimeFirstSession = normalizeUtcDay(activityLifetimeQuery?.current?.firstSession);
		if (lifetimeFirstSession && lifetimeFirstSession.getUTCFullYear() === currentCalendarYear) {
			return lifetimeFirstSession;
		}

		return calendarYearStart;
	});

	let calendarRangeLabel = $derived.by(() => {
		if (!calendarVisibleStart) return '';

		const lifetimeFirstSession = normalizeUtcDay(activityLifetimeQuery?.current?.firstSession);
		if (lifetimeFirstSession && lifetimeFirstSession.getUTCFullYear() === currentCalendarYear) {
			return `Since ${formatCalendarSummaryDate(lifetimeFirstSession)}`;
		}

		return `From ${formatCalendarSummaryDate(calendarVisibleStart)}`;
	});

	let calendarMonthSections = $derived.by(() => {
		if (!calendarVisibleStart || calendarChartData.length === 0) {
			return [] as CalendarHeatmapMonth[];
		}

		const durationByDate = new Map(
			calendarChartData.map((entry) => [formatDate(entry.date), entry.duration])
		);
		const sections: CalendarHeatmapMonth[] = [];

		for (
			let monthCursor = new Date(
				Date.UTC(calendarVisibleStart.getUTCFullYear(), calendarVisibleStart.getUTCMonth(), 1)
			);
			monthCursor.getTime() <= todayUtc.getTime();
			monthCursor = new Date(
				Date.UTC(monthCursor.getUTCFullYear(), monthCursor.getUTCMonth() + 1, 1)
			)
		) {
			const monthStart = new Date(
				Date.UTC(monthCursor.getUTCFullYear(), monthCursor.getUTCMonth(), 1)
			);
			const monthEnd = new Date(
				Date.UTC(monthCursor.getUTCFullYear(), monthCursor.getUTCMonth() + 1, 0)
			);
			const visibleMonthStart = maxDate(monthStart, calendarVisibleStart);
			const visibleMonthEnd = minDate(monthEnd, todayUtc);
			const gridStart = startOfUtcWeek(visibleMonthStart);
			const gridEnd = endOfUtcWeek(visibleMonthEnd);
			const cells: CalendarHeatmapCell[] = [];

			for (
				let day = visibleMonthStart;
				day.getTime() <= visibleMonthEnd.getTime();
				day = addUtcDays(day, 1)
			) {
				const key = formatDate(day);
				const duration = durationByDate.get(key) ?? 0;

				cells.push({
					key,
					column: getWeekOffset(gridStart, day) + 1,
					row: day.getUTCDay() + 1,
					date: day,
					duration,
					fill: getCalendarCellFill(duration),
					border: getCalendarCellBorder(duration),
					tooltip: formatCalendarCellTooltip(day, duration),
					isActive: duration > 0
				});
			}

			sections.push({
				key: getMonthKey(monthStart),
				label: formatCalendarMonthLabel(monthStart),
				weekCount: getWeekOffset(gridStart, gridEnd) + 1,
				cells
			});
		}

		return sections;
	});
</script>

<Drawer.Root {open} {onOpenChange}>
	<Drawer.Content class="flex flex-col">
		<div class="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden">
			<Drawer.Header class="pb-2">
				<Drawer.Title class="text-center">
					<div class="mb-1 flex items-center justify-center gap-2">
						<span class="text-xl">{activity?.icon}</span>
						<span class="font-semibold">{activity?.name}</span>
					</div>
					<div
						class="flex items-center justify-center gap-2 text-sm font-normal text-muted-foreground"
					>
						<ChartBar class="h-4 w-4" />
						<span>Activity Statistics</span>
					</div>
				</Drawer.Title>
			</Drawer.Header>

			<!-- Period & Granularity Selectors -->
			<div class="flex items-center justify-center gap-2 px-4 pb-3">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="outline" size="sm" class="gap-1">
							<Calendar class="h-3.5 w-3.5" />
							{currentPeriodLabel}
							<ChevronDown class="h-3.5 w-3.5" />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						{#each periodOptions as option (option.value)}
							<DropdownMenu.Item
								onclick={() => handlePeriodChange(option.value)}
								class={selectedPeriod === option.value ? 'bg-accent' : ''}
							>
								{option.label}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="outline" size="sm" class="gap-1">
							{currentGranularityLabel}
							<ChevronDown class="h-3.5 w-3.5" />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						{#each granularityOptions[selectedPeriod] as option (option.value)}
							<DropdownMenu.Item
								onclick={() => (selectedGranularity = option.value)}
								class={effectiveGranularity === option.value ? 'bg-accent' : ''}
							>
								{option.label}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<!-- Content -->
			<div class="min-h-0 flex-1 overflow-y-auto">
				<div class="space-y-4 px-4 pb-8">
					{#if statisticsQuery}
						{#if statisticsQuery.loading}
							<div class="py-8 text-center">
								<p class="text-muted-foreground">Loading statistics...</p>
							</div>
						{:else if statisticsQuery.error}
							<div class="py-8 text-center">
								<p class="text-red-500">Failed to load statistics</p>
							</div>
						{:else}
							{@const statistics = statisticsQuery.current}
							{#if statistics && statistics.totalSessions === 0}
								<div class="py-8 text-center">
									<p class="text-muted-foreground">No data recorded for this period.</p>
								</div>
							{:else if statistics}
								{@const chartData = statistics.chartData}
								{@const hasCalendarData = calendarChartData.length > 0}

								<div class="rounded-lg border bg-card p-4">
									{#if calendarStatisticsQuery?.loading || activityLifetimeQuery?.loading}
										<div class="py-8 text-center">
											<p class="text-sm text-muted-foreground">Loading yearly activity...</p>
										</div>
									{:else if calendarStatisticsQuery?.error}
										<div class="py-8 text-center">
											<p class="text-sm text-red-500">Failed to load yearly activity.</p>
										</div>
									{:else if hasCalendarData}
										<div class="mb-4">
											<div>
												<p
													class="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase"
												>
													This Year
												</p>
												<div class="mt-1 flex items-baseline gap-2">
													<span class="text-4xl leading-none font-semibold"
														>{calendarRecordCount}</span
													>
													<span class="text-sm text-muted-foreground">records</span>
												</div>
												<p class="mt-1 text-xs text-muted-foreground">
													{calendarRangeLabel}
												</p>
											</div>
										</div>
										<div class="flex items-start gap-3">
											<div class="grid shrink-0 gap-0.75 pt-6 text-[11px] text-muted-foreground">
												{#each weekdayLabels as label, index (`${label}-${index}`)}
													<div
														class="flex items-center justify-end"
														style={`height: ${calendarCellSize}px;`}
													>
														{label}
													</div>
												{/each}
											</div>
											<div class="overflow-x-auto pb-2">
												<Chart.Container
													config={chartConfig}
													class="aspect-auto h-auto min-w-max shrink-0"
												>
													<div class="flex min-w-max items-start gap-3">
														{#each calendarMonthSections as month (month.key)}
															<div class="space-y-2">
																<p class="pl-0.5 text-[11px] font-medium text-muted-foreground/80">
																	{month.label}
																</p>
																<div
																	class="grid"
																	style={`grid-template-rows: repeat(7, ${calendarCellSize}px); grid-template-columns: repeat(${month.weekCount}, ${calendarCellSize}px); gap: ${calendarCellGap}px;`}
																>
																	{#each month.cells as cell (cell.key)}
																		<div
																			class="rounded-sm border"
																			style={`grid-column: ${cell.column}; grid-row: ${cell.row}; width: ${calendarCellSize}px; height: ${calendarCellSize}px; background-color: ${cell.fill}; border-color: ${cell.border}; opacity: ${cell.isActive ? 1 : 0.72};`}
																			title={cell.tooltip}
																			aria-label={cell.tooltip}
																		></div>
																	{/each}
																</div>
															</div>
														{/each}
													</div>
												</Chart.Container>
											</div>
										</div>
										<div
											class="mt-4 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3 sm:gap-3"
										>
											<span>{calendarActiveDays} active days</span>
											<span>{formatDuration(calendarTrackedDuration)} tracked</span>
											<span>{formatDuration(calendarMaxDuration)} peak day</span>
										</div>
									{:else}
										<div class="py-8 text-center">
											<p class="text-sm text-muted-foreground">
												No tracked time for {currentCalendarYear} yet.
											</p>
										</div>
									{/if}
								</div>

								<!-- Bar Chart -->
								{#if chartData.length > 0}
									<div class="rounded-lg border bg-card p-4">
										<h3 class="mb-3 text-sm font-medium text-muted-foreground">
											Time Distribution
										</h3>
										<Chart.Container config={chartConfig} class="h-45 w-full">
											<BarChart
												data={chartData}
												xScale={scaleBand().padding(0.3)}
												x="label"
												axis="x"
												series={[
													{ key: 'duration', label: 'Time', color: chartConfig.duration.color }
												]}
												props={{
													bars: {
														stroke: 'none',
														rounded: 'all',
														radius: 4,
														initialHeight: 0,
														motion: {
															x: { type: 'tween', duration: 400, easing: cubicInOut },
															width: { type: 'tween', duration: 400, easing: cubicInOut },
															height: { type: 'tween', duration: 400, easing: cubicInOut },
															y: { type: 'tween', duration: 400, easing: cubicInOut }
														}
													},
													highlight: { area: { fill: 'none' } },
													xAxis: { format: (d: string) => d },
													yAxis: { format: (value: number) => formatDuration(value) }
												}}
											>
												{#snippet tooltip()}
													<Chart.Tooltip>
														{#snippet formatter({ value, name })}
															<div
																class="flex w-full items-center justify-between gap-2 leading-none"
															>
																<span class="text-muted-foreground">{name}</span>
																<span class="font-mono font-medium text-foreground tabular-nums">
																	{formatDuration(Number(value))}
																</span>
															</div>
														{/snippet}
													</Chart.Tooltip>
												{/snippet}
											</BarChart>
										</Chart.Container>
									</div>
								{/if}

								<!-- Record Length -->
								<div class="rounded-lg border bg-card p-4">
									<h3 class="mb-3 text-sm font-medium text-muted-foreground">Record Length</h3>
									<div class="grid grid-cols-3 gap-3">
										<div class="rounded-lg bg-muted/50 p-3 text-center">
											<p class="text-lg font-semibold">
												{formatDuration(statistics.shortestSession)}
											</p>
											<p class="text-xs text-muted-foreground">Shortest</p>
										</div>
										<div class="rounded-lg bg-muted/50 p-3 text-center">
											<p class="text-lg font-semibold">
												{formatDuration(statistics.averageSession)}
											</p>
											<p class="text-xs text-muted-foreground">Average</p>
										</div>
										<div class="rounded-lg bg-muted/50 p-3 text-center">
											<p class="text-lg font-semibold">
												{formatDuration(statistics.longestSession)}
											</p>
											<p class="text-xs text-muted-foreground">Longest</p>
										</div>
									</div>
								</div>

								<!-- Record Time -->
								<div class="rounded-lg border bg-card p-4">
									<h3 class="mb-3 text-sm font-medium text-muted-foreground">Record Time</h3>
									<div class="grid grid-cols-2 gap-3">
										<div class="flex items-center gap-3">
											<div
												class="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10"
											>
												<Timer class="h-4 w-4 text-green-600" />
											</div>
											<div>
												<p class="text-sm font-medium">
													{formatDateTime(statistics.firstSession)}
												</p>
												<p class="text-xs text-muted-foreground">First Record</p>
											</div>
										</div>
										<div class="flex items-center gap-3">
											<div
												class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10"
											>
												<Timer class="h-4 w-4 text-blue-600" />
											</div>
											<div>
												<p class="text-sm font-medium">
													{formatDateTime(statistics.lastSession)}
												</p>
												<p class="text-xs text-muted-foreground">Last Record</p>
											</div>
										</div>
									</div>
								</div>
							{/if}
						{/if}
					{:else}
						<div class="py-8 text-center">
							<p class="text-muted-foreground">Select an activity to view statistics.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<Drawer.Footer class="shrink-0">
			<Drawer.Close class="w-full">
				<button
					class="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
				>
					Close
				</button>
			</Drawer.Close>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
