<script lang="ts">
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
	}

	let { categories }: Props = $props();

	function formatDuration(seconds: number) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours === 0) {
			return `${minutes}m`;
		}

		return `${hours}h ${minutes}m`;
	}

	function getTotalDuration() {
		return categories.reduce((total, category) => total + category.totalDuration, 0);
	}

	function getPercentage(duration: number) {
		const total = getTotalDuration();
		if (total === 0) return 0;
		return Math.round((duration / total) * 100);
	}
</script>

<div class="rounded-lg border bg-card p-6">
	<h3 class="mb-4 text-lg font-semibold">Time by Category</h3>

	{#if categories.length === 0}
		<p class="text-center text-muted-foreground">No data available for this period.</p>
	{:else}
		<div class="space-y-4">
			{#each categories as category, index (category.categoryId + '-' + index)}
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
						<p class="text-sm text-muted-foreground">{getPercentage(category.totalDuration)}%</p>
					</div>
				</div>
				<div class="h-2 rounded-full bg-muted">
					<div
						class="h-2 rounded-full transition-all duration-300"
						style="background-color: {category.categoryColor}; width: {getPercentage(
							category.totalDuration
						)}%"
					></div>
				</div>
			{/each}
		</div>
	{/if}
</div>
