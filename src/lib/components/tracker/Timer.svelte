<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { calculateElapsedTime, timerStore } from '$lib/stores';
	import { formatTime } from '$lib/time';
	import { Square } from '@lucide/svelte';
	import { useInterval } from 'runed';

	interface Props {
		onStop: () => void;
	}

	let { onStop }: Props = $props();

	// Current elapsed time
	let elapsedSeconds = $state(0);

	// Get timer state directly from the store (reactive)
	const timerState = $derived(timerStore.current);

	// Create interval for updating elapsed time every second
	const timerInterval = useInterval(
		() => {
			elapsedSeconds = calculateElapsedTime(timerState);
		},
		1000,
		{
			immediate: false // Don't start automatically, we'll control it based on timer state
		}
	);

	// Control the interval based on timer state
	$effect(() => {
		if (timerState.isActive) {
			// Update immediately when timer becomes active
			elapsedSeconds = calculateElapsedTime(timerState);

			// Start the interval for continuous updates
			timerInterval.resume();
		} else {
			// Pause the interval when timer is not active
			timerInterval.pause();
			elapsedSeconds = 0;
		}
	});
</script>

<div class="rounded-2xl bg-slate-800 px-3 py-2 text-white">
	<div class="flex items-center justify-between">
		<div>
			<div class="mb-1 text-sm text-gray-300">
				{timerState.categoryName} / {timerState.activityName}
			</div>
			<div class="font-mono text-2xl font-bold">{formatTime(elapsedSeconds)}</div>
		</div>
		<Button
			onclick={onStop}
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-white transition-colors hover:bg-gray-100"
			aria-label="Stop timer"
		>
			<Square class="h-6 w-6 text-gray-800" />
		</Button>
	</div>
</div>
