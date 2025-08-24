<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { formatTime } from '$lib/time';
	import { Square } from '@lucide/svelte';
	import { getCategories } from './data.remote';

	// Timer state
	let isTimerActive = $state(false);
	let currentCategory = $state('');
	let currentActivity = $state('');
	let timerSeconds = $state(0);
	let stopTimer = $state(() => {});

	// Get categories query (returns a query object with loading/error/current)
	const categoriesQuery = getCategories();
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
	{#if categoriesQuery.error}
		<div class="mt-4 text-center text-xs text-red-500">Failed to load categories</div>
	{:else if categoriesQuery.loading}
		<div class="mt-4 text-center text-xs text-slate-400">Loading categories...</div>
	{:else if !categoriesQuery.current || categoriesQuery.current.length === 0}
		<div class="mt-4 text-center text-xs text-slate-400">No categories yet</div>
	{:else}
		<div class="mt-4 space-y-2">
			<RadioGroup.Root value="starter" class="flex flex-wrap justify-center gap-3">
				{#each categoriesQuery.current as cat (cat.id)}
					<Label
						class="flex items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-input/20"
						style="background-color: {cat.color}"
					>
						<RadioGroup.Item
							value={String(cat.id)}
							id={String(cat.id)}
							class="sr-only data-[state=checked]:border-primary"
						/>
						<div class="grid gap-1 font-normal">
							<div class="font-medium">{cat.name}</div>
							<div class="text-xs leading-snug text-balance text-muted-foreground">
								{cat.icon}
							</div>
						</div>
					</Label>
				{/each}
			</RadioGroup.Root>
		</div>
	{/if}
</ScrollArea>
