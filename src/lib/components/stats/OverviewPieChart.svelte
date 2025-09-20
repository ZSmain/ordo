<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { PieChart, Text } from 'layerchart';

	interface CategoryStat {
		categoryId: number;
		categoryName: string;
		categoryColor: string;
		categoryIcon: string;
		totalDuration: number;
		sessionCount: number;
	}

	interface Props {
		categories: CategoryStat[];
		period: string;
	}

	let { categories, period }: Props = $props();

	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return hours === 0 ? `${minutes}m` : `${hours}h ${minutes}m`;
	}

	let chartData = $derived(
		categories.map((category) => ({
			category: category.categoryName,
			duration: category.totalDuration,
			color: category.categoryColor,
			icon: category.categoryIcon
		}))
	);

	let chartConfig = $derived({
		duration: { label: 'Duration' },
		...Object.fromEntries(
			categories.map((category) => [
				category.categoryName.toLowerCase().replace(/\s+/g, ''),
				{
					label: category.categoryName,
					color: category.categoryColor
				}
			])
		)
	} satisfies Chart.ChartConfig);

	let totalDuration = $derived(chartData.reduce((acc, curr) => acc + curr.duration, 0));
	let totalSessions = $derived(categories.reduce((sum, cat) => sum + cat.sessionCount, 0));
</script>

<Card.Root class="flex flex-col">
	<Card.Header class="items-center pb-2">
		<Card.Title>Time Distribution</Card.Title>
		<Card.Description>Overview for {period}</Card.Description>
	</Card.Header>
	<Card.Content class="flex-1 pb-2">
		{#if chartData.length === 0}
			<div class="flex h-[250px] items-center justify-center">
				<p class="text-muted-foreground">No data available for this period</p>
			</div>
		{:else}
			<Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[250px]">
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
						<Chart.Tooltip />
					{/snippet}
				</PieChart>
			</Chart.Container>
		{/if}
	</Card.Content>
	<Card.Footer class="flex-col gap-2 pt-2 text-sm">
		<div class="grid w-full grid-cols-2 gap-2">
			<div class="flex items-center gap-2 leading-none font-medium">
				<TrendingUpIcon class="size-4" />
				<span class="text-xs">{categories.length} categories tracked</span>
			</div>
			<div class="flex items-center gap-2 leading-none font-medium">
				<span class="text-xs">{totalSessions} total sessions</span>
			</div>
		</div>
		<div class="text-center leading-none text-muted-foreground">
			Time spent across different categories {period}
		</div>
	</Card.Footer>
</Card.Root>
