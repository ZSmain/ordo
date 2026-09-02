<script lang="ts">
	import { archiveActivity, deleteActivity } from '$lib/api/data.remote';
	import { ActivityStatisticsDrawer } from '$lib/components/stats';
	import { Button } from '$lib/components/ui/button';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { TrackerActivity } from '$lib/tracker/activity-projection';
	import { Archive, ChartBar, PencilLine, Star, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import EditActivity from '../tracker/EditActivity.svelte';

	interface Props {
		activity: TrackerActivity;
	}

	let { activity }: Props = $props();

	let editOpen = $state(false);
	let statisticsOpen = $state(false);
	let unarchiveDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let isUnarchiving = $state(false);
	let isDeleting = $state(false);

	function formatUpdatedAt(value: unknown): string {
		if (!value) return '';
		const d = value instanceof Date ? value : new Date(value as string | number);
		if (Number.isNaN(d.getTime())) return '';
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	let updatedAtLabel = $derived(
		formatUpdatedAt((activity as unknown as { updatedAt: unknown }).updatedAt)
	);

	async function confirmUnarchive() {
		if (isUnarchiving) return;
		isUnarchiving = true;
		try {
			await archiveActivity({ id: activity.id, archived: false });
			toast.success(`"${activity.name}" unarchived`);
			unarchiveDialogOpen = false;
		} catch (e) {
			console.error(e);
			toast.error('Failed to unarchive activity');
		} finally {
			isUnarchiving = false;
		}
	}

	async function confirmDelete() {
		if (isDeleting) return;
		isDeleting = true;
		try {
			await deleteActivity({ id: activity.id });
			toast.success(`"${activity.name}" deleted`);
			deleteDialogOpen = false;
		} catch (e) {
			console.error(e);
			toast.error('Failed to delete activity');
		} finally {
			isDeleting = false;
		}
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger
		class="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
	>
		<div class="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-base leading-none">
			{activity.icon}
		</div>
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
				<span class="truncate text-sm font-medium text-foreground">{activity.name}</span>
				{#if activity.favorite}
					<Star class="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
				{/if}
				{#if updatedAtLabel}
					<span class="text-xs text-muted-foreground">· {updatedAtLabel}</span>
				{/if}
			</div>
			<div class="mt-1 flex flex-wrap gap-1">
				{#each activity.categories as cat (cat.id)}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
					>
						<span>{cat.icon}</span>
						<span>{cat.name}</span>
					</span>
				{/each}
				{#if activity.categories.length === 0}
					<span class="text-xs text-muted-foreground">Uncategorized</span>
				{/if}
			</div>
		</div>
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item onSelect={() => (editOpen = true)}>
			<PencilLine />
			Modify
		</ContextMenu.Item>
		<ContextMenu.Item onSelect={() => (statisticsOpen = true)}>
			<ChartBar />
			Statistics
		</ContextMenu.Item>
		<ContextMenu.Item onSelect={() => (unarchiveDialogOpen = true)}>
			<Archive />
			Unarchive
		</ContextMenu.Item>
		<ContextMenu.Separator />
		<ContextMenu.Item
			onSelect={() => (deleteDialogOpen = true)}
			class="text-destructive focus:text-destructive"
		>
			<Trash2 />
			Delete
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>

<EditActivity bind:open={editOpen} {activity} onActivityUpdated={() => (editOpen = false)} />

<ActivityStatisticsDrawer
	bind:open={statisticsOpen}
	activity={{ id: activity.id, name: activity.name, icon: activity.icon }}
	onOpenChange={(open) => (statisticsOpen = open)}
/>

<Dialog.Root bind:open={unarchiveDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Unarchive Activity</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to unarchive "{activity.name}"? It will reappear in the main tracker
				list.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => (unarchiveDialogOpen = false)}
				disabled={isUnarchiving}
			>
				Cancel
			</Button>
			<Button onclick={confirmUnarchive} disabled={isUnarchiving}>
				{isUnarchiving ? 'Unarchiving...' : 'Unarchive'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

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
