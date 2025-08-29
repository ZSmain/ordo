<script lang="ts">
	import { ActivityList, CategorySelector } from '$lib/components/tracker';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { formatTime } from '$lib/time';
	import { Square } from '@lucide/svelte';
	import { getCategoriesWithActivities } from './data.remote';

	// Timer state
	let isTimerActive = $state(false);
	let currentCategory = $state('');
	let currentActivity = $state('');
	let timerSeconds = $state(0);
	let stopTimer = $state(() => {});

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

	// Handle activity selection
	function handleActivitySelect(categoryName: string, activityName: string) {
		currentCategory = categoryName;
		currentActivity = activityName;
		// Here you would typically start the timer
	}
</script>

<svelte:head>
	<title>Ordo - Timer</title>
</svelte:head>

<ScrollArea class="p-4">
	{#if isTimerActive}
		<div class="rounded-2xl bg-slate-800 p-3 text-white">
			<div class="flex items-center justify-between">
				<div>
					<div class="mb-1 text-sm text-gray-300">{currentCategory} / {currentActivity}</div>
					<div class="font-mono text-2xl font-bold">{formatTime(timerSeconds)}</div>
				</div>
				<Button
					onclick={stopTimer}
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-white transition-colors hover:bg-gray-100"
					aria-label="Stop timer"
				>
					<Square class="h-6 w-6 text-gray-800" />
				</Button>
			</div>
		</div>
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
