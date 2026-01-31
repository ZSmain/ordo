<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import type { SelectActivity } from '$lib/server/db/schema';
	import ActivityCard from './ActivityCard.svelte';

	interface ActivityWithContext {
		activity: SelectActivity;
		categoryColor: string;
		categoryName: string;
	}

	interface Props {
		activities: ActivityWithContext[];
		onActivitySelect?: (categoryName: string, activityName: string) => void;
		userId?: string;
		currentCategory?: string;
		currentActivity?: string;
	}

	let {
		activities,
		onActivitySelect,
		userId,
		currentCategory,
		currentActivity
	}: Props = $props();

	// Filter out archived activities by default
	let visibleActivities = $derived(
		activities?.filter((item) => !item.activity.archived) || []
	);
</script>

{#if activities && activities.length > 0}
	<Separator class="my-4" />
	<div class="mt-4 space-y-2">
		<h2 class="text-lg font-semibold text-foreground">
			Activities
		</h2>

		{#if !visibleActivities || visibleActivities.length === 0}
			<div class="text-center text-xs text-muted-foreground">
				No active activities found
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				{#each visibleActivities as item, index (item.activity.id + '-' + index)}
					<ActivityCard
						activity={item.activity}
						categoryColor={item.categoryColor}
						categoryName={item.categoryName}
						{onActivitySelect}
						{userId}
						{currentCategory}
						{currentActivity}
					/>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<Separator class="my-4" />
	<div class="mt-4 py-8 text-center">
		<p class="text-muted-foreground">Select a category to view activities</p>
	</div>
{/if}
