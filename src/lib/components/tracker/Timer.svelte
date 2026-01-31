<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { formatTime } from '$lib/time';
	import { Square } from '@lucide/svelte';

	interface Props {
		categoryName: string;
		activityName: string;
		startTime: number | null;
		onStop: () => void;
	}

	let { categoryName, activityName, startTime, onStop }: Props = $props();

	// Current elapsed time
	let elapsedSeconds = $state(0);

	// Calculate elapsed time from start time
	function calculateElapsed(): number {
		if (!startTime) return 0;
		return Math.floor((Date.now() - startTime) / 1000);
	}

	// Control the interval based on timer state
	$effect(() => {
		if (startTime) {
			// Update immediately when timer becomes active
			elapsedSeconds = calculateElapsed();

			// Start the interval for continuous updates
			const interval = setInterval(() => {
				elapsedSeconds = calculateElapsed();
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
				{categoryName} / {activityName}
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
