<script lang="ts">
	import { ActivityStatisticsDrawer } from '$lib/components/stats';
	import { Button } from '$lib/components/ui/button';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Archive, ChartBar, Pause, PencilLine, Play, Trash2 } from '@lucide/svelte';
	import EditActivity from './EditActivity.svelte';

	import { useLiveStore, activityActions } from '$lib/livestore';

	const store = useLiveStore();

	interface CategoryData {
		id: string;
		name: string;
		color: string;
		icon: string;
	}

	interface ActivityData {
		id: string;
		name: string;
		icon: string;
		archived?: boolean;
		dailyGoal?: number | null;
		weeklyGoal?: number | null;
		monthlyGoal?: number | null;
		categories?: CategoryData[];
	}

	interface Props {
		activity: ActivityData;
		categoryColor: string;
		categoryName: string;
		onActivitySelect?: (categoryName: string, activityName: string) => void;
		userId?: string;
		currentCategory?: string;
		currentActivity?: string;
	}

	let {
		activity,
		categoryColor,
		categoryName,
		onActivitySelect,
		userId = '',
		currentCategory,
		currentActivity
	}: Props = $props();

	let editActivityOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let archiveDialogOpen = $state(false);
	let statisticsOpen = $state(false);

	// Check if this activity is currently running
	let isRunning = $derived(currentCategory === categoryName && currentActivity === activity.name);

	function handleClick() {
		onActivitySelect?.(categoryName, activity.name);
	}

	// Handle modify activity
	function handleModifyActivity() {
		editActivityOpen = true;
	}

	// Handle archive activity
	function handleArchiveActivity() {
		archiveDialogOpen = true;
	}

	// Handle delete activity
	function handleDeleteActivity() {
		deleteDialogOpen = true;
	}

	// Confirm archive
	function confirmArchive() {
		if (!userId) return;

		try {
			if (activity.archived) {
				activityActions.unarchive(store, activity.id);
			} else {
				activityActions.archive(store, activity.id);
			}

			archiveDialogOpen = false;
		} catch (error) {
			console.error('Failed to archive activity:', error);
		}
	}

	// Confirm delete
	function confirmDelete() {
		if (!userId) return;

		try {
			activityActions.delete(store, activity.id);

			deleteDialogOpen = false;
		} catch (error) {
			console.error('Failed to delete activity:', error);
		}
	}

	// Handle activity updated
	function handleActivityUpdated() {
		editActivityOpen = false;
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<Label
			class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-input/10 {activity.archived
				? 'opacity-60'
				: ''} {isRunning ? 'border-primary bg-primary/5' : ''}"
			style="background-color: {categoryColor}10"
			onclick={handleClick}
		>
			<div class="grid gap-1 font-normal">
				<div class="text-sm font-medium">
					{activity.name}
					{#if activity.archived}
						<span class="ml-1 text-xs text-muted-foreground">(Archived)</span>
					{/if}
				</div>
				<div class="text-lg leading-snug">
					{activity.icon}
				</div>
				{#if activity.dailyGoal}
					<div class="text-xs text-muted-foreground">
						Goal: {activity.dailyGoal}min
					</div>
				{/if}
			</div>
			{#if isRunning}
				<Pause class="ml-auto h-4 w-4 text-primary" />
			{:else}
				<Play class="ml-auto h-4 w-4 text-muted-foreground" />
			{/if}
		</Label>
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item onclick={handleModifyActivity}>
			<PencilLine class="mr-2 h-4 w-4" />
			Modify
		</ContextMenu.Item>
		<ContextMenu.Item onclick={() => (statisticsOpen = true)}>
			<ChartBar class="mr-2 h-4 w-4" />
			Statistics
		</ContextMenu.Item>
		<ContextMenu.Item onclick={handleArchiveActivity}>
			<Archive class="mr-2 h-4 w-4" />
			{activity.archived ? 'Unarchive' : 'Archive'}
		</ContextMenu.Item>
		<ContextMenu.Separator />
		<ContextMenu.Item onclick={handleDeleteActivity} class="text-red-600 focus:text-red-600">
			<Trash2 class="mr-2 h-4 w-4" />
			Delete
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>

<!-- Edit Activity Drawer -->
<EditActivity
	bind:open={editActivityOpen}
	{activity}
	onActivityUpdated={handleActivityUpdated}
	{userId}
/>

<!-- Activity Statistics Drawer -->
<ActivityStatisticsDrawer
	bind:open={statisticsOpen}
	activity={{ id: activity.id, name: activity.name, icon: activity.icon }}
	{userId}
	onOpenChange={(open) => (statisticsOpen = open)}
/>

<!-- Archive Confirmation Dialog -->
<Dialog.Root bind:open={archiveDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{activity.archived ? 'Unarchive' : 'Archive'} Activity</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to {activity.archived ? 'unarchive' : 'archive'} "{activity.name}"?
				{#if !activity.archived}
					Archived activities won't appear in the main list but can still be viewed.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (archiveDialogOpen = false)}>Cancel</Button>
			<Button onclick={confirmArchive}>
				{activity.archived ? 'Unarchive' : 'Archive'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Delete Activity</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{activity.name}"? This will also delete all associated time
				sessions. This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancel</Button>
			<Button variant="destructive" onclick={confirmDelete}>Delete</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
