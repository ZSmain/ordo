<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { calculateElapsedTime, timerStore } from '$lib/stores';
	import { formatTime } from '$lib/time';
	import { Square } from '@lucide/svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import { onMount } from 'svelte';

	interface Props {
		onStop: () => void;
	}

	let { onStop }: Props = $props();

	const now = new SvelteDate();

	// Get timer state directly from the store (reactive)
	const timerState = $derived(timerStore.current);

	const elapsedSeconds = $derived.by(() => {
		if (!timerState.isActive) {
			return 0;
		}

		now.getTime();
		return calculateElapsedTime(timerState);
	});

	// Global keyboard shortcut to stop timer with Space or Escape
	onMount(() => {
		const interval = setInterval(() => {
			now.setTime(Date.now());
		}, 1000);

		function handleKeydown(event: KeyboardEvent) {
			if (!timerState.isActive || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
				return;
			}

			const target = event.target as HTMLElement | null;
			if (!target) {
				return;
			}

			const interactiveSelector =
				'input, textarea, select, button, a, [contenteditable="true"], [role="button"], [role="link"], [role="menuitem"], [role="option"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"]';

			if (target.matches(interactiveSelector) || target.closest(interactiveSelector)) {
				return;
			}

			if (event.code === 'Space' || event.key === 'Escape') {
				event.preventDefault();
				onStop();
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => {
			clearInterval(interval);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="rounded-2xl bg-primary px-3 py-2 text-primary-foreground">
	<div class="flex items-center justify-between">
		<div>
			<div class="mb-1 text-sm opacity-80">
				{timerState.categoryName} / {timerState.activityName}
			</div>
			<div class="font-mono text-2xl font-bold">{formatTime(elapsedSeconds)}</div>
			<div class="mt-1 text-xs opacity-60">Press Space or Esc to stop</div>
		</div>
		<Button
			onclick={onStop}
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-background transition-colors hover:bg-muted"
			aria-label="Stop timer (Space or Escape)"
		>
			<Square class="h-6 w-6 text-foreground" />
		</Button>
	</div>
</div>
