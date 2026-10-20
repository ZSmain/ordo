<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { formatDuration } from '#lib/time/index.js';
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
		totalDuration: number;
		totalSessions: number;
		period: string;
	}

	let { categories, totalDuration, totalSessions, period }: Props = $props();

	// Category stats allocate multi-category session time evenly, so their durations
	// add up to the tracked total. Key by id: display names are not guaranteed unique.
	const chartData = $derived(
		categories
			.filter((category) => category.totalDuration > 0)
			.map((category) => ({
				categoryId: String(category.categoryId),
				category: category.categoryName,
				duration: category.totalDuration,
				color: category.categoryColor
			}))
	);

	const chartConfig = $derived.by(() => {
		return {
			duration: { label: 'Duration' },
			...Object.fromEntries(
				chartData.map((item) => [
					item.categoryId,
					{
						label: item.category,
						color: item.color
					}
				])
			)
		} satisfies Chart.ChartConfig;
	});
</script>

<Card.Root class="flex flex-col select-none">
	<Card.Header class="items-center pb-2">
		<Card.Title>Time by Category</Card.Title>
		<Card.Description>Time spent across categories · {period}</Card.Description>
	</Card.Header>
	<Card.Content class="flex-1 pb-2">
		{#if chartData.length === 0}
			<div class="flex h-62.5 items-center justify-center">
				<p class="text-muted-foreground">No data available for this period</p>
			</div>
		{:else}
			<Chart.Container config={chartConfig} class="mx-auto aspect-square w-full max-w-62.5">
				<PieChart
					data={chartData}
					key="categoryId"
					label="category"
					value="duration"
					c="color"
					innerRadius={-24}
					padding={16}
					padAngle={0.015}
					cornerRadius={4}
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
	<Card.Footer class="pt-2 text-sm">
		<div class="flex w-full items-center justify-between leading-none text-muted-foreground">
			<span class="text-xs">{chartData.length} categories</span>
			<span class="text-xs">{totalSessions} sessions</span>
		</div>
	</Card.Footer>
</Card.Root>
