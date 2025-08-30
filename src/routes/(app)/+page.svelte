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
	import { getCategoriesWithActivities, startTimerSession, stopTimerSession } from './data.remote';

	// Get user from page data
	const user = $derived(page.data?.user);

	// Timer state
	let isTimerActive = $state(false);
	let currentCategory = $state('');
	let currentActivity = $state('');
	let timerSeconds = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let currentSessionId = $state<number | null>(null);

	// Selected category state
	let selectedCategoryId = $state<string>('');

	// Get categories with activities query - only if user is available
	const categoriesQuery = $derived.by(() => {
		if (!user?.id) return null;
		return getCategoriesWithActivities(user.id);
	});

	// Computed: selected category with activities
	const selectedCategory = $derived.by(() => {
		// Don't process if no category is selected or data isn't loaded
		if (!selectedCategoryId || !categoriesQuery?.current) {
			return null;
		}

		const categoryId = parseInt(selectedCategoryId);
		const category = categoriesQuery.current.find((cat) => cat.id === categoryId);

		// Return the category with activities (or empty array if no activities property)
		return category
			? {
					...category,
					activities: category.activities || []
				}
			: null;
	});

	// Start timer function
	async function startTimer(activityId: number) {
		if (!user?.id) return;

		try {
			// Start session in database using remote function with activity ID parameter
			const session = await startTimerSession({ activityId, userId: user.id });
			currentSessionId = session.id;

			// Start UI timer
			isTimerActive = true;
			timerSeconds = 0;
			timerInterval = setInterval(() => {
				timerSeconds++;
			}, 1000);
		} catch (error) {
			console.error('Failed to start timer session:', error);
			// Still show timer even if DB save fails
			isTimerActive = true;
			timerSeconds = 0;
			timerInterval = setInterval(() => {
				timerSeconds++;
			}, 1000);
		}
	}

	// Stop timer function
	async function stopTimer() {
		try {
			// Stop session in database if we have a session ID
			if (currentSessionId && user?.id) {
				await stopTimerSession({ sessionId: currentSessionId, userId: user.id });
				currentSessionId = null;
			}
		} catch (error) {
			console.error('Failed to stop timer session:', error);
		} finally {
			// Always stop the UI timer
			isTimerActive = false;
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
			timerSeconds = 0;
			currentCategory = '';
			currentActivity = '';
		}
	}

	// Handle activity selection
	async function handleActivitySelect(categoryName: string, activityName: string) {
		if (!user?.id) return;

		// Stop any existing timer first
		if (isTimerActive) {
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

			// Set current activity info
			currentCategory = categoryName;
			currentActivity = activityName;

			// Start timer with the found activity ID
			await startTimer(foundActivity.id);
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
</script>

<svelte:head>
	<title>Ordo - Timer</title>
</svelte:head>

<ScrollArea class="p-4">
	{#if isTimerActive}
		<Timer
			categoryName={currentCategory}
			activityName={currentActivity}
			seconds={timerSeconds}
			onStop={stopTimer}
		/>
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
		bind:selectedCategoryId
		loading={categoriesQuery?.loading || false}
		error={categoriesQuery?.error}
	/>

	<!-- Activities for Selected Category -->
	<ActivityList category={selectedCategory} onActivitySelect={handleActivitySelect} />
</ScrollArea>

<!-- Floating Add Button -->
<FloatingAddButton
	onCategoryCreated={handleCategoryCreated}
	onActivityCreated={handleActivityCreated}
	userId={user?.id || ''}
/>
