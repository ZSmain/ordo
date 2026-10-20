<script lang="ts">
	import { formatDuration } from '#lib/time/index.js';

	interface ActivityStat {
		activityId: number;
		activityName: string;
		activityIcon: string;
		categories: Array<{
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
		onActivityClick?: (activity: { id: number; name: string; icon: string }) => void;
	}

	let { activities, onActivityClick }: Props = $props();
</script>

<div class="rounded-lg border bg-card p-6 select-none">
	<h3 class="mb-4 text-lg font-semibold">Activity Breakdown</h3>

	{#if activities.length === 0}
		<p class="text-center text-muted-foreground">No data available for this period.</p>
	{:else}
		<div class="space-y-2">
			{#each activities as activity (activity.activityId)}
				<button
					type="button"
					class="flex w-full items-center justify-between gap-3 rounded-md bg-muted/50 p-2 text-left transition-colors hover:bg-muted"
					onclick={() =>
						onActivityClick?.({
							id: activity.activityId,
							name: activity.activityName,
							icon: activity.activityIcon
						})}
				>
					<div class="flex min-w-0 items-center gap-2">
						<span class="text-base">{activity.activityIcon}</span>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">{activity.activityName}</p>
							<div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
								{#each activity.categories as category (category.categoryId)}
									<span class="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
										<span
											class="size-1.5 rounded-full"
											style="background-color: {category.categoryColor}"
										></span>
										{category.categoryName}
									</span>
								{:else}
									<span class="text-[11px] text-muted-foreground">Uncategorized</span>
								{/each}
							</div>
						</div>
					</div>
					<div class="shrink-0 text-right">
						<p class="text-sm font-medium">{formatDuration(activity.totalDuration)}</p>
						<p class="text-xs text-muted-foreground">
							{activity.sessionCount} session{activity.sessionCount === 1 ? '' : 's'}
						</p>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
