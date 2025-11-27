<script lang="ts">
	import { DeleteSessionDialog, ModifySessionDrawer } from '$lib/components/daily';
	import { ActivityStatisticsDrawer } from '$lib/components/stats';
	import { Badge } from '$lib/components/ui/badge';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { BarChart3, PencilLine, Trash2 } from '@lucide/svelte';

	interface Props {
		session: {
			id: number;
			startedAt: Date;
			stoppedAt: Date | null;
			duration: number | null;
			notes: string | null;
			activity: {
				id: number;
				name: string;
				icon: string;
			};
			categories: Array<{
				id: number;
				name: string;
				color: string;
				icon: string;
			}>;
		};
		userId: string;
		onSessionUpdated?: () => void;
	}

	let { session, userId, onSessionUpdated }: Props = $props();

	let modifyDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let statisticsOpen = $state(false);

	function formatTimeRange(startedAt: Date, stoppedAt: Date | null) {
		const start = new Date(startedAt).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});

		if (!stoppedAt) return `${start} - ongoing`;

		const end = new Date(stoppedAt).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});

		return `${start} - ${end}`;
	}

	function formatDuration(seconds: number | null) {
		if (!seconds) return '0s';

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;

		if (hours > 0) {
			if (minutes === 0 && remainingSeconds === 0) return `${hours}h`;
			if (remainingSeconds === 0) return `${hours}h ${minutes}m`;
			return `${hours}h ${minutes}m ${remainingSeconds}s`;
		}

		if (minutes === 0) {
			return `${remainingSeconds}s`;
		}

		if (remainingSeconds === 0) {
			return `${minutes}m`;
		}

		return `${minutes}m ${remainingSeconds}s`;
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<div
			class="mb-1.5 rounded-lg border p-1 transition-colors hover:opacity-90"
			style="background-color: {session.categories[0]?.color || '#gray'}10"
		>
			<div class="flex items-start justify-between gap-2">
				<div class="flex flex-1 items-center gap-3">
					<!-- Activity icon -->
					<span class="flex-shrink-0 text-lg">{session.activity.icon}</span>

					<!-- Activity info -->
					<div class="min-w-0 flex-1">
						<div class="mb-1">
							<h3 class="truncate text-sm font-medium">
								{session.activity.name}
							</h3>
						</div>

						<!-- Categories as badges -->
						{#if session.categories.length > 0}
							<div class="mb-1 flex flex-wrap gap-1">
								{#each session.categories as category}
									<Badge
										variant="outline"
										class="h-auto px-1.5 py-0.5 text-xs"
										style="border-color: {category.color}; color: {category.color};"
									>
										<span class="mr-1">{category.icon}</span>
										{category.name}
									</Badge>
								{/each}
							</div>
						{/if}

						<div class="mt-1 text-xs text-muted-foreground">
							{formatTimeRange(session.startedAt, session.stoppedAt)}
						</div>
					</div>
				</div>

				<!-- Duration -->
				<div class="flex-shrink-0 text-right">
					<Badge variant="secondary" class="text-xs">
						{formatDuration(session.duration)}
					</Badge>
				</div>
			</div>

			<!-- Notes -->
			{#if session.notes}
				<div class="mt-3 border-t pt-3 text-xs text-muted-foreground">
					{session.notes}
				</div>
			{/if}
		</div>
	</ContextMenu.Trigger>

	<ContextMenu.Content>
		<ContextMenu.Item onclick={() => (modifyDialogOpen = true)}>
			<PencilLine class="mr-2 h-4 w-4" />
			Modify Times
		</ContextMenu.Item>
		<ContextMenu.Item onclick={() => (statisticsOpen = true)}>
			<BarChart3 class="mr-2 h-4 w-4" />
			Activity Statistics
		</ContextMenu.Item>
		<ContextMenu.Separator />
		<ContextMenu.Item
			onclick={() => (deleteDialogOpen = true)}
			class="text-red-600 focus:text-red-600"
		>
			<Trash2 class="mr-2 h-4 w-4" />
			Delete Session
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>

<!-- Dialogs -->
<ModifySessionDrawer
	bind:open={modifyDialogOpen}
	{session}
	{userId}
	onOpenChange={(open) => (modifyDialogOpen = open)}
	onSessionUpdated={() => onSessionUpdated?.()}
/>

<DeleteSessionDialog
	bind:open={deleteDialogOpen}
	{session}
	{userId}
	onOpenChange={(open) => (deleteDialogOpen = open)}
	onSessionDeleted={() => onSessionUpdated?.()}
/>

<!-- Activity Statistics Drawer -->
<ActivityStatisticsDrawer
	bind:open={statisticsOpen}
	activity={session.activity}
	{userId}
	onOpenChange={(open) => (statisticsOpen = open)}
/>
