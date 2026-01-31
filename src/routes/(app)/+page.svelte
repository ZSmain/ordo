<script lang="ts">
	import { page } from '$app/state';
	import {
		useLiveStore,
		categoriesForUser$,
		activitiesForUser$,
		activityCategoryLinks$,
		activeSession$,
		timeSessionActions
	} from '$lib/livestore';

	const store = useLiveStore();
	import {
		ActivityList,
		CategorySelector,
		FloatingAddButton,
		Timer
	} from '$lib/components/tracker';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { selectionStore } from '$lib/stores';
	import { toast } from 'svelte-sonner';

	// Get user from page data
	const user = $derived(page.data?.user);
	const userId = $derived(user?.id ?? '');

	// LiveStore queries - reactive and automatically update
	const categories = $derived(userId ? store.query(categoriesForUser$(userId)) : []);
	const activities = $derived(userId ? store.query(activitiesForUser$(userId)) : []);
	const activityCategoryLinks = $derived(store.query(activityCategoryLinks$));
	const activeSessions = $derived(userId ? store.query(activeSession$(userId)) : []);
	const activeSession = $derived(activeSessions.length > 0 ? activeSessions[0] : null);

	// Build categories with activities (similar to getCategoriesWithActivities)
	const categoriesWithActivities = $derived.by(() => {
		if (!categories.length) return [];

		return categories.map((cat) => {
			// Find all activity IDs linked to this category
			const linkedActivityIds = activityCategoryLinks
				.filter((link) => link.categoryId === cat.id)
				.map((link) => link.activityId);

			// Get the full activity objects
			const categoryActivities = activities.filter((activity) =>
				linkedActivityIds.includes(activity.id)
			);

			// For each activity, also include its categories
			const activitiesWithCategories = categoryActivities.map((activity) => {
				const activityCategoryIds = activityCategoryLinks
					.filter((link) => link.activityId === activity.id)
					.map((link) => link.categoryId);

				const activityCategories = categories.filter((c) => activityCategoryIds.includes(c.id));

				return {
					...activity,
					categories: activityCategories
				};
			});

			return {
				...cat,
				activities: activitiesWithCategories
			};
		});
	});

	// Timer state derived from active session
	const timerState = $derived.by(() => {
		if (!activeSession) {
			return {
				isActive: false,
				categoryName: '',
				activityName: '',
				activityId: null as string | null,
				sessionId: null as string | null,
				startTime: null as number | null
			};
		}

		// Find activity and category for the session
		const sessionActivity = activities.find((a) => a.id === activeSession.activityId);
		const categoryLink = activityCategoryLinks.find(
			(link) => link.activityId === activeSession.activityId
		);
		const sessionCategory = categoryLink
			? categories.find((c) => c.id === categoryLink.categoryId)
			: null;

		return {
			isActive: true,
			categoryName: sessionCategory?.name ?? 'Uncategorized',
			activityName: sessionActivity?.name ?? 'Unknown',
			activityId: activeSession.activityId,
			sessionId: activeSession.id,
			startTime: activeSession.startedAt?.getTime() ?? null
		};
	});

	// Computed: selected activities from multiple categories
	const selectedActivities = $derived.by(() => {
		const selectedIds = $selectionStore.selectedCategoryIds || [];
		if (selectedIds.length === 0 || !categoriesWithActivities.length) {
			return [];
		}

		const filterMode = $selectionStore.filterMode || 'OR';

		if (filterMode === 'AND' && selectedIds.length > 1) {
			// AND Logic: Intersection
			const activitiesPerCategory = selectedIds
				.map((idStr) => {
					const cat = categoriesWithActivities.find((c) => c.id === idStr);
					return cat ? { category: cat, activities: cat.activities || [] } : null;
				})
				.filter((item) => item !== null);

			if (activitiesPerCategory.length === 0) return [];

			let intersection = activitiesPerCategory[0]!.activities;

			for (let i = 1; i < activitiesPerCategory.length; i++) {
				const currentIds = new Set(activitiesPerCategory[i]!.activities.map((a) => a.id));
				intersection = intersection.filter((a) => currentIds.has(a.id));
			}

			return intersection.map((activity) => {
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
				string,
				{
					activity: (typeof categoriesWithActivities)[0]['activities'][0];
					categoryColor: string;
					categoryName: string;
				}
			> = {};

			for (const categoryIdStr of selectedIds) {
				const category = categoriesWithActivities.find((cat) => cat.id === categoryIdStr);

				if (category && category.activities) {
					for (const activity of category.activities) {
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

	// Start timer function
	function startTimer(activityId: string, categoryName: string, activityName: string) {
		if (!userId) return;

		try {
			// First stop any active session
			if (activeSession) {
				timeSessionActions.stop(store, activeSession.id, activeSession.startedAt);
			}

			// Start new session
			timeSessionActions.start(store, { activityId, userId });
		} catch (error) {
			console.error('Failed to start timer session:', error);
			toast.error('Failed to start timer. Please try again.');
		}
	}

	// Stop timer function
	function stopTimer() {
		if (!activeSession) return;

		try {
			timeSessionActions.stop(store, activeSession.id, activeSession.startedAt);
		} catch (error) {
			console.error('Failed to stop timer session:', error);
			toast.error('Failed to stop timer.');
		}
	}

	// Handle activity selection
	function handleActivitySelect(categoryName: string, activityName: string) {
		if (!userId) return;

		// Check if this is the currently running activity (toggle behavior)
		if (
			timerState.isActive &&
			timerState.categoryName === categoryName &&
			timerState.activityName === activityName
		) {
			stopTimer();
			return;
		}

		// Find the activity ID
		let foundActivityId: string | null = null;

		for (const cat of categoriesWithActivities) {
			if (cat.name === categoryName) {
				const act = cat.activities.find((a) => a.name === activityName);
				if (act) {
					foundActivityId = act.id;
					break;
				}
			}
		}

		if (!foundActivityId) {
			// Fallback: search across all categories
			for (const cat of categoriesWithActivities) {
				const act = cat.activities.find((a) => a.name === activityName);
				if (act) {
					foundActivityId = act.id;
					categoryName = cat.name;
					break;
				}
			}
		}

		if (!foundActivityId) {
			console.error('Activity not found:', activityName);
			return;
		}

		startTimer(foundActivityId, categoryName, activityName);
	}
</script>

<svelte:head>
	<title>Ordo - Timer</title>
</svelte:head>

<ScrollArea class="p-4">
	{#if timerState.isActive}
		<Timer
			categoryName={timerState.categoryName}
			activityName={timerState.activityName}
			startTime={timerState.startTime}
			onStop={stopTimer}
		/>
	{:else}
		<!-- Instructions when no timer is active -->
		<div class="px-4 py-8 text-center">
			<div class="mb-2 text-xl font-semibold text-foreground">
				Click on activity to start tracking
			</div>
			<div class="text-sm text-muted-foreground">Long click to edit</div>
		</div>
	{/if}

	<Separator />

	<!-- Categories -->
	<CategorySelector
		categories={categoriesWithActivities}
		selectedCategoryIds={$selectionStore.selectedCategoryIds || []}
		filterMode={$selectionStore.filterMode || 'OR'}
		onFilterModeChange={handleFilterModeChange}
		onCategoryChange={handleCategorySelection}
		loading={false}
		error={null}
		{userId}
	/>

	<!-- Activities for Selected Categories -->
	<ActivityList
		activities={selectedActivities}
		onActivitySelect={handleActivitySelect}
		{userId}
		currentCategory={timerState.categoryName}
		currentActivity={timerState.activityName}
	/>
</ScrollArea>

<!-- Floating Add Button -->
<FloatingAddButton {userId} />
