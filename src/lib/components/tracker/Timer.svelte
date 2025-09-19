<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { calculateElapsedTime, timerStore } from '$lib/stores';
	import { formatTime } from '$lib/time';
	import { Square } from '@lucide/svelte';

	interface Props {
		onStop: () => void;
	}

	let { onStop }: Props = $props();

	// Current elapsed time
	let elapsedSeconds = $state(0);

	// Subscribe to timer store
	let timerState = $state($timerStore);
	$effect(() => {
		const unsubscribe = timerStore.subscribe((state) => {
			timerState = state;
		});
		return unsubscribe;
	});

	// Update elapsed time every second when timer is active
	$effect(() => {
		if (timerState.isActive) {
			// Update immediately
			elapsedSeconds = calculateElapsedTime(timerState);

			// Set up interval for real-time updates
			const interval = setInterval(() => {
				elapsedSeconds = calculateElapsedTime(timerState);
			}, 1000);

			return () => clearInterval(interval);
		} else {
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
