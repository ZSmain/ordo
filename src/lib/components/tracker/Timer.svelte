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

	// Get timer state directly from the store (reactive)
	const timerState = $derived(timerStore.current);

	// Control the interval based on timer state
	$effect(() => {
		if (timerState.isActive) {
			// Update immediately when timer becomes active
			elapsedSeconds = calculateElapsedTime(timerState);

			// Start the interval for continuous updates
			const interval = setInterval(() => {
				elapsedSeconds = calculateElapsedTime(timerState);
			}, 1000);

			return () => clearInterval(interval);
		} else {
			elapsedSeconds = 0;
		}
	});
</script>

<div class="rounded-2xl bg-primary px-3 py-2 text-primary-foreground">
	<div class="flex items-center justify-between">
		<div>
			<div class="mb-1 text-sm opacity-80">
				{timerState.categoryName} / {timerState.activityName}
			</div>
			<div class="font-mono text-2xl font-bold">{formatTime(elapsedSeconds)}</div>
		</div>
		<Button
			onclick={onStop}
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-background transition-colors hover:bg-muted"
			aria-label="Stop timer"
		>
			<Square class="h-6 w-6 text-foreground" />
		</Button>
	</div>
</div>
