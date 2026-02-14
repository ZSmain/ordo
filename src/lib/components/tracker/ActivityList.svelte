<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import type { SelectActivity } from '$lib/server/db/schema';
	import { Search, X } from '@lucide/svelte';
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

	// Search state
	let searchQuery = $state('');

	// Filter out archived activities and apply search filter
	let visibleActivities = $derived.by(() => {
		const nonArchived = activities?.filter((item) => !item.activity.archived) || [];
		
		if (!searchQuery.trim()) {
			return nonArchived;
		}
		
		const query = searchQuery.toLowerCase().trim();
		return nonArchived.filter(
			(item) =>
				item.activity.name.toLowerCase().includes(query) ||
				item.activity.icon.includes(query) ||
				item.categoryName.toLowerCase().includes(query)
		);
	});

	// Clear search
	function clearSearch() {
		searchQuery = '';
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && searchQuery) {
			clearSearch();
			event.preventDefault();
		}
	}
</script>

{#if activities && activities.length > 0}
	<Separator class="my-4" />
	<div class="mt-4 space-y-3">
		<div class="flex items-center justify-between gap-2">
			<h2 class="text-lg font-semibold text-foreground">
				Activities
			</h2>
			<span class="text-xs text-muted-foreground">
				{visibleActivities.length} of {activities.filter(a => !a.activity.archived).length}
			</span>
		</div>

		<!-- Search input -->
		<div class="relative">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search activities... (Esc to clear)"
				bind:value={searchQuery}
				class="pl-9 pr-9"
				onkeydown={handleKeydown}
			/>
			{#if searchQuery}
				<button
					type="button"
					onclick={clearSearch}
					class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					aria-label="Clear search"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>

		{#if !visibleActivities || visibleActivities.length === 0}
			<div class="py-6 text-center">
				{#if searchQuery}
					<p class="text-sm text-muted-foreground">No activities match "{searchQuery}"</p>
					<button
						type="button"
						onclick={clearSearch}
						class="mt-2 text-sm text-primary hover:underline"
					>
						Clear search
					</button>
				{:else}
					<p class="text-sm text-muted-foreground">No active activities found</p>
				{/if}
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
