<script lang="ts">
	import { archiveActivity, deleteActivity, setActivityFavorite } from '$lib/api/data.remote';
	import { ActivityStatisticsDrawer } from '$lib/components/stats';
	import { Button } from '$lib/components/ui/button';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { TrackerActivity } from '$lib/tracker/activity-projection';
	import { Archive, ChartBar, Pause, PencilLine, Play, Star, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import EditActivity from './EditActivity.svelte';

	interface Props {
		activity: TrackerActivity;
		categoryColor: string;
		categoryName: string;
		onActivitySelect?: (activityId: number, categoryName: string, activityName: string) => void;
		userId?: string;
		currentActivityId?: number | null;
		showFavoriteStar?: boolean;
	}

	let {
		activity,
		categoryColor,
		categoryName,
		onActivitySelect,
		userId = '',
		currentActivityId,
		showFavoriteStar = true
	}: Props = $props();

	let editActivityOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let archiveDialogOpen = $state(false);
	let statisticsOpen = $state(false);
	let isDeleting = $state(false);
	let isArchiving = $state(false);
	let isUpdatingFavorite = $state(false);

	// Check if this activity is currently running
	let isRunning = $derived(currentActivityId === activity.id);

	function handleClick() {
		onActivitySelect?.(activity.id, categoryName, activity.name);
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

	async function handleToggleFavorite() {
		if (!userId || isUpdatingFavorite) return;

		isUpdatingFavorite = true;
		const nextFavoriteState = !activity.favorite;

		try {
			await setActivityFavorite({
				id: activity.id,
				favorite: nextFavoriteState
			});

			toast.success(
				nextFavoriteState
					? `"${activity.name}" added to favorites`
					: `"${activity.name}" removed from favorites`
			);
		} catch (error) {
			console.error('Failed to update favorite activity:', error);
			toast.error('Failed to update favorites');
		} finally {
			isUpdatingFavorite = false;
		}
	}

	// Confirm archive
	async function confirmArchive() {
		if (!userId || isArchiving) return;

		isArchiving = true;
		const actionName = activity.archived ? 'unarchived' : 'archived';

		try {
			await archiveActivity({
				id: activity.id,
				archived: !activity.archived
			});

			toast.success(`"${activity.name}" ${actionName}`);
			archiveDialogOpen = false;
		} catch (error) {
			console.error('Failed to archive activity:', error);
			toast.error(`Failed to ${activity.archived ? 'unarchive' : 'archive'} activity`);
		} finally {
			isArchiving = false;
		}
	}

	// Confirm delete
	async function confirmDelete() {
		if (!userId || isDeleting) return;

		isDeleting = true;
		const activityName = activity.name;

		try {
			await deleteActivity({ id: activity.id });

			toast.success(`"${activityName}" deleted`);
			deleteDialogOpen = false;
		} catch (error) {
			console.error('Failed to delete activity:', error);
			toast.error('Failed to delete activity');
		} finally {
			isDeleting = false;
		}
	}

	// Handle activity updated
	function handleActivityUpdated() {
		editActivityOpen = false;
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<button
			type="button"
			class="relative flex min-h-24 w-full items-start gap-3 overflow-hidden rounded-xl border p-3 text-left transition-colors duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--category-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none {activity.archived
				? 'opacity-60'
				: ''} {isRunning
				? 'border-[color-mix(in_oklab,var(--category-color)_55%,var(--border))] bg-[color-mix(in_oklab,var(--category-color)_7%,var(--card))] ring-1 ring-[color-mix(in_oklab,var(--category-color)_30%,transparent)]'
				: 'border-border bg-card'}"
			style="--category-color: {categoryColor}"
			onclick={handleClick}
			aria-pressed={isRunning}
			aria-label={isRunning ? `Pause ${activity.name}` : `Start ${activity.name}`}
		>
			<span
				class="grid size-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--category-color)_12%,transparent)] text-xl leading-none"
				aria-hidden="true"
			>
				{activity.icon}
			</span>

			<span class="grid min-w-0 flex-1 gap-0.5">
				<span class="flex items-center gap-1 text-sm font-medium text-foreground">
					<span class="truncate">{activity.name}</span>
					{#if activity.favorite && showFavoriteStar}
						<Star class="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
					{/if}
					{#if activity.archived}
						<span class="text-xs font-normal text-muted-foreground">(Archived)</span>
					{/if}
				</span>
				{#if activity.dailyGoal}
					<span class="text-xs text-muted-foreground">
						Goal: {activity.dailyGoal} min/day
					</span>
				{:else if activity.latestGoals?.dailyGoal}
					<span class="text-xs text-muted-foreground">
						Goal from tomorrow: {activity.latestGoals.dailyGoal} min/day
					</span>
				{/if}
			</span>

			<span class="relative size-4 shrink-0 self-start text-muted-foreground" aria-hidden="true">
				<Play
					class="absolute inset-0 m-auto size-4 transition-all duration-200 {isRunning
						? 'scale-50 opacity-0'
						: 'opacity-100'}"
				/>
				<Pause
					class="absolute inset-0 m-auto size-4 text-[color-mix(in_oklab,var(--category-color)_65%,black)] transition-all duration-200 {isRunning
						? 'opacity-100'
						: 'scale-50 opacity-0'}"
				/>
			</span>
		</button>
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
		<ContextMenu.Item onclick={handleToggleFavorite} disabled={isUpdatingFavorite}>
			<Star class="mr-2 h-4 w-4" />
			{activity.favorite ? 'Remove from favorites' : 'Add to favorites'}
		</ContextMenu.Item>
		<ContextMenu.Item onclick={handleArchiveActivity}>
			<Archive class="mr-2 h-4 w-4" />
			{activity.archived ? 'Unarchive' : 'Archive'}
		</ContextMenu.Item>
		<ContextMenu.Separator />
		<ContextMenu.Item onclick={handleDeleteActivity} class="text-destructive focus:text-destructive">
			<Trash2 class="mr-2 h-4 w-4" />
			Delete
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>

<!-- Edit Activity Drawer -->
<EditActivity bind:open={editActivityOpen} {activity} onActivityUpdated={handleActivityUpdated} />

<!-- Activity Statistics Drawer -->
<ActivityStatisticsDrawer
	bind:open={statisticsOpen}
	activity={{ id: activity.id, name: activity.name, icon: activity.icon }}
	onOpenChange={(open) => (statisticsOpen = open)}
/>

<!-- Archive Confirmation Dialog -->
<Dialog.Root bind:open={archiveDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
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
			<Button variant="outline" onclick={() => (archiveDialogOpen = false)} disabled={isArchiving}>
				Cancel
			</Button>
			<Button onclick={confirmArchive} disabled={isArchiving}>
				{#if isArchiving}
					{activity.archived ? 'Unarchiving...' : 'Archiving...'}
				{:else}
					{activity.archived ? 'Unarchive' : 'Archive'}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Delete Activity</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{activity.name}"? This will also delete all associated time
				sessions. This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)} disabled={isDeleting}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={confirmDelete} disabled={isDeleting}>
				{isDeleting ? 'Deleting...' : 'Delete'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
