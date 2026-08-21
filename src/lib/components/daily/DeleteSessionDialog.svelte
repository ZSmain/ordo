<script lang="ts">
	import { deleteSession } from '$lib/api/daily.remote';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { formatDuration, formatTimeRange } from '$lib/time';
	import { Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		session: {
			id: number;
			startedAt: Date;
			stoppedAt: Date | null;
			duration: number | null;
			activity: {
				name: string;
				icon: string;
			};
		};
		onOpenChange: (open: boolean) => void;
		onSessionDeleted: () => void;
	}

	let { open = $bindable(), session, onOpenChange, onSessionDeleted }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleDelete() {
		try {
			loading = true;
			error = null;

			await deleteSession({
				sessionId: session.id
			});

			toast.success('Session deleted');
			// Notify parent component
			onSessionDeleted();
			error = null;
			onOpenChange(false);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete session';
			toast.error('Failed to delete session');
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		error = null;
		onOpenChange(false);
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-destructive">
				<Trash2 class="h-5 w-5" />
				Delete Session
			</Dialog.Title>
			<Dialog.Description>
				This action cannot be undone. The session will be permanently deleted.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3">
					<p class="text-sm text-destructive">{error}</p>
				</div>
			{/if}

			<!-- Session details -->
			<div class="rounded-lg border bg-muted/50 p-4">
				<div class="flex items-center gap-3">
					<span class="text-lg">{session.activity.icon}</span>
					<div class="flex-1">
						<h3 class="font-medium">{session.activity.name}</h3>
						<p class="text-sm text-muted-foreground">
							{formatTimeRange(session.startedAt, session.stoppedAt)}
						</p>
						<p class="text-sm text-muted-foreground">
							Duration: {formatDuration(session.duration)}
						</p>
					</div>
				</div>
			</div>

			<p class="text-sm text-muted-foreground">
				Are you sure you want to delete this session? This will permanently remove the time tracking
				record.
			</p>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancel} disabled={loading}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete} disabled={loading}>
				{loading ? 'Deleting...' : 'Delete Session'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
