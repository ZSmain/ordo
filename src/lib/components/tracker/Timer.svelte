<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { formatTime } from '$lib/time';
	import { Square } from '@lucide/svelte';

	interface Props {
		categoryName: string;
		activityName: string;
		seconds: number;
		onStop: () => void;
	}

	let { categoryName, activityName, seconds, onStop }: Props = $props();
</script>

<div class="rounded-2xl bg-slate-800 px-3 py-2 text-white">
	<div class="flex items-center justify-between">
		<div>
			<div class="mb-1 text-sm text-gray-300">{categoryName} / {activityName}</div>
			<div class="font-mono text-2xl font-bold">{formatTime(seconds)}</div>
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
