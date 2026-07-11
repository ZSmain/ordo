<script lang="ts">
	import type { TrackerActivityRow } from '$lib/tracker/activity-projection';
	import ActivityCard from './ActivityCard.svelte';

	interface Props {
		activities: TrackerActivityRow[];
		onActivitySelect?: (activityId: number, categoryName: string, activityName: string) => void;
		userId?: string;
		currentActivityId?: number | null;
	}

	let { activities, onActivitySelect, userId, currentActivityId }: Props = $props();

	const allFavorites = $derived(activities.filter((item) => !item.activity.archived));
</script>

<div class="mt-3 space-y-3">
	{#if allFavorites.length === 0}
		<div class="py-6 text-center">
			<p class="text-sm text-muted-foreground">No favorite activities yet</p>
			<p class="mt-1 text-xs text-muted-foreground">
				Right-click or long-press any activity and add it to favorites.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-3">
			{#each allFavorites as item (item.activity.id)}
				<ActivityCard
					activity={item.activity}
					categoryColor={item.categoryColor}
					categoryName={item.categoryName}
					{onActivitySelect}
					{userId}
					{currentActivityId}
				/>
			{/each}
		</div>
	{/if}
</div>
