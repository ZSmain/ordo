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
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		selectionStore,
		trackerSessionController,
		timerStore,
		trackerTabPersistedState,
		type TrackerTab
	} from '$lib/stores';
	import { onMount } from 'svelte';

	// State for create dialogs triggered from empty states
	let showCreateCategory = $state(false);
	let showCreateActivity = $state(false);
	let activeTab = $state<TrackerTab>(trackerTabPersistedState.current);

	// Get user from page data
	const user = $derived(page.data?.user);

	// Query system caches by arguments, so same user.id returns cached instance
	const categoriesQuery = $derived(user?.id ? getCategoriesWithActivities(user.id) : null);

	// Computed: selected activities from multiple categories
	const selectedActivities = $derived.by(() => {
		// Don't process if no categories are selected or data isn't loaded
		const selectedIds = selectionStore.current.selectedCategoryIds;
		const currentCategories = categoriesQuery?.current;
		if (selectedIds.length === 0 || !currentCategories) {
			return [];
		}

		const filterMode = selectionStore.current.filterMode;

		if (filterMode === 'AND' && selectedIds.length > 1) {
			// AND Logic: Intersection
			// Get activities for each selected category
			const activitiesPerCategory = selectedIds
				.map((idStr) => {
					const cat = currentCategories.find((c) => c.id === parseInt(idStr));
					return cat ? { category: cat, activities: cat.activities || [] } : null;
				})
				.filter((item) => item !== null);

			if (activitiesPerCategory.length === 0) return [];

			// Start with the first category's activities
			let intersection = activitiesPerCategory[0]!.activities;

			// Filter to keep only those present in all other selected categories
			for (let i = 1; i < activitiesPerCategory.length; i++) {
				const currentIds = new Set(activitiesPerCategory[i]!.activities.map((a) => a.id));
				intersection = intersection.filter((a) => currentIds.has(a.id));
			}

			// Map to result format
			return intersection.map((activity) => {
				// Use the first selected category as context (or any valid one)
				const contextCategory = activitiesPerCategory[0]!.category;
				return {
					activity,
					categoryColor: contextCategory.color,
					categoryName: contextCategory.name
				};
			});
		} else {
			// OR Logic: Union (Deduplicated)
			const activitiesMap: Record<
				number,
				{
					activity: (typeof currentCategories)[0]['activities'][0];
					categoryColor: string;
					categoryName: string;
				}
			> = {};

			// Iterate through all selected categories
			for (const categoryIdStr of selectedIds) {
				const categoryId = parseInt(categoryIdStr);
				const category = currentCategories.find((cat) => cat.id === categoryId);

				if (category && category.activities) {
					for (const activity of category.activities) {
						// Use activity ID as key to deduplicate
						if (!activitiesMap[activity.id]) {
							activitiesMap[activity.id] = {
								activity,
								categoryColor: category.color,
								categoryName: category.name
							};
						}
					}
				}
			}

			return Object.values(activitiesMap);
		}
	});

	// Handle category selection changes
	function handleCategorySelection(categoryId: string) {
		selectionStore.toggleCategory(categoryId);
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

		void trackerSessionController.stop(user.id);
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
			void trackerSessionController.reconcile(user.id);
		}
	}

	onMount(() => {
		if (user?.id) {
			void trackerSessionController.reconcile(user.id);
		}
	});

	$effect(() => {
		if (trackerTabPersistedState.current !== activeTab) {
			trackerTabPersistedState.current = activeTab;
		}
	});

	$effect(() => {
		if (activeTab !== trackerTabPersistedState.current) {
			activeTab = trackerTabPersistedState.current;
		}
	});

	const favoriteActivities = $derived.by(() => {
		const currentCategories = categoriesQuery?.current;
		if (!currentCategories) return [];

		const favoritesMap: Record<
			number,
			{
				activity: (typeof currentCategories)[0]['activities'][0];
				categoryColor: string;
				categoryName: string;
			}
		> = {};

		for (const category of currentCategories) {
			for (const activity of category.activities) {
				if (activity.archived || !activity.favorite || favoritesMap[activity.id]) continue;

				favoritesMap[activity.id] = {
					activity,
					categoryColor: category.color,
					categoryName: category.name
				};
			}
		}

		return Object.values(favoritesMap).sort((a, b) =>
			a.activity.name.localeCompare(b.activity.name)
		);
	});

	// Check if there are any non-archived activities in selected categories
	const hasActivitiesInSelection = $derived(
		selectedActivities.some((item) => !item.activity.archived)
	);
</script>

<svelte:document onvisibilitychange={handleVisibilityChange} />

<svelte:head>
	<title>Ordo - Timer</title>
</svelte:head>

<ScrollArea class="p-4">
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
		<Tabs.Root bind:value={activeTab} class="mt-4 w-full">
			<Tabs.List class="grid w-full grid-cols-2 rounded-lg bg-muted p-1">
				<Tabs.Trigger value="activities" class="rounded-md data-[state=active]:bg-background">
					Activities
				</Tabs.Trigger>
				<Tabs.Trigger value="favorites" class="rounded-md data-[state=active]:bg-background">
					Favorites
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="activities" class="mt-0">
				<!-- Categories -->
				<CategorySelector
					categories={categoriesQuery?.current || []}
					selectedCategoryIds={selectionStore.current.selectedCategoryIds}
					filterMode={selectionStore.current.filterMode}
					onFilterModeChange={handleFilterModeChange}
					onClearSelection={handleClearCategorySelection}
					onCategoryChange={handleCategorySelection}
					loading={categoriesQuery?.loading || false}
					error={categoriesQuery?.error}
					userId={user?.id || ''}
				/>

				<!-- Activities for Selected Categories -->
				{#if selectionStore.current.selectedCategoryIds.length === 0}
					<Separator class="my-4" />
					<EmptyState type="no-selection" />
				{:else if !hasActivitiesInSelection}
					<Separator class="my-4" />
					<EmptyState type="no-activities" onCreateActivity={() => (showCreateActivity = true)} />
				{:else}
					<ActivityList
						activities={selectedActivities}
						onActivitySelect={handleActivitySelect}
						userId={user?.id || ''}
						currentActivityId={timerStore.current.activityId}
					/>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="favorites" class="mt-0">
				<FavoriteActivities
					activities={favoriteActivities}
					onActivitySelect={handleActivitySelect}
					userId={user?.id || ''}
					currentActivityId={timerStore.current.activityId}
				/>
			</Tabs.Content>
		</Tabs.Root>
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
