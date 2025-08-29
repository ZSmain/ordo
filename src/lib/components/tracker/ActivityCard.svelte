<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import type { Activity } from '$lib/types';
	import { Play } from '@lucide/svelte';

	interface Props {
		activity: Activity;
		categoryColor: string;
		categoryName: string;
		onActivitySelect?: (categoryName: string, activityName: string) => void;
	}

	let { activity, categoryColor, categoryName, onActivitySelect }: Props = $props();

	function handleClick() {
		onActivitySelect?.(categoryName, activity.name);
	}
</script>

<Label
	class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-input/10"
	style="background-color: {categoryColor}10"
	onclick={handleClick}
>
	<div class="grid gap-1 font-normal">
		<div class="text-sm font-medium">{activity.name}</div>
		<div class="text-lg leading-snug">
			{activity.icon}
		</div>
		{#if activity.dailyGoal}
			<div class="text-xs text-muted-foreground">
				Goal: {activity.dailyGoal}min
			</div>
		{/if}
	</div>
	<Play class="ml-auto h-4 w-4 text-muted-foreground" />
</Label>
