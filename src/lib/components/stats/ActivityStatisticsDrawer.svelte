<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Calendar, ChartBar, ChevronDown, Clock, Hash, Timer } from '@lucide/svelte';
	import { scaleBand } from 'd3-scale';
	import { BarChart, type ChartContextValue } from 'layerchart';
	import { cubicInOut } from 'svelte/easing';
	import { getActivityStatistics } from '../../../routes/(app)/stats/stats.remote';

	interface ActivityInfo {
		id: number;
		name: string;
		icon: string;
	}

	interface Props {
		open: boolean;
		activity: ActivityInfo | null;
		userId: string;
		onOpenChange?: (open: boolean) => void;
	}

	let { open = $bindable(), activity, userId, onOpenChange }: Props = $props();

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

	// Default granularity for each period type
	const defaultGranularity: Record<PeriodType, GranularityType> = {
		year: 'monthly',
		month: 'weekly',
		week: 'daily',
		last7: 'daily',
		all: 'monthly'
	};

	// State
	let selectedPeriod = $state<PeriodType>('year');
	let selectedGranularity = $state<GranularityType>('monthly');

	let chartContext = $state<ChartContextValue>();

	const chartConfig = {
		duration: { label: 'Time', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	// Derive valid granularity - if current selection is invalid, use default
	let effectiveGranularity = $derived.by(() => {
		const availableGranularities = granularityOptions[selectedPeriod];
		const isValid = availableGranularities.some((g) => g.value === selectedGranularity);
		return isValid ? selectedGranularity : defaultGranularity[selectedPeriod];
	});

	// Calculate date range based on period
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
				return {}; // No date filters - get all data
		}
	}

	function formatDate(date: Date): string {
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		const day = String(date.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Use SvelteKit Remote Functions query pattern - reactive data fetching
	let statisticsQuery = $derived.by(() => {
		if (!open || !activity) return null;

		const { startDate, endDate } = getDateRange(selectedPeriod);
		return getActivityStatistics({
			userId,
			activityId: activity.id,
			startDate,
			endDate,
			granularity: effectiveGranularity
		});
	});

	function formatDuration(seconds: number | null | undefined): string {
		if (seconds === null || seconds === undefined || seconds === 0) return '0m';

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			if (minutes === 0) return `${hours}h`;
			return `${hours}h ${minutes}m`;
		}
		if (minutes > 0) {
			if (secs === 0) return `${minutes}m`;
			return `${minutes}m ${secs}s`;
		}
		return `${secs}s`;
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

	// Handle period change - reset granularity to default for new period
	function handlePeriodChange(period: PeriodType) {
		selectedPeriod = period;
		selectedGranularity = defaultGranularity[period];
	}
</script>

<Drawer.Root {open} {onOpenChange}>
	<Drawer.Content class="max-h-[90vh]">
		<div class="mx-auto flex h-full w-full max-w-lg flex-col">
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
			<div class="flex-1 overflow-hidden">
				<ScrollArea class="h-full">
					<div class="space-y-4 px-4 pb-4">
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
									{@const chartDataInHours = statistics.chartData.map((d) => ({
										label: d.label,
										duration: d.duration / 3600
									}))}

									<!-- Bar Chart -->
									{#if chartDataInHours.length > 0}
										<div class="rounded-lg border bg-card p-4">
											<h3 class="mb-3 text-sm font-medium text-muted-foreground">
												Time Distribution
											</h3>
											<Chart.Container config={chartConfig} class="h-[180px] w-full">
												<BarChart
													bind:context={chartContext}
													data={chartDataInHours}
													xScale={scaleBand().padding(0.3)}
													x="label"
													axis="x"
													series={[
														{ key: 'duration', label: 'Hours', color: chartConfig.duration.color }
													]}
													props={{
														bars: {
															stroke: 'none',
															rounded: 'all',
															radius: 4,
															initialY: chartContext?.height,
															initialHeight: 0,
															motion: {
																x: { type: 'tween', duration: 400, easing: cubicInOut },
																width: { type: 'tween', duration: 400, easing: cubicInOut },
																height: { type: 'tween', duration: 400, easing: cubicInOut },
																y: { type: 'tween', duration: 400, easing: cubicInOut }
															}
														},
														highlight: { area: { fill: 'none' } },
														xAxis: { format: (d: string) => d }
													}}
												>
													{#snippet tooltip()}
														<Chart.Tooltip />
													{/snippet}
												</BarChart>
											</Chart.Container>
										</div>
									{/if}

									<!-- Total Stats -->
									<div class="rounded-lg border bg-card p-4">
										<h3 class="mb-3 text-sm font-medium text-muted-foreground">Overview</h3>
										<div class="grid grid-cols-2 gap-4">
											<div class="flex items-center gap-3">
												<div
													class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
												>
													<Clock class="h-5 w-5 text-primary" />
												</div>
												<div>
													<p class="text-xl font-bold">
														{formatDuration(statistics.totalDuration)}
													</p>
													<p class="text-xs text-muted-foreground">Total Time</p>
												</div>
											</div>
											<div class="flex items-center gap-3">
												<div
													class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
												>
													<Hash class="h-5 w-5 text-primary" />
												</div>
												<div>
													<p class="text-xl font-bold">{statistics.totalSessions}</p>
													<p class="text-xs text-muted-foreground">Total Records</p>
												</div>
											</div>
										</div>
									</div>

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
				</ScrollArea>
			</div>

			<Drawer.Footer>
				<Drawer.Close class="w-full">
					<button
						class="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
					>
						Close
					</button>
				</Drawer.Close>
			</Drawer.Footer>
		</div>
	</Drawer.Content>
</Drawer.Root>
