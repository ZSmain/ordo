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
	import {
		projectFavoriteActivities,
		projectSelectedActivities
	} from '$lib/tracker/activity-projection';
	import { onMount } from 'svelte';

	// State for create dialogs triggered from empty states
	let showCreateCategory = $state(false);
	let showCreateActivity = $state(false);
	let activeTab = $state<TrackerTab>(trackerTabPersistedState.current);

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
		if (user?.id) {
			void trackerSessionController.reconcile();
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

	const favoriteActivities = $derived.by(() => projectFavoriteActivities(categoriesQuery?.current));

	// Check if there are any non-archived activities in selected categories
	const hasActivitiesInSelection = $derived(
		selectedActivities.some((item) => !item.activity.archived)
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
					onSelectedCategoryIdsChange={handleCategorySelectionChange}
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
