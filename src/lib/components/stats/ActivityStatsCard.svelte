<script lang="ts">
	interface ActivityStat {
		activityId: number;
		activityName: string;
		activityIcon: string;
		categoryId: number;
		categoryName: string;
		categoryColor: string;
		categoryIcon: string;
		totalDuration: number;
		sessionCount: number;
	}

	interface Props {
		activities: ActivityStat[];
	}

	let { activities }: Props = $props();

	function formatDuration(seconds: number) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours === 0) {
			return `${minutes}m`;
		}

		return `${hours}h ${minutes}m`;
	}

	// Group activities by category
	function groupActivitiesByCategory() {
		const grouped = new Map<
			number,
			{
				category: {
					id: number;
					name: string;
					color: string;
					icon: string;
				};
				activities: ActivityStat[];
			}
		>();

		activities.forEach((activity) => {
			if (!grouped.has(activity.categoryId)) {
				grouped.set(activity.categoryId, {
					category: {
						id: activity.categoryId,
						name: activity.categoryName,
						color: activity.categoryColor,
						icon: activity.categoryIcon
					},
					activities: []
				});
			}
			grouped.get(activity.categoryId)!.activities.push(activity);
		});

		return Array.from(grouped.values());
	}

	let groupedActivities = $derived(groupActivitiesByCategory());
</script>

<div class="rounded-lg border bg-card p-6">
	<h3 class="mb-4 text-lg font-semibold">Activity Details</h3>

	{#if activities.length === 0}
		<p class="text-center text-muted-foreground">No data available for this period.</p>
	{:else}
		<div class="space-y-6">
			{#each groupedActivities as group (group.category.id)}
				<div>
					<div class="mb-2 flex items-center gap-2">
						<div
							class="font-small flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
							style="background-color: {group.category.color}"
						>
							{group.category.icon}
						</div>
						<h4 class="font-medium text-muted-foreground">{group.category.name}</h4>
					</div>
					<div class="space-y-2">
						{#each group.activities as activity (activity.activityId)}
							<div class="flex items-center justify-between rounded-md bg-muted/50 p-1.5">
								<div class="flex items-center gap-1">
									<span class="text-sm">{activity.activityIcon}</span>
									<div>
										<p class="text-sm font-medium">{activity.activityName}</p>
										<p class="text-xs text-muted-foreground">
											{activity.sessionCount} session{activity.sessionCount === 1 ? '' : 's'}
										</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-sm font-medium">{formatDuration(activity.totalDuration)}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
