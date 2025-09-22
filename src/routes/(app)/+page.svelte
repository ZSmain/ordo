<script lang="ts">
	import { page } from '$app/state';
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
	import {
		getActiveSession,
		getCategoriesWithActivities,
		startTimerSession,
		stopTimerSession
	} from './data.remote';

	// Get user from page data
	const user = $derived(page.data?.user);

	// Get categories with activities query - only if user is available
	const categoriesQuery = $derived.by(() => {
		if (!user?.id) return null;
		return getCategoriesWithActivities(user.id);
	});

	// Computed: selected category with activities
	const selectedCategory = $derived.by(() => {
		// Don't process if no category is selected or data isn't loaded
		if (!$selectionStore.selectedCategoryId || !categoriesQuery?.current) {
			return null;
		}

		const categoryId = parseInt($selectionStore.selectedCategoryId);
		const category = categoriesQuery.current.find((cat) => cat.id === categoryId);

		// Return the category with activities (or empty array if no activities property)
		return category
			? {
					...category,
					activities: category.activities || []
				}
			: null;
	});

	// Handle category selection changes
	function handleCategorySelection(categoryId: string) {
		selectionStore.setSelectedCategory(categoryId);
	}

	// Start timer function
	async function startTimer(activityId: number, categoryName: string, activityName: string) {
		if (!user?.id) return;

		try {
			// Start session in database using remote function with activity ID parameter
			const session = await startTimerSession({ activityId, userId: user.id });

			// Start timer in store
			timerStore.startTimer(categoryName, activityName, activityId, session.id);
		} catch (error) {
			// Check for SvelteKit redirects (e.g., authentication issues)
			if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
				throw error; // Re-throw redirect objects
			}

			console.error('Failed to start timer session:', error);

			toast.error('Failed to start timer. Please check your connection and try again.');
		}
	}

	// Stop timer function
	async function stopTimer() {
		try {
			// Stop session in database if we have a valid session ID
			if (timerStore.current.sessionId && timerStore.current.sessionId > 0 && user?.id) {
				await stopTimerSession({ sessionId: timerStore.current.sessionId, userId: user.id });
			}
		} catch (error) {
			// Check for SvelteKit redirects (e.g., authentication issues)
			if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
				throw error; // Re-throw redirect objects
			}

			console.error('Failed to stop timer session:', error);

			toast.error('Failed to stop timer on server. The timer will be cleared locally.');
		} finally {
			// Always stop the timer in the store to clear the UI
			timerStore.stopTimer();
		}
	}

	// Handle activity selection
	async function handleActivitySelect(categoryName: string, activityName: string) {
		if (!user?.id) return;

		// Check if this is the currently running activity (toggle behavior)
		if (
			timerStore.current.isActive &&
			timerStore.current.categoryName === categoryName &&
			timerStore.current.activityName === activityName
		) {
			// Stop the timer if clicking the same activity
			await stopTimer();
			return;
		}

		// Stop any existing timer first
		if (timerStore.current.isActive) {
			await stopTimer();
		}

		try {
			// Get categories data to find the activity ID
			const categoriesData = await getCategoriesWithActivities(user.id);

			const foundCategory = categoriesData.find((cat) => cat.name === categoryName);
			if (!foundCategory) {
				console.error('Category not found:', categoryName);
				return;
			}

			const foundActivity = foundCategory.activities.find((act) => act.name === activityName);
			if (!foundActivity) {
				console.error('Activity not found:', activityName);
				return;
			}

			// Start timer with the found activity
			await startTimer(foundActivity.id, categoryName, activityName);
		} catch (error) {
			console.error('Failed to start activity:', error);
		}
	}

	// Handle category creation
	function handleCategoryCreated() {
		// Refresh the categories query
		if (user?.id) {
			categoriesQuery?.refresh();
		}
	}

	// Handle activity creation
	function handleActivityCreated() {
		// Refresh the categories query to get updated activities
		if (user?.id) {
			categoriesQuery?.refresh();
		}
	}

	// Restore timer session on mount
	onMount(async () => {
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
			<div class="mb-2 text-xl font-semibold text-gray-800">
				Click on activity to start tracking
			</div>
			<div class="text-sm text-gray-500">Long click to edit</div>
		</div>
	{/if}

	<Separator />

	<!-- Categories -->
	<CategorySelector
		categories={categoriesQuery?.current || []}
		selectedCategoryId={$selectionStore.selectedCategoryId}
		onCategoryChange={handleCategorySelection}
		loading={categoriesQuery?.loading || false}
		error={categoriesQuery?.error}
		onCategoryUpdated={handleCategoryCreated}
		userId={user?.id || ''}
	/>

	<!-- Activities for Selected Category -->
	<ActivityList
		category={selectedCategory}
		onActivitySelect={handleActivitySelect}
		onActivityUpdated={handleCategoryCreated}
		userId={user?.id || ''}
		currentCategory={timerStore.current.categoryName}
		currentActivity={timerStore.current.activityName}
	/>
</ScrollArea>

<!-- Floating Add Button -->
<FloatingAddButton
	onCategoryCreated={handleCategoryCreated}
	onActivityCreated={handleActivityCreated}
	userId={user?.id || ''}
/>
