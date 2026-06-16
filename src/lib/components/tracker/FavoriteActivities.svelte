<script lang="ts">
	import type { TrackerActivityRow } from '$lib/tracker/activity-projection';
	import { Star } from '@lucide/svelte';
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

<div class="mt-4 space-y-3">
	<div class="flex items-center justify-between gap-2">
		<div class="flex items-start gap-2">
			<div
				class="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
			>
				<Star class="h-4 w-4 fill-current" />
			</div>
			<div>
				<h2 class="text-lg font-semibold text-foreground">Favorites</h2>
				<p class="text-sm text-muted-foreground">Quick access to your most-used activities</p>
			</div>
		</div>
	</div>

	{#if allFavorites.length === 0}
		<div class="py-8 text-center">
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
