<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import type { CategoryWithActivities } from '$lib/types';
	import ActivityCard from './ActivityCard.svelte';

	interface Props {
		category: CategoryWithActivities | null;
		onActivitySelect?: (categoryName: string, activityName: string) => void;
		userId?: string;
		currentCategory?: string;
		currentActivity?: string;
	}

	let { category, onActivitySelect, userId, currentCategory, currentActivity }: Props = $props();

	// Filter out archived activities by default
	let visibleActivities = $derived(
		category?.activities?.filter((activity) => !activity.archived) || []
	);
</script>

{#if category}
	<Separator class="my-4" />
	<div class="mt-4 space-y-2">
		<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
			Activities - {category.name}
		</h2>

		{#if !visibleActivities || visibleActivities.length === 0}
			<div class="text-center text-xs text-slate-400 dark:text-slate-500">
				No activities in this category yet
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				{#each visibleActivities as activity, index (activity.id + '-' + index)}
					<ActivityCard
						{activity}
						categoryColor={category.color}
						categoryName={category.name}
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
