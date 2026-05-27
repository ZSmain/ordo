<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import type { TrackerActivityRow } from '$lib/tracker/activity-projection';
	import { Search, Star, X } from '@lucide/svelte';
	import ActivityCard from './ActivityCard.svelte';

	interface Props {
		activities: TrackerActivityRow[];
		onActivitySelect?: (activityId: number, categoryName: string, activityName: string) => void;
		userId?: string;
		currentActivityId?: number | null;
	}

	let { activities, onActivitySelect, userId, currentActivityId }: Props = $props();

	let searchQuery = $state('');

	const allFavorites = $derived(activities.filter((item) => !item.activity.archived));

	const visibleFavorites = $derived.by(() => {
		if (!searchQuery.trim()) {
			return allFavorites;
		}

		const query = searchQuery.toLowerCase().trim();
		return allFavorites.filter(
			(item) =>
				item.activity.name.toLowerCase().includes(query) ||
				item.activity.icon.includes(query) ||
				item.categoryName.toLowerCase().includes(query)
		);
	});

	function clearSearch() {
		searchQuery = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && searchQuery) {
			clearSearch();
			event.preventDefault();
		}
	}
</script>

<Separator class="my-4" />
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
		<span class="text-xs text-muted-foreground"
			>{visibleFavorites.length} of {allFavorites.length}</span
		>
	</div>

	{#if allFavorites.length > 0}
		<div class="relative px-1">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search favorites... (Esc to clear)"
				bind:value={searchQuery}
				class="pr-9 pl-9"
				onkeydown={handleKeydown}
			/>
			{#if searchQuery}
				<button
					type="button"
					onclick={clearSearch}
					class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					aria-label="Clear search"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>
	{/if}

	{#if allFavorites.length === 0}
		<div class="py-8 text-center">
			<p class="text-sm text-muted-foreground">No favorite activities yet</p>
			<p class="mt-1 text-xs text-muted-foreground">
				Right-click or long-press any activity and add it to favorites.
			</p>
		</div>
	{:else if visibleFavorites.length === 0}
		<div class="py-6 text-center">
			<p class="text-sm text-muted-foreground">No favorites match "{searchQuery}"</p>
			<button type="button" onclick={clearSearch} class="mt-2 text-sm text-primary hover:underline">
				Clear search
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-3">
			{#each visibleFavorites as item (item.activity.id)}
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
