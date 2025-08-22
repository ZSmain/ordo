<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { formatTime } from '$lib/time';
	import { Square } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Timer state
	let isTimerActive = $state(true);
	let currentCategory = $state('Spanish');
	let currentActivity = $state('Duolingo');
	let timerSeconds = $state(0);
	let stopTimer = $state(() => {});
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
</ScrollArea>
