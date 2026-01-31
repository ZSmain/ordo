<script lang="ts">
	import { page } from '$app/state';
	import {
		getActiveSession,
		getCategoriesWithActivities,
		startTimerSession,
		stopTimerSession
	} from '$lib/api/data.remote';
	import {
		ActivityList,
		CategorySelector,
		FloatingAddButton,
		Timer
	} from '$lib/components/tracker';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { restoreTimerFromDatabase, selectionStore, timerStore } from '$lib/stores';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// Get user from page data
	const user = $derived(page.data?.user);

	// Get categories with activities query - persisted across re-mounts
	let categoriesQuery = $state<ReturnType<typeof getCategoriesWithActivities> | null>(null);

	$effect(() => {
		if (user?.id) {
			// Query system caches by arguments, so same user.id returns cached instance
			categoriesQuery = getCategoriesWithActivities(user.id);
		} else {
			categoriesQuery = null;
		}
	});

	// Computed: selected activities from multiple categories
	const selectedActivities = $derived.by(() => {
		// Don't process if no categories are selected or data isn't loaded
		const selectedIds = $selectionStore.selectedCategoryIds || [];
		const currentCategories = categoriesQuery?.current;
		if (selectedIds.length === 0 || !currentCategories) {
			return [];
		}

		const filterMode = $selectionStore.filterMode || 'OR';

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

	// Start timer function with optimistic update
	function startTimer(activityId: number, categoryName: string, activityName: string) {
		if (!user?.id) return;

		// Optimistically update the timer store immediately
		// Use a temporary session ID (-1) until the server responds
		timerStore.startTimer(categoryName, activityName, activityId, -1);

		// Start session in database with optimistic update on getActiveSession
		startTimerSession({ activityId, userId: user.id })
			.updates(
				getActiveSession(user.id).withOverride(() => ({
					session: {
						id: -1,
						activityId,
						userId: user.id,
						startedAt: new Date(),
						stoppedAt: null,
						duration: null,
						notes: null,
						isActive: true,
						createdAt: new Date(),
						updatedAt: new Date()
					},
					activity: { id: activityId, name: activityName, icon: '⏱️', userId: user.id },
					category: { name: categoryName }
				}))
			)
			.then((session) => {
				// Update the timer store with the real session ID once server responds
				timerStore.updateSessionId(session.id);
			})
			.catch((error) => {
				// Check for SvelteKit redirects (e.g., authentication issues)
				if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
					throw error; // Re-throw redirect objects
				}

				console.error('Failed to start timer session:', error);
				// Rollback the optimistic update
				timerStore.stopTimer();
				toast.error('Failed to start timer. Please check your connection and try again.');
			});
	}

	// Stop timer function with optimistic update
	function stopTimer() {
		const currentSessionId = timerStore.current.sessionId;
		const currentUserId = user?.id;

		// Optimistically stop the timer immediately
		timerStore.stopTimer();

		// Stop session in database if we have a valid session ID
		if (currentSessionId && currentSessionId > 0 && currentUserId) {
			stopTimerSession({ sessionId: currentSessionId, userId: currentUserId })
				.updates(getActiveSession(currentUserId).withOverride(() => null))
				.catch((error) => {
					// Check for SvelteKit redirects (e.g., authentication issues)
					if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
						throw error; // Re-throw redirect objects
					}

					console.error('Failed to stop timer session:', error);
					toast.error('Failed to stop timer on server. The timer was cleared locally.');
				});
		}
	}

	// Handle activity selection
	function handleActivitySelect(categoryName: string, activityName: string) {
		if (!user?.id) return;

		// Check if this is the currently running activity (toggle behavior)
		if (
			timerStore.current.isActive &&
			timerStore.current.categoryName === categoryName &&
			timerStore.current.activityName === activityName
		) {
			// Stop the timer if clicking the same activity
			stopTimer();
			return;
		}

		// Stop any existing timer first
		if (timerStore.current.isActive) {
			stopTimer();
		}

		// Get categories data to find the activity ID
		const categoriesData = categoriesQuery?.current;
		if (!categoriesData) {
			console.error('Categories not loaded');
			return;
		}

		// We need to find the activity ID. Since we have multiple categories selected,
		// we can search through the selectedActivities derived store or the raw categories.
		// Searching raw categories is safer as it covers all possibilities.

		let foundActivityId = -1;

		// Find the activity in the categories
		for (const cat of categoriesData) {
			if (cat.name === categoryName) {
				const act = cat.activities.find((a) => a.name === activityName);
				if (act) {
					foundActivityId = act.id;
					break;
				}
			}
		}

		if (foundActivityId === -1) {
			// Fallback: try to find by name across all categories if category name match failed
			// This handles edge cases where category name might be ambiguous or display-only
			for (const cat of categoriesData) {
				const act = cat.activities.find((a) => a.name === activityName);
				if (act) {
					foundActivityId = act.id;
					// Update category name to the one where we found it
					categoryName = cat.name;
					break;
				}
			}
		}

		if (foundActivityId === -1) {
			console.error('Activity not found:', activityName);
			return;
		}

		// Start timer with the found activity
		startTimer(foundActivityId, categoryName, activityName);
	}

	// Sync timer state with database
	async function syncTimerWithDatabase() {
		if (!user?.id) return;

		try {
			const activeSession = await getActiveSession(user.id);

			if (activeSession) {
				const dbTimerState = restoreTimerFromDatabase(activeSession);

				// Update if different
				if (
					!timerStore.current.isActive ||
					timerStore.current.sessionId !== dbTimerState.sessionId
				) {
					timerStore.set(dbTimerState);
					console.log('Tab sync: Timer updated from database');
				}
			} else if (timerStore.current.isActive) {
				// Timer running locally but not in database - was stopped elsewhere
				timerStore.stopTimer();
				console.log('Tab sync: Timer stopped - session ended elsewhere');
			}
		} catch (error) {
			console.error('Failed to sync timer:', error);
		}
	}

	// Restore timer session on mount
	onMount(() => {
		// Initial timer sync
		(async () => {
			if (!user?.id) return;

			try {
				// Check the database for any active session
				const activeSession = await getActiveSession(user.id);

				if (activeSession) {
					// Check if the persisted timer state matches the database session
					const dbTimerState = restoreTimerFromDatabase(activeSession);

					// Only update if the database session is different from persisted state
					// This handles cases where the session was stopped on another device
					if (
						!timerStore.current.isActive ||
						timerStore.current.sessionId !== dbTimerState.sessionId ||
						timerStore.current.activityId !== dbTimerState.activityId
					) {
						timerStore.set(dbTimerState);
						console.log('Synced timer with database:', dbTimerState);
					} else {
						console.log('Timer state already in sync with database');
					}
				} else {
					// No active session in database, clear any persisted timer state
					if (timerStore.current.isActive) {
						timerStore.stopTimer();
						console.log('Cleared stale timer state - no active session in database');
					}
				}
			} catch (error) {
				console.error('Failed to restore timer session:', error);
			}
		})();

		// Sync timer when tab becomes visible (handles multi-tab/device scenarios)
		function handleVisibilityChange() {
			if (document.visibilityState === 'visible' && user?.id) {
				syncTimerWithDatabase();
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});
</script>

<svelte:head>
	<title>Ordo - Timer</title>
</svelte:head>

<ScrollArea class="p-4">
	{#if timerStore.current.isActive}
		<Timer onStop={stopTimer} />
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
		categories={categoriesQuery?.current || []}
		selectedCategoryIds={$selectionStore.selectedCategoryIds || []}
		filterMode={$selectionStore.filterMode || 'OR'}
		onFilterModeChange={handleFilterModeChange}
		onCategoryChange={handleCategorySelection}
		loading={categoriesQuery?.loading || false}
		error={categoriesQuery?.error}
		userId={user?.id || ''}
	/>

	<!-- Activities for Selected Categories -->
	<ActivityList
		activities={selectedActivities}
		onActivitySelect={handleActivitySelect}
		userId={user?.id || ''}
		currentCategory={timerStore.current.categoryName}
		currentActivity={timerStore.current.activityName}
	/>
</ScrollArea>

<!-- Floating Add Button -->
<FloatingAddButton userId={user?.id || ''} />
