<script lang="ts">
	import { page } from '$app/state';
	import { getCategoriesWithActivities } from '$lib/api/data.remote';
	import {
		ActivityList,
		CategorySelector,
		CreateActivity,
		CreateCategory,
		EmptyState,
		FavoriteActivities,
		FloatingAddButton,
		Timer
	} from '$lib/components/tracker';
	import ActivityCard from '$lib/components/tracker/ActivityCard.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import {
		selectionStore,
		timerStore,
		trackerSessionController,
		trackerTabPersistedState
	} from '$lib/stores';
	import type { TrackerTab } from '$lib/stores/tracker-view';
	import {
		projectFavoriteActivities,
		projectSelectedActivities
	} from '$lib/tracker/activity-projection';
	import { Archive, LayoutGrid, Star } from '@lucide/svelte';
	import { onMount } from 'svelte';

	// State for create dialogs triggered from empty states
	let showCreateCategory = $state(false);
	let showCreateActivity = $state(false);

	const currentTab = $derived(trackerTabPersistedState.current);

	const tabOrder: TrackerTab[] = ['activities', 'favorites', 'archived'];

	const tabConfig = $derived.by(() => {
		if (currentTab === 'favorites') {
			return {
				label: 'Favorites',
				Icon: Star
			};
		}
		if (currentTab === 'archived') {
			return {
				label: 'Archived',
				Icon: Archive
			};
		}
		return {
			label: 'Categories',
			Icon: LayoutGrid
		};
	});

	// Get user from page data
	const user = $derived(page.data?.user);

	// Guard the remote query behind authenticated page data
	const categoriesQuery = $derived(user ? getCategoriesWithActivities() : null);

	// Computed: selected activities from multiple categories
	const selectedActivities = $derived.by(() =>
		projectSelectedActivities(categoriesQuery?.current, selectionStore.current)
	);

	// Handle category selection changes
	function handleCategorySelectionChange(categoryIds: string[]) {
		selectionStore.setSelectedCategories(categoryIds);
	}

	// Handle filter mode changes
	function handleFilterModeChange(mode: 'AND' | 'OR') {
		selectionStore.setFilterMode(mode);
	}

	function handleClearCategorySelection() {
		selectionStore.reset();
	}

	function stopTimer() {
		if (!user?.id) return;

		void trackerSessionController.stop();
	}

	// Handle activity selection
	function handleActivitySelect(activityId: number, categoryName: string, activityName: string) {
		if (!user?.id) return;

		void trackerSessionController.toggle({
			userId: user.id,
			activityId,
			categoryName,
			activityName
		});
	}

	function handleVisibilityChange() {
		if (document.visibilityState === 'visible' && user?.id) {
			void trackerSessionController.reconcile();
		}
	}

	onMount(() => {
		// One-time migration from the old localStorage flag to the shared tab store
		const legacy = localStorage.getItem('ordo-show-favorites');
		if (legacy !== null && localStorage.getItem('ordo-tracker-tab') === null) {
			trackerTabPersistedState.current = legacy === 'true' ? 'favorites' : 'activities';
			localStorage.removeItem('ordo-show-favorites');
		}

		// Migrate invalid tab values (e.g., old store without 'archived')
		if (!tabOrder.includes(trackerTabPersistedState.current as TrackerTab)) {
			trackerTabPersistedState.current = 'activities';
		}

		if (user?.id) {
			void trackerSessionController.reconcile();
		}
	});

	const favoriteActivities = $derived.by(() => projectFavoriteActivities(categoriesQuery?.current));

	// Check if there are any non-archived activities in selected categories
	const hasActivitiesInSelection = $derived(
		selectedActivities.some((item) => !item.activity.archived)
	);

	const archivedSelectedActivities = $derived.by(() =>
		selectedActivities.filter((item) => item.activity.archived)
	);
</script>

<svelte:document onvisibilitychange={handleVisibilityChange} />

<svelte:head>
	<title>Ordo - Timer</title>
</svelte:head>

<ScrollArea class="h-full flex-1 p-4">
	{#if timerStore.current.isActive}
		<Timer onStop={stopTimer} />
	{:else if (categoriesQuery?.current?.length ?? 0) > 0}
		<!-- Instructions when no timer is active but categories exist -->
		<div class="px-4 py-8 text-center">
			<div class="mb-2 text-xl font-semibold text-foreground">
				Click on activity to start tracking
			</div>
			<div class="text-sm text-muted-foreground">Right-click or long-press to edit or delete</div>
		</div>
		<Separator />
	{/if}

	{#if !categoriesQuery?.loading && (categoriesQuery?.current?.length ?? 0) === 0}
		<!-- Empty state for new users with no categories -->
		<EmptyState type="no-categories" onCreateCategory={() => (showCreateCategory = true)} />
	{:else}
		<div class="mt-8 space-y-4">
			<!-- Header with title + select -->
			<div class="flex items-center justify-between gap-3 px-1">
				<h2 class="text-lg font-semibold text-foreground">
					{tabConfig.label}
				</h2>
				<Select.Root
					type="single"
					value={currentTab}
					onValueChange={(value) => {
						if (value && tabOrder.includes(value as TrackerTab)) {
							trackerTabPersistedState.current = value as TrackerTab;
						}
					}}
				>
					<Select.Trigger
						class="h-8 w-8 justify-center p-0 [&>svg:last-child]:hidden"
						size="sm"
						aria-label="Select view: {tabConfig.label}"
					>
						<span class="flex items-center justify-center">
							{#if currentTab === 'favorites'}
								<Star class="size-4" />
							{:else if currentTab === 'archived'}
								<Archive class="size-4" />
							{:else}
								<LayoutGrid class="size-4" />
							{/if}
							<span class="sr-only">{tabConfig.label}</span>
						</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="activities">
							<span class="flex items-center gap-2">
								<LayoutGrid class="size-4" />
								Categories
							</span>
						</Select.Item>
						<Select.Item value="favorites">
							<span class="flex items-center gap-2">
								<Star class="size-4" />
								Favorites
							</span>
						</Select.Item>
						<Select.Item value="archived">
							<span class="flex items-center gap-2">
								<Archive class="size-4" />
								Archived
							</span>
						</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<CategorySelector
				categories={categoriesQuery?.current || []}
				selectedCategoryIds={selectionStore.current.selectedCategoryIds}
				filterMode={selectionStore.current.filterMode}
				onFilterModeChange={handleFilterModeChange}
				onClearSelection={handleClearCategorySelection}
				onSelectedCategoryIdsChange={handleCategorySelectionChange}
				loading={categoriesQuery?.loading || false}
				error={categoriesQuery?.error}
				userId={user?.id || ''}
			/>

			<div class="content-panel">
				<Separator class="my-4" />
				{#if currentTab === 'activities'}
					{#if selectionStore.current.selectedCategoryIds.length === 0}
						<EmptyState type="no-selection" />
					{:else if !hasActivitiesInSelection}
						<EmptyState type="no-activities" onCreateActivity={() => (showCreateActivity = true)} />
					{:else}
						<ActivityList
							activities={selectedActivities}
							onActivitySelect={handleActivitySelect}
							userId={user?.id || ''}
							currentActivityId={timerStore.current.activityId}
						/>
					{/if}
				{:else if currentTab === 'favorites'}
					<FavoriteActivities
						activities={favoriteActivities}
						onActivitySelect={handleActivitySelect}
						userId={user?.id || ''}
						currentActivityId={timerStore.current.activityId}
					/>
				{:else}
					<!-- Archived -->
					{#if selectionStore.current.selectedCategoryIds.length === 0}
						<EmptyState type="no-selection" />
					{:else if archivedSelectedActivities.length === 0}
						<div class="py-6 text-center">
							<p class="text-sm text-muted-foreground">
								No archived activities in selected categories
							</p>
							<p class="mt-1 text-xs text-muted-foreground">
								Archived items will appear here. Right-click to unarchive, view statistics, or
								delete.
							</p>
						</div>
					{:else}
						<div class="mt-4 space-y-3">
							<div class="flex items-center justify-between gap-2">
								<h2 class="text-lg font-semibold text-foreground">Archived Activities</h2>
								<span class="text-xs text-muted-foreground">
									{archivedSelectedActivities.length} archived
								</span>
							</div>
							<div class="grid grid-cols-2 gap-3">
								{#each archivedSelectedActivities as item (item.activity.id)}
									<ActivityCard
										activity={item.activity}
										categoryColor={item.categoryColor}
										categoryName={item.categoryName}
										onActivitySelect={handleActivitySelect}
										userId={user?.id || ''}
										currentActivityId={timerStore.current.activityId}
									/>
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</ScrollArea>

<!-- Floating Add Button -->
<FloatingAddButton userId={user?.id || ''} />

<!-- Create dialogs triggered from empty states -->
<CreateCategory
	bind:open={showCreateCategory}
	userId={user?.id || ''}
	onCategoryCreated={() => (showCreateCategory = false)}
/>

<CreateActivity
	bind:open={showCreateActivity}
	userId={user?.id || ''}
	onActivityCreated={() => (showCreateActivity = false)}
/>

<style>
	.content-panel {
		transition: opacity 0.25s ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.content-panel {
			transition: none;
		}
	}
</style>
