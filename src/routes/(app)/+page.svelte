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
	import {
		selectionStore,
		trackerSessionController,
		timerStore,
		trackerTabPersistedState
	} from '$lib/stores';
	import { Star } from '@lucide/svelte';
	import {
		projectFavoriteActivities,
		projectSelectedActivities
	} from '$lib/tracker/activity-projection';
	import { onMount } from 'svelte';

	// State for create dialogs triggered from empty states
	let showCreateCategory = $state(false);
	let showCreateActivity = $state(false);

	const showFavorites = $derived(trackerTabPersistedState.current === 'favorites');

	function toggleFavorites() {
		trackerTabPersistedState.current =
			trackerTabPersistedState.current === 'favorites' ? 'activities' : 'favorites';
	}

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

		if (user?.id) {
			void trackerSessionController.reconcile();
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
		<div class="star-wrapper relative mt-8">
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
				{showFavorites}
			/>

			<!--
				Star tab is always a circle sitting in the card's top-edge notch.
				Outline star when categories are shown, filled star when favorites are shown.
			-->
			<button
				type="button"
				onclick={toggleFavorites}
				class="star-tab absolute z-10 flex size-12 items-center justify-center border border-border bg-card shadow-md
					transition-[transform,box-shadow,color] duration-300 ease-out
					hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2
					focus-visible:ring-primary focus-visible:outline-none active:scale-95"
				style="top: -24px; right: 32px;"
				aria-expanded={!showFavorites}
				aria-controls="categories-grid"
				aria-pressed={showFavorites}
				aria-label={showFavorites ? 'Show categories' : 'Show favorites'}
			>
				<Star
					class="size-5 transition-[fill,color,stroke] duration-300 ease-out {showFavorites
						? 'fill-primary text-primary'
						: 'fill-none text-muted-foreground'}"
				/>
			</button>

			<div class="content-panel">
				<Separator class="my-4" />
				{#if !showFavorites}
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
				{:else}
					<FavoriteActivities
						activities={favoriteActivities}
						onActivitySelect={handleActivitySelect}
						userId={user?.id || ''}
						currentActivityId={timerStore.current.activityId}
					/>
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
	/* Circular bite out of the card top edge so the star tab sits in a notch */
	.star-wrapper :global(.category-panel) {
		-webkit-mask-image:
			radial-gradient(circle 28px at right 52px top 0, #000 99%, transparent 100%),
			linear-gradient(#000, #000);
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-composite: xor;
		mask-image:
			radial-gradient(circle 28px at right 52px top 0, #000 99%, transparent 100%),
			linear-gradient(#000, #000);
		mask-repeat: no-repeat;
		mask-composite: exclude;
	}

	.star-tab {
		border-radius: 9999px;
	}

	.content-panel {
		transition: opacity 0.25s ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.star-tab,
		.content-panel {
			transition: none;
		}
	}
</style>
