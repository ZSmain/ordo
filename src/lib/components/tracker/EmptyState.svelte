<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FolderPlus, Lightbulb, PlayCircle, Plus, Timer } from '@lucide/svelte';

	interface Props {
		type: 'no-categories' | 'no-activities' | 'no-selection';
		onCreateCategory?: () => void;
		onCreateActivity?: () => void;
	}

	let { type, onCreateCategory, onCreateActivity }: Props = $props();
</script>

{#if type === 'no-categories'}
	<div class="flex flex-col items-center justify-center py-12 text-center">
		<div class="mb-4 rounded-full bg-primary/10 p-4">
			<FolderPlus class="h-8 w-8 text-primary" />
		</div>
		<h3 class="mb-2 text-lg font-semibold text-foreground">Welcome to Ordo!</h3>
		<p class="mb-1 max-w-sm text-sm text-muted-foreground">
			Start by creating a category to organize your activities.
		</p>
		<p class="mb-6 max-w-sm text-sm text-muted-foreground">
			Categories help you group related activities like "Work", "Exercise", or "Learning".
		</p>
		{#if onCreateCategory}
			<Button onclick={onCreateCategory}>
				<Plus class="mr-2 h-4 w-4" />
				Create your first category
			</Button>
		{/if}

		<!-- Tips section -->
		<div class="mt-8 rounded-lg border border-dashed p-4 text-left">
			<div class="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
				<Lightbulb class="h-4 w-4 text-muted-foreground" />
				Quick tips
			</div>
			<ul class="space-y-1.5 text-xs text-muted-foreground">
				<li class="flex items-start gap-2">
					<span class="text-primary">•</span>
					Right-click or long-press categories and activities to edit or delete them
				</li>
				<li class="flex items-start gap-2">
					<span class="text-primary">•</span>
					Activities can belong to multiple categories
				</li>
				<li class="flex items-start gap-2">
					<span class="text-primary">•</span>
					Set daily goals to track your progress
				</li>
			</ul>
		</div>
	</div>
{:else if type === 'no-activities'}
	<div class="flex flex-col items-center justify-center py-10 text-center">
		<div class="mb-4 rounded-full bg-muted p-4">
			<Timer class="h-8 w-8 text-muted-foreground" />
		</div>
		<h3 class="mb-2 text-base font-medium text-foreground">No activities yet</h3>
		<p class="mb-6 max-w-xs text-sm text-muted-foreground">
			Create an activity to start tracking your time. Activities are the tasks you want to measure.
		</p>
		{#if onCreateActivity}
			<Button variant="secondary" size="sm" onclick={onCreateActivity}>
				<Plus class="mr-2 h-4 w-4" />
				Create activity
			</Button>
		{/if}
	</div>
{:else if type === 'no-selection'}
	<div class="flex flex-col items-center justify-center py-10 text-center">
		<div class="mb-4 rounded-full bg-muted p-4">
			<PlayCircle class="h-8 w-8 text-muted-foreground" />
		</div>
		<h3 class="mb-2 text-base font-medium text-foreground">Select a category</h3>
		<p class="max-w-xs text-sm text-muted-foreground">
			Choose one or more categories above to see available activities and start tracking time.
		</p>
	</div>
{/if}
