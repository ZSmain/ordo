<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { formatDuration } from '$lib/time';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { PieChart, Text } from 'layerchart';

	interface ActivityStat {
		activityId: number;
		activityName: string;
		activityIcon: string;
		categoryId: number;
		categoryName: string;
		categoryColor: string;
		categoryIcon: string;
		allCategories?: Array<{
			categoryId: number;
			categoryName: string;
			categoryColor: string;
			categoryIcon: string;
		}>;
		totalDuration: number;
		sessionCount: number;
	}

	interface Props {
		activities: ActivityStat[];
		period: string;
	}

	let { activities, period }: Props = $props();

	let chartData = $derived.by(() => {
		// Now activities are already deduplicated from the remote function
		return activities.map((activity) => ({
			category: activity.activityName,
			duration: activity.totalDuration,
			color: activity.categoryColor,
			icon: activity.activityIcon
		}));
	});

	let chartConfig = $derived.by(() => {
		const data = chartData;
		return {
			duration: { label: 'Duration' },
			...Object.fromEntries(
				data.map((item: any) => [
					item.category.toLowerCase().replace(/\s+/g, ''),
					{
						label: item.category,
						color: item.color
					}
				])
			)
		} satisfies Chart.ChartConfig;
	});

	let totalDuration = $derived.by(() =>
		chartData.reduce((acc: number, curr: any) => acc + curr.duration, 0)
	);
	let totalSessions = $derived.by(() =>
		activities.reduce((sum: number, activity: any) => sum + activity.sessionCount, 0)
	);
</script>

<Card.Root class="flex flex-col select-none">
	<Card.Header class="items-center pb-2">
		<Card.Title>Activity Distribution</Card.Title>
		<Card.Description>Time spent on activities {period}</Card.Description>
	</Card.Header>
	<Card.Content class="flex-1 pb-2">
		{#if chartData.length === 0}
			<div class="flex h-62.5 items-center justify-center">
				<p class="text-muted-foreground">No data available for this period</p>
			</div>
		{:else}
			<Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-62.5">
				<PieChart
					data={chartData}
					key="category"
					value="duration"
					c="color"
					innerRadius={60}
					padding={28}
					props={{ pie: { motion: 'tween' } }}
				>
					{#snippet aboveMarks()}
						<Text
							value={formatDuration(totalDuration)}
							textAnchor="middle"
							verticalAnchor="middle"
							class="fill-foreground text-3xl! font-bold"
							dy={3}
						/>
						<Text
							value="Total Time"
							textAnchor="middle"
							verticalAnchor="middle"
							class="fill-muted-foreground! text-muted-foreground"
							dy={22}
						/>
					{/snippet}
					{#snippet tooltip()}
						<Chart.Tooltip>
							{#snippet formatter({ value, name })}
								<div class="flex w-full items-center justify-between gap-2 leading-none">
									<span class="text-muted-foreground">{name}</span>
									<span class="font-mono font-medium text-foreground tabular-nums">
										{formatDuration(Number(value))}
									</span>
								</div>
							{/snippet}
						</Chart.Tooltip>
					{/snippet}
				</PieChart>
			</Chart.Container>
		{/if}
	</Card.Content>
	<Card.Footer class="flex-col gap-2 pt-2 text-sm">
		<div class="grid w-full grid-cols-2 gap-2">
			<div class="flex items-center gap-2 leading-none font-medium">
				<TrendingUpIcon class="size-4" />
				<span class="text-xs">
					{activities.length} activities tracked
				</span>
			</div>
			<div class="flex items-center gap-2 leading-none font-medium">
				<span class="text-xs">{totalSessions} total sessions</span>
			</div>
		</div>
		<div class="text-center leading-none text-muted-foreground">
			Time spent on different activities {period}
		</div>
	</Card.Footer>
</Card.Root>
