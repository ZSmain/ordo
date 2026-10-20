<script lang="ts">
	import { formatDuration } from '#lib/time/index.js';

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
		totalDuration?: number;
	}

	let { categories, totalDuration }: Props = $props();

	const total = $derived(
		totalDuration ?? categories.reduce((sum, category) => sum + category.totalDuration, 0)
	);

	// Largest-remainder rounding keeps the displayed integer percentages at 100%.
	const percentages = $derived.by(() => {
		const raw = categories.map((category) => ({
			categoryId: category.categoryId,
			value: total > 0 ? (category.totalDuration / total) * 100 : 0
		}));
		const rounded = raw.map((item) => Math.floor(item.value));
		const remaining = total > 0 ? 100 - rounded.reduce((sum, value) => sum + value, 0) : 0;
		const byRemainder = raw
			.map((item, index) => ({ index, remainder: item.value - rounded[index] }))
			.sort((a, b) => b.remainder - a.remainder);

		for (let i = 0; i < remaining && byRemainder.length > 0; i += 1) {
			rounded[byRemainder[i % byRemainder.length].index] += 1;
		}

		return new Map(raw.map((item, index) => [item.categoryId, rounded[index]]));
	});

	function getPercentage(categoryId: number) {
		return percentages.get(categoryId) ?? 0;
	}

	function getBarWidth(duration: number) {
		return total > 0 ? (duration / total) * 100 : 0;
	}
</script>

<div class="rounded-lg border bg-card p-6 select-none">
	<h3 class="mb-4 text-lg font-semibold">Category Breakdown</h3>

	{#if categories.length === 0}
		<p class="text-center text-muted-foreground">No data available for this period.</p>
	{:else}
		<div class="space-y-4">
			{#each categories as category (category.categoryId)}
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
							style="background-color: {category.categoryColor}"
						>
							{category.categoryIcon}
						</div>
						<div>
							<p class="font-medium">{category.categoryName}</p>
							<p class="text-sm text-muted-foreground">
								{category.sessionCount} session{category.sessionCount === 1 ? '' : 's'}
							</p>
						</div>
					</div>
					<div class="text-right">
						<p class="font-medium">{formatDuration(category.totalDuration)}</p>
						<p class="text-sm text-muted-foreground">
							{getPercentage(category.categoryId)}%
						</p>
					</div>
				</div>
				<div class="h-2 rounded-full bg-muted">
					<div
						class="h-2 rounded-full transition-[width] duration-300 ease-out"
						style="background-color: {category.categoryColor}; width: {getBarWidth(
							category.totalDuration
						)}%"
					></div>
				</div>
			{/each}
		</div>
	{/if}
</div>
