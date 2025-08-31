<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import type { CategoryWithActivities } from '$lib/types';
	import ActivityCard from './ActivityCard.svelte';

	interface Props {
		category: CategoryWithActivities | null;
		onActivitySelect?: (categoryName: string, activityName: string) => void;
		onActivityUpdated?: () => void;
		userId?: string;
	}

	let { category, onActivitySelect, onActivityUpdated, userId }: Props = $props();

	// Filter out archived activities by default
	let visibleActivities = $derived(
		category?.activities?.filter((activity) => !activity.archived) || []
	);
</script>

{#if category}
	<Separator class="my-4" />
	<div class="mt-4 space-y-2">
		<h2 class="text-lg font-semibold text-gray-800">
			Activities - {category.name}
		</h2>

		{#if !visibleActivities || visibleActivities.length === 0}
			<div class="text-center text-xs text-slate-400">No activities in this category yet</div>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				{#each visibleActivities as activity (activity.id)}
					<ActivityCard
						{activity}
						categoryColor={category.color}
						categoryName={category.name}
						{onActivitySelect}
						{onActivityUpdated}
						{userId}
					/>
				{/each}
			</div>
		{/if}
	</div>
{/if}
