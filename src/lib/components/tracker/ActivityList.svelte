<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import type { Activity } from '$lib/server/db/schema';
	import ActivityCard from './ActivityCard.svelte';

	interface ActivityWithContext {
		activity: Activity;
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
		<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
			Activities
		</h2>

		{#if !visibleActivities || visibleActivities.length === 0}
			<div class="text-center text-xs text-slate-400 dark:text-slate-500">
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
{/if}
