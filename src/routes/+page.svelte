<script lang="ts">
	import { ActivityList, CategorySelector, Timer } from '$lib/components/tracker';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { getCategoriesWithActivities } from './data.remote';

	// Timer state
	let isTimerActive = $state(false);
	let currentCategory = $state('');
	let currentActivity = $state('');
	let timerSeconds = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;


	// Selected category state
	let selectedCategoryId = $state<string>('');

	// Get categories with activities query
	const categoriesQuery = getCategoriesWithActivities();

	// Computed: selected category with activities
	const selectedCategory = $derived.by(() => {
		// Don't process if no category is selected or data isn't loaded
		if (!selectedCategoryId || !categoriesQuery.current) {
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
	function startTimer() {
		isTimerActive = true;
		timerSeconds = 0;
		timerInterval = setInterval(() => {
			timerSeconds++;
		}, 1000);
	}

	// Stop timer function
	function stopTimer() {
		isTimerActive = false;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		timerSeconds = 0;
		currentCategory = '';
		currentActivity = '';
	}

	// Handle activity selection
	function handleActivitySelect(categoryName: string, activityName: string) {
		// Stop any existing timer first
		if (isTimerActive) {
			stopTimer();
		}

		currentCategory = categoryName;
		currentActivity = activityName;
		startTimer();
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
		categories={categoriesQuery.current || []}
		bind:selectedCategoryId
		loading={categoriesQuery.loading}
		error={categoriesQuery.error}
	/>

	<!-- Activities for Selected Category -->
	<ActivityList category={selectedCategory} onActivitySelect={handleActivitySelect} />
</ScrollArea>
